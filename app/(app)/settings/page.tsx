import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveWorkspace } from '@/lib/workspace'
import { SettingsPageClient } from '@/components/settings/SettingsPageClient'
import { isMollieConfigured } from '@/lib/mollie'
import { APP_VERSION } from '@/lib/version'

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

  // Load workspace branding + digest setting
  const { data: ws } = await supabase
    .from('workspaces').select('id, name, brand_color, logo_url, digest_enabled, digest_frequency, bundesland, plan, plan_expires_at')
    .eq('id', workspace.id).single() as {
      data: { id: string; name: string; brand_color: string; logo_url: string | null; digest_enabled: boolean; digest_frequency: string; bundesland: string | null; plan: string; plan_expires_at: string | null } | null
    }

  // Load members with email via RPC (SECURITY DEFINER, joins auth.users)
  const { data: members } = await supabase
    .rpc('get_workspace_members_with_email', { p_workspace_id: workspace.id }) as {
      data: Array<{ user_id: string; role: string; joined_at: string; email: string; display_name: string }> | null
    }

  // Load LLM configs (admin only) – extraction + transcription
  type LlmRow = { role: string; provider: string; model: string; endpoint: string | null } | null
  let llmExtraction: LlmRow = null
  let llmTranscription: LlmRow = null
  if (isAdmin) {
    const { data: llmRows } = await supabase
      .from('workspace_llm_config')
      .select('role, provider, model, endpoint')
      .eq('workspace_id', workspace.id) as { data: Array<{ role: string; provider: string; model: string; endpoint: string | null }> | null }
    llmExtraction = (llmRows ?? []).find(r => r.role === 'extraction') ?? null
    llmTranscription = (llmRows ?? []).find(r => r.role === 'transcription') ?? null
  }
  const llmInitial = {
    extraction: llmExtraction
      ? { configured: true as const, provider: llmExtraction.provider, model: llmExtraction.model, endpoint: llmExtraction.endpoint ?? undefined, apiKeyMasked: '••••••••' }
      : { configured: false as const },
    transcription: llmTranscription
      ? { configured: true as const, provider: llmTranscription.provider, model: llmTranscription.model, apiKeyMasked: '••••••••' }
      : { configured: false as const },
  }

  // Load billing usage data

  const plan = (ws?.plan ?? 'beta') as import('@/lib/plans').Plan
  const [{ count: projectCount }, { count: seatCount }, { data: usageData }] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id).is('archived_at', null),
    supabase.from('workspace_members').select('user_id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
    supabase.from('workspace_usage').select('transcripts_month').eq('workspace_id', workspace.id).maybeSingle(),
  ])

  // Load pending invitations (admin only)
  const { data: pendingInvitations } = isAdmin
    ? await supabase
        .from('invitations')
        .select('id, email, role, created_at, expires_at, project_id')
        .eq('workspace_id', workspace.id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false }) as {
          data: Array<{ id: string; email: string; role: string; created_at: string; expires_at: string; project_id: string | null }> | null
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

  // Load Notion config (admin only, fallback if table doesn't exist yet)
  let notionInitial = { configured: false, connectedAt: null as string | null }
  if (isAdmin) {
    try {
      const { data: notionData } = await supabase
        .from('workspace_notion_configs')
        .select('connected_at')
        .eq('workspace_id', workspace.id)
        .maybeSingle() as { data: { connected_at: string } | null }
      if (notionData) notionInitial = { configured: true, connectedAt: notionData.connected_at }
    } catch { /* Migration 018 not yet deployed – silently skip */ }
  }

  return (
    <SettingsPageClient
      userEmail={user.email ?? ''}
      isAdmin={isAdmin}
      workspace={ws ?? { id: workspace.id, name: workspace.name, brand_color: '#2563EB', logo_url: null, digest_enabled: true, digest_frequency: 'daily', bundesland: null, plan: 'beta', plan_expires_at: null }}
      members={members ?? []}
      pendingInvitations={pendingInvitations ?? []}
      llmInitial={llmInitial}
      apiKeys={apiKeys ?? []}
      mollieEnabled={isMollieConfigured()}
      billing={{
        plan,
        planExpiresAt: ws?.plan_expires_at ?? null,
        seatCount: seatCount ?? 0,
        projectCount: projectCount ?? 0,
        transcriptsThisMonth: (usageData as { transcripts_month?: number } | null)?.transcripts_month ?? 0,
      }}
      notionInitial={notionInitial}
      version={APP_VERSION}
    />
  )
}
