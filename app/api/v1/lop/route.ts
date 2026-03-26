import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { validateApiKey } from '@/lib/apiKeyAuth'
import { z } from 'zod'

const createSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  responsible: z.string().max(200).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  priority: z.enum(['hoch', 'mittel', 'niedrig']).default('mittel'),
  status: z.enum(['offen', 'in_bearbeitung', 'abgeschlossen']).default('offen'),
})

export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request.headers.get('authorization'))
  if (!auth) {
    return NextResponse.json({ error: 'Ungültiger oder fehlender API-Key.' }, { status: 401 })
  }

  const projectId = request.nextUrl.searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json({ error: 'projectId ist erforderlich.' }, { status: 400 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify project belongs to workspace
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('workspace_id', auth.workspaceId)
    .single()

  if (!project) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })

  const { data, error } = await supabase
    .from('lop_items')
    .select('id, title, description, responsible, due_date, priority, status, result, created_at, updated_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Datenbankfehler.' }, { status: 500 })

  return NextResponse.json({ data, count: data?.length ?? 0 })
}

export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request.headers.get('authorization'))
  if (!auth) {
    return NextResponse.json({ error: 'Ungültiger oder fehlender API-Key.' }, { status: 401 })
  }

  if (!auth.scope.includes('write')) {
    return NextResponse.json({ error: 'Schreibzugriff erforderlich.' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', parsed.data.projectId)
    .eq('workspace_id', auth.workspaceId)
    .single()

  if (!project) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })

  const { data, error } = await supabase
    .from('lop_items')
    .insert({
      workspace_id: auth.workspaceId,
      project_id: parsed.data.projectId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      responsible: parsed.data.responsible ?? null,
      due_date: parsed.data.due_date ?? null,
      priority: parsed.data.priority,
      status: parsed.data.status,
    })
    .select('id, title, description, responsible, due_date, priority, status, created_at')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Erstellung fehlgeschlagen.' }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
