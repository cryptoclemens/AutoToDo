import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveWorkspace } from '@/lib/workspace'
import BrandingForm from './BrandingForm'

export default async function BrandingPage() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const slug = headers().get('x-workspace-slug') ?? ''
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) redirect('/onboarding')

  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).single() as {
      data: { role: string } | null
    }

  if (!member || !['workspace_owner', 'workspace_admin'].includes(member.role)) {
    redirect('/dashboard')
  }

  const { data: ws } = await supabase
    .from('workspaces')
    .select('id, name, brand_color, logo_url')
    .eq('id', workspace.id).single() as {
      data: { id: string; name: string; brand_color: string; logo_url: string | null } | null
    }

  if (!ws) redirect('/dashboard')

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Branding</h1>
      <p className="text-sm text-gray-500 mb-6">Logo und Akzentfarbe deines Workspaces anpassen.</p>
      <BrandingForm workspace={ws} />
    </div>
  )
}
