import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import InviteAcceptForm from './InviteAcceptForm'

interface Props {
  params: { token: string }
}

export default async function InvitePage({ params }: Props) {
  const supabase = createClient()

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Do NOT filter by accepted_at here — a previous failed attempt may have set it.
  // Handle the already-accepted case explicitly below.
  const { data: invitation } = await serviceClient
    .from('invitations')
    .select('id, workspace_id, project_id, email, role, invited_by, accepted_at, expires_at, workspaces(name, slug)')
    .eq('token', params.token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle() as {
      data: {
        id: string
        workspace_id: string
        project_id: string | null
        email: string
        role: string
        invited_by: string | null
        accepted_at: string | null
        expires_at: string
        workspaces: { name: string; slug: string } | null
      } | null
    }

  if (!invitation || !invitation.workspaces) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  // Already accepted → if logged in send to dashboard, else show form with hint
  if (invitation.accepted_at) {
    if (user) redirect('/dashboard')
    // Show form in "already accepted" state — user can still log in and access
    return (
      <InviteAcceptForm
        token={params.token}
        workspaceName={invitation.workspaces.name}
        email={invitation.email}
        role={invitation.role}
        alreadyAccepted
      />
    )
  }

  // Logged-in user → accept immediately and redirect
  if (user) {
    if (invitation.project_id) {
      // Project-scoped invite: add only to project_members
      await serviceClient.from('project_members').upsert({
        project_id: invitation.project_id,
        user_id: user.id,
        role: invitation.role,
        joined_at: new Date().toISOString(),
      }, { onConflict: 'project_id,user_id' })
    } else {
      // Workspace invite: add to workspace_members
      await serviceClient.from('workspace_members').upsert({
        workspace_id: invitation.workspace_id,
        user_id: user.id,
        role: invitation.role,
        invited_by: invitation.invited_by,
      }, { onConflict: 'workspace_id,user_id' })
    }

    await serviceClient
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    redirect('/dashboard')
  }

  return (
    <InviteAcceptForm
      token={params.token}
      workspaceName={invitation.workspaces.name}
      email={invitation.email}
      role={invitation.role}
    />
  )
}
