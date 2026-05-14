import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = db()
  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { error } = await supabase
    .from('idea_items')
    .delete()
    .eq('id', params.id)
    .eq('workspace_id', workspace.id)

  if (error) return NextResponse.json({ error: 'Löschen fehlgeschlagen.' }, { status: 500 })
  return NextResponse.json({ ok: true })
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
  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { data: idea, error: fetchErr } = await supabase
    .from('idea_items')
    .select('id, project_id, title, note')
    .eq('id', params.id)
    .eq('workspace_id', workspace.id)
    .single()

  if (fetchErr || !idea) return NextResponse.json({ error: 'Idee nicht gefunden.' }, { status: 404 })

  const { data: lopItem, error: insertErr } = await supabase
    .from('lop_items')
    .insert({
      project_id: idea.project_id,
      workspace_id: workspace.id,
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
