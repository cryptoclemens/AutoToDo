import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { resolveProjectAccess } from '@/lib/projectAccess'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function authedUser() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { error: 'Nicht authentifiziert.', status: 401 as const }
  return { user, supabase: serviceClient() }
}

// Item laden + Zugriff über dessen Projekt-Workspace auflösen
async function itemAccess(supabase: ReturnType<typeof serviceClient>, userId: string, itemId: string) {
  const { data: item } = await supabase
    .from('lop_items').select('id, workspace_id, project_id')
    .eq('id', itemId).maybeSingle() as { data: { id: string; workspace_id: string; project_id: string } | null }
  if (!item) return null
  const access = await resolveProjectAccess(supabase, userId, item.project_id)
  if (!access) return null
  return { item, access }
}

// Verwandte Punkte eines Items (bidirektional) auflisten
export async function GET(request: NextRequest) {
  const ctx = await authedUser()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const { supabase, user } = ctx

  const itemId = request.nextUrl.searchParams.get('itemId')
  if (!itemId) return NextResponse.json({ error: 'itemId fehlt.' }, { status: 400 })

  const acc = await itemAccess(supabase, user.id, itemId)
  if (!acc) return NextResponse.json({ error: 'Nicht gefunden oder keine Berechtigung.' }, { status: 403 })

  const { data: rels } = await supabase
    .from('lop_item_relations')
    .select('item_a, item_b')
    .eq('workspace_id', acc.item.workspace_id)
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

// Zwei Punkte verknüpfen
export async function POST(request: NextRequest) {
  const ctx = await authedUser()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const { supabase, user } = ctx

  const parsed = mutateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  if (parsed.data.itemId === parsed.data.relatedId) {
    return NextResponse.json({ error: 'Ein Punkt kann nicht mit sich selbst verknüpft werden.' }, { status: 400 })
  }

  // Zugriff (Edit) über das Projekt des ersten Items
  const acc = await itemAccess(supabase, user.id, parsed.data.itemId)
  if (!acc || !acc.access.canEdit) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }
  const workspaceId = acc.item.workspace_id

  // Beide Punkte müssen zum selben Workspace gehören
  const { data: items } = await supabase
    .from('lop_items').select('id, workspace_id')
    .in('id', [parsed.data.itemId, parsed.data.relatedId]) as { data: { id: string; workspace_id: string }[] | null }
  if ((items ?? []).filter(i => i.workspace_id === workspaceId).length !== 2) {
    return NextResponse.json({ error: 'Punkte nicht gefunden.' }, { status: 404 })
  }

  // Kanonische Reihenfolge (item_a < item_b) erzwingen, Duplikate ignorieren
  const [item_a, item_b] = [parsed.data.itemId, parsed.data.relatedId].sort()
  const { error } = await supabase.from('lop_item_relations')
    .upsert({ workspace_id: workspaceId, item_a, item_b, created_by: user.id },
      { onConflict: 'item_a,item_b', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: 'Verknüpfung fehlgeschlagen.' }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}

// Verknüpfung lösen
export async function DELETE(request: NextRequest) {
  const ctx = await authedUser()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const { supabase, user } = ctx

  const parsed = mutateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })

  const acc = await itemAccess(supabase, user.id, parsed.data.itemId)
  if (!acc || !acc.access.canEdit) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const [item_a, item_b] = [parsed.data.itemId, parsed.data.relatedId].sort()
  await supabase.from('lop_item_relations')
    .delete()
    .eq('workspace_id', acc.item.workspace_id)
    .eq('item_a', item_a)
    .eq('item_b', item_b)

  return NextResponse.json({ ok: true })
}
