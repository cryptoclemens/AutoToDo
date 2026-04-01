import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { validateApiKey } from '@/lib/apiKeyAuth'
import { runTranscriptProcessing } from '@/lib/processTranscript'
import { z } from 'zod'

export const maxDuration = 60

const schema = z.object({
  projectId: z.string().uuid(),
  text: z.string().min(1).max(100000),
  meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  meetingName: z.string().max(255).optional(),
})

export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request.headers.get('authorization'))
  if (!auth) {
    return NextResponse.json({ error: 'Ungültiger oder fehlender API-Key.' }, { status: 401 })
  }

  if (!auth.scope.includes('write')) {
    return NextResponse.json({ error: 'Schreibzugriff erforderlich.' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', parsed.data.projectId)
    .eq('workspace_id', auth.workspaceId)
    .single()

  if (!project) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })

  // Upload text as file to Supabase Storage
  const filename = `recorder-${Date.now()}.txt`
  const filePath = `${auth.workspaceId}/${parsed.data.projectId}/${filename}`

  const { error: uploadError } = await supabase.storage
    .from('transcripts')
    .upload(filePath, Buffer.from(parsed.data.text, 'utf-8'), {
      contentType: 'text/plain',
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: 'Upload fehlgeschlagen.' }, { status: 500 })
  }

  const { data: transcript, error: dbError } = await supabase
    .from('transcripts')
    .insert({
      workspace_id: auth.workspaceId,
      project_id: parsed.data.projectId,
      file_path: filePath,
      storage_path: filePath,
      original_filename: parsed.data.meetingName ?? 'recorder-upload.txt',
      meeting_date: parsed.data.meetingDate ?? null,
      processing_status: 'pending',
    })
    .select('id, project_id, processing_status, created_at')
    .single()

  if (dbError || !transcript) {
    return NextResponse.json({ error: 'Transkript konnte nicht gespeichert werden.' }, { status: 500 })
  }

  // Trigger LLM processing pipeline (synchronous, up to 60s)
  const result = await runTranscriptProcessing(transcript.id)

  return NextResponse.json(
    { ...transcript, processing: result },
    { status: 201 }
  )
}
