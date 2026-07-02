import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/encryption'
import { resolveProjectAccess } from '@/lib/projectAccess'
import { runTranscriptProcessing } from '@/lib/processTranscript'
import { checkTranscriptLimit, incrementTranscriptUsage } from '@/lib/plan-gate'

// Allow up to 300s for LLM processing
export const maxDuration = 300

const MAX_FILE_SIZE = 500 * 1024 // 500 KB
const MAX_TEXT_SIZE = 500 * 1024 // 500 KB as characters

/** Strip basic RTF markup to plain text */
function stripRtf(rtf: string): string {
  let text = rtf
  // Replace paragraph/line breaks with newlines
  text = text.replace(/\\par[d]?\b\s?/g, '\n')
  text = text.replace(/\\line\b\s?/g, '\n')
  // Remove header groups like {\fonttbl ...} {\colortbl ...}
  text = text.replace(/\{\\[a-z]+[^{}]*\}/g, '')
  // Remove remaining control words and symbols
  text = text.replace(/\\[a-z]+[-]?\d*\s?/gi, '')
  // Remove braces and backslashes
  text = text.replace(/[{}\\]/g, '')
  // Collapse excess blank lines
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

export async function POST(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const formData = await req.formData()
  const projectId = formData.get('projectId') as string | null
  const meetingDate = formData.get('meetingDate') as string | null
  const pastedText = formData.get('text') as string | null
  const file = formData.get('file') as File | null

  if (!projectId) {
    return NextResponse.json({ error: 'projectId ist erforderlich.' }, { status: 400 })
  }

  // Zugriff über den Workspace DES PROJEKTS (nicht Heimat-Workspace); Viewer dürfen nicht hochladen
  const access = await resolveProjectAccess(supabase, user.id, projectId)
  if (!access) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })
  if (!access.canEdit) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  const workspace = { id: access.workspaceId }

  if (!pastedText && !file) {
    return NextResponse.json({ error: 'Entweder Text oder Datei erforderlich.' }, { status: 400 })
  }

  // Plan-Gate: Transkript-Limit prüfen
  const { data: ws } = await supabase
    .from('workspaces').select('plan, plan_expires_at').eq('id', workspace.id).single() as {
      data: { plan: string; plan_expires_at: string | null } | null
    }
  const transcriptGate = await checkTranscriptLimit(supabase, workspace.id, (ws?.plan ?? 'beta') as import('@/lib/plans').Plan, ws?.plan_expires_at)
  if (!transcriptGate.allowed) {
    return NextResponse.json({ error: transcriptGate.reason, upgradeHint: transcriptGate.upgradeHint }, { status: 402 })
  }

  // Resolve text content from either source
  let text: string
  let originalFilename: string

  if (pastedText) {
    if (pastedText.length > MAX_TEXT_SIZE) {
      return NextResponse.json({ error: 'Text zu lang (max. 500 KB).' }, { status: 400 })
    }
    text = pastedText
    originalFilename = '__paste__'
  } else {
    // file is guaranteed non-null here since we checked above
    const f = file!
    if (f.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Datei zu groß (max. 500 KB).' }, { status: 400 })
    }
    const isRtf = f.name.toLowerCase().endsWith('.rtf')
    const isTxt = f.name.toLowerCase().endsWith('.txt')
    if (!isTxt && !isRtf) {
      return NextResponse.json({ error: 'Nur .txt und .rtf Dateien erlaubt.' }, { status: 400 })
    }
    const raw = await f.text()
    text = isRtf ? stripRtf(raw) : raw
    originalFilename = f.name
  }

  const encryptedContent = encrypt(text)

  // Store in Supabase Storage
  const safeFilename = originalFilename.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_")
  const storagePath = `${workspace.id}/${projectId}/${Date.now()}_${safeFilename}`
  const { error: storageError } = await supabase.storage
    .from('transcripts')
    .upload(storagePath, Buffer.from(encryptedContent, 'utf8'), {
      contentType: 'text/plain',
      upsert: false,
    })

  if (storageError) {
    console.error('Storage upload failed:', storageError.message)
  }

  // Create transcript record
  const { data: transcript, error: dbError } = await supabase
    .from('transcripts')
    .insert({
      project_id: projectId,
      workspace_id: workspace.id,
      original_filename: originalFilename,
      file_path: storageError ? '' : storagePath,
      storage_path: storageError ? null : storagePath,
      encrypted_content: storageError ? encryptedContent : null,
      meeting_date: meetingDate || null,
      processing_status: 'pending',
      uploaded_by: user.id,
    })
    .select('id')
    .single() as { data: { id: string } | null; error: unknown }

  if (dbError || !transcript) {
    return NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 })
  }

  // Increment monthly usage counter
  await incrementTranscriptUsage(supabase, workspace.id)

  // Process inline (awaited)
  const result = await runTranscriptProcessing(transcript.id)

  return NextResponse.json({
    id: transcript.id,
    status: result.ok ? 'done' : 'error',
    itemsCreated: result.itemsCreated ?? 0,
    itemsUpdated: result.itemsUpdated ?? 0,
    error: result.error ?? null,
  }, { status: 201 })
}
