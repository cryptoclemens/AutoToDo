import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceDb } from '@/lib/settingsAdmin'
import {
  getMsConfig, verifyState, exchangeCode, fetchAccountInfo, storeTokens,
} from '@/lib/microsoftCalendar'

const SETTINGS_URL = '/settings?tab=integrations'

function absolute(path: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://autotodo.vencly.com').replace(/\/$/, '')
  return `${base}${path}`
}

// GET: OAuth-Callback von Microsoft (code + state).
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const error = url.searchParams.get('error')
  if (error) return NextResponse.redirect(absolute(`${SETTINGS_URL}&calendar_error=${encodeURIComponent(error)}`))

  const code = url.searchParams.get('code')
  const stateRaw = url.searchParams.get('state')
  if (!code || !stateRaw) return NextResponse.redirect(absolute(`${SETTINGS_URL}&calendar_error=missing_params`))

  const state = verifyState(stateRaw)
  if (!state) return NextResponse.redirect(absolute(`${SETTINGS_URL}&calendar_error=bad_state`))

  // Defense-in-depth: die aktuelle Session muss derselbe User sein, der den Flow gestartet hat,
  // und Admin des Workspaces bleiben.
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user || user.id !== state.userId) {
    return NextResponse.redirect(absolute(`${SETTINGS_URL}&calendar_error=session_mismatch`))
  }

  const supabase = serviceDb()
  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', state.workspaceId).eq('user_id', user.id).maybeSingle() as {
      data: { role: string } | null
    }
  if (!['workspace_owner', 'workspace_admin'].includes(member?.role ?? '')) {
    return NextResponse.redirect(absolute(`${SETTINGS_URL}&calendar_error=forbidden`))
  }

  const cfg = getMsConfig()
  if (!cfg) return NextResponse.redirect(absolute(`${SETTINGS_URL}&calendar_error=not_configured`))

  try {
    const tokens = await exchangeCode(cfg, code)
    const account = await fetchAccountInfo(tokens.access_token)
    await storeTokens(supabase, state.workspaceId, tokens, {
      account_email: account.email,
      account_name: account.name,
      connected_by: user.id,
    })
  } catch {
    return NextResponse.redirect(absolute(`${SETTINGS_URL}&calendar_error=exchange_failed`))
  }

  return NextResponse.redirect(absolute(`${SETTINGS_URL}&calendar_connected=1`))
}
