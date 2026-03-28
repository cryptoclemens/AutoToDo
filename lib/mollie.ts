/**
 * Mollie payment integration placeholder.
 * Full billing implementation pending Mollie account setup.
 *
 * Mollie Docs: https://docs.mollie.com/reference/v2/subscriptions-api/overview
 *
 * Required environment variables:
 *   MOLLIE_API_KEY       – Live key: live_xxx, Test key: test_xxx
 *   MOLLIE_WEBHOOK_SECRET – Custom secret to verify webhook origin
 */

/** Mollie plan price IDs (to be filled when products are created in Mollie Dashboard) */
export const MOLLIE_PLAN_AMOUNTS: Record<string, { value: string; currency: 'EUR' }> = {
  solo_monthly:     { value: '12.00', currency: 'EUR' },
  team_monthly:     { value: '29.00', currency: 'EUR' },
  team_seat:        { value: '8.00',  currency: 'EUR' },
  business_monthly: { value: '99.00', currency: 'EUR' },
  business_seat:    { value: '6.00',  currency: 'EUR' },
}

export function isMollieConfigured(): boolean {
  return Boolean(process.env.MOLLIE_API_KEY)
}
