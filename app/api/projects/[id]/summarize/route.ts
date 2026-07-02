import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { resolveProjectAccess } from '@/lib/projectAccess'
import { decrypt } from '@/lib/encryption'
import { summarizeLopItems } from '@/lib/llm/summarizeLop'
import type { LlmConfig } from '@/lib/llm/types'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const access = await resolveProjectAccess(supabase, user.id, params.id, 'id, name, workspace_id')
  if (!access) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })
  const workspace = { id: access.workspaceId }
  const project = access.project as { id: string; name: string; workspace_id: string }

  // LLM-Config laden (extraction role)
  const { data: llmRow } = await supabase
    .from('workspace_llm_config')
    .select('provider, model, encrypted_api_key, endpoint')
    .eq('workspace_id', workspace.id)
    .eq('role', 'extraction')
    .maybeSingle() as {
      data: { provider: string; model: string; encrypted_api_key: string; endpoint?: string | null } | null
    }

  if (!llmRow) {
    return NextResponse.json({ error: 'Kein KI-Key konfiguriert. Bitte unter Einstellungen → KI hinterlegen.' }, { status: 422 })
  }

  const config: LlmConfig = {
    provider: llmRow.provider as LlmConfig['provider'],
    model: llmRow.model,
    apiKey: decrypt(llmRow.encrypted_api_key),
    endpoint: llmRow.endpoint ?? undefined,
  }

  // Offene LOP-Punkte holen
  const { data: items } = await supabase
    .from('lop_items')
    .select('title, responsible, due_date, status, priority')
    .eq('project_id', project.id)
    .in('status', ['offen', 'in_bearbeitung'])
    .order('priority', { ascending: true })
    .limit(50) as {
      data: Array<{ title: string; responsible: string | null; due_date: string | null; status: string; priority: string }> | null
    }

  if (!items?.length) {
    return NextResponse.json({ summary: 'Keine offenen LOP-Punkte vorhanden.' })
  }

  try {
    const summary = await summarizeLopItems(config, project.name, items)
    return NextResponse.json({ summary })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
