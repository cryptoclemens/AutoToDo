/**
 * Stripe integration placeholder.
 * Full billing implementation pending Stripe account setup.
 */

export const STRIPE_PRICE_IDS: Record<string, string> = {
  // To be filled when Stripe products are created
  solo_monthly: process.env.STRIPE_PRICE_SOLO_MONTHLY ?? '',
  team_monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY ?? '',
  team_seat: process.env.STRIPE_PRICE_TEAM_SEAT ?? '',
  business_monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? '',
  business_seat: process.env.STRIPE_PRICE_BUSINESS_SEAT ?? '',
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET)
}
