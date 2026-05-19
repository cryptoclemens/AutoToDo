import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getGermanHolidays } from '@/lib/holidays'

// Cron runs at 16:00 UTC (= 17:00 CET / 18:00 CEST, Mo-Fr) via host crontab

const STATUS_LABELS: Record<string, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  offen: { bg: '#fee2e2', text: '#b91c1c' },
  in_bearbeitung: { bg: '#dbeafe', text: '#1d4ed8' },
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '–'
  const d = new Date(dateStr)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

interface DigestItem {
  id: string
  title: string
  status: string
  due_date: string | null
  project_id: string
}

interface Project {
  id: string
  name: string
  workspace_id: string
}

function buildDigestEmail(
  displayName: string,
  items: DigestItem[],
  projectMap: Record<string, Project>,
  workspaceNameMap: Record<string, string>,
  appUrl: string,
): string {
  // Group items by workspace → project
  const grouped: Record<string, Record<string, DigestItem[]>> = {}
  for (const item of items) {
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
        const overdue = isOverdue(item.due_date)
        return `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 12px;font-size:14px;color:#1e293b;">${item.title}</td>
            <td style="padding:8px 12px;">
              <span style="background:${sc.bg};color:${sc.text};padding:2px 8px;border-radius:4px;font-size:12px;white-space:nowrap;">
                ${STATUS_LABELS[item.status] ?? item.status}
              </span>
            </td>
            <td style="padding:8px 12px;font-size:14px;color:${overdue ? '#ef4444' : '#475569'};white-space:nowrap;">
              ${formatDate(item.due_date)}${overdue ? ' ⚠' : ''}
            </td>
          </tr>`
      }).join('')

      return `
        <div style="margin:16px 0;">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-bottom:8px;">
            <h3 style="margin:0;font-size:15px;color:#1e293b;">${proj?.name ?? 'Projekt'}</h3>
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
        <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;">${wsName}</p>
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
      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Ihre tägliche Aufgaben-Zusammenfassung</p>
    </div>
    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 8px;font-size:16px;color:#1e293b;">Hallo ${displayName},</p>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;">
        hier sind Ihre <strong>${items.length} offenen Aufgabe${items.length !== 1 ? 'n' : ''}</strong>, die auf Ihre Erledigung warten:
      </p>
      ${sections}
    </div>
    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
        Diese E-Mail wird werktäglich von AutoToDo versendet.<br>
        Einstellungen: <a href="${appUrl}/settings" style="color:#2563eb;text-decoration:none;">${appUrl}/settings</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function GET(request: NextRequest) {
  // Auth: CRON_SECRET (gesetzt in .env, aufgerufen via host crontab)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ?dry_run=true → diagnose without sending emails
  const dryRun = new URL(request.url).searchParams.get('dry_run') === 'true'

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey && !dryRun) {
    return NextResponse.json({ skipped: 'RESEND_API_KEY not set' })
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://autotodo.vencly.com').replace(/\/$/, '')

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  async function sendEmail(to: string, subject: string, html: string) {
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

  // 1. Workspaces mit aktiviertem Digest
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, bundesland, digest_frequency')
    .neq('digest_frequency', 'disabled') as {
      data: Array<{ id: string; name: string; bundesland: string | null; digest_frequency: string }> | null
    }

  if (!workspaces?.length) {
    return NextResponse.json({ sent: 0, dry_run: dryRun, reason: 'No workspaces with digest enabled. Check Settings → Workspace → Digest frequency.' })
  }

  // 2. Filter by frequency (frequency-based daily digest scheduling)
  const today = new Date().getDay() // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  const frequencyFilteredWorkspaces = (workspaces ?? []).filter(ws => {
    if (ws.digest_frequency === 'weekly') return today === 1       // Monday only
    if (ws.digest_frequency === 'twice_weekly') return today === 1 || today === 4  // Monday + Thursday
    return true // 'daily': no additional filter (crontab runs Mon–Fri)
  })

  if (!frequencyFilteredWorkspaces.length) {
    return NextResponse.json({ sent: 0, dry_run: dryRun, reason: 'No workspaces scheduled for today based on frequency.' })
  }

  // 3. Filter by holidays
  const todayStr = new Date().toISOString().slice(0, 10)
  const activeWorkspaces = frequencyFilteredWorkspaces.filter(ws => {
    const holidays = getGermanHolidays(new Date().getFullYear(), ws.bundesland)
    return !holidays.has(todayStr)
  })
  if (!activeWorkspaces.length) {
    return NextResponse.json({ sent: 0, dry_run: dryRun, reason: 'All workspaces are on holiday today.' })
  }

  const workspaceIds = activeWorkspaces.map(w => w.id)
  const workspaceNameMap: Record<string, string> = Object.fromEntries(activeWorkspaces.map(w => [w.id, w.name]))

  // 4. Nicht-archivierte Projekte
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, workspace_id')
    .in('workspace_id', workspaceIds)
    .is('archived_at', null) as { data: Array<{ id: string; name: string; workspace_id: string }> | null }

  if (!projects?.length) {
    return NextResponse.json({ sent: 0, reason: 'No active projects' })
  }

  const projectIds = projects.map(p => p.id)
  const projectMap: Record<string, { id: string; name: string; workspace_id: string }> =
    Object.fromEntries(projects.map(p => [p.id, p]))

  // 5. Offene LOP-Punkte mit responsible_user_id
  const { data: items } = await supabase
    .from('lop_items')
    .select('id, title, status, due_date, responsible_user_id, project_id')
    .in('project_id', projectIds)
    .in('status', ['offen', 'in_bearbeitung'])
    .not('responsible_user_id', 'is', null)
    .order('due_date', { ascending: true, nullsFirst: false }) as {
      data: Array<{
        id: string; title: string; status: string; due_date: string | null
        responsible_user_id: string; project_id: string
      }> | null
    }

  if (!items?.length) {
    return NextResponse.json({
      sent: 0,
      dry_run: dryRun,
      reason: 'No open items with responsible_user_id set. Only items assigned via the member dropdown (not free-text) trigger the digest.',
      debug: { workspacesFound: workspaces.length, projectsFound: projects?.length ?? 0 },
    })
  }

  // 6. Gruppieren nach Nutzer
  const itemsByUser: Record<string, typeof items> = {}
  for (const item of items) {
    const uid = item.responsible_user_id
    if (!itemsByUser[uid]) itemsByUser[uid] = []
    itemsByUser[uid].push(item)
  }

  // 7. Pro Nutzer E-Mail versenden
  let sent = 0
  const errors: string[] = []
  const dryRunRecipients: Array<{ email: string; itemCount: number }> = []

  for (const [userId, userItems] of Object.entries(itemsByUser)) {
    try {
      const { data: { user } } = await supabase.auth.admin.getUserById(userId)
      if (!user?.email) continue

      const displayName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email

      if (dryRun) {
        dryRunRecipients.push({ email: user.email, itemCount: userItems.length })
        continue
      }

      const html = buildDigestEmail(displayName, userItems, projectMap, workspaceNameMap, appUrl)

      await sendEmail(
        user.email,
        `Ihre ${userItems.length} offene${userItems.length !== 1 ? 'n' : ''} Aufgabe${userItems.length !== 1 ? 'n' : ''} – AutoToDo`,
        html,
      )
      sent++
    } catch (err) {
      errors.push(userId)
      console.error('[daily-digest] Error for user', userId, err)
    }
  }

  if (dryRun) {
    return NextResponse.json({
      dry_run: true,
      would_send_to: dryRunRecipients,
      total_users: dryRunRecipients.length,
      total_items: items.length,
    })
  }

  return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined })
}
