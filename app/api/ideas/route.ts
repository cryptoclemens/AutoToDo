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

export async function GET(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId fehlt.' }, { status: 400 })

  const supabase = db()
  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const [{ data: ideas }, { data: parked }] = await Promise.all([
    supabase
      .from('idea_items')
      .select('id, title, note, created_by_name, created_at')
      .eq('project_id', projectId)
      .eq('workspace_id', workspace.id),
    supabase
      .from('lop_items')
      .select('id, title, description, created_at')
      .eq('project_id', projectId)
      .eq('workspace_id', workspace.id)
      .eq('status', 'geparkt'),
  ])

  const result = [
    ...(ideas ?? []).map(i => ({ ...i, note: i.note, source: 'idea' as const })),
    ...(parked ?? []).map(i => ({
      id: i.id,
      title: i.title,
      note: i.description,
      created_by_name: null,
      created_at: i.created_at,
      source: 'parked_lop' as const,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json() as { projectId?: string; title?: string; note?: string }
  if (!body.projectId || !body.title?.trim()) {
    return NextResponse.json({ error: 'projectId und title sind Pflichtfelder.' }, { status: 400 })
  }

  const supabase = db()
  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
  const displayName: string =
    authUser?.user?.user_metadata?.full_name ??
    authUser?.user?.user_metadata?.name ??
    authUser?.user?.email?.split('@')[0] ??
    'Unbekannt'

  const { data, error } = await supabase
    .from('idea_items')
    .insert({
      project_id: body.projectId,
      workspace_id: workspace.id,
      title: body.title.trim(),
      note: body.note?.trim() || null,
      created_by: user.id,
      created_by_name: displayName,
    })
    .select('id, title, note, created_by_name, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Idee konnte nicht gespeichert werden.' }, { status: 500 })
  return NextResponse.json(data)
}
