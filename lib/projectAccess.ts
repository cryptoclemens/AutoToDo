import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Projektbezogene Zugriffsauflösung.
 *
 * Hintergrund: Nutzer können zu einzelnen Projekten fremder Firmen (Workspaces)
 * eingeladen sein, ohne Mitglied dieses Workspace zu sein. `resolveWorkspace()`
 * löst aber nur EINEN "Heimat"-Workspace des Nutzers auf und taugt daher NICHT,
 * um Zugriff/Scope für ein bestimmtes Projekt zu bestimmen.
 *
 * Diese Helfer leiten den Workspace IMMER aus dem Projekt (bzw. der Ressource) ab
 * und autorisieren über Workspace-Mitgliedschaft ODER Projekt-Mitgliedschaft.
 */

const WS_EDIT_ROLES = ['workspace_owner', 'workspace_admin', 'project_admin', 'editor']
const WS_ADMIN_ROLES = ['workspace_owner', 'workspace_admin', 'project_admin']
const PM_EDIT_ROLES = ['project_admin', 'editor']

export interface ProjectAccess {
  /** Der Projekt-Datensatz mit den angeforderten Feldern (mind. id + workspace_id). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  project: any
  /** Workspace des Projekts (nicht der Heimat-Workspace des Nutzers!). */
  workspaceId: string
  /** Effektive Rolle des Nutzers für dieses Projekt. */
  role: string
  /** Woher der Zugriff stammt. */
  source: 'workspace' | 'project'
  canEdit: boolean
  canAdmin: boolean
}

/**
 * Löst den Zugriff eines Nutzers auf ein bestimmtes Projekt auf – unabhängig davon,
 * welchen Heimat-Workspace `resolveWorkspace()` liefern würde.
 *
 * @returns null, wenn das Projekt nicht existiert oder der Nutzer keinen Zugriff hat.
 */
export async function resolveProjectAccess(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  select = 'id, workspace_id'
): Promise<ProjectAccess | null> {
  const sel = select.includes('workspace_id') ? select : `${select}, workspace_id`
  const { data: project } = await supabase
    .from('projects')
    .select(sel)
    .eq('id', projectId)
    .maybeSingle()

  if (!project) return null
  const workspaceId = (project as unknown as { workspace_id: string }).workspace_id

  // 1. Workspace-Mitgliedschaft im Workspace DES PROJEKTS
  const { data: wsMember } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspaceId).eq('user_id', userId).maybeSingle()

  if (wsMember) {
    const role = (wsMember as { role: string }).role
    return {
      project, workspaceId, role, source: 'workspace',
      canEdit: WS_EDIT_ROLES.includes(role),
      canAdmin: WS_ADMIN_ROLES.includes(role),
    }
  }

  // 2. Direkte Projekt-Mitgliedschaft (Einladung zu einem einzelnen Projekt)
  const { data: pmMember } = await supabase
    .from('project_members').select('role')
    .eq('project_id', projectId).eq('user_id', userId).maybeSingle()

  if (pmMember) {
    const role = (pmMember as { role: string }).role
    return {
      project, workspaceId, role, source: 'project',
      canEdit: PM_EDIT_ROLES.includes(role),
      canAdmin: role === 'project_admin',
    }
  }

  return null
}
