import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/superAdmin'

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const ok = await isSuperAdmin(user.id)
  if (!ok) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

  const supabase = db()
  const workspaceId = params.id

  const [
    { data: ws },
    { count: memberCount },
    { count: projectCount },
    { data: lopItems },
    { count: transcriptCount },
    { data: members },
  ] = await Promise.all([
    supabase.from('workspaces').select('id, name, slug, plan, created_at').eq('id', workspaceId).single(),
    supabase.from('workspace_members').select('user_id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).is('archived_at', null),
    supabase.from('lop_items').select('status, due_date, created_at, priority').eq('workspace_id', workspaceId),
    supabase.from('transcripts').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase.from('workspace_members').select('user_id, role, joined_at').eq('workspace_id', workspaceId),
  ])

  if (!ws) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const items = lopItems ?? []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const openCount = items.filter(i => i.status !== 'abgeschlossen').length
  const doneCount = items.filter(i => i.status === 'abgeschlossen').length
  const overdueCount = items.filter(i =>
    i.status !== 'abgeschlossen' && i.due_date && new Date(i.due_date) < today
  ).length
  const highPrioCount = items.filter(i => i.priority === 'hoch' && i.status !== 'abgeschlossen').length

  // Completion rate
  const completionRate = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0

  // Items created per week (last 8 weeks)
  const weeklyActivity: Record<string, number> = {}
  for (let w = 7; w >= 0; w--) {
    const d = new Date(today)
    d.setDate(d.getDate() - w * 7)
    const key = d.toISOString().slice(0, 10)
    weeklyActivity[key] = 0
  }
  items.forEach(item => {
    const created = new Date(item.created_at)
    // Find which week bucket
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - w * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      if (created >= weekStart && created < weekEnd) {
        weeklyActivity[weekStart.toISOString().slice(0, 10)]++
        break
      }
    }
  })

  // Enrich members with email
  const enrichedMembers = await Promise.all((members ?? []).map(async m => {
    const { data: { user: u } } = await supabase.auth.admin.getUserById(m.user_id)
    return {
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      email: u?.email ?? '',
      display_name: u?.user_metadata?.full_name || u?.user_metadata?.name || u?.email || m.user_id,
      last_sign_in: u?.last_sign_in_at ?? null,
    }
  }))

  return NextResponse.json({
    workspace: ws,
    kpis: {
      memberCount: memberCount ?? 0,
      projectCount: projectCount ?? 0,
      transcriptCount: transcriptCount ?? 0,
      totalItems: items.length,
      openCount,
      doneCount,
      overdueCount,
      highPrioCount,
      completionRate,
    },
    weeklyActivity: Object.entries(weeklyActivity).map(([date, count]) => ({ date, count })),
    members: enrichedMembers,
  })
}
