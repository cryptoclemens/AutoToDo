import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { z } from 'zod'

const createSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  responsible: z.string().max(100).nullable().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  priority: z.enum(['hoch', 'mittel', 'niedrig']).default('mittel'),
})

export async function POST(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Workspace aus Subdomain-Header
  const headersList = headers()
  const slug = headersList.get('x-workspace-slug') ?? ''
  const { data: workspace } = await supabase
    .from('workspaces').select('id').eq('slug', slug).single()
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const workspaceId = (workspace as { id: string }).id

  // Berechtigung prüfen
  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspaceId).eq('user_id', user.id).single()

  const editRoles = ['workspace_owner', 'workspace_admin', 'project_admin', 'editor']
  if (!member || !editRoles.includes((member as { role: string }).role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const { projectId, ...fields } = parsed.data
  const { data, error } = await supabase
    .from('lop_items')
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      ...fields,
    })
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'LOP-Punkt konnte nicht erstellt werden.' }, { status: 500 })
  }

  // Audit-Log
  await supabase.from('lop_item_history').insert({
    workspace_id: workspaceId,
    item_id: (data as { id: string }).id,
    changed_by: user.id,
    change_type: 'manual_edit',
    new_values: data,
  })

  return NextResponse.json(data, { status: 201 })
}
