/**
 * Migration script: Move beta workspaces to 'free' plan with 90-day grandfathering.
 *
 * Usage:
 *   npx tsx scripts/migrate-beta-to-free.ts
 *
 * What it does:
 * - Finds all workspaces with plan = 'beta'
 * - Sets plan = 'free' and plan_expires_at = now() + 90 days
 * - During grandfathering, getPlanLimits() returns beta (unlimited) limits
 * - After 90 days, free-tier limits kick in automatically
 *
 * Run once when freemium model launches.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: betaWorkspaces, error } = await supabase
    .from('workspaces')
    .select('id, name, plan')
    .eq('plan', 'beta')

  if (error) {
    console.error('Error fetching workspaces:', error.message)
    process.exit(1)
  }

  if (!betaWorkspaces || betaWorkspaces.length === 0) {
    console.log('No beta workspaces found. Nothing to migrate.')
    return
  }

  console.log(`Found ${betaWorkspaces.length} beta workspace(s) to migrate.`)

  const grandfatherUntil = new Date()
  grandfatherUntil.setDate(grandfatherUntil.getDate() + 90)

  let migrated = 0
  for (const ws of betaWorkspaces) {
    const { error: updateError } = await supabase
      .from('workspaces')
      .update({
        plan: 'free',
        plan_expires_at: grandfatherUntil.toISOString(),
      })
      .eq('id', ws.id)

    if (updateError) {
      console.error(`  ✗ ${ws.name} (${ws.id}): ${updateError.message}`)
    } else {
      console.log(`  ✓ ${ws.name} → free (grandfathered until ${grandfatherUntil.toLocaleDateString()})`)
      migrated++
    }
  }

  console.log(`\nDone. ${migrated}/${betaWorkspaces.length} workspaces migrated.`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
