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

/** GET: list all friends codes */
export async function GET() {
  const user = await checkSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

  const supabase = db()
  const { data: codes } = await supabase
    .from('friends_codes')
    .select('id, code, label, created_at, redeemed_at, redeemed_by_user_id, redeemed_workspace_id')
    .order('created_at', { ascending: false }) as {
      data: Array<{
        id: string; code: string; label: string | null
        created_at: string; redeemed_at: string | null
        redeemed_by_user_id: string | null; redeemed_workspace_id: string | null
      }> | null
    }

  // Enrich redeemed entries with workspace name + user email + usage counts
  const enriched = await Promise.all((codes ?? []).map(async c => {
    if (!c.redeemed_workspace_id) return {
      ...c, workspace_name: null, redeemed_email: null,
      lopCount: null, transcriptCount: null, lastActivity: null,
    }
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
      ...c,
      workspace_name: ws?.name ?? null,
      redeemed_email: redeemedUser?.email ?? null,
      lopCount: lopCount ?? 0,
      transcriptCount: transcriptCount ?? 0,
      lastActivity: lastLop?.[0]?.created_at ?? null,
    }
  }))

  return NextResponse.json(enriched)
}

/** POST: generate a new friends code */
export async function POST(request: NextRequest) {
  const user = await checkSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

  const body = await request.json() as { label?: string }
  const supabase = db()

  // Generate unique code (retry on collision)
  let code = generateFriendsCode()
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase
      .from('friends_codes').select('id').eq('code', code).maybeSingle()
    if (!existing) break
    code = generateFriendsCode()
  }

  const { data, error } = await supabase
    .from('friends_codes')
    .insert({ code, label: body.label ?? null, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Code konnte nicht erstellt werden.' }, { status: 500 })

  return NextResponse.json(data)
}
