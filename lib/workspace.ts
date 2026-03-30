import { SupabaseClient } from '@supabase/supabase-js'

export type WorkspaceRow = {
  id: string
  name: string
  slug: string
  brand_color: string
  logo_url: string | null
}

/**
 * Resolves the current workspace.
 * Tries by slug first (subdomain routing), falls back to the user's first membership.
 */
export async function resolveWorkspace(
  supabase: SupabaseClient,
  userId: string,
  slug: string
): Promise<WorkspaceRow | null> {
  const SELECT = 'id, name, slug, brand_color, logo_url'

  if (slug) {
    const { data } = await supabase
      .from('workspaces')
      .select(SELECT)
      .eq('slug', slug)
      .maybeSingle()
    if (data) return data as WorkspaceRow
  }

  // Fallback: first workspace the user belongs to
  const { data } = await supabase
    .from('workspace_members')
    .select(`workspaces(${SELECT})`)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (data?.workspaces) return data.workspaces as unknown as WorkspaceRow

  // Third fallback: project-scoped member
  const { data: pmRow } = await supabase
    .from('project_members')
    .select('projects(workspace_id)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  const wsId = (pmRow?.projects as unknown as { workspace_id: string } | null)?.workspace_id
  if (wsId) {
    const { data: ws } = await supabase
      .from('workspaces')
      .select(SELECT)
      .eq('id', wsId)
      .maybeSingle()
    if (ws) return ws as WorkspaceRow
  }
  return null
}
