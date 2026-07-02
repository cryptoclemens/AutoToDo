import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export interface SearchResult {
  id: string
  title: string
  responsible: string | null
  status: string
  due_date: string | null
  priority: string
  project_id: string
  project_name: string
}

export async function GET(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const raw = request.nextUrl.searchParams.get('q')?.trim()
  if (!raw || raw.length < 2) return NextResponse.json({ results: [] })
  // PostgREST metacharacters in .or()-strings können den Filter-AST kapern.
  // Alle PostgREST-Sonderzeichen entfernen bevor der Wert interpoliert wird.
  const q = raw.replace(/[,()*:\\]/g, '').slice(0, 100)
  if (q.length < 2) return NextResponse.json({ results: [] })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Über alle zugänglichen Projekte suchen: eigene Workspaces + direkt zugewiesene Projekte
  const { data: wsm } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', user.id)
  const memberWsIds = (wsm ?? []).map(m => (m as { workspace_id: string }).workspace_id)
  const projectIds = new Set<string>()
  if (memberWsIds.length) {
    const { data: ps } = await supabase.from('projects').select('id').in('workspace_id', memberWsIds)
    for (const p of ps ?? []) projectIds.add((p as { id: string }).id)
  }
  const { data: pms } = await supabase.from('project_members').select('project_id').eq('user_id', user.id)
  for (const r of pms ?? []) projectIds.add((r as { project_id: string }).project_id)
  if (projectIds.size === 0) return NextResponse.json({ results: [] })

  const { data: items } = await supabase
    .from('lop_items')
    .select('id, title, responsible, status, due_date, priority, project_id, projects(name)')
    .in('project_id', Array.from(projectIds))
    .or(`title.ilike.%${q}%,responsible.ilike.%${q}%,description.ilike.%${q}%`)
    .neq('status', 'abgeschlossen')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(30) as {
      data: Array<{
        id: string; title: string; responsible: string | null; status: string
        due_date: string | null; priority: string; project_id: string
        projects: { name: string } | null
      }> | null
    }

  const results: SearchResult[] = (items ?? []).map(i => ({
    id: i.id,
    title: i.title,
    responsible: i.responsible,
    status: i.status,
    due_date: i.due_date,
    priority: i.priority,
    project_id: i.project_id,
    project_name: i.projects?.name ?? '',
  }))

  return NextResponse.json({ results })
}
