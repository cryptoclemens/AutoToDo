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

export async function sendSlackNotification(webhookUrl: string, text: string): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch {
    // fire-and-forget — never throw
  }
}

export function formatLopEvent(
  event: LopEvent,
  item: Record<string, unknown>,
  workspaceName: string,
): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://autotodo.vencly.com').replace(/\/$/, '')
  const title = (item.title as string) ?? 'LOP-Punkt'
  const projectId = item.project_id as string | undefined
  const link = projectId ? `${appUrl}/projects/${projectId}` : appUrl

  const status = item.status
    ? ` · Status: ${STATUS_LABELS[item.status as string] ?? item.status}`
    : ''
  const owner = item.responsible ? ` · ${item.responsible}` : ''
  const due = item.due_date ? ` · Fällig: ${item.due_date}` : ''

  const eventLabel: Record<LopEvent, string> = {
    'lop.item.created': 'Neuer LOP-Punkt',
    'lop.item.updated': 'LOP-Punkt bearbeitet',
    'lop.item.status_changed': 'Status geändert',
    'lop.item.deleted': 'LOP-Punkt gelöscht',
  }

  return `*[${workspaceName}] ${eventLabel[event]}:* <${link}|${title}>${status}${owner}${due}`
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

  const text = formatLopEvent(event, item, wsData.name)
  await sendSlackNotification(wsData.slack_webhook_url, text)
}
