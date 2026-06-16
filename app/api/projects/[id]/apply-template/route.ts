import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'
import { z } from 'zod'

const schema = z.object({ templateId: z.string().uuid() })

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'templateId fehlt.' }, { status: 400 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { data: project } = await supabase
    .from('projects').select('id').eq('id', params.id).eq('workspace_id', workspace.id).single() as { data: { id: string } | null }
  if (!project) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })

  const { data: template } = await supabase
    .from('lop_templates').select('items').eq('id', parsed.data.templateId).eq('workspace_id', workspace.id).single() as {
      data: { items: Array<{ title: string; priority?: string; due_offset_days?: number }> } | null
    }
  if (!template) return NextResponse.json({ error: 'Vorlage nicht gefunden.' }, { status: 404 })

  const today = new Date()
  const insertRows = template.items.map(item => ({
    workspace_id: workspace.id,
    project_id: project.id,
    title: item.title,
    status: 'offen',
    priority: item.priority ?? 'mittel',
    due_date: item.due_offset_days != null
      ? new Date(today.getTime() + item.due_offset_days * 86400_000).toISOString().slice(0, 10)
      : null,
    requires_review: false,
  }))

  const { data: created, error } = await supabase
    .from('lop_items').insert(insertRows).select('id') as { data: Array<{ id: string }> | null; error: unknown }

  if (error) return NextResponse.json({ error: 'Fehler beim Erstellen der LOP-Punkte.' }, { status: 500 })
  return NextResponse.json({ created: created?.length ?? 0 })
}
