import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { resolveWorkspace } from '@/lib/workspace'

const schema = z.object({
  targetId: z.string().uuid(),
  sourceIds: z.array(z.string().uuid()).min(1).max(20),
})

type LopRow = {
  id: string
  workspace_id: string
  project_id: string
  title: string
  description: string | null
  result: string | null
  status: string
}

export async function POST(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })

  const { targetId } = parsed.data
  const sourceIds = parsed.data.sourceIds.filter(id => id !== targetId)
  if (sourceIds.length === 0) {
    return NextResponse.json({ error: 'Mindestens ein anderer Quell-Punkt nötig.' }, { status: 400 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  // Berechtigung: Editor-Rolle im Workspace
  const { data: wsMember } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).maybeSingle()
  const editRoles = ['workspace_owner', 'workspace_admin', 'project_admin', 'editor']
  if (!wsMember || !editRoles.includes((wsMember as { role: string }).role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  // Ziel + Quellen laden, Workspace-Zugehörigkeit prüfen
  const { data: rows } = await supabase
    .from('lop_items')
    .select('id, workspace_id, project_id, title, description, result, status')
    .in('id', [targetId, ...sourceIds]) as { data: LopRow[] | null }

  const target = rows?.find(r => r.id === targetId)
  if (!target || target.workspace_id !== workspace.id) {
    return NextResponse.json({ error: 'Ziel-Punkt nicht gefunden.' }, { status: 404 })
  }
  const sources = (rows ?? []).filter(r => sourceIds.includes(r.id) && r.workspace_id === workspace.id)
  if (sources.length === 0) {
    return NextResponse.json({ error: 'Keine gültigen Quell-Punkte.' }, { status: 404 })
  }

  // Beschreibung des Ziels um die der Quellen ergänzen (Titel des Ziels bleibt führend)
  const appended = sources
    .map(s => {
      const body = [s.description, s.result].filter(Boolean).join('\n')
      return `— Verschmolzen aus „${s.title}“${body ? `:\n${body}` : ''}`
    })
    .join('\n\n')
  const newDescription = [target.description, appended].filter(Boolean).join('\n\n').slice(0, 8000)

  await supabase.from('lop_items')
    .update({ description: newDescription })
    .eq('id', targetId)

  const sourceRealIds = sources.map(s => s.id)

  // Quell-Punkte archivieren (Status 'merged' + Verweis aufs Ziel)
  await supabase.from('lop_items')
    .update({ status: 'merged', merged_into_id: targetId })
    .in('id', sourceRealIds)

  // Kinder der Quellen auf das Ziel umhängen, damit keine Teilaufgabe verwaist
  await supabase.from('lop_items')
    .update({ parent_id: targetId })
    .in('parent_id', sourceRealIds)

  // Verknüpfungen der Quellen auf das Ziel umziehen (best effort; Duplikate/Self-Links ignorieren)
  try {
    const { data: rels } = await supabase
      .from('lop_item_relations')
      .select('id, item_a, item_b')
      .or(sourceRealIds.map(id => `item_a.eq.${id},item_b.eq.${id}`).join(','))
    for (const rel of (rels ?? []) as { id: string; item_a: string; item_b: string }[]) {
      const other = sourceRealIds.includes(rel.item_a) ? rel.item_b : rel.item_a
      await supabase.from('lop_item_relations').delete().eq('id', rel.id)
      if (other === targetId) continue
      const [a, b] = [targetId, other].sort()
      await supabase.from('lop_item_relations')
        .upsert({ workspace_id: workspace.id, item_a: a, item_b: b, created_by: user.id },
          { onConflict: 'item_a,item_b', ignoreDuplicates: true })
    }
  } catch {
    // Relations-Tabelle ggf. noch nicht migriert – ignorieren
  }

  // Audit-Log am Ziel
  await supabase.from('lop_item_history').insert({
    workspace_id: workspace.id,
    item_id: targetId,
    changed_by: user.id,
    change_type: 'manual_edit',
    new_values: { merged_from: sources.map(s => ({ id: s.id, title: s.title })) },
  })

  return NextResponse.json({ ok: true, merged: sourceRealIds.length })
}
