// Geteilte Bausteine für ToDo-E-Mails (abendlicher Digest + Post-Meeting-Mail).
// Extrahiert aus app/api/cron/daily-digest/route.ts, damit beide Mail-Typen
// dieselbe Optik teilen (DRY).

export interface TodoEmailItem {
  id: string
  title: string
  status: string
  due_date: string | null
  project_id: string
}

export interface ProjectInfo {
  id: string
  name: string
  workspace_id: string
}

/** Escaped einen String für die sichere Einbettung in HTML-Mails (verhindert HTML-Injection). */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const STATUS_LABELS: Record<string, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
}

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  offen: { bg: '#fee2e2', text: '#b91c1c' },
  in_bearbeitung: { bg: '#dbeafe', text: '#1d4ed8' },
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '–'
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function isOverdue(dateStr: string | null, todayStr: string): boolean {
  if (!dateStr) return false
  // Compare date strings directly (YYYY-MM-DD) to avoid timezone/time-of-day issues
  return dateStr < todayStr
}

export function isDueToday(dateStr: string | null, todayStr: string): boolean {
  return dateStr === todayStr
}

/** Sort key: 0 = overdue, 1 = due today, 2 = no date */
export function sortPriority(dateStr: string | null, todayStr: string): number {
  if (!dateStr) return 2
  if (dateStr < todayStr) return 0
  if (dateStr === todayStr) return 1
  return 2 // future
}

export interface BuildTodoEmailOptions {
  displayName: string
  items: TodoEmailItem[]
  projectMap: Record<string, ProjectInfo>
  workspaceNameMap: Record<string, string>
  appUrl: string
  todayStr: string
  /** Untertitel im dunklen Header. Wird als vertrauenswürdiges HTML eingebettet. */
  headerSubtitle: string
  /**
   * Einleitungssatz unter der Begrüßung. Wird als vertrauenswürdiges HTML
   * eingebettet (z.B. <strong>). Dynamische/nutzerkontrollierte Anteile MUSS
   * der Aufrufer vorher mit esc() escapen.
   */
  intro: string
  /** Fußzeilen-Text. Wird als vertrauenswürdiges HTML eingebettet. */
  footer: string
}

/**
 * Baut die ToDo-E-Mail. Sortiert Items (überfällig → heute → ohne Datum),
 * gruppiert nach Workspace → Projekt und rendert eine responsive HTML-Mail.
 */
export function buildTodoEmail(opts: BuildTodoEmailOptions): string {
  const { displayName, items, projectMap, workspaceNameMap, appUrl, todayStr, headerSubtitle, intro, footer } = opts

  // Sort items: overdue first (0), today (1), no due date (2)
  const sorted = [...items].sort((a, b) => {
    const pa = sortPriority(a.due_date, todayStr)
    const pb = sortPriority(b.due_date, todayStr)
    if (pa !== pb) return pa - pb
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date.localeCompare(b.due_date)
  })

  // Group items by workspace → project
  const grouped: Record<string, Record<string, TodoEmailItem[]>> = {}
  for (const item of sorted) {
    const proj = projectMap[item.project_id]
    if (!proj) continue
    const wsId = proj.workspace_id
    if (!grouped[wsId]) grouped[wsId] = {}
    if (!grouped[wsId][proj.id]) grouped[wsId][proj.id] = []
    grouped[wsId][proj.id].push(item)
  }

  const sections = Object.entries(grouped).map(([wsId, projects]) => {
    const wsName = workspaceNameMap[wsId] ?? 'Workspace'
    const projectSections = Object.entries(projects).map(([projId, projItems]) => {
      const proj = projectMap[projId]
      const projectUrl = `${appUrl}/projects/${projId}`
      const rows = projItems.map(item => {
        const sc = STATUS_COLORS[item.status] ?? { bg: '#f3f4f6', text: '#374151' }
        const overdue = isOverdue(item.due_date, todayStr)
        const dueToday = isDueToday(item.due_date, todayStr)
        const dateColor = overdue ? '#ef4444' : dueToday ? '#d97706' : '#475569'
        const dateSuffix = overdue ? ' ⚠' : dueToday ? ' ★' : ''
        return `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 12px;font-size:14px;color:#1e293b;">${esc(item.title)}</td>
            <td style="padding:8px 12px;">
              <span style="background:${sc.bg};color:${sc.text};padding:2px 8px;border-radius:4px;font-size:12px;white-space:nowrap;">
                ${STATUS_LABELS[item.status] ?? item.status}
              </span>
            </td>
            <td style="padding:8px 12px;font-size:14px;color:${dateColor};white-space:nowrap;">
              ${formatDate(item.due_date)}${dateSuffix}
            </td>
          </tr>`
      }).join('')

      return `
        <div style="margin:16px 0;">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-bottom:8px;">
            <h3 style="margin:0;font-size:15px;color:#1e293b;">${esc(proj?.name ?? 'Projekt')}</h3>
            <a href="${projectUrl}" style="font-size:12px;color:#2563eb;text-decoration:none;">Zur Liste →</a>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="text-align:left;padding:6px 12px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Aufgabe</th>
                <th style="text-align:left;padding:6px 12px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Status</th>
                <th style="text-align:left;padding:6px 12px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Fälligkeit</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`
    }).join('')

    return `
      <div style="margin:24px 0;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;">${esc(wsName)}</p>
        ${projectSections}
      </div>`
  }).join('<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">')

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <!-- Header -->
    <div style="background:#1e293b;padding:24px 32px;">
      <span style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-.3px;">AutoToDo</span>
      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">${headerSubtitle}</p>
    </div>
    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 8px;font-size:16px;color:#1e293b;">Hallo ${esc(displayName)},</p>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;">${intro}</p>
      ${sections}
    </div>
    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
        ${footer}<br>
        Einstellungen: <a href="${appUrl}/settings" style="color:#2563eb;text-decoration:none;">${appUrl}/settings</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Erzeugt eine sendEmail-Funktion gegen die Resend-API.
 * `from` kann via RESEND_FROM übersteuert werden.
 */
export function makeResendSender(resendKey: string) {
  return async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? 'AutoToDo <noreply@vencly.app>',
        to,
        subject,
        html,
      }),
    })
    if (!res.ok) throw new Error(`Resend error: ${res.status}`)
  }
}
