import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'
import { z } from 'zod'

// GET /api/daily-plan?date=YYYY-MM-DD[&days=14]
// Returns plan for the given date + recent history
export async function GET(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
  const days = Math.min(Number(searchParams.get('days') ?? '14'), 60)

  // Fetch last N days of plans
  const since = new Date(date)
  since.setDate(since.getDate() - days + 1)

  const { data: plans } = await supabase
    .from('daily_plans')
    .select('date, text')
    .eq('user_id', user.id)
    .eq('workspace_id', workspace.id)
    .gte('date', since.toISOString().slice(0, 10))
    .lte('date', date)
    .order('date', { ascending: false })

  // Auto-suggest for today: open/in-progress LOP items where user is responsible
  const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
  const displayName: string | null =
    authUser?.user?.user_metadata?.full_name ?? authUser?.user?.user_metadata?.name ?? null

  let suggestion = ''
  const todayPlan = (plans ?? []).find(p => p.date === date)
  if (!todayPlan?.text) {
    let lopQ = supabase
      .from('lop_items')
      .select('title')
      .eq('workspace_id', workspace.id)
      .in('status', ['offen', 'in_bearbeitung'])
      .order('updated_at', { ascending: false })
      .limit(5)

    // Try by user_id first, then by display name
    const { data: byId } = await lopQ.eq('responsible_user_id', user.id)
    let items = byId ?? []

    if (items.length === 0 && displayName) {
      const { data: byName } = await supabase
        .from('lop_items')
        .select('title')
        .eq('workspace_id', workspace.id)
        .eq('responsible', displayName)
        .in('status', ['offen', 'in_bearbeitung'])
        .order('updated_at', { ascending: false })
        .limit(5)
      items = byName ?? []
    }

    const joined = items.map(i => i.title).join('; ')
    suggestion = joined.length > 300 ? joined.slice(0, 299) + '…' : joined
  }

  return NextResponse.json({
    today: date,
    plan: todayPlan?.text ?? '',
    suggestion,
    history: (plans ?? []).filter(p => p.date !== date),
  })
}

const putSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  text: z.string().max(300),
})

// PUT /api/daily-plan — upsert plan for a given date
export async function PUT(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { error } = await supabase
    .from('daily_plans')
    .upsert(
      { user_id: user.id, workspace_id: workspace.id, date: parsed.data.date, text: parsed.data.text, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,workspace_id,date' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
