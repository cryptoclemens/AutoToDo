import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', _request.url))

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const headersList = headers()
  const slug = headersList.get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.redirect(new URL('/dashboard', _request.url))

  const workspaceId = workspace.id

  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspaceId).eq('user_id', user.id).single()

  const adminRoles = ['workspace_owner', 'workspace_admin', 'project_admin']
  if (!member || !adminRoles.includes((member as { role: string }).role)) {
    return NextResponse.redirect(new URL(`/projects/${params.id}`, _request.url))
  }

  await supabase
    .from('projects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('workspace_id', workspaceId)

  return NextResponse.redirect(new URL('/dashboard', _request.url))
}
