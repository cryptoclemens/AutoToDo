import { SupabaseClient } from '@supabase/supabase-js'
import { getPlanLimits, Plan, getNextUpgradePlan } from './plans'

export type GateResult =
  | { allowed: true }
  | { allowed: false; reason: string; upgradeHint: Plan }

/**
 * Check if the workspace can create another project.
 */
export async function checkProjectLimit(
  supabase: SupabaseClient,
  workspaceId: string,
  plan: Plan,
  planExpiresAt?: string | null,
): Promise<GateResult> {
  const limits = getPlanLimits(plan, planExpiresAt)
  if (limits.maxProjects === null) return { allowed: true }

  const { count } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .is('archived_at', null)

  if ((count ?? 0) >= limits.maxProjects) {
    return {
      allowed: false,
      reason: `Dein Plan erlaubt maximal ${limits.maxProjects} aktive Projekte.`,
      upgradeHint: getNextUpgradePlan(plan) ?? 'solo',
    }
  }
  return { allowed: true }
}

/**
 * Check if the workspace can upload another transcript this month.
 */
export async function checkTranscriptLimit(
  supabase: SupabaseClient,
  workspaceId: string,
  plan: Plan,
  planExpiresAt?: string | null,
): Promise<GateResult> {
  const limits = getPlanLimits(plan, planExpiresAt)
  if (limits.maxTranscriptsPerMonth === null) return { allowed: true }

  // Upsert usage row and check current month count
  const now = new Date()
  const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data: usage } = await supabase
    .from('workspace_usage')
    .select('transcripts_month, period_start')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  const isCurrentPeriod = usage?.period_start === periodStart
  const currentCount = isCurrentPeriod ? (usage?.transcripts_month ?? 0) : 0

  if (currentCount >= limits.maxTranscriptsPerMonth) {
    return {
      allowed: false,
      reason: `Dein Plan erlaubt maximal ${limits.maxTranscriptsPerMonth} Transkripte pro Monat.`,
      upgradeHint: getNextUpgradePlan(plan) ?? 'solo',
    }
  }
  return { allowed: true }
}

/**
 * Increment the transcript usage counter after a successful upload.
 */
export async function incrementTranscriptUsage(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<void> {
  const now = new Date()
  const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data: existing } = await supabase
    .from('workspace_usage')
    .select('transcripts_month, period_start')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  const isCurrentPeriod = existing?.period_start === periodStart

  await supabase.from('workspace_usage').upsert({
    workspace_id: workspaceId,
    transcripts_month: isCurrentPeriod ? (existing?.transcripts_month ?? 0) + 1 : 1,
    period_start: periodStart,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'workspace_id' })
}

/**
 * Check if the workspace can add another member.
 */
export async function checkSeatLimit(
  supabase: SupabaseClient,
  workspaceId: string,
  plan: Plan,
  planExpiresAt?: string | null,
): Promise<GateResult> {
  const limits = getPlanLimits(plan, planExpiresAt)
  if (limits.maxSeats === null) return { allowed: true }

  const { count } = await supabase
    .from('workspace_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  if ((count ?? 0) >= limits.maxSeats) {
    return {
      allowed: false,
      reason: `Dein Plan erlaubt maximal ${limits.maxSeats} Mitglieder.`,
      upgradeHint: getNextUpgradePlan(plan) ?? 'team',
    }
  }
  return { allowed: true }
}

/**
 * Check if a project can add another guest.
 */
export async function checkGuestLimit(
  supabase: SupabaseClient,
  projectId: string,
  plan: Plan,
  planExpiresAt?: string | null,
): Promise<GateResult> {
  const limits = getPlanLimits(plan, planExpiresAt)
  if (limits.guestsPerLop === 0) {
    return {
      allowed: false,
      reason: 'Gast-Einladungen sind ab dem Solo-Plan verfügbar.',
      upgradeHint: 'solo',
    }
  }

  const { count } = await supabase
    .from('project_guests')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .gt('expires_at', new Date().toISOString())

  if ((count ?? 0) >= limits.guestsPerLop) {
    return {
      allowed: false,
      reason: `Dein Plan erlaubt maximal ${limits.guestsPerLop} aktive Gäste pro Projekt.`,
      upgradeHint: getNextUpgradePlan(plan) ?? 'team',
    }
  }
  return { allowed: true }
}
