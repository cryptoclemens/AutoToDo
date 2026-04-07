import { createClient as createServiceClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/encryption'
import { processTranscriptWithLlm } from '@/lib/llm/factory'
import type { LlmConfig } from '@/lib/llm/types'

const CONFIDENCE_AUTO = 0.85
const CONFIDENCE_MARK = 0.70

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function runTranscriptProcessing(transcriptId: string): Promise<{
  ok: boolean
  itemsCreated?: number
  itemsUpdated?: number
  error?: string
}> {
  const supabase = db()

  // Load transcript
  const { data: transcript } = await supabase
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

  if (!transcript) return { ok: false, error: 'Transkript nicht gefunden.' }
  if (transcript.processing_status === 'done') {
    const { data: stored } = await supabase
      .from('transcripts')
      .select('items_created, items_updated')
      .eq('id', transcriptId)
      .single()
    return { ok: true, itemsCreated: stored?.items_created ?? 0, itemsUpdated: stored?.items_updated ?? 0 }
  }

  // Mark as processing
  await supabase.from('transcripts').update({ processing_status: 'processing' }).eq('id', transcriptId)

  try {
    // Retrieve encrypted content
    let encryptedContent: string | null = transcript.encrypted_content

    if (!encryptedContent && transcript.storage_path) {
      const { data: fileData } = await supabase.storage
        .from('transcripts')
        .download(transcript.storage_path)
      if (fileData) {
        encryptedContent = await fileData.text()
      }
    }

    if (!encryptedContent) throw new Error('Transkript-Inhalt nicht gefunden.')

    const transcriptText = decrypt(encryptedContent)

    // Detect Whisper hallucination (e.g. "you you you you...")
    const words = transcriptText.trim().split(/\s+/)
    if (words.length > 10) {
      const freq: Record<string, number> = {}
      for (const w of words) freq[w.toLowerCase()] = (freq[w.toLowerCase()] ?? 0) + 1
      const topCount = Math.max(...Object.values(freq))
      if (topCount / words.length > 0.6) {
        throw new Error('Transkript enthält nur Wiederholungen – Whisper-Halluzination erkannt. Bitte Spracheinstellung prüfen oder Aufnahme wiederholen.')
      }
    }

    // Load LLM config (extraction role)
    const { data: llmConfig } = await supabase
      .from('workspace_llm_config')
      .select('provider, model, encrypted_api_key, endpoint')
      .eq('workspace_id', transcript.workspace_id)
      .eq('role', 'extraction')
      .maybeSingle() as {
        data: {
          provider: string; model: string; encrypted_api_key: string
          endpoint?: string | null
        } | null
      }

    if (!llmConfig) throw new Error('Kein LLM-Key konfiguriert. Bitte unter Einstellungen → LLM hinterlegen.')

    const config: LlmConfig = {
      provider: llmConfig.provider as LlmConfig['provider'],
      model: llmConfig.model,
      apiKey: decrypt(llmConfig.encrypted_api_key),
      endpoint: llmConfig.endpoint ?? undefined,
    }

    // Load existing LOP items for context (include description for dedup)
    const { data: existingItems } = await supabase
      .from('lop_items')
      .select('id, title, description, status')
      .eq('project_id', transcript.project_id)
      .neq('status', 'abgeschlossen') as {
        data: Array<{ id: string; title: string; description: string | null; status: string }> | null
      }

    // Load workspace members for name matching
    const { data: memberRows } = await supabase
      .from('workspace_members')
      .select('user_id, role, profiles:user_id(display_name, email)')
      .eq('workspace_id', transcript.workspace_id) as {
        data: Array<{
          user_id: string
          role: string
          profiles: { display_name: string | null; email: string | null } | null
        }> | null
      }

    const members = (memberRows ?? [])
      .map(m => ({
        display_name: m.profiles?.display_name ?? m.profiles?.email?.split('@')[0] ?? 'Unbekannt',
        email: m.profiles?.email ?? '',
      }))
      .filter(m => m.display_name !== 'Unbekannt')

    // Process with LLM (with retry on JSON parse error)
    let result
    try {
      result = await processTranscriptWithLlm(config, transcriptText, existingItems ?? [], members)
    } catch {
      await new Promise(r => setTimeout(r, 1500))
      result = await processTranscriptWithLlm(config, transcriptText, [], members)
    }

    // Apply actions
    let itemsCreated = 0
    let itemsUpdated = 0

    for (const action of result.actions) {
      const isAutoApply = action.confidence >= CONFIDENCE_AUTO
      const requiresReview = action.confidence < CONFIDENCE_MARK

      if (action.action === 'create') {
        const { error } = await supabase.from('lop_items').insert({
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
          transcript_id: transcriptId,
        }

        if (isAutoApply) {
          if (action.title) updates.title = action.title
          if (action.status) updates.status = action.action === 'close' ? 'abgeschlossen' : action.status
          if (action.result) updates.result = action.result
          updates.requires_review = false
        }

        const { error } = await supabase.from('lop_items')
          .update(updates)
          .eq('id', action.lop_item_id)
          .eq('project_id', transcript.project_id)

        if (!error) itemsUpdated++
      }
    }

    // Save context notes (resilient — silently skips if migration not deployed)
    try {
      const notes = (result.context_notes ?? []).filter(n => n.text?.trim())
      if (notes.length > 0) {
        await supabase.from('project_context_notes').insert(
          notes.map(n => ({
            project_id: transcript.project_id,
            workspace_id: transcript.workspace_id,
            transcript_id: transcriptId,
            text: n.text.trim(),
            category: n.category ?? 'info',
            relevant_from: n.relevant_from ?? null,
            relevant_until: n.relevant_until ?? null,
          }))
        )
      }
    } catch { /* migration 020 not yet deployed */ }

    // Mark done
    await supabase.from('transcripts').update({
      processing_status: 'done',
      items_created: itemsCreated,
      items_updated: itemsUpdated,
      llm_summary: result.summary,
      processed_at: new Date().toISOString(),
    }).eq('id', transcriptId)

    return { ok: true, itemsCreated, itemsUpdated }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    await supabase.from('transcripts').update({
      processing_status: 'error',
      processing_error: message,
      error_message: message,
    }).eq('id', transcriptId)
    return { ok: false, error: message }
  }
}
