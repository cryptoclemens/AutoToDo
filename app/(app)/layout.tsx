import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { resolveWorkspace } from '@/lib/workspace'
import WorkspaceNav from '@/components/workspace/WorkspaceNav'
import FeedbackButton from '@/components/FeedbackButton'
import Image from 'next/image'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) redirect('/onboarding')

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single() as { data: { role: string } | null }

  if (!member) redirect('/onboarding')

  const brandColor = workspace.brand_color ?? '#2563EB'

  return (
    <>
      <style>{`
        :root { --brand: ${brandColor}; }
      `}</style>
      <div className="min-h-screen bg-gray-50">
        <WorkspaceNav
          workspace={workspace}
          userRole={member.role}
          userId={user.id}
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
    </>
  )
}
