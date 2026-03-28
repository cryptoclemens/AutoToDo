export type Plan = 'beta' | 'free' | 'solo' | 'team' | 'business'

export interface PlanLimits {
  maxProjects: number | null        // null = unbegrenzt
  maxSeats: number | null
  maxTranscriptsPerMonth: number | null
  guestsPerLop: number
  customBranding: boolean
  apiAccess: boolean
  webhooks: boolean
  ssoAvailable: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  beta: {
    maxProjects: null,
    maxSeats: null,
    maxTranscriptsPerMonth: null,
    guestsPerLop: 0,
    customBranding: true,
    apiAccess: true,
    webhooks: true,
    ssoAvailable: false,
  },
  free: {
    maxProjects: 2,
    maxSeats: 1,
    maxTranscriptsPerMonth: 10,
    guestsPerLop: 0,
    customBranding: false,
    apiAccess: false,
    webhooks: false,
    ssoAvailable: false,
  },
  solo: {
    maxProjects: null,
    maxSeats: 1,
    maxTranscriptsPerMonth: null,
    guestsPerLop: 2,
    customBranding: false,
    apiAccess: true,
    webhooks: false,
    ssoAvailable: false,
  },
  team: {
    maxProjects: null,
    maxSeats: 20,
    maxTranscriptsPerMonth: null,
    guestsPerLop: 2,
    customBranding: true,
    apiAccess: true,
    webhooks: true,
    ssoAvailable: false,
  },
  business: {
    maxProjects: null,
    maxSeats: null,
    maxTranscriptsPerMonth: null,
    guestsPerLop: 2,
    customBranding: true,
    apiAccess: true,
    webhooks: true,
    ssoAvailable: true,
  },
}

export const PLAN_NAMES: Record<Plan, string> = {
  beta: 'Beta',
  free: 'Free',
  solo: 'Solo',
  team: 'Team',
  business: 'Business',
}

export const UPGRADE_ORDER: Plan[] = ['free', 'solo', 'team', 'business']

/**
 * Returns the effective limits for a workspace, respecting Grandfathering.
 * During grandfathering period (plan_expires_at in the future for a downgraded plan),
 * beta limits are used.
 */
export function getPlanLimits(plan: Plan, planExpiresAt?: string | null): PlanLimits {
  // Grandfathering: if plan_expires_at is set and in the future, use beta limits
  if (planExpiresAt && new Date(planExpiresAt) > new Date()) {
    return PLAN_LIMITS['beta']
  }
  return PLAN_LIMITS[plan]
}

export function getNextUpgradePlan(current: Plan): Plan | null {
  const idx = UPGRADE_ORDER.indexOf(current)
  if (idx === -1 || idx >= UPGRADE_ORDER.length - 1) return null
  return UPGRADE_ORDER[idx + 1]
}
