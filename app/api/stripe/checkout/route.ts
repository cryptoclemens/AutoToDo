import { NextRequest, NextResponse } from 'next/server'

/**
 * Stripe checkout session creator (placeholder).
 * Will redirect users to Stripe Checkout when billing goes live.
 */
export async function POST(_req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe-Zahlungsintegration ist noch nicht verfügbar.' }, { status: 503 })
  }

  // TODO: Implement when Stripe billing goes live
  // const { plan, workspaceId } = await req.json()
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  // const session = await stripe.checkout.sessions.create({ ... })
  // return NextResponse.json({ url: session.url })

  return NextResponse.json({ error: 'Stripe-Zahlungsintegration ist noch nicht verfügbar.' }, { status: 503 })
}
