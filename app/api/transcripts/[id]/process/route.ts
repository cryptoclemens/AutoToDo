import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/encryption'
import { processTranscriptWithLlm } from '@/lib/llm/factory'
import type { LlmConfig } from '@/lib/llm/types'

const CONFIDENCE_AUTO = 0.85
const CONFIDENCE_MARK = 0.70

function supabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Internal-only endpoint
  const secret = req.headers.get('x-internal-secret') ?? ''
  if (secret !== (process.env.INTERNAL_API_SECRET ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabase()
  const transcriptId = params.id

  // Load transcript
  const { data: transcript } = await db
    .from('transcripts')
    .select('id, project_id, workspace_id, storage_path, encrypted_content, processing_status')
    .eq('id', transcriptId)
    .single() as {
      data: {
        id: string; project_id: string; workspace_id: string
        storage_path: string | null; encrypted_content: string | null
        processing_status: string
      } | null
    }

  if (!transcript) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (transcript.processing_status !== 'pending') {
    return NextResponse.json({ error: 'Already processed' }, { status: 409 })
  }

  // Mark as processing
  await db.from('transcripts').update({ processing_status: 'processing' }).eq('id', transcriptId)

  try {
    // Retrieve encrypted content
    let encryptedContent: string | null = transcript.encrypted_content

    if (!encryptedContent && transcript.storage_path) {
      const { data: fileData } = await db.storage
        .from('transcripts')
        .download(transcript.storage_path)
      if (fileData) {
        encryptedContent = await fileData.text()
      }
    }

    if (!encryptedContent) throw new Error('Transkript-Inhalt nicht gefunden.')

    const transcriptText = decrypt(encryptedContent)

    // Load LLM config (service_role required – no RLS SELECT policy for authenticated)
    const { data: llmConfig } = await db
      .from('workspace_llm_config')
      .select('provider, model, encrypted_api_key')
      .eq('workspace_id', transcript.workspace_id)
      .single() as {
        data: { provider: string; model: string; encrypted_api_key: string } | null
      }

    if (!llmConfig) throw new Error('Kein LLM-Key konfiguriert. Bitte unter Einstellungen → LLM hinterlegen.')

    const config: LlmConfig = {
      provider: llmConfig.provider as LlmConfig['provider'],
      model: llmConfig.model,
      apiKey: decrypt(llmConfig.encrypted_api_key),
    }

    // Load existing LOP items for context
    const { data: existingItems } = await db
      .from('lop_items')
      .select('id, title, status')
      .eq('project_id', transcript.project_id)
      .neq('status', 'abgeschlossen') as {
        data: Array<{ id: string; title: string; status: string }> | null
      }

    // Process with LLM (with retry on JSON parse error)
    let result
    try {
      result = await processTranscriptWithLlm(config, transcriptText, existingItems ?? [])
    } catch (_err) {
      // Single retry with a simplified context
      await new Promise(r => setTimeout(r, 1500))
      result = await processTranscriptWithLlm(config, transcriptText, [])
    }

    // Apply actions
    let itemsCreated = 0
    let itemsUpdated = 0

    for (const action of result.actions) {
      const isAutoApply = action.confidence >= CONFIDENCE_AUTO
      const requiresReview = action.confidence < CONFIDENCE_MARK

      if (action.action === 'create') {
        const { error } = await db.from('lop_items').insert({
          project_id: transcript.project_id,
          workspace_id: transcript.workspace_id,
          title: action.title ?? 'Unbekannter Punkt',
          description: action.description ?? null,
          responsible: action.responsible ?? null,
          due_date: action.due_date ?? null,
          priority: action.priority ?? 'mittel',
          status: 'offen',
          source: 'ai',
          ai_confidence: action.confidence,
          confidence_score: action.confidence,
          requires_review: requiresReview,
          transcript_id: transcriptId,
        })
        if (!error) itemsCreated++

      } else if (action.action === 'update' || action.action === 'close') {
        if (!action.lop_item_id) continue

        const updates: Record<string, unknown> = {
          ai_suggestion: JSON.stringify(action),
          ai_confidence: action.confidence,
          confidence_score: action.confidence,
          requires_review: requiresReview || !isAutoApply,
        }

        if (isAutoApply) {
          if (action.status) updates.status = action.action === 'close' ? 'abgeschlossen' : action.status
          if (action.result) updates.result = action.result
          updates.requires_review = false
        }

        const { error } = await db.from('lop_items')
          .update(updates)
          .eq('id', action.lop_item_id)
          .eq('project_id', transcript.project_id)

        if (!error) itemsUpdated++
      }
    }

    // Mark done
    await db.from('transcripts').update({
      processing_status: 'done',
      items_created: itemsCreated,
      items_updated: itemsUpdated,
      llm_summary: result.summary,
      processed_at: new Date().toISOString(),
    }).eq('id', transcriptId)

    return NextResponse.json({ ok: true, itemsCreated, itemsUpdated })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    await db.from('transcripts').update({
      processing_status: 'error',
      processing_error: message,
      error_message: message,
    }).eq('id', transcriptId)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
