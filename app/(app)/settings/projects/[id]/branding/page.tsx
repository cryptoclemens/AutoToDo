import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveWorkspace } from '@/lib/workspace'
import ProjectBrandingForm from './ProjectBrandingForm'

interface Props {
  params: { id: string }
}

export default async function ProjectBrandingPage({ params }: Props) {
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
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).maybeSingle() as {
      data: { role: string } | null
    }

  if (!member || !['workspace_owner', 'workspace_admin', 'project_admin'].includes(member.role)) {
    redirect('/dashboard')
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, brand_color, logo_url, branding_inherited, bundesland')
    .eq('id', params.id)
    .eq('workspace_id', workspace.id)
    .single() as {
      data: { id: string; name: string; brand_color: string | null; logo_url: string | null; branding_inherited: boolean; bundesland: string | null } | null
    }

  if (!project) notFound()

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-1 text-sm text-gray-500">
        <Link href="/settings" className="hover:text-gray-700">Einstellungen</Link>
        <span>/</span>
        <span>{project.name}</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Projekt-Branding</h1>
      <p className="text-sm text-gray-500 mb-6">
        Eigenes Logo und Akzentfarbe für &bdquo;{project.name}&ldquo; — überschreibt das Workspace-Branding.
      </p>
      <ProjectBrandingForm project={project} workspaceId={workspace.id} bundesland={project.bundesland} />
    </div>
  )
}
