import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { encrypt } from '@/lib/encryption'
import { resolveWorkspace } from '@/lib/workspace'
import { runTranscriptProcessing } from '@/lib/processTranscript'
import { checkTranscriptLimit, incrementTranscriptUsage } from '@/lib/plan-gate'

// Allow up to 300s for LLM processing on Vercel Pro
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

  const headersList = headers()
  const slug = headersList.get('x-workspace-slug') ?? ''

  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).single() as {
      data: { role: string } | null
    }
  if (!member || member.role === 'viewer') {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
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

  const formData = await req.formData()
  const projectId = formData.get('projectId') as string | null
  const meetingDate = formData.get('meetingDate') as string | null
  const pastedText = formData.get('text') as string | null
  const file = formData.get('file') as File | null

  if (!projectId) {
    return NextResponse.json({ error: 'projectId ist erforderlich.' }, { status: 400 })
  }
  if (!pastedText && !file) {
    return NextResponse.json({ error: 'Entweder Text oder Datei erforderlich.' }, { status: 400 })
  }

  // Verify project belongs to workspace
  const { data: project } = await supabase
    .from('projects').select('id').eq('id', projectId).eq('workspace_id', workspace.id).single() as {
      data: { id: string } | null
    }
  if (!project) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })

  // Resolve text content from either source
  let text: string
  let originalFilename: string

  if (pastedText) {
    if (pastedText.length > MAX_TEXT_SIZE) {
      return NextResponse.json({ error: 'Text zu lang (max. 500 KB).' }, { status: 400 })
    }
    text = pastedText
    originalFilename = 'eingefügter-text.txt'
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
  const storagePath = `${workspace.id}/${projectId}/${Date.now()}_${originalFilename}`
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

  // Process inline (awaited) – fire-and-forget fails on Vercel serverless
  const result = await runTranscriptProcessing(transcript.id)

  return NextResponse.json({
    id: transcript.id,
    status: result.ok ? 'done' : 'error',
    itemsCreated: result.itemsCreated ?? 0,
    itemsUpdated: result.itemsUpdated ?? 0,
    error: result.error ?? null,
  }, { status: 201 })
}
