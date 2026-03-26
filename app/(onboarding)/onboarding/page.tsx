import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

export default async function OnboardingPage() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  // Use service role to bypass self-referential RLS on workspace_members
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name, slug)')
    .eq('user_id', user.id)
    .single() as {
      data: {
        workspace_id: string
        role: string
        workspaces: { id: string; name: string; slug: string }
      } | null
    }

  if (!member) redirect('/register')

  const workspace = member.workspaces

  return <OnboardingWizard workspace={workspace} userId={user.id} />
}
