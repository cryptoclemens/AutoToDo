import { SupabaseClient } from '@supabase/supabase-js'

const STATUS_LABELS: Record<string, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
  abgeschlossen: 'Abgeschlossen',
}

type LopEvent =
  | 'lop.item.created'
  | 'lop.item.updated'
  | 'lop.item.status_changed'
  | 'lop.item.deleted'

function isTeamsUrl(url: string): boolean {
  return url.includes('webhook.office.com') || url.includes('office365.com')
}

export async function sendSlackNotification(webhookUrl: string, text: string): Promise<void> {
  try {
    const body = isTeamsUrl(webhookUrl)
      ? JSON.stringify({ text }) // Teams also accepts simple { text }
      : JSON.stringify({ text })
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
  } catch {
    // fire-and-forget — never throw
  }
}

/** Format a LOP event message for Slack (mrkdwn) */
function formatForSlack(
  event: LopEvent,
  item: Record<string, unknown>,
  workspaceName: string,
): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://autotodo.vencly.com').replace(/\/$/, '')
  const title = (item.title as string) ?? 'LOP-Punkt'
  const projectId = item.project_id as string | undefined
  const link = projectId ? `${appUrl}/projects/${projectId}` : appUrl

  const status = item.status ? ` · Status: ${STATUS_LABELS[item.status as string] ?? item.status}` : ''
  const owner = item.responsible ? ` · ${item.responsible}` : ''
  const due = item.due_date ? ` · Fällig: ${item.due_date}` : ''

  const eventLabel: Record<LopEvent, string> = {
    'lop.item.created': 'Neuer LOP-Punkt',
    'lop.item.updated': 'LOP-Punkt bearbeitet',
    'lop.item.status_changed': 'Status geändert',
    'lop.item.deleted': 'LOP-Punkt gelöscht',
  }

  // Slack: *bold*, <url|label>
  return `*[${workspaceName}] ${eventLabel[event]}:* <${link}|${title}>${status}${owner}${due}`
}

/** Format a LOP event message for Microsoft Teams */
function formatForTeams(
  event: LopEvent,
  item: Record<string, unknown>,
  workspaceName: string,
): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://autotodo.vencly.com').replace(/\/$/, '')
  const title = (item.title as string) ?? 'LOP-Punkt'
  const projectId = item.project_id as string | undefined
  const link = projectId ? `${appUrl}/projects/${projectId}` : appUrl

  const status = item.status ? ` · Status: ${STATUS_LABELS[item.status as string] ?? item.status}` : ''
  const owner = item.responsible ? ` · ${item.responsible}` : ''
  const due = item.due_date ? ` · Fällig: ${item.due_date}` : ''

  const eventLabel: Record<LopEvent, string> = {
    'lop.item.created': 'Neuer LOP-Punkt',
    'lop.item.updated': 'LOP-Punkt bearbeitet',
    'lop.item.status_changed': 'Status geändert',
    'lop.item.deleted': 'LOP-Punkt gelöscht',
  }

  // Teams: **bold**, [label](url)
  return `**[${workspaceName}] ${eventLabel[event]}:** [${title}](${link})${status}${owner}${due}`
}

export function formatLopEvent(
  event: LopEvent,
  item: Record<string, unknown>,
  workspaceName: string,
  webhookUrl?: string,
): string {
  if (webhookUrl && isTeamsUrl(webhookUrl)) {
    return formatForTeams(event, item, workspaceName)
  }
  return formatForSlack(event, item, workspaceName)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function notifySlackForLopEvent(
  supabase: SupabaseClient,
  workspaceId: string,
  event: LopEvent,
  item: Record<string, unknown>,
): Promise<void> {
  const { data: ws } = await supabase
    .from('workspaces')
    .select('slack_webhook_url, name')
    .eq('id', workspaceId)
    .single()

  const wsData = ws as { slack_webhook_url: string | null; name: string } | null
  if (!wsData?.slack_webhook_url) return

  const text = formatLopEvent(event, item, wsData.name, wsData.slack_webhook_url)
  await sendSlackNotification(wsData.slack_webhook_url, text)
}
