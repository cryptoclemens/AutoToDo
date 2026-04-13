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
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000).toISOString()

  const [
    { data: workspacesByPlan },
    { count: totalTranscripts },
    { count: totalLopItems },
    { count: newWorkspacesMonth },
    { data: recentLopDates },
    { data: allUsers },
  ] = await Promise.all([
    supabase.from('workspaces').select('plan'),
    supabase.from('transcripts').select('id', { count: 'exact', head: true }),
    supabase.from('lop_items').select('id', { count: 'exact', head: true }),
    supabase.from('workspaces').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    // Active workspaces = had lop_item created in last 30 days
    supabase.from('lop_items').select('workspace_id').gte('created_at', thirtyDaysAgo),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const planCounts: Record<string, number> = {}
  for (const ws of workspacesByPlan ?? []) {
    planCounts[ws.plan] = (planCounts[ws.plan] ?? 0) + 1
  }

  const activeWorkspaceIds = new Set((recentLopDates ?? []).map(r => r.workspace_id))

  const totalUsers = allUsers?.users?.length ?? 0
  const newUsersMonth = (allUsers?.users ?? []).filter(
    u => u.created_at && u.created_at >= monthStart
  ).length
  const activeUsersMonth = (allUsers?.users ?? []).filter(
    u => u.last_sign_in_at && u.last_sign_in_at >= thirtyDaysAgo
  ).length

  return NextResponse.json({
    totalWorkspaces: (workspacesByPlan ?? []).length,
    planCounts,
    activeWorkspaces: activeWorkspaceIds.size,
    newWorkspacesMonth: newWorkspacesMonth ?? 0,
    totalUsers,
    newUsersMonth,
    activeUsersMonth,
    totalTranscripts: totalTranscripts ?? 0,
    totalLopItems: totalLopItems ?? 0,
  })
}
