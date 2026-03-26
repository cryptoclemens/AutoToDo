import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import WorkspaceNav from '@/components/workspace/WorkspaceNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Workspace aus Middleware-Header lesen
  const headersList = headers()
  const slug = headersList.get('x-workspace-slug') ?? ''

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, slug, brand_color, logo_url')
    .eq('slug', slug)
    .single() as { data: { id: string; name: string; slug: string; brand_color: string; logo_url: string | null } | null }

  if (!workspace) redirect('/login')

  // Mitgliedschaft prüfen
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single() as { data: { role: string } | null }

  if (!member) redirect('/login')

  const brandColor = workspace.brand_color ?? '#2563EB'

  return (
    <>
      {/* CSS Custom Properties für Branding */}
      <style>{`
        :root {
          --brand: ${brandColor};
        }
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
      </div>
    </>
  )
}
