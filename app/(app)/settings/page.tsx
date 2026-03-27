import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveWorkspace } from '@/lib/workspace'
import { SettingsPageClient } from '@/components/settings/SettingsPageClient'

export default async function SettingsPage() {
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

  if (!member) redirect('/onboarding')

  const isAdmin = ['workspace_owner', 'workspace_admin'].includes(member.role)

  // Load workspace branding
  const { data: ws } = await supabase
    .from('workspaces').select('id, name, brand_color, logo_url')
    .eq('id', workspace.id).single() as {
      data: { id: string; name: string; brand_color: string; logo_url: string | null } | null
    }

  // Load members
  const { data: members } = await supabase
    .from('workspace_members').select('user_id, role, joined_at')
    .eq('workspace_id', workspace.id)
    .order('joined_at', { ascending: true }) as {
      data: Array<{ user_id: string; role: string; joined_at: string }> | null
    }

  // Load LLM config (admin only)
  const { data: llmConfig } = isAdmin
    ? await supabase.from('workspace_llm_config')
        .select('provider, model, endpoint')
        .eq('workspace_id', workspace.id).single() as {
          data: { provider: string; model: string; endpoint: string | null } | null
        }
    : { data: null }

  // Load API keys (admin only)
  const { data: apiKeys } = isAdmin
    ? await supabase.from('api_keys')
        .select('id, name, key_prefix, scope, expires_at, last_used_at, created_at, revoked_at')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false }) as {
          data: Array<{
            id: string; name: string; key_prefix: string; scope: string[]
            expires_at: string | null; last_used_at: string | null
            created_at: string; revoked_at: string | null
          }> | null
        }
    : { data: null }

  const llmInitial = llmConfig
    ? { configured: true, provider: llmConfig.provider, model: llmConfig.model, endpoint: llmConfig.endpoint ?? undefined, apiKeyMasked: '••••••••' }
    : { configured: false }

  return (
    <SettingsPageClient
      userEmail={user.email ?? ''}
      isAdmin={isAdmin}
      workspace={ws ?? { id: workspace.id, name: workspace.name, brand_color: '#2563EB', logo_url: null }}
      members={members ?? []}
      llmInitial={llmInitial}
      apiKeys={apiKeys ?? []}
    />
  )
}
