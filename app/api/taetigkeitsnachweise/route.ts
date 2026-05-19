import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'
import { getWorkingDays, getGermanHolidays, getHolidayLabels } from '@/lib/holidays'

export async function GET(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // YYYY-MM
  const projectId = searchParams.get('projectId') ?? null
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'Parameter month (YYYY-MM) fehlt.' }, { status: 400 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { data: wsRow } = await supabase
    .from('workspaces').select('bundesland').eq('id', workspace.id).single()
  const wsBundesland: string | null = (wsRow as { bundesland: string | null } | null)?.bundesland ?? null

  const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
  const displayName: string | null =
    authUser?.user?.user_metadata?.full_name ?? authUser?.user?.user_metadata?.name ?? null

  const [y, m] = month.split('-').map(Number)
  const start = `${month}-01`
  const end = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`

  // Bundesland des Projekts für Feiertags-Filterung
  let bundesland: string | null = null
  if (projectId) {
    const { data: proj } = await supabase
      .from('projects').select('bundesland').eq('id', projectId).single()
    bundesland = proj?.bundesland ?? null
  }

  const workingDays = getWorkingDays(y, m, bundesland)

  const daysCount = new Date(y, m, 0).getDate()
  const allDays: string[] = Array.from({ length: daysCount }, (_, i) => {
    const d = String(i + 1).padStart(2, '0')
    return `${month}-${d}`
  })

  const holidays = getGermanHolidays(y, wsBundesland)
  const holidayLabels = getHolidayLabels(y, wsBundesland)
  const nonWorkingDays: string[] = allDays.filter(date => {
    const dow = new Date(date + 'T00:00:00').getDay()
    return dow === 0 || dow === 6 || holidays.has(date)
  })

  // LOP-Items: fällig ODER abgeschlossen im Monat
  const buildLopQuery = (matchCol: string, matchVal: string) => {
    let q = supabase
      .from('lop_items')
      .select('title, due_date, completed_at')
      .eq('workspace_id', workspace.id)
      .eq(matchCol, matchVal)
      .or(
        `and(due_date.gte.${start},due_date.lte.${end}),` +
        `and(completed_at.gte.${start}T00:00:00,completed_at.lte.${end}T23:59:59)`
      )
    if (projectId) q = q.eq('project_id', projectId)
    return q
  }

  const { data: byUserId } = await buildLopQuery('responsible_user_id', user.id)

  let byName: { title: string; due_date: string | null; completed_at: string | null }[] = []
  if (displayName) {
    const { data } = await buildLopQuery('responsible', displayName)
    const seen = new Set((byUserId ?? []).map(i => i.title))
    byName = (data ?? []).filter(i => !seen.has(i.title))
  }

  const lopItems = [...(byUserId ?? []), ...byName].filter(i => i.title?.trim())

  // Transkripte
  let txQuery = supabase
    .from('transcripts')
    .select('original_filename, meeting_date')
    .eq('workspace_id', workspace.id)
    .gte('meeting_date', start)
    .lte('meeting_date', end)
    .not('original_filename', 'in', '("__paste__","eingefuegter-text.txt","eingefügter-text.txt")')
    .order('meeting_date', { ascending: true })
  if (projectId) txQuery = txQuery.eq('project_id', projectId)
  const { data: transcripts } = await txQuery

  // Tagespläne
  const { data: dailyPlans } = await supabase
    .from('daily_plans')
    .select('date, text')
    .eq('user_id', user.id)
    .eq('workspace_id', workspace.id)
    .gte('date', start)
    .lte('date', end)

  const days: Record<string, { lop: string[]; meetings: string[]; plan?: string }> = {}

  const getOrCreate = (date: string) => {
    if (!days[date]) days[date] = { lop: [], meetings: [] }
    return days[date]
  }

  for (const p of dailyPlans ?? []) {
    if (p.text?.trim()) getOrCreate(p.date).plan = p.text
  }

  for (const item of lopItems) {
    // Abgeschlossene Items erscheinen am Abschlusstag
    if (item.completed_at) {
      const d = item.completed_at.slice(0, 10)
      if (d >= start && d <= end) getOrCreate(d).lop.push(item.title)
    }
    // Items mit Deadline erscheinen zusätzlich am Fälligkeitstag
    if (item.due_date && item.due_date >= start && item.due_date <= end) {
      const d = item.due_date
      const existing = days[d]?.lop ?? []
      if (!existing.includes(item.title)) getOrCreate(d).lop.push(item.title)
    }
  }

  for (const t of transcripts ?? []) {
    if (!t.meeting_date) continue
    const name = t.original_filename
      ? t.original_filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
      : 'Meeting'
    getOrCreate(t.meeting_date).meetings.push(name)
  }

  return NextResponse.json({ days, workingDays, allDays, nonWorkingDays, holidayLabels })
}
