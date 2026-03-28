import { createMollieClient } from '@mollie/api-client'

/**
 * Mollie payment integration.
 *
 * Required environment variables:
 *   MOLLIE_API_KEY  – Live key: live_xxx, Test key: test_xxx
 *
 * Mollie does NOT sign webhooks with a header.
 * Verify by fetching the payment resource from the API and checking payment.status.
 */

export function getMollieClient() {
  if (!process.env.MOLLIE_API_KEY) {
    throw new Error('MOLLIE_API_KEY not configured')
  }
  return createMollieClient({ apiKey: process.env.MOLLIE_API_KEY })
}

export function isMollieConfigured(): boolean {
  return Boolean(process.env.MOLLIE_API_KEY)
}

/** Monthly prices per plan (EUR) */
export const MOLLIE_PLAN_AMOUNTS: Record<string, { value: string; currency: 'EUR' }> = {
  solo_monthly:     { value: '12.00', currency: 'EUR' },
  team_monthly:     { value: '29.00', currency: 'EUR' },
  team_seat:        { value: '8.00',  currency: 'EUR' },
  business_monthly: { value: '99.00', currency: 'EUR' },
  business_seat:    { value: '6.00',  currency: 'EUR' },
}
