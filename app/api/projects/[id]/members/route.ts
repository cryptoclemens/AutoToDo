import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { resolveWorkspace } from '@/lib/workspace'
import { headers } from 'next/headers'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin(projectId: string) {
  const authClient = createAuthClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { error: 'Nicht authentifiziert.', status: 401, user: null }

  const slug = headers().get('x-workspace-slug') ?? ''
  const supabase = serviceClient()
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return { error: 'Workspace nicht gefunden.', status: 404, user: null }

  // Check workspace admin OR project admin
  const { data: wsMember } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).maybeSingle() as { data: { role: string } | null }

  if (wsMember && ['workspace_owner', 'workspace_admin', 'project_admin'].includes(wsMember.role)) {
    return { error: null, status: 200, user, supabase }
  }

  const { data: pmMember } = await supabase
    .from('project_members').select('role')
    .eq('project_id', projectId).eq('user_id', user.id).maybeSingle() as { data: { role: string } | null }

  if (pmMember?.role === 'project_admin') {
    return { error: null, status: 200, user, supabase }
  }

  return { error: 'Keine Berechtigung.', status: 403, user: null }
}

/** GET /api/projects/[id]/members — list project members */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(params.id)
  if (auth.error || !auth.supabase) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase } = auth

  const { data, error } = await supabase
    .from('project_members')
    .select('user_id, role, joined_at')
    .eq('project_id', params.id)

  if (error) return NextResponse.json({ error: 'Fehler beim Laden.' }, { status: 500 })

  // Enrich with user emails
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const userMap = Object.fromEntries(users.map(u => [u.id, { email: u.email, display_name: u.user_metadata?.display_name ?? u.user_metadata?.full_name ?? null }]))

  const members = (data ?? []).map(m => ({
    user_id: m.user_id,
    role: m.role,
    joined_at: m.joined_at,
    email: userMap[m.user_id]?.email ?? null,
    display_name: userMap[m.user_id]?.display_name ?? null,
  }))

  return NextResponse.json(members)
}

/** DELETE /api/projects/[id]/members?userId=<uuid> — remove a project member */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(params.id)
  if (auth.error || !auth.supabase) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase } = auth

  const userId = new URL(req.url).searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Fehlende userId.' }, { status: 400 })

  await supabase.from('project_members').delete()
    .eq('project_id', params.id).eq('user_id', userId)

  return NextResponse.json({ ok: true })
}
