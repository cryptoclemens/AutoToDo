import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify project exists and user has edit permission via workspace membership
  const { data: project } = await supabase
    .from('projects').select('id, workspace_id').eq('id', params.id).single() as {
      data: { id: string; workspace_id: string } | null
    }
  if (!project) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })

  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', project.workspace_id).eq('user_id', user.id).single() as {
      data: { role: string } | null
    }

  const editRoles = ['workspace_owner', 'workspace_admin', 'project_admin', 'editor']
  if (!member || !editRoles.includes(member.role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const { data: updated, error } = await supabase
    .from('projects')
    .update(parsed.data)
    .eq('id', params.id)
    .select('id, name, description')
    .single()

  if (error || !updated) {
    return NextResponse.json({ error: 'Projekt konnte nicht aktualisiert werden.' }, { status: 500 })
  }

  return NextResponse.json(updated)
}
