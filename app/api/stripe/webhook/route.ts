import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

/**
 * Stripe webhook handler (placeholder).
 * Will handle subscription events when Stripe billing goes live.
 *
 * Expected events:
 * - checkout.session.completed → set workspace plan
 * - customer.subscription.updated → update plan/seats
 * - customer.subscription.deleted → downgrade to free
 */
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured.' }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 })
  }

  // TODO: Implement when Stripe billing goes live
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  // switch (event.type) { ... }

  const _supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('Stripe webhook received (placeholder):', body.slice(0, 100))

  return NextResponse.json({ received: true })
}
