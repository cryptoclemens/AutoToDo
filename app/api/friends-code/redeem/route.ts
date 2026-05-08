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

export async function POST(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const { code } = await request.json() as { code?: string }
  const normalizedCode = (code ?? '').trim().toUpperCase()
  if (!normalizedCode) return NextResponse.json({ error: 'Kein Code angegeben.' }, { status: 400 })

  const supabase = db()

  const { data: friendsCode } = await supabase
    .from('friends_codes')
    .select('id, code, use_count, max_uses')
    .eq('code', normalizedCode)
    .maybeSingle() as {
      data: { id: string; code: string; use_count: number; max_uses: number } | null
    }

  if (!friendsCode) {
    return NextResponse.json({ error: 'Ungültiger Friends-Code.' }, { status: 404 })
  }
  if (friendsCode.use_count >= friendsCode.max_uses) {
    return NextResponse.json({ error: 'Dieser Code wurde bereits vollständig eingelöst.' }, { status: 409 })
  }

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Kein Workspace gefunden.' }, { status: 404 })

  await supabase
    .from('workspaces')
    .update({ plan: 'team', plan_expires_at: null })
    .eq('id', workspace.id)

  const newCount = friendsCode.use_count + 1
  const isExhausted = newCount >= friendsCode.max_uses
  await supabase.from('friends_codes').update({
    use_count: newCount,
    ...(isExhausted ? {
      redeemed_at: new Date().toISOString(),
      redeemed_by_user_id: user.id,
      redeemed_workspace_id: workspace.id,
    } : {}),
  }).eq('id', friendsCode.id)

  await supabase.from('friends_code_redemptions').insert({
    code_id: friendsCode.id,
    redeemed_by_user_id: user.id,
    redeemed_workspace_id: workspace.id,
  })

  return NextResponse.json({ ok: true, plan: 'team' })
}
