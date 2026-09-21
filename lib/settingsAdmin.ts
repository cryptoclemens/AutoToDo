// Gemeinsamer Admin-Kontext für Workspace-Integrationseinstellungen.
// Auth über den User-Client, Datenzugriff über die Service-Role (siehe CLAUDE.md #10).

import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'

export interface SettingsAdminCtx {
  userId: string
  workspaceId: string
  isAdmin: boolean
  supabase: SupabaseClient
}

export function serviceDb(): SupabaseClient {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** Ermittelt eingeloggten User + aufgelösten Workspace + Admin-Flag. `null`, wenn nicht eingeloggt. */
export async function getSettingsAdminCtx(): Promise<SettingsAdminCtx | null> {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null

  const slug = headers().get('x-workspace-slug') ?? ''
  const supabase = serviceDb()
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return null

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .maybeSingle() as { data: { role: string } | null }

  const isAdmin = ['workspace_owner', 'workspace_admin'].includes(member?.role ?? '')
  return { userId: user.id, workspaceId: workspace.id, isAdmin, supabase }
}
