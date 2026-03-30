import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Tokens are 64-char hex strings (randomBytes(32).toString('hex')), not UUIDs
const schema = z.object({ token: z.string().min(32).max(128) })

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültiger Token.' }, { status: 400 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Look up invitation first — the token is the proof of permission
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

  // Resolve which user to add: prefer authenticated session, fall back to email lookup.
  // The token + email match is sufficient auth proof (token was sent to that email).
  const supabaseAuth = createClient()
  const { data: { user: sessionUser } } = await supabaseAuth.auth.getUser()

  let userId: string | null = sessionUser?.id ?? null

  if (!userId) {
    // User just signed up — session cookie may not be set yet.
    // Look up the user by the invitation email using the service client.
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const matched = users.find(u => u.email === invitation.email)
    if (matched) {
      userId = matched.id
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Workspace membership only for workspace-level invites (no project_id)
  if (!invitation.project_id) {
    await supabase.from('workspace_members').upsert({
      workspace_id: invitation.workspace_id,
      user_id: userId,
      role: invitation.role,
      invited_by: invitation.invited_by,
    }, { onConflict: 'workspace_id,user_id', ignoreDuplicates: true })
  }

  // Projektspezifische Mitgliedschaft (falls projektbezogene Einladung)
  if (invitation.project_id) {
    const projectRole = ['workspace_admin', 'workspace_owner'].includes(invitation.role)
      ? 'project_admin'
      : invitation.role as 'project_admin' | 'editor' | 'viewer'
    await supabase.from('project_members').upsert({
      project_id: invitation.project_id,
      user_id: userId,
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
