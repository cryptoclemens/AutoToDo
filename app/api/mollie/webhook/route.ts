import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

/**
 * Mollie webhook handler (placeholder).
 * Will handle subscription events when Mollie billing goes live.
 *
 * Mollie sends a POST with `id` in the body when a payment/subscription changes.
 * Fetch the full object via GET /v2/payments/{id} or /v2/subscriptions/{id}.
 *
 * Expected events:
 * - payment.paid        → activate workspace plan
 * - subscription.active → confirm subscription active
 * - subscription.canceled → downgrade to free at period end
 * - payment.failed      → notify user, retry logic
 *
 * Verification: Mollie does not sign webhooks — verify by fetching the
 * resource from the Mollie API and checking its status.
 */
export async function POST(req: NextRequest) {
  if (!process.env.MOLLIE_API_KEY) {
    return NextResponse.json({ error: 'Mollie nicht konfiguriert.' }, { status: 503 })
  }

  const body = await req.text()
  const params = new URLSearchParams(body)
  const paymentId = params.get('id')

  if (!paymentId) {
    return NextResponse.json({ error: 'Fehlende payment ID.' }, { status: 400 })
  }

  // TODO: Implement when Mollie billing goes live
  // const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY })
  // const payment = await mollie.payments.get(paymentId)
  // const workspaceId = payment.metadata?.workspaceId
  // switch (payment.status) {
  //   case 'paid': → update workspace plan
  //   case 'failed': → notify user
  // }

  const _supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('Mollie webhook received (placeholder):', paymentId)

  // Mollie expects HTTP 200 to confirm receipt
  return new NextResponse(null, { status: 200 })
}
