import crypto from 'crypto'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export type WebhookEvent =
  | 'lop.item.created'
  | 'lop.item.updated'
  | 'lop.item.deleted'
  | 'lop.item.status_changed'

interface WebhookEndpoint {
  id: string
  url: string
  secret: string
  events: string[]
}

function sign(secret: string, body: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

async function deliverWithRetry(endpoint: WebhookEndpoint, payload: string, attempt = 1): Promise<void> {
  const sig = sign(endpoint.secret, payload)
  try {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AutoToDo-Signature': `sha256=${sig}`,
        'X-AutoToDo-Event': JSON.parse(payload).event,
      },
      body: payload,
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch {
    if (attempt < 3) {
      await new Promise(r => setTimeout(r, 2 ** attempt * 1000))
      return deliverWithRetry(endpoint, payload, attempt + 1)
    }
    // silently fail after 3 attempts — do not crash the main request
  }
}

export async function dispatchWebhook(
  workspaceId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('id, url, secret, events')
      .eq('workspace_id', workspaceId)
      .eq('active', true)

    if (!endpoints?.length) return

    const payload = JSON.stringify({ event, workspace_id: workspaceId, data, timestamp: new Date().toISOString() })

    await Promise.allSettled(
      endpoints
        .filter((ep: WebhookEndpoint) => ep.events.includes(event) || ep.events.includes('*'))
        .map((ep: WebhookEndpoint) => deliverWithRetry(ep, payload))
    )
  } catch {
    // non-blocking — never crash the main request
  }
}
