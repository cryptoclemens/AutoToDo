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

  // Service-Client nutzen, damit der Workspace-Join nicht an RLS scheitert
  const { data: invitation } = await serviceClient
    .from('invitations')
    .select('*, workspaces(name, slug)')
    .eq('token', params.token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single() as {
      data: {
        id: string
        workspace_id: string
        email: string
        role: string
        invited_by: string | null
        workspaces: { name: string; slug: string } | null
      } | null
    }

  if (!invitation || !invitation.workspaces) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  // Bereits eingeloggt → direkt akzeptieren
  if (user) {
    await serviceClient.from('workspace_members').insert({
      workspace_id: invitation.workspace_id,
      user_id: user.id,
      role: invitation.role,
      invited_by: invitation.invited_by,
    })

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
