import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveWorkspace } from '@/lib/workspace'
import { headers } from 'next/headers'
import { z } from 'zod'

const updateSchema = z.object({
  role: z.enum(['workspace_admin', 'project_admin', 'editor', 'viewer']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Rolle.' }, { status: 400 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  // Only workspace_owner or workspace_admin may change roles
  const { data: self } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single()

  if (!self || !['workspace_owner', 'workspace_admin'].includes((self as { role: string }).role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  // Prevent changing workspace_owner role
  const { data: target } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', params.id)
    .single()

  if (!target) return NextResponse.json({ error: 'Mitglied nicht gefunden.' }, { status: 404 })
  if ((target as { role: string }).role === 'workspace_owner') {
    return NextResponse.json({ error: 'Workspace-Owner-Rolle kann nicht geändert werden.' }, { status: 403 })
  }

  const { error } = await supabase
    .from('workspace_members')
    .update({ role: parsed.data.role })
    .eq('workspace_id', workspace.id)
    .eq('user_id', params.id)

  if (error) return NextResponse.json({ error: 'Update fehlgeschlagen.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { data: self } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single()

  if (!self || !['workspace_owner', 'workspace_admin'].includes((self as { role: string }).role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  // Cannot remove yourself or workspace_owner
  if (params.id === user.id) {
    return NextResponse.json({ error: 'Sie können sich nicht selbst entfernen.' }, { status: 403 })
  }

  const { data: target } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', params.id)
    .single()

  if ((target as { role: string } | null)?.role === 'workspace_owner') {
    return NextResponse.json({ error: 'Workspace-Owner kann nicht entfernt werden.' }, { status: 403 })
  }

  await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspace.id)
    .eq('user_id', params.id)

  return NextResponse.json({ ok: true })
}
