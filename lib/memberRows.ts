import type { SupabaseClient } from '@supabase/supabase-js'
import type { MemberRow } from '@/lib/speakerCandidates'

/**
 * Lädt Workspace- + Projekt-Mitglieder (mit user_id, display_name, email) für die
 * Kandidatenliste des Sprecher-Matchings. Spiegelt die Logik aus processTranscript.ts.
 */
export async function loadMemberRows(
  supabase: SupabaseClient,
  workspaceId: string,
  projectId: string,
): Promise<MemberRow[]> {
  const { data: wsRows } = await supabase.rpc('get_workspace_members_with_email', {
    p_workspace_id: workspaceId,
  }) as { data: Array<{ user_id: string; display_name: string; email: string }> | null }

  const { data: pmRows } = await supabase
    .from('project_members').select('user_id').eq('project_id', projectId) as {
      data: Array<{ user_id: string }> | null
    }

  const wsIds = new Set((wsRows ?? []).map(m => m.user_id))
  const extraIds = (pmRows ?? []).map(r => r.user_id).filter(id => !wsIds.has(id))

  let extra: MemberRow[] = []
  if (extraIds.length > 0) {
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    extra = users
      .filter(u => extraIds.includes(u.id))
      .map(u => ({
        user_id: u.id,
        display_name: (u.user_metadata?.full_name as string | undefined)
          || (u.user_metadata?.name as string | undefined)
          || u.email?.split('@')[0]
          || u.id,
        email: u.email ?? '',
      }))
  }

  return [...(wsRows ?? []), ...extra]
}
