import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Cron runs hourly – checks for reminders where next_reminder_at <= NOW()

const DAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const FREQ_LABELS: Record<string, string> = {
  daily: 'täglich',
  weekly: 'wöchentlich',
  biweekly: 'zweiwöchentlich',
  monthly: 'monatlich',
}

function computeNextReminderAt(
  frequency: string,
  dayOfWeek: number | null,
  dayOfMonth: number | null,
  from: Date,
): Date {
  if (frequency === 'daily') {
    const next = new Date(from)
    next.setDate(next.getDate() + 1)
    next.setHours(8, 0, 0, 0)
    return next
  }

  if (frequency === 'weekly') {
    const targetDay = dayOfWeek ?? 0
    const next = new Date(from)
    next.setHours(8, 0, 0, 0)
    const currentDay = (from.getDay() + 6) % 7
    let daysUntil = (targetDay - currentDay + 7) % 7
    if (daysUntil === 0) daysUntil = 7
    next.setDate(next.getDate() + daysUntil)
    return next
  }

  if (frequency === 'biweekly') {
    const targetDay = dayOfWeek ?? 0
    const next = new Date(from)
    next.setHours(8, 0, 0, 0)
    const currentDay = (from.getDay() + 6) % 7
    let daysUntil = (targetDay - currentDay + 7) % 7
    if (daysUntil === 0) daysUntil = 14
    else daysUntil += 7 // add extra week for biweekly
    next.setDate(next.getDate() + daysUntil)
    return next
  }

  if (frequency === 'monthly') {
    const targetDom = dayOfMonth ?? 1
    const next = new Date(from.getFullYear(), from.getMonth() + 1, targetDom, 8, 0, 0, 0)
    return next
  }

  const next = new Date(from)
  next.setDate(next.getDate() + 7)
  return next
}

function buildReminderEmail(
  displayName: string,
  lopTitle: string,
  projectName: string,
  workspaceName: string,
  frequency: string,
  dayOfWeek: number | null,
  projectUrl: string,
  appUrl: string,
): string {
  const freqLabel = FREQ_LABELS[frequency] ?? frequency
  const dayLabel = dayOfWeek !== null ? ` (${DAY_NAMES[dayOfWeek]})` : ''
  const scheduleText = `${freqLabel}${dayLabel}`

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <!-- Header -->
    <div style="background:#1e293b;padding:24px 32px;">
      <span style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-.3px;">AutoToDo</span>
      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Erinnerung an Ihren wiederkehrenden Aufgabenpunkt</p>
    </div>
    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="margin:0 0 8px;font-size:16px;color:#1e293b;">Hallo ${displayName},</p>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;">
        Sie haben eine <strong>${scheduleText}</strong> Erinnerung für folgenden LOP-Punkt eingerichtet:
      </p>

      <!-- Item Card -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">${workspaceName} · ${projectName}</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;">${lopTitle}</p>
      </div>

      <a href="${projectUrl}" style="display:inline-block;background:#1e293b;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:500;">
        Zum LOP-Punkt →
      </a>
    </div>
    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
        Diese Erinnerung wird ${scheduleText} verschickt.<br>
        Erinnerungen verwalten: <a href="${appUrl}/settings" style="color:#2563eb;text-decoration:none;">${appUrl}/settings</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  // 1. Alle fälligen Erinnerungen laden
  const now = new Date().toISOString()
  const { data: reminders, error: remindersError } = await supabase
    .from('recurring_reminders')
    .select('*')
    .lte('next_reminder_at', now) as {
      data: Array<{
        id: string
        lop_item_id: string
        workspace_id: string
        user_id: string
        frequency: string
        day_of_week: number | null
        day_of_month: number | null
        next_reminder_at: string
      }> | null
      error: unknown
    }

  if (remindersError) {
    return NextResponse.json({ error: 'DB-Fehler beim Laden der Erinnerungen.' }, { status: 500 })
  }

  if (!reminders?.length) {
    return NextResponse.json({ sent: 0, reason: 'Keine fälligen Erinnerungen.' })
  }

  let sent = 0
  const errors: string[] = []
  const dryRunList: Array<{ email: string; lopTitle: string }> = []

  for (const reminder of reminders) {
    try {
      // LOP-Punkt laden
      const { data: lopItem } = await supabase
        .from('lop_items')
        .select('id, title, project_id')
        .eq('id', reminder.lop_item_id)
        .maybeSingle() as { data: { id: string; title: string; project_id: string } | null }

      if (!lopItem) {
        // LOP-Punkt gelöscht (CASCADE sollte greifen, aber Fallback)
        await supabase.from('recurring_reminders').delete().eq('id', reminder.id)
        continue
      }

      // Projekt + Workspace laden
      const { data: project } = await supabase
        .from('projects')
        .select('id, name, workspace_id')
        .eq('id', lopItem.project_id)
        .maybeSingle() as { data: { id: string; name: string; workspace_id: string } | null }

      if (!project) continue

      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('id', project.workspace_id)
        .maybeSingle() as { data: { id: string; name: string } | null }

      if (!workspace) continue

      // Nutzer-E-Mail laden
      const { data: { user } } = await supabase.auth.admin.getUserById(reminder.user_id)
      if (!user?.email) continue

      const displayName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email

      const projectUrl = `${appUrl}/projects/${project.id}`

      if (dryRun) {
        dryRunList.push({ email: user.email, lopTitle: lopItem.title })
      } else {
        const html = buildReminderEmail(
          displayName,
          lopItem.title,
          project.name,
          workspace.name,
          reminder.frequency,
          reminder.day_of_week,
          projectUrl,
          appUrl,
        )

        await sendEmail(
          user.email,
          `Erinnerung: ${lopItem.title} – AutoToDo`,
          html,
        )
        sent++
      }

      // next_reminder_at aktualisieren
      const nextAt = computeNextReminderAt(
        reminder.frequency,
        reminder.day_of_week,
        reminder.day_of_month,
        new Date(),
      )

      await supabase
        .from('recurring_reminders')
        .update({
          next_reminder_at: nextAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reminder.id)

    } catch (err) {
      errors.push(reminder.id)
      console.error('[cron/reminders] Error for reminder', reminder.id, err)
    }
  }

  if (dryRun) {
    return NextResponse.json({ dry_run: true, would_send_to: dryRunList, total: dryRunList.length })
  }

  return NextResponse.json({ sent, total: reminders.length, errors: errors.length > 0 ? errors : undefined })
}
