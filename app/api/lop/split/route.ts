import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { resolveProjectAccess } from '@/lib/projectAccess'

const schema = z.object({
  itemId: z.string().uuid(),
  subtasks: z.array(z.object({
    title: z.string().min(1).max(200),
    responsible: z.string().max(100).nullable().optional(),
    responsible_user_id: z.string().uuid().nullable().optional(),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    priority: z.enum(['hoch', 'mittel', 'niedrig']).optional(),
  })).min(1).max(20),
})

export async function POST(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Eltern-Punkt laden (für project_id, Workspace, Default-Verantwortlicher)
  const { data: parent } = await supabase
    .from('lop_items')
    .select('id, workspace_id, project_id, responsible, responsible_user_id, priority')
    .eq('id', parsed.data.itemId)
    .maybeSingle() as { data: {
      id: string; workspace_id: string; project_id: string
      responsible: string | null; responsible_user_id: string | null; priority: string
    } | null }

  if (!parent) {
    return NextResponse.json({ error: 'Aufzuteilender Punkt nicht gefunden.' }, { status: 404 })
  }

  // Berechtigung über den Workspace/das Projekt DES ELTERN-Punkts (nicht Heimat-Workspace)
  const access = await resolveProjectAccess(supabase, user.id, parent.project_id)
  if (!access || !access.canEdit) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }
  const workspace = { id: access.workspaceId }

  const toInsert = parsed.data.subtasks.map(s => ({
    workspace_id: workspace.id,
    project_id: parent.project_id,
    parent_id: parent.id,
    title: s.title,
    responsible: s.responsible ?? parent.responsible,
    responsible_user_id: s.responsible_user_id ?? parent.responsible_user_id,
    due_date: s.due_date ?? null,
    priority: s.priority ?? (parent.priority as 'hoch' | 'mittel' | 'niedrig'),
    status: 'offen',
  }))

  const { data: created, error } = await supabase
    .from('lop_items')
    .insert(toInsert)
    .select()

  if (error || !created) {
    return NextResponse.json({ error: 'Teilaufgaben konnten nicht erstellt werden.' }, { status: 500 })
  }

  // Audit-Log: Teilaufgaben am Eltern-Punkt vermerken
  await supabase.from('lop_item_history').insert({
    workspace_id: workspace.id,
    item_id: parent.id,
    changed_by: user.id,
    change_type: 'manual_edit',
    new_values: { split_into: (created as { id: string; title: string }[]).map(c => ({ id: c.id, title: c.title })) },
  })

  return NextResponse.json({ ok: true, items: created }, { status: 201 })
}
