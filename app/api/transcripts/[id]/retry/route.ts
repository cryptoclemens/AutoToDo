import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveProjectAccess } from '@/lib/projectAccess'
import { runTranscriptProcessing } from '@/lib/processTranscript'

// Allow up to 300s for LLM processing
export const maxDuration = 300

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Transkript per ID laden, Zugriff (Edit) über dessen Projekt-Workspace prüfen
  const { data: transcript } = await supabase
    .from('transcripts')
    .select('id, project_id')
    .eq('id', params.id)
    .maybeSingle() as { data: { id: string; project_id: string } | null }

  if (!transcript) return NextResponse.json({ error: 'Transkript nicht gefunden.' }, { status: 404 })

  const access = await resolveProjectAccess(supabase, user.id, transcript.project_id)
  if (!access || !access.canEdit) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  // Reset status to pending so processing can restart
  await supabase.from('transcripts')
    .update({ processing_status: 'pending', processing_error: null, error_message: null })
    .eq('id', params.id)

  const result = await runTranscriptProcessing(params.id)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, itemsCreated: result.itemsCreated, itemsUpdated: result.itemsUpdated })
}
