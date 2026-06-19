import { createClient as createServiceClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/encryption'
import { processTranscriptWithLlm } from '@/lib/llm/factory'
import type { LlmConfig } from '@/lib/llm/types'
import { sendPostMeetingTodoEmails } from '@/lib/email/postMeetingNotify'

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
    .select('id, project_id, workspace_id, storage_path, encrypted_content, processing_status, uploaded_by')
    .eq('id', transcriptId)
    .single() as {
      data: {
        id: string; project_id: string; workspace_id: string
        storage_path: string | null; encrypted_content: string | null
        processing_status: string; uploaded_by: string | null
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

  try {
    // Mark as processing
    await supabase.from('transcripts').update({ processing_status: 'processing', processing_error: null, error_message: null }).eq('id', transcriptId)

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

    // Load project settings (call_language for AI hint)
    const { data: project } = await supabase
      .from('projects')
      .select('call_language')
      .eq('id', transcript.project_id)
      .maybeSingle() as { data: { call_language: string | null } | null }
    const callLanguage = project?.call_language ?? 'de'

    // Load existing LOP items for context (include description for dedup)
    const { data: existingItems } = await supabase
      .from('lop_items')
      .select('id, title, description, status, responsible')
      .eq('project_id', transcript.project_id)
      .neq('status', 'abgeschlossen') as {
        data: Array<{ id: string; title: string; description: string | null; status: string; responsible: string | null }> | null
      }

    // Collect known responsible names from ALL lop_items (including closed) as learned spellings
    const { data: allResponsibles } = await supabase
      .from('lop_items')
      .select('responsible')
      .eq('project_id', transcript.project_id)
      .not('responsible', 'is', null) as {
        data: Array<{ responsible: string }> | null
      }

    const knownNames = Array.from(new Set(
      (allResponsibles ?? []).map(r => r.responsible).filter(Boolean) as string[]
    ))

    // Load workspace members for name matching (via RPC that reads auth.users)
    const { data: wsMemberRows } = await supabase.rpc('get_workspace_members_with_email', {
      p_workspace_id: transcript.workspace_id,
    }) as {
      data: Array<{
        user_id: string
        role: string
        display_name: string
        email: string
      }> | null
    }

    // Also load project-scoped members (e.g. external collaborators not in workspace_members)
    const { data: pmRows } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', transcript.project_id) as { data: Array<{ user_id: string }> | null }

    const wsMemberIds = new Set((wsMemberRows ?? []).map(m => m.user_id))
    const extraUserIds = (pmRows ?? []).map(r => r.user_id).filter(id => !wsMemberIds.has(id))

    let extraRows: Array<{ user_id: string; display_name: string; email: string }> = []
    if (extraUserIds.length > 0) {
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      extraRows = users
        .filter(u => extraUserIds.includes(u.id))
        .map(u => ({
          user_id: u.id,
          display_name: (u.user_metadata?.full_name as string | undefined)
            || (u.user_metadata?.name as string | undefined)
            || u.email?.split('@')[0]
            || u.id,
          email: u.email ?? '',
        }))
    }

    const allMemberRows = [...(wsMemberRows ?? []), ...extraRows]

    const members = allMemberRows
      .filter(m => m.display_name && m.display_name !== m.email)
      .map(m => ({ display_name: m.display_name, email: m.email }))

    // Resolve display name of transcript submitter for daily_plan extraction
    let submitterName: string | undefined
    if (transcript.uploaded_by) {
      const uploaderRow = allMemberRows.find(m => m.user_id === transcript.uploaded_by)
      if (uploaderRow?.display_name && uploaderRow.display_name !== uploaderRow.email) {
        submitterName = uploaderRow.display_name
      } else {
        // Fallback: fetch from auth.users directly
        const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
        const uploaderUser = users.find(u => u.id === transcript.uploaded_by)
        if (uploaderUser) {
          submitterName = (uploaderUser.user_metadata?.full_name as string | undefined)
            || (uploaderUser.user_metadata?.name as string | undefined)
            || uploaderUser.email?.split('@')[0]
        }
      }
    }

    // Map for resolving responsible name → user_id after LLM processing
    const memberEntries = allMemberRows.map(m => ({
      uid: m.user_id,
      display_name: m.display_name,
    }))
    const resolveResponsibleUserId = (responsibleName: string | null | undefined): string | null => {
      if (!responsibleName) return null
      const nameLower = responsibleName.toLowerCase().trim()
      for (const entry of memberEntries) {
        const fullLower = entry.display_name.toLowerCase()
        const firstName = fullLower.split(/\s+/)[0]
        if (fullLower === nameLower || firstName === nameLower) return entry.uid
      }
      return null
    }

    // Prepend language hint so the LLM knows what to expect
    const LANG_LABELS: Record<string, string> = {
      de: 'Deutsch', en: 'English', fr: 'Français', es: 'Español',
      it: 'Italiano', pt: 'Português', nl: 'Nederlands', pl: 'Polski',
    }
    const langHint = `[Sprache der Aufnahme: ${LANG_LABELS[callLanguage] ?? callLanguage}]\n\n`
    const annotatedText = langHint + transcriptText

    // Process with LLM (with retry on JSON parse error)
    let result
    try {
      result = await processTranscriptWithLlm(config, annotatedText, existingItems ?? [], members, knownNames, submitterName)
    } catch {
      await new Promise(r => setTimeout(r, 1500))
      result = await processTranscriptWithLlm(config, annotatedText, [], members, knownNames, submitterName)
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
          responsible_user_id: resolveResponsibleUserId(action.responsible),
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

    // Save daily plan for the transcript submitter
    if (result.daily_plan_text && transcript.uploaded_by) {
      const meetingDate = new Date().toISOString().split('T')[0]
      await supabase.from('daily_plans').upsert({
        user_id: transcript.uploaded_by,
        workspace_id: transcript.workspace_id,
        project_id: transcript.project_id,
        date: meetingDate,
        text: result.daily_plan_text,
      }, { onConflict: 'user_id,project_id,date' })
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

    // Save ideas (resilient — silently skips if migration not deployed)
    try {
      const ideas = (result.ideas ?? []).filter((i: { title?: string }) => i.title?.trim())
      if (ideas.length > 0) {
        await supabase.from('idea_items').insert(
          ideas.map((i: { title: string; note?: string | null }) => ({
            project_id: transcript.project_id,
            workspace_id: transcript.workspace_id,
            title: i.title.trim(),
            note: i.note?.trim() || null,
            created_by: null,
            created_by_name: 'KI (Transkript)',
          }))
        )
      }
    } catch { /* migration 027 not yet deployed */ }

    // Save speaker map (resilient — silently skips if migration not yet deployed)
    try {
      const speakerMap = (result.speaker_map ?? []).filter(s => s.speaker_label?.trim())
      if (speakerMap.length > 0) {
        await supabase.from('transcripts').update({
          speaker_map: speakerMap,
        }).eq('id', transcriptId)
      }
    } catch { /* migration 039 not yet deployed */ }

    // Mark done
    await supabase.from('transcripts').update({
      processing_status: 'done',
      items_created: itemsCreated,
      items_updated: itemsUpdated,
      llm_summary: result.summary,
      processed_at: new Date().toISOString(),
    }).eq('id', transcriptId)

    // Post-Meeting-ToDo-Mails versenden (ersetzt den abendlichen Digest, F-030).
    // Mail-Fehler dürfen die Verarbeitung nie kippen.
    try {
      await sendPostMeetingTodoEmails(supabase, {
        projectId: transcript.project_id,
        workspaceId: transcript.workspace_id,
      })
    } catch { /* Versandfehler ignorieren – Verarbeitung gilt als erfolgreich */ }

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
