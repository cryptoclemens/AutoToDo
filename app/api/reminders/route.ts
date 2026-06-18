import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { resolveWorkspace } from '@/lib/workspace'

const createSchema = z.object({
  lopItemId: z.string().uuid(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
})

function computeNextReminderAt(
  frequency: string,
  dayOfWeek: number | null | undefined,
  dayOfMonth: number | null | undefined,
): Date {
  const now = new Date()

  if (frequency === 'daily') {
    const next = new Date(now)
    next.setDate(next.getDate() + 1)
    next.setHours(8, 0, 0, 0)
    return next
  }

  if (frequency === 'weekly' || frequency === 'biweekly') {
    // dayOfWeek: 0=Montag, ..., 6=Sonntag
    // JS getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
    // Convert: JS day → our day: (jsDay + 6) % 7
    const targetDay = dayOfWeek ?? 0 // default: Montag
    const next = new Date(now)
    next.setHours(8, 0, 0, 0)
    // Find next occurrence of targetDay
    const currentDay = (now.getDay() + 6) % 7 // convert to 0=Montag
    let daysUntil = (targetDay - currentDay + 7) % 7
    if (daysUntil === 0) daysUntil = 7 // always at least 1 week ahead
    next.setDate(next.getDate() + daysUntil)
    return next
  }

  if (frequency === 'monthly') {
    const targetDom = dayOfMonth ?? 1
    const next = new Date(now.getFullYear(), now.getMonth(), targetDom, 8, 0, 0, 0)
    if (next <= now) {
      next.setMonth(next.getMonth() + 1)
    }
    return next
  }

  // fallback
  const next = new Date(now)
  next.setDate(next.getDate() + 7)
  return next
}

export async function GET(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const lopItemId = new URL(request.url).searchParams.get('lopItemId')
  if (!lopItemId) return NextResponse.json({ error: 'lopItemId fehlt.' }, { status: 400 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('recurring_reminders')
    .select('*')
    .eq('lop_item_id', lopItemId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ reminder: data })
}

export async function POST(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  // Verify lop_item belongs to this workspace
  const { data: lopItem } = await supabase
    .from('lop_items')
    .select('id, project_id')
    .eq('id', parsed.data.lopItemId)
    .maybeSingle()

  if (!lopItem) return NextResponse.json({ error: 'LOP-Punkt nicht gefunden.' }, { status: 404 })

  const nextReminderAt = computeNextReminderAt(
    parsed.data.frequency,
    parsed.data.dayOfWeek,
    parsed.data.dayOfMonth,
  )

  // Upsert: one reminder per user per lop_item
  const { data: existing } = await supabase
    .from('recurring_reminders')
    .select('id')
    .eq('lop_item_id', parsed.data.lopItemId)
    .eq('user_id', user.id)
    .maybeSingle()

  let result
  if (existing) {
    const { data, error } = await supabase
      .from('recurring_reminders')
      .update({
        frequency: parsed.data.frequency,
        day_of_week: parsed.data.dayOfWeek ?? null,
        day_of_month: parsed.data.dayOfMonth ?? null,
        next_reminder_at: nextReminderAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  } else {
    const { data, error } = await supabase
      .from('recurring_reminders')
      .insert({
        lop_item_id: parsed.data.lopItemId,
        workspace_id: workspace.id,
        user_id: user.id,
        frequency: parsed.data.frequency,
        day_of_week: parsed.data.dayOfWeek ?? null,
        day_of_month: parsed.data.dayOfMonth ?? null,
        next_reminder_at: nextReminderAt.toISOString(),
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  }

  return NextResponse.json({ reminder: result })
}
