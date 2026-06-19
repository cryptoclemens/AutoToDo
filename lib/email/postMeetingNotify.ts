import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildTodoEmail,
  makeResendSender,
  type TodoEmailItem,
  type ProjectInfo,
} from './todoEmail'

interface PostMeetingOptions {
  projectId: string
  workspaceId: string
  /** Nur Empfänger/Items ermitteln, nicht versenden. */
  dryRun?: boolean
}

export interface PostMeetingResult {
  sent: number
  recipients: Array<{ email: string; itemCount: number }>
  errors?: string[]
  skipped?: string
}

/**
 * Versendet nach der Verarbeitung eines Transkripts personalisierte ToDo-Mails:
 * Jedes Projekt-Mitglied mit offenen Aufgaben (responsible_user_id gesetzt)
 * erhält eine Mail mit allen seinen offenen Items in diesem Projekt.
 *
 * Ersetzt funktional den abendlichen Digest (siehe Spec F-030). Fehler beim
 * Versand brechen den Lauf nicht ab; fehlt RESEND_API_KEY, wird still übersprungen.
 */
export async function sendPostMeetingTodoEmails(
  supabase: SupabaseClient,
  { projectId, workspaceId, dryRun = false }: PostMeetingOptions,
): Promise<PostMeetingResult> {
  const empty: PostMeetingResult = { sent: 0, recipients: [] }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey && !dryRun) {
    return { ...empty, skipped: 'no RESEND_API_KEY' }
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://autotodo.vencly.com').replace(/\/$/, '')
  const todayStr = new Date().toISOString().slice(0, 10)

  // 1. Projekt laden (Name; archivierte überspringen)
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, workspace_id, archived_at')
    .eq('id', projectId)
    .maybeSingle() as {
      data: { id: string; name: string; workspace_id: string; archived_at: string | null } | null
    }

  if (!project) return { ...empty, skipped: 'project not found' }
  if (project.archived_at) return { ...empty, skipped: 'project archived' }

  // 2. Workspace-Name (für Mail-Gruppierung)
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('name')
    .eq('id', workspaceId)
    .maybeSingle() as { data: { name: string } | null }

  const projectMap: Record<string, ProjectInfo> = {
    [project.id]: { id: project.id, name: project.name, workspace_id: project.workspace_id },
  }
  const workspaceNameMap: Record<string, string> = {
    [workspaceId]: workspace?.name ?? 'Workspace',
  }

  // 3. Alle offenen Items des Projekts mit Verantwortlichem
  const { data: items } = await supabase
    .from('lop_items')
    .select('id, title, status, due_date, responsible_user_id, project_id')
    .eq('project_id', projectId)
    .in('status', ['offen', 'in_bearbeitung'])
    .not('responsible_user_id', 'is', null)
    .order('due_date', { ascending: true, nullsFirst: false }) as {
      data: Array<TodoEmailItem & { responsible_user_id: string }> | null
    }

  if (!items?.length) return { ...empty, skipped: 'no open items with responsible_user_id' }

  // 4. Nach Verantwortlichem gruppieren (Empfänger = nur Personen mit ≥1 Item)
  const itemsByUser: Record<string, TodoEmailItem[]> = {}
  for (const item of items) {
    const uid = item.responsible_user_id
    if (!itemsByUser[uid]) itemsByUser[uid] = []
    itemsByUser[uid].push(item)
  }

  // 5. Pro Nutzer versenden
  const sendEmail = resendKey ? makeResendSender(resendKey) : null
  let sent = 0
  const recipients: Array<{ email: string; itemCount: number }> = []
  const errors: string[] = []

  for (const [userId, userItems] of Object.entries(itemsByUser)) {
    try {
      const { data: { user } } = await supabase.auth.admin.getUserById(userId)
      if (!user?.email) continue

      const displayName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email

      recipients.push({ email: user.email, itemCount: userItems.length })

      if (dryRun || !sendEmail) continue

      const html = buildTodoEmail({
        displayName,
        items: userItems,
        projectMap,
        workspaceNameMap,
        appUrl,
        todayStr,
        headerSubtitle: 'Deine Aufgaben aus dem Meeting',
        intro: `ein Meeting im Projekt <strong>${project.name}</strong> wurde gerade verarbeitet. ` +
          `Hier sind deine <strong>${userItems.length} offene${userItems.length !== 1 ? 'n' : ''} Aufgabe${userItems.length !== 1 ? 'n' : ''}</strong>:`,
        footer: 'Diese E-Mail wurde nach der Verarbeitung eines Meetings versendet.',
      })

      await sendEmail(
        user.email,
        `Deine ToDos aus dem Meeting – ${project.name}`,
        html,
      )
      sent++
    } catch (err) {
      errors.push(userId)
      console.error('[post-meeting-notify] Error for user', userId, err)
    }
  }

  return { sent, recipients, errors: errors.length > 0 ? errors : undefined }
}
