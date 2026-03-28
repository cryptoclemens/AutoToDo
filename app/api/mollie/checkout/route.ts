import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { resolveWorkspace } from '@/lib/workspace'
import { headers } from 'next/headers'
import { MOLLIE_PLAN_AMOUNTS } from '@/lib/mollie'
import type { Plan } from '@/lib/plans'

/**
 * Mollie checkout session creator (placeholder).
 * Will create a Mollie payment/subscription and redirect to hosted checkout.
 *
 * Request body: { plan: 'solo' | 'team' | 'business', seats?: number }
 *
 * Mollie flow:
 * 1. POST /v2/payments → returns checkoutUrl
 * 2. Redirect user to checkoutUrl
 * 3. Mollie redirects back to redirectUrl after payment
 * 4. Mollie calls /api/mollie/webhook with payment status
 */
export async function POST(req: NextRequest) {
  if (!process.env.MOLLIE_API_KEY) {
    return NextResponse.json({ error: 'Zahlungsintegration noch nicht verfügbar.' }, { status: 503 })
  }

  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { plan, seats = 1 } = await req.json() as { plan: Plan; seats?: number }
  const planKey = `${plan}_monthly` as keyof typeof MOLLIE_PLAN_AMOUNTS
  const amount = MOLLIE_PLAN_AMOUNTS[planKey]

  if (!amount) {
    return NextResponse.json({ error: 'Ungültiger Plan.' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autotodo.app'

  // TODO: Implement when Mollie billing goes live
  // const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY })
  // const payment = await mollie.payments.create({
  //   amount,
  //   description: `AutoToDo ${plan} – ${workspace.name}`,
  //   redirectUrl: `${appUrl}/settings?tab=billing&upgraded=1`,
  //   webhookUrl: `${appUrl}/api/mollie/webhook`,
  //   metadata: { workspaceId: workspace.id, plan, seats },
  // })
  // return NextResponse.json({ checkoutUrl: payment.getCheckoutUrl() })

  console.log('Mollie checkout requested (placeholder):', { workspaceId: workspace.id, plan, seats, amount })

  return NextResponse.json({ error: 'Zahlungsintegration noch nicht verfügbar.' }, { status: 503 })
}
