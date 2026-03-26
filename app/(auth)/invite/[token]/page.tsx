import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InviteAcceptForm from './InviteAcceptForm'

interface Props {
  params: { token: string }
}

export default async function InvitePage({ params }: Props) {
  const supabase = createClient()

  const { data: invitation } = await supabase
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
        workspaces: { name: string; slug: string }
      } | null
    }

  if (!invitation) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  // Bereits eingeloggt → direkt akzeptieren
  if (user) {
    // Service client for write operations
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
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

  const workspace = invitation.workspaces as { name: string; slug: string }

  return (
    <InviteAcceptForm
      token={params.token}
      workspaceName={workspace.name}
      email={invitation.email}
      role={invitation.role}
    />
  )
}
