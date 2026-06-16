import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'

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

  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { data: items } = await supabase
    .from('lop_items')
    .select('id, title, responsible, status, due_date, priority, project_id, projects(name)')
    .eq('workspace_id', workspace.id)
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
