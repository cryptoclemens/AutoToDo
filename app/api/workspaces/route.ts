import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  userId: z.string().uuid(),
})

// Service-Role-Client (umgeht RLS)
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const { name, slug, userId } = parsed.data
  const supabase = createServiceClient()

  // Slug-Verfügbarkeit prüfen
  const { data: existing } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Diese Subdomain ist bereits vergeben.' }, { status: 409 })
  }

  // Workspace anlegen
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({ name, slug })
    .select('id')
    .single()

  if (wsError || !workspace) {
    return NextResponse.json({ error: 'Workspace konnte nicht erstellt werden.' }, { status: 500 })
  }

  // Nutzer als workspace_owner hinzufügen
  const { error: memberError } = await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: 'workspace_owner',
  })

  if (memberError) {
    // Workspace wieder löschen (Rollback)
    await supabase.from('workspaces').delete().eq('id', workspace.id)
    return NextResponse.json({ error: 'Mitgliedschaft konnte nicht erstellt werden.' }, { status: 500 })
  }

  return NextResponse.json({ workspaceId: workspace.id, slug }, { status: 201 })
}

/**
 * Auto-accept pending invitations for a user by email.
 * Called after registration so invited users are added to their workspace(s) automatically.
 */
export async function PATCH(request: NextRequest) {
  const { userId } = await request.json() as { userId?: string }
  if (!userId) return NextResponse.json({ ok: true })

  const supabase = createServiceClient()

  // Look up the user's email
  const { data: { user } } = await supabase.auth.admin.getUserById(userId)
  if (!user?.email) return NextResponse.json({ ok: true })

  // Find all pending invitations for this email
  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('email', user.email)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())

  if (!invitations?.length) return NextResponse.json({ ok: true })

  for (const inv of invitations) {
    await supabase.from('workspace_members').upsert({
      workspace_id: inv.workspace_id,
      user_id: userId,
      role: inv.role,
      invited_by: inv.invited_by,
    }, { onConflict: 'workspace_id,user_id', ignoreDuplicates: true })

    if (inv.project_id) {
      const projectRole = ['workspace_admin', 'workspace_owner'].includes(inv.role)
        ? 'project_admin'
        : inv.role as 'project_admin' | 'editor' | 'viewer'
      await supabase.from('project_members').upsert({
        project_id: inv.project_id,
        user_id: userId,
        role: projectRole,
        invited_by: inv.invited_by,
      }, { onConflict: 'project_id,user_id', ignoreDuplicates: true })
    }

    await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', inv.id)
  }

  return NextResponse.json({ ok: true, accepted: invitations.length })
}
