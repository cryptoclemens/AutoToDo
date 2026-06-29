import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { resolveWorkspace } from '@/lib/workspace'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function authedWorkspace() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { error: 'Nicht authentifiziert.', status: 401 as const }
  const supabase = serviceClient()
  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return { error: 'Workspace nicht gefunden.', status: 404 as const }
  return { user, supabase, workspace }
}

// Verwandte Punkte eines Items (bidirektional) auflisten
export async function GET(request: NextRequest) {
  const ctx = await authedWorkspace()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const { supabase, workspace } = ctx

  const itemId = request.nextUrl.searchParams.get('itemId')
  if (!itemId) return NextResponse.json({ error: 'itemId fehlt.' }, { status: 400 })

  const { data: rels } = await supabase
    .from('lop_item_relations')
    .select('item_a, item_b')
    .eq('workspace_id', workspace.id)
    .or(`item_a.eq.${itemId},item_b.eq.${itemId}`) as { data: { item_a: string; item_b: string }[] | null }

  const relatedIds = (rels ?? []).map(r => r.item_a === itemId ? r.item_b : r.item_a)
  if (relatedIds.length === 0) return NextResponse.json([])

  const { data: items } = await supabase
    .from('lop_items')
    .select('id, title, status')
    .in('id', relatedIds)
    .neq('status', 'merged') as { data: { id: string; title: string; status: string }[] | null }

  return NextResponse.json(items ?? [])
}

const mutateSchema = z.object({
  itemId: z.string().uuid(),
  relatedId: z.string().uuid(),
})

async function assertEditor(supabase: ReturnType<typeof serviceClient>, workspaceId: string, userId: string) {
  const { data: m } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspaceId).eq('user_id', userId).maybeSingle()
  const editRoles = ['workspace_owner', 'workspace_admin', 'project_admin', 'editor']
  return !!m && editRoles.includes((m as { role: string }).role)
}

// Zwei Punkte verknüpfen
export async function POST(request: NextRequest) {
  const ctx = await authedWorkspace()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const { supabase, workspace, user } = ctx

  const parsed = mutateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  if (parsed.data.itemId === parsed.data.relatedId) {
    return NextResponse.json({ error: 'Ein Punkt kann nicht mit sich selbst verknüpft werden.' }, { status: 400 })
  }
  if (!await assertEditor(supabase, workspace.id, user.id)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  // Beide Punkte müssen zum Workspace gehören
  const { data: items } = await supabase
    .from('lop_items').select('id, workspace_id')
    .in('id', [parsed.data.itemId, parsed.data.relatedId]) as { data: { id: string; workspace_id: string }[] | null }
  if ((items ?? []).filter(i => i.workspace_id === workspace.id).length !== 2) {
    return NextResponse.json({ error: 'Punkte nicht gefunden.' }, { status: 404 })
  }

  // Kanonische Reihenfolge (item_a < item_b) erzwingen, Duplikate ignorieren
  const [item_a, item_b] = [parsed.data.itemId, parsed.data.relatedId].sort()
  const { error } = await supabase.from('lop_item_relations')
    .upsert({ workspace_id: workspace.id, item_a, item_b, created_by: user.id },
      { onConflict: 'item_a,item_b', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: 'Verknüpfung fehlgeschlagen.' }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}

// Verknüpfung lösen
export async function DELETE(request: NextRequest) {
  const ctx = await authedWorkspace()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const { supabase, workspace, user } = ctx

  const parsed = mutateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  if (!await assertEditor(supabase, workspace.id, user.id)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const [item_a, item_b] = [parsed.data.itemId, parsed.data.relatedId].sort()
  await supabase.from('lop_item_relations')
    .delete()
    .eq('workspace_id', workspace.id)
    .eq('item_a', item_a)
    .eq('item_b', item_b)

  return NextResponse.json({ ok: true })
}
