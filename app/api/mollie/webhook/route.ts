import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getMollieClient } from '@/lib/mollie'
import { createAndSendInvoice } from '@/lib/invoice'
import type { Plan } from '@/lib/plans'

export const runtime = 'nodejs'

/**
 * Mollie webhook handler.
 *
 * Mollie sends a POST with `id` in the body (application/x-www-form-urlencoded)
 * when a payment status changes. There is no HMAC signature — verify by fetching
 * the payment resource from the Mollie API.
 *
 * Handled events:
 * - payment.paid    → activate workspace plan
 * - payment.failed  → log (Mollie will retry; subscription cancels after failures)
 * - payment.expired → log
 *
 * Must always return HTTP 200 — Mollie retries on any other status code.
 */
export async function POST(req: NextRequest) {
  // Always return 200 so Mollie doesn't retry on config errors
  if (!process.env.MOLLIE_API_KEY) {
    console.error('Mollie webhook received but MOLLIE_API_KEY not set')
    return new NextResponse(null, { status: 200 })
  }

  const body = await req.text()
  const params = new URLSearchParams(body)
  const paymentId = params.get('id')

  if (!paymentId) {
    console.error('Mollie webhook: missing id in body')
    return new NextResponse(null, { status: 200 })
  }

  try {
    const mollie = getMollieClient()
    const payment = await mollie.payments.get(paymentId)

    const metadata = payment.metadata as {
      workspaceId?: string
      userId?: string
      plan?: string
      seats?: string
    } | null

    if (!metadata?.workspaceId || !metadata?.plan) {
      console.error('Mollie webhook: missing metadata on payment', paymentId)
      return new NextResponse(null, { status: 200 })
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (payment.status === 'paid') {
      // Activate the plan on the workspace
      const seats = metadata.seats ? parseInt(metadata.seats, 10) : null
      const { error } = await supabase
        .from('workspaces')
        .update({
          plan: metadata.plan,
          plan_expires_at: null, // clear any grandfathering expiry
          ...(seats && seats > 1 ? { plan_seats: seats } : {}),
        })
        .eq('id', metadata.workspaceId)

      if (error) {
        console.error('Mollie webhook: failed to update workspace plan', error)
      } else {
        console.log('Mollie webhook: plan activated', {
          workspaceId: metadata.workspaceId,
          plan: metadata.plan,
          paymentId,
        })

        // Rechnung erstellen und per E-Mail verschicken
        const amountGross = parseFloat(payment.amount.value)
        const currency = payment.amount.currency
        createAndSendInvoice(supabase, {
          paymentId,
          workspaceId: metadata.workspaceId,
          userId: metadata.userId ?? '',
          plan: metadata.plan as Plan,
          amountGross,
          currency,
        }).catch(err => console.error('Mollie webhook: invoice error', err))
      }
    } else {
      // Log other statuses (failed, expired, canceled) — Mollie handles retries
      console.log('Mollie webhook: payment status', payment.status, {
        paymentId,
        workspaceId: metadata.workspaceId,
      })
    }
  } catch (err) {
    console.error('Mollie webhook error:', err)
  }

  // Always 200 — Mollie must not retry
  return new NextResponse(null, { status: 200 })
}
