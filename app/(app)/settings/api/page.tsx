import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveWorkspace } from '@/lib/workspace'
import ApiKeyList from './ApiKeyList'

export default async function ApiSettingsPage() {
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

  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, scope, expires_at, last_used_at, created_at, revoked_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false }) as {
      data: Array<{
        id: string; name: string; key_prefix: string; scope: string[]
        expires_at: string | null; last_used_at: string | null
        created_at: string; revoked_at: string | null
      }> | null
    }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">API-Keys</h1>
      <p className="text-sm text-gray-500 mb-6">
        Erstelle API-Keys für den programmatischen Zugriff auf AutoToDo.
      </p>
      <ApiKeyList initialKeys={apiKeys ?? []} />
    </div>
  )
}
