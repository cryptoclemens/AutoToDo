import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({ token: z.string().uuid() })

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültiger Token.' }, { status: 400 })
  }

  const supabaseAuth = createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: invitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', parsed.data.token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invitation) {
    return NextResponse.json({ error: 'Einladung ungültig oder abgelaufen.' }, { status: 404 })
  }

  // Workspace-Mitgliedschaft eintragen (ignoriert Duplikat)
  await supabase.from('workspace_members').upsert({
    workspace_id: invitation.workspace_id,
    user_id: user.id,
    role: invitation.role,
    invited_by: invitation.invited_by,
  }, { onConflict: 'workspace_id,user_id', ignoreDuplicates: true })

  // Projektspezifische Mitgliedschaft eintragen (falls projektbezogene Einladung)
  if (invitation.project_id) {
    const projectRole = ['workspace_admin', 'workspace_owner'].includes(invitation.role)
      ? 'project_admin'
      : invitation.role as 'project_admin' | 'editor' | 'viewer'
    await supabase.from('project_members').upsert({
      project_id: invitation.project_id,
      user_id: user.id,
      role: projectRole,
      invited_by: invitation.invited_by,
    }, { onConflict: 'project_id,user_id', ignoreDuplicates: true })
  }

  await supabase
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  return NextResponse.json({ ok: true, workspaceId: invitation.workspace_id })
}
