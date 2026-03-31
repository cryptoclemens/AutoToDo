import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify user has access to this item
  const { data: item } = await supabase
    .from('lop_items')
    .select('workspace_id, project_id, ai_confidence')
    .eq('id', params.id)
    .single() as { data: { workspace_id: string; project_id: string; ai_confidence: number | null } | null }

  if (!item) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  // Check access
  const { data: wsMember } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', item.workspace_id).eq('user_id', user.id).maybeSingle()

  if (!wsMember) {
    const { data: pmMember } = await supabase
      .from('project_members').select('role')
      .eq('project_id', item.project_id).eq('user_id', user.id).maybeSingle()
    if (!pmMember) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  // Fetch first and last history entries
  const { data: history } = await supabase
    .from('lop_item_history')
    .select('changed_by, change_type, created_at')
    .eq('item_id', params.id)
    .order('created_at', { ascending: true }) as {
      data: Array<{ changed_by: string | null; change_type: string; created_at: string }> | null
    }

  if (!history || history.length === 0) {
    return NextResponse.json({ created: null, lastEdited: null })
  }

  const first = history[0]
  const last = history[history.length - 1]

  // Collect user IDs to resolve
  const _userIds = [first.changed_by, last.changed_by].filter(Boolean) as string[]
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const userMap = Object.fromEntries(
    users.map(u => [u.id, u.user_metadata?.display_name ?? u.user_metadata?.full_name ?? u.email ?? u.id])
  )

  function resolveName(userId: string | null, changeType: string): string {
    if (!userId && changeType === 'ai_create') return 'KI'
    if (!userId) return 'Unbekannt'
    return userMap[userId] ?? 'Unbekannt'
  }

  const createdByAi = first.change_type === 'ai_create' || (item.ai_confidence !== null && !first.changed_by)

  return NextResponse.json({
    created: {
      name: createdByAi ? 'KI' : resolveName(first.changed_by, first.change_type),
      date: first.created_at,
      byAi: createdByAi,
    },
    lastEdited: history.length > 1 ? {
      name: resolveName(last.changed_by, last.change_type),
      date: last.created_at,
      byAi: last.change_type === 'ai_create' || last.change_type === 'ai_update',
    } : null,
  })
}
