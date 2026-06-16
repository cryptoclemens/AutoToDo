import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveWorkspace } from '@/lib/workspace'
import { isSuperAdmin } from '@/lib/superAdmin'
import WorkspaceNav from '@/components/workspace/WorkspaceNav'
import FeedbackButton from '@/components/FeedbackButton'
import Image from 'next/image'
import { StatusLabelsProvider } from '@/lib/statusLabels'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) redirect('/onboarding')

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .maybeSingle() as { data: { role: string } | null }

  // Project-scoped users are in project_members but not workspace_members — allow them through
  if (!member) {
    const { data: pm } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!pm) redirect('/onboarding')
  }

  const brandColor = workspace.brand_color ?? '#2563EB'
  const superAdmin = await isSuperAdmin(user.id)

  return (
    <>
      <style>{`
        :root { --brand: ${brandColor}; }
      `}</style>
      <StatusLabelsProvider>
      <div className="min-h-screen bg-gray-50">
        <WorkspaceNav
          workspace={workspace}
          userRole={member?.role ?? 'viewer'}
          userId={user.id}
          isSuperAdmin={superAdmin}
        />
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
        <FeedbackButton />
        <a
          href="https://www.vencly.com"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-40 opacity-50 hover:opacity-80 transition-opacity"
        >
          <Image src="/vencly-logo.svg" alt="vencly" width={72} height={18} />
        </a>
      </div>
      </StatusLabelsProvider>
    </>
  )
}
