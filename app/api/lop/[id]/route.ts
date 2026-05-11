import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient, SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { dispatchWebhook } from '@/lib/webhook'
import { notifySlackForLopEvent } from '@/lib/slack'

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  responsible: z.string().max(100).nullable().optional(),
  responsible_user_id: z.string().uuid().nullable().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  priority: z.enum(['hoch', 'mittel', 'niedrig']).optional(),
  status: z.enum(['offen', 'in_bearbeitung', 'abgeschlossen']).optional(),
  result: z.string().max(2000).nullable().optional(),
  requires_review: z.boolean().optional(),
  links: z.array(z.object({
    url: z.string().url().max(2000),
    label: z.string().max(200).optional(),
  })).optional(),
  co_responsibles: z.array(z.object({
    name: z.string().max(100),
    user_id: z.string().uuid().nullable().optional(),
  })).optional(),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getServiceClient(): Promise<SupabaseClient<any>> {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkEditPermission(userId: string, itemId: string, supabase: SupabaseClient<any>) {
  const { data: item } = await supabase
    .from('lop_items').select('workspace_id, project_id, status, title').eq('id', itemId).single()
  if (!item) return null

  const ws = item as { workspace_id: string; project_id: string; status: string; title: string }

  const editRoles = ['workspace_owner', 'workspace_admin', 'project_admin', 'editor']

  // Check workspace membership
  const { data: wsMember } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', ws.workspace_id).eq('user_id', userId).maybeSingle()

  if (wsMember && editRoles.includes((wsMember as { role: string }).role)) {
    return ws
  }

  // Check project membership
  const { data: pmMember } = await supabase
    .from('project_members').select('role')
    .eq('project_id', ws.project_id).eq('user_id', userId).maybeSingle()

  if (pmMember && editRoles.includes((pmMember as { role: string }).role)) {
    return ws
  }

  return null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const supabase = await getServiceClient()
  const existing = await checkEditPermission(user.id, params.id, supabase)
  if (!existing) return NextResponse.json({ error: 'Nicht gefunden oder keine Berechtigung.' }, { status: 403 })

  const updatePayload: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.status === 'abgeschlossen' && existing.status !== 'abgeschlossen') {
    updatePayload.completed_at = new Date().toISOString()
  } else if (parsed.data.status && parsed.data.status !== 'abgeschlossen') {
    updatePayload.completed_at = null
  }

  const { data, error } = await supabase
    .from('lop_items')
    .update(updatePayload)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Update fehlgeschlagen.' }, { status: 500 })

  // Audit-Log
  const changeType = parsed.data.status ? 'status_change' : 'manual_edit'
  await supabase.from('lop_item_history').insert({
    workspace_id: existing.workspace_id,
    item_id: params.id,
    changed_by: user.id,
    change_type: changeType,
    previous_values: existing,
    new_values: parsed.data,
  })

  // Webhook + Slack (fire-and-forget)
  const webhookEvent = parsed.data.status ? 'lop.item.status_changed' : 'lop.item.updated'
  dispatchWebhook(existing.workspace_id, webhookEvent, data as Record<string, unknown>)
  notifySlackForLopEvent(supabase, existing.workspace_id, webhookEvent, data as Record<string, unknown>)

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = await getServiceClient()
  const existing = await checkEditPermission(user.id, params.id, supabase)
  if (!existing) return NextResponse.json({ error: 'Nicht gefunden oder keine Berechtigung.' }, { status: 403 })

  const { error } = await supabase.from('lop_items').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Löschen fehlgeschlagen.' }, { status: 500 })

  const deletedItem = { id: params.id, title: existing.title }
  dispatchWebhook(existing.workspace_id, 'lop.item.deleted', deletedItem)
  notifySlackForLopEvent(supabase, existing.workspace_id, 'lop.item.deleted', deletedItem)

  return NextResponse.json({ ok: true })
}
