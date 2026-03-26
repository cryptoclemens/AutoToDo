import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Workspace des Nutzers laden
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
