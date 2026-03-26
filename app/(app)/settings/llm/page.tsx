import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { resolveWorkspace } from '@/lib/workspace'
import { LlmSettingsForm } from './LlmSettingsForm'

export default async function LlmSettingsPage() {
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

  const isAdmin = ['workspace_owner', 'workspace_admin'].includes(member?.role ?? '')

  const { data: llmConfig } = await supabase
    .from('workspace_llm_config')
    .select('provider, model')
    .eq('workspace_id', workspace.id)
    .single() as { data: { provider: string; model: string } | null }

  const initial = llmConfig
    ? { configured: true, provider: llmConfig.provider, model: llmConfig.model, apiKeyMasked: '••••••••' }
    : { configured: false }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">LLM-Einstellungen</h1>
      <p className="text-sm text-gray-500 mb-8">
        Hinterlegen Sie Ihren eigenen API-Key (BYOK). Ihre Transkripte werden direkt an den gewählten Anbieter geschickt.
      </p>

      {isAdmin ? (
        <LlmSettingsForm initial={initial} />
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
          Nur Workspace-Admins können die LLM-Konfiguration ändern.
          {initial.configured && (
            <span className="block mt-1 text-gray-500">
              Aktuell konfiguriert: {initial.provider} / {initial.model}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
