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

  // For generic links (is_link=true) we don't filter by accepted_at — they're reusable.
  // For regular email invites we require accepted_at IS NULL (single-use).
  const now = new Date().toISOString()

  // First try as a reusable link
  let invitation = null
  const { data: linkInvitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', parsed.data.token)
    .eq('is_link', true)
    .gt('expires_at', now)
    .maybeSingle()

  if (linkInvitation) {
    invitation = linkInvitation
  } else {
    // Fall back to regular (single-use, email-targeted) invite
    const { data: emailInvitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', parsed.data.token)
      .eq('is_link', false)
      .is('accepted_at', null)
      .gt('expires_at', now)
      .maybeSingle()
    invitation = emailInvitation
  }

  if (!invitation) {
    return NextResponse.json({ error: 'Einladung ungültig oder abgelaufen.' }, { status: 404 })
  }

  // Resolve which user to add: prefer authenticated session, fall back to email lookup.
  const supabaseAuth = createClient()
  const { data: { user: sessionUser } } = await supabaseAuth.auth.getUser()

  let userId: string | null = sessionUser?.id ?? null

  if (!userId && invitation.email) {
    // For email invites: user just signed up — look up by invitation email
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const matched = users.find(u => u.email === invitation.email)
    if (matched) userId = matched.id
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

  // Only mark email invites as accepted (link invites stay active for reuse)
  if (!invitation.is_link) {
    await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)
  }

  return NextResponse.json({ ok: true, workspaceId: invitation.workspace_id })
}
