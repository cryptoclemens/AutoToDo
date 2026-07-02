import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { resolveProjectAccess } from '@/lib/projectAccess'

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Idee laden + Zugriff (Edit) über deren Projekt-Workspace auflösen
async function ideaAccess(supabase: ReturnType<typeof db>, userId: string, ideaId: string) {
  const { data: idea } = await supabase
    .from('idea_items')
    .select('id, project_id, workspace_id, title, note')
    .eq('id', ideaId)
    .maybeSingle() as { data: { id: string; project_id: string; workspace_id: string; title: string; note: string | null } | null }
  if (!idea) return null
  const access = await resolveProjectAccess(supabase, userId, idea.project_id)
  if (!access) return null
  return { idea, access }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = db()
  const acc = await ideaAccess(supabase, user.id, params.id)
  if (!acc || !acc.access.canEdit) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })

  const { error } = await supabase
    .from('idea_items')
    .delete()
    .eq('id', params.id)
    .eq('workspace_id', acc.idea.workspace_id)

  if (error) return NextResponse.json({ error: 'Löschen fehlgeschlagen.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Update: Titel und Notiz einer nativen Idee bearbeiten
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json() as { title?: string; note?: string }
  if (!body.title?.trim()) return NextResponse.json({ error: 'Titel ist Pflichtfeld.' }, { status: 400 })

  const supabase = db()
  const acc = await ideaAccess(supabase, user.id, params.id)
  if (!acc || !acc.access.canEdit) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })

  const { data, error } = await supabase
    .from('idea_items')
    .update({ title: body.title.trim(), note: body.note?.trim() || null })
    .eq('id', params.id)
    .eq('workspace_id', acc.idea.workspace_id)
    .select('id, title, note, created_by_name, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Aktualisierung fehlgeschlagen.' }, { status: 500 })
  return NextResponse.json({ ...data, source: 'idea' as const })
}

// Promote: Idee → echten LOP-Punkt umwandeln
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = db()
  const acc = await ideaAccess(supabase, user.id, params.id)
  if (!acc || !acc.access.canEdit) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  const idea = acc.idea

  const { data: lopItem, error: insertErr } = await supabase
    .from('lop_items')
    .insert({
      project_id: idea.project_id,
      workspace_id: acc.idea.workspace_id,
      title: idea.title,
      description: idea.note ?? null,
      status: 'offen',
      priority: 'niedrig',
      source: 'manual',
    })
    .select('id')
    .single()

  if (insertErr) return NextResponse.json({ error: 'LOP-Punkt konnte nicht erstellt werden.' }, { status: 500 })

  await supabase.from('idea_items').delete().eq('id', params.id)

  return NextResponse.json({ ok: true, lopItemId: lopItem.id })
}
