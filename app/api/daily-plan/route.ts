import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { resolveProjectAccess } from '@/lib/projectAccess'
import { z } from 'zod'

// GET /api/daily-plan?date=YYYY-MM-DD&projectId=UUID[&days=14]
export async function GET(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
  const projectId = searchParams.get('projectId')
  const days = Math.min(Number(searchParams.get('days') ?? '14'), 60)

  if (!projectId) return NextResponse.json({ error: 'projectId fehlt.' }, { status: 400 })

  // Zugriff über das Projekt (nicht Heimat-Workspace)
  const access = await resolveProjectAccess(supabase, user.id, projectId)
  if (!access) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })

  // Fetch last N days of plans for this project
  const since = new Date(date)
  since.setDate(since.getDate() - days + 1)

  const { data: plans } = await supabase
    .from('daily_plans')
    .select('date, text')
    .eq('user_id', user.id)
    .eq('project_id', projectId)
    .gte('date', since.toISOString().slice(0, 10))
    .lte('date', date)
    .order('date', { ascending: false })

  // Auto-suggest: open/in-progress LOP items for this project where user is responsible
  const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
  const displayName: string | null =
    authUser?.user?.user_metadata?.full_name ?? authUser?.user?.user_metadata?.name ?? null

  let suggestion = ''
  const todayPlan = (plans ?? []).find(p => p.date === date)
  if (!todayPlan?.text) {
    const baseQ = supabase
      .from('lop_items')
      .select('title')
      .eq('project_id', projectId)
      .in('status', ['offen', 'in_bearbeitung'])
      .order('updated_at', { ascending: false })
      .limit(5)

    const { data: byId } = await baseQ.eq('responsible_user_id', user.id)
    let items = byId ?? []

    if (items.length === 0 && displayName) {
      const { data: byName } = await supabase
        .from('lop_items')
        .select('title')
        .eq('project_id', projectId)
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
  projectId: z.string().uuid(),
  text: z.string().max(300),
})

// PUT /api/daily-plan — upsert plan for a given date + project
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

  const access = await resolveProjectAccess(supabase, user.id, parsed.data.projectId)
  if (!access) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  const workspace = { id: access.workspaceId }

  const { error } = await supabase
    .from('daily_plans')
    .upsert(
      {
        user_id: user.id,
        workspace_id: workspace.id,
        project_id: parsed.data.projectId,
        date: parsed.data.date,
        text: parsed.data.text,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,project_id,date' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
