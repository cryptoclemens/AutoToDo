import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'

export async function GET(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const projectId = request.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId fehlt.' }, { status: 400 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const headersList = headers()
  const slug = headersList.get('x-workspace-slug') ?? ''
  const workspaceBase = await resolveWorkspace(supabase, user.id, slug)
  if (!workspaceBase) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  // Fetch additional fields needed for export
  const { data: workspace } = await supabase
    .from('workspaces').select('id, name, brand_color').eq('id', workspaceBase.id).single() as {
      data: { id: string; name: string; brand_color: string } | null
    }
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { data: project } = await supabase
    .from('projects').select('name').eq('id', projectId).eq('workspace_id', workspace.id).single() as {
      data: { name: string } | null
    }
  if (!project) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })

  const { data: items } = await supabase
    .from('lop_items')
    .select('title, description, responsible, due_date, priority, status, result, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true }) as { data: Array<Record<string, unknown>> | null }

  // Dynamischer Import (SheetJS ist optional – wird in Phase 6 vollständig implementiert)
  try {
    const { generateLopExcel } = await import('@/lib/export')
    const buffer = generateLopExcel(
      items ?? [],
      project.name,
      workspace.name,
      workspace.brand_color
    )
    const filename = `LOP_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Export-Modul noch nicht verfügbar.' }, { status: 501 })
  }
}
