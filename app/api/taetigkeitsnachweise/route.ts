import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'

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

  // Anzeigename des Nutzers für Fallback-Suche über responsible-Textfeld
  const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
  const displayName: string | null =
    authUser?.user?.user_metadata?.full_name ?? authUser?.user?.user_metadata?.name ?? null

  const start = `${month}-01`
  const [y, m] = month.split('-').map(Number)
  const endDate = new Date(y, m, 0)
  const end = `${month}-${String(endDate.getDate()).padStart(2, '0')}`

  // LOP-Items: per responsible_user_id ODER per Anzeigename (Fallback für ältere Einträge)
  const buildLopQuery = (matchCol: string, matchVal: string) => {
    let q = supabase
      .from('lop_items')
      .select('title, updated_at')
      .eq('workspace_id', workspace.id)
      .eq(matchCol, matchVal)
      .gte('updated_at', `${start}T00:00:00`)
      .lte('updated_at', `${end}T23:59:59`)
      .order('updated_at', { ascending: true })
    if (projectId) q = q.eq('project_id', projectId)
    return q
  }

  const { data: byUserId } = await buildLopQuery('responsible_user_id', user.id)

  // Fallback: responsible-Text enthält den Anzeigenamen (nur wenn kein responsible_user_id gesetzt)
  let byName: { title: string; updated_at: string }[] = []
  if (displayName) {
    const { data } = await buildLopQuery('responsible', displayName)
    // Deduplizieren: Items, die bereits per user_id gefunden wurden, ausschließen
    const byUserIdDates = new Set((byUserId ?? []).map(i => i.updated_at.slice(0, 10) + '|' + i.title))
    byName = (data ?? []).filter(i => !byUserIdDates.has(i.updated_at.slice(0, 10) + '|' + i.title))
  }

  const lopItems = [...(byUserId ?? []), ...byName]

  // Transkripte des Monats im Workspace/Projekt
  let txQuery = supabase
    .from('transcripts')
    .select('original_filename, meeting_date')
    .eq('workspace_id', workspace.id)
    .gte('meeting_date', start)
    .lte('meeting_date', end)
    .order('meeting_date', { ascending: true })
  if (projectId) txQuery = txQuery.eq('project_id', projectId)
  const { data: transcripts } = await txQuery

  // Nach Datum gruppieren
  const days: Record<string, { lop: string[]; meetings: string[] }> = {}

  const getOrCreate = (date: string) => {
    if (!days[date]) days[date] = { lop: [], meetings: [] }
    return days[date]
  }

  for (const item of lopItems) {
    const date = item.updated_at.slice(0, 10)
    getOrCreate(date).lop.push(item.title)
  }

  for (const t of transcripts ?? []) {
    if (!t.meeting_date) continue
    const name = t.original_filename
      ? t.original_filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
      : 'Meeting'
    getOrCreate(t.meeting_date).meetings.push(name)
  }

  return NextResponse.json({ days })
}
