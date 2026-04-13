import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/superAdmin'

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

  const supabase = db()

  const [
    { data: recentLop },
    { data: recentTranscripts },
    { data: recentWorkspaces },
  ] = await Promise.all([
    supabase
      .from('lop_items')
      .select('id, title, status, responsible, responsible_user_id, updated_by, created_at, updated_at, workspace_id, workspaces(name)')
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('transcripts')
      .select('id, workspace_id, created_at, workspaces(name)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('workspaces')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // Collect unique user ids that appear as updated_by or responsible_user_id
  const userIds = new Set<string>()
  for (const item of recentLop ?? []) {
    if (item.updated_by) userIds.add(item.updated_by)
    if (item.responsible_user_id) userIds.add(item.responsible_user_id)
  }

  // Fetch user emails/names for those ids
  const userMap: Record<string, string> = {}
  await Promise.all(Array.from(userIds).map(async uid => {
    const { data: { user: u } } = await supabase.auth.admin.getUserById(uid)
    if (u) {
      userMap[uid] = u.user_metadata?.full_name || u.user_metadata?.name || u.email || uid
    }
  }))

  type WsRef = { name: string } | { name: string }[] | null
  function wsName(ref: WsRef): string | null {
    if (!ref) return null
    if (Array.isArray(ref)) return ref[0]?.name ?? null
    return (ref as { name: string }).name ?? null
  }

  const lopActivity = (recentLop ?? []).map(item => ({
    type: 'lop' as const,
    id: item.id,
    title: item.title,
    status: item.status,
    responsible: item.responsible ?? null,
    actor: item.updated_by ? (userMap[item.updated_by] ?? item.updated_by) : null,
    workspace_name: wsName(item.workspaces as WsRef),
    workspace_id: item.workspace_id,
    timestamp: item.updated_at ?? item.created_at,
  }))

  const transcriptActivity = (recentTranscripts ?? []).map(t => ({
    type: 'transcript' as const,
    id: t.id,
    workspace_name: wsName(t.workspaces as WsRef),
    workspace_id: t.workspace_id,
    timestamp: t.created_at,
  }))

  const workspaceActivity = (recentWorkspaces ?? []).map(ws => ({
    type: 'workspace' as const,
    id: ws.id,
    name: ws.name,
    timestamp: ws.created_at,
  }))

  return NextResponse.json({ lopActivity, transcriptActivity, workspaceActivity })
}
