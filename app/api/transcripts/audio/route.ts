import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/encryption'
import { decrypt } from '@/lib/encryption'
import { resolveProjectAccess } from '@/lib/projectAccess'
import { runTranscriptProcessing } from '@/lib/processTranscript'
import { checkTranscriptLimit, incrementTranscriptUsage } from '@/lib/plan-gate'

export const maxDuration = 120 // Whisper + LLM can take longer

const MAX_AUDIO_SIZE = 25 * 1024 * 1024 // 25 MB (OpenAI Whisper limit)
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-m4a']

export async function POST(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Parse form data
  const formData = await req.formData()
  const projectId = formData.get('projectId') as string | null
  const meetingDate = formData.get('meetingDate') as string | null
  const meetingName = formData.get('meetingName') as string | null
  const audioFile = formData.get('audio') as File | null

  if (!projectId) return NextResponse.json({ error: 'projectId ist erforderlich.' }, { status: 400 })
  if (!audioFile) return NextResponse.json({ error: 'Audio-Datei ist erforderlich.' }, { status: 400 })

  // Zugriff über den Workspace DES PROJEKTS (nicht Heimat-Workspace); Viewer dürfen nicht hochladen
  const access = await resolveProjectAccess(supabase, user.id, projectId)
  if (!access) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })
  if (!access.canEdit) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  const workspace = { id: access.workspaceId }

  // Plan gate (Plan des Projekt-Workspace)
  const { data: ws } = await supabase
    .from('workspaces').select('plan, plan_expires_at').eq('id', workspace.id).single() as {
      data: { plan: string; plan_expires_at: string | null } | null
    }
  const gate = await checkTranscriptLimit(supabase, workspace.id, (ws?.plan ?? 'beta') as import('@/lib/plans').Plan, ws?.plan_expires_at)
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason, upgradeHint: gate.upgradeHint }, { status: 402 })
  }

  // Validate audio
  if (audioFile.size > MAX_AUDIO_SIZE) {
    return NextResponse.json({ error: 'Audio zu groß (max. 25 MB).' }, { status: 400 })
  }
  const mimeBase = audioFile.type.split(';')[0].trim()
  if (!ALLOWED_AUDIO_TYPES.includes(mimeBase)) {
    return NextResponse.json({ error: `Audio-Format nicht unterstützt: ${audioFile.type}` }, { status: 400 })
  }

  // Verify project belongs to workspace
  const { data: project } = await supabase
    .from('projects').select('id').eq('id', projectId).eq('workspace_id', workspace.id).single() as { data: { id: string } | null }
  if (!project) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })

  // Load transcription config; fall back to extraction if compatible
  const { data: allConfigs } = await supabase
    .from('workspace_llm_config')
    .select('role, provider, encrypted_api_key')
    .eq('workspace_id', workspace.id) as { data: Array<{ role: string; provider: string; encrypted_api_key: string }> | null }

  const transcriptionConfig = (allConfigs ?? []).find(r => r.role === 'transcription')
  const extractionConfig = (allConfigs ?? []).find(r => r.role === 'extraction')

  const WHISPER_PROVIDERS = ['openai', 'groq', 'azure_openai']
  const activeConfig = transcriptionConfig ?? (
    extractionConfig && WHISPER_PROVIDERS.includes(extractionConfig.provider)
      ? extractionConfig
      : null
  )

  if (!activeConfig) {
    return NextResponse.json({
      error: 'Kein Transkriptions-API-Key konfiguriert. Bitte unter Einstellungen → KI einen OpenAI- oder Groq-Key für Audio-Transkription hinterlegen.',
    }, { status: 422 })
  }
  const apiKey = decrypt(activeConfig.encrypted_api_key)
  const isGroq = activeConfig.provider === 'groq'

  // Call Whisper API (OpenAI or Groq)
  const whisperUrl = isGroq
    ? 'https://api.groq.com/openai/v1/audio/transcriptions'
    : 'https://api.openai.com/v1/audio/transcriptions'
  const whisperModel = isGroq ? 'whisper-large-v3-turbo' : 'whisper-1'

  const whisperForm = new FormData()
  whisperForm.append('file', audioFile, audioFile.name || 'recording.webm')
  whisperForm.append('model', whisperModel)
  whisperForm.append('language', 'de') // default; could be made configurable

  const whisperRes = await fetch(whisperUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: whisperForm,
  })

  if (!whisperRes.ok) {
    const errBody = await whisperRes.text()
    return NextResponse.json({ error: `Whisper-Fehler: ${whisperRes.status} – ${errBody}` }, { status: 500 })
  }

  const { text } = await whisperRes.json() as { text: string }
  if (!text?.trim()) {
    return NextResponse.json({ error: 'Whisper hat keinen Text erkannt. Bitte Aufnahme prüfen.' }, { status: 422 })
  }

  // Store transcript text (same pattern as main route)
  const originalFilename = meetingName ? `${meetingName}.txt` : `aufnahme-${Date.now()}.txt`
  const encryptedContent = encrypt(text)
  const safeFilename = originalFilename.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_")
  const storagePath = `${workspace.id}/${projectId}/${Date.now()}_${safeFilename}`

  const { error: storageError } = await supabase.storage
    .from('transcripts')
    .upload(storagePath, Buffer.from(encryptedContent, 'utf8'), {
      contentType: 'text/plain',
      upsert: false,
    })

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
    })
    .select('id, project_id, processing_status, created_at')
    .single()

  if (dbError || !transcript) {
    return NextResponse.json({ error: 'Transkript konnte nicht gespeichert werden.' }, { status: 500 })
  }

  await incrementTranscriptUsage(supabase, workspace.id)

  // Trigger LLM processing pipeline
  const result = await runTranscriptProcessing(transcript.id)

  return NextResponse.json(
    { ...transcript, processing: result },
    { status: 201 }
  )
}
