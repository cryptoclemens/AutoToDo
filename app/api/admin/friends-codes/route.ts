import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin, generateFriendsCode } from '@/lib/superAdmin'

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function checkSuperAdmin() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null
  const ok = await isSuperAdmin(user.id)
  return ok ? user : null
}

/** GET: list all friends codes with redemption details */
export async function GET() {
  const user = await checkSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

  const supabase = db()
  const { data: codes } = await supabase
    .from('friends_codes')
    .select('id, code, label, created_at, redeemed_at, redeemed_by_user_id, redeemed_workspace_id, max_uses, use_count')
    .order('created_at', { ascending: false }) as {
      data: Array<{
        id: string; code: string; label: string | null
        created_at: string; redeemed_at: string | null
        redeemed_by_user_id: string | null; redeemed_workspace_id: string | null
        max_uses: number | null; use_count: number | null
      }> | null
    }

  // Fetch all redemptions for all codes in one query
  const codeIds = (codes ?? []).map(c => c.id)
  const { data: allRedemptions } = codeIds.length > 0
    ? await supabase
        .from('friends_code_redemptions')
        .select('id, code_id, redeemed_at, redeemed_by_user_id, redeemed_workspace_id')
        .in('code_id', codeIds)
        .order('redeemed_at', { ascending: true })
    : { data: [] as Array<{ id: string; code_id: string; redeemed_at: string; redeemed_by_user_id: string | null; redeemed_workspace_id: string | null }> }

  // Batch-fetch workspace names for all unique workspace IDs in redemptions
  const uniqueWsIds = [...new Set((allRedemptions ?? []).map(r => r.redeemed_workspace_id).filter(Boolean) as string[])]
  const { data: wsList } = uniqueWsIds.length > 0
    ? await supabase.from('workspaces').select('id, name').in('id', uniqueWsIds)
    : { data: [] as Array<{ id: string; name: string }> }
  const wsNameMap = Object.fromEntries((wsList ?? []).map(w => [w.id, w.name]))

  // Batch-fetch user emails for all unique user IDs in redemptions
  const uniqueUserIds = [...new Set((allRedemptions ?? []).map(r => r.redeemed_by_user_id).filter(Boolean) as string[])]
  const emailMap: Record<string, string> = {}
  await Promise.all(uniqueUserIds.map(async uid => {
    const { data: { user: u } } = await supabase.auth.admin.getUserById(uid)
    if (u?.email) emailMap[uid] = u.email
  }))

  // Group redemptions by code_id
  const redemptionsByCode: Record<string, Array<{
    id: string; redeemed_at: string
    redeemed_email: string | null; workspace_id: string | null; workspace_name: string | null
  }>> = {}
  for (const r of allRedemptions ?? []) {
    if (!redemptionsByCode[r.code_id]) redemptionsByCode[r.code_id] = []
    redemptionsByCode[r.code_id].push({
      id: r.id,
      redeemed_at: r.redeemed_at,
      redeemed_email: r.redeemed_by_user_id ? (emailMap[r.redeemed_by_user_id] ?? null) : null,
      workspace_id: r.redeemed_workspace_id,
      workspace_name: r.redeemed_workspace_id ? (wsNameMap[r.redeemed_workspace_id] ?? null) : null,
    })
  }

  // Enrich single-use redeemed codes with workspace stats (existing behavior)
  const enriched = await Promise.all((codes ?? []).map(async c => {
    const maxUses = c.max_uses ?? 1
    const useCount = c.use_count ?? 0
    const redemptions = redemptionsByCode[c.id] ?? []

    // For single-use codes with a redeemed workspace: full enrichment as before
    if (maxUses === 1 && c.redeemed_workspace_id) {
      const [
        { data: ws },
        { data: { user: redeemedUser } },
        { count: lopCount },
        { count: transcriptCount },
        { data: lastLop },
      ] = await Promise.all([
        supabase.from('workspaces').select('name').eq('id', c.redeemed_workspace_id).single(),
        c.redeemed_by_user_id
          ? supabase.auth.admin.getUserById(c.redeemed_by_user_id)
          : Promise.resolve({ data: { user: null } }),
        supabase.from('lop_items').select('id', { count: 'exact', head: true }).eq('workspace_id', c.redeemed_workspace_id),
        supabase.from('transcripts').select('id', { count: 'exact', head: true }).eq('workspace_id', c.redeemed_workspace_id),
        supabase.from('lop_items').select('created_at').eq('workspace_id', c.redeemed_workspace_id).order('created_at', { ascending: false }).limit(1),
      ])
      return {
        ...c, max_uses: maxUses, use_count: useCount,
        workspace_name: ws?.name ?? null,
        redeemed_email: redeemedUser?.email ?? null,
        lopCount: lopCount ?? 0,
        transcriptCount: transcriptCount ?? 0,
        lastActivity: lastLop?.[0]?.created_at ?? null,
        redemptions,
      }
    }

    // For multi-use codes: no top-level workspace stats
    return {
      ...c, max_uses: maxUses, use_count: useCount,
      workspace_name: null, redeemed_email: null,
      lopCount: null, transcriptCount: null, lastActivity: null,
      redemptions,
    }
  }))

  return NextResponse.json(enriched)
}

/** POST: generate a new friends code */
export async function POST(request: NextRequest) {
  const user = await checkSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

  const body = await request.json() as { label?: string; max_uses?: number }
  const maxUses = Math.max(1, Math.min(100, Math.round(Number(body.max_uses) || 1)))
  const supabase = db()

  let code = generateFriendsCode()
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase
      .from('friends_codes').select('id').eq('code', code).maybeSingle()
    if (!existing) break
    code = generateFriendsCode()
  }

  const { data, error } = await supabase
    .from('friends_codes')
    .insert({ code, label: body.label ?? null, created_by: user.id, max_uses: maxUses })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Code konnte nicht erstellt werden.' }, { status: 500 })

  return NextResponse.json(data)
}
