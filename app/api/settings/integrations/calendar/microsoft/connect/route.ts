import { NextResponse } from 'next/server'
import { getSettingsAdminCtx } from '@/lib/settingsAdmin'
import { getMsConfig, buildAuthorizeUrl, signState } from '@/lib/microsoftCalendar'

const SETTINGS_URL = '/settings?tab=integrations'

// GET: startet den Microsoft-OAuth-Consent (Browser-Redirect).
export async function GET() {
  const ctx = await getSettingsAdminCtx()
  if (!ctx) return NextResponse.redirect(absolute('/login'))
  if (!ctx.isAdmin) return NextResponse.redirect(absolute(`${SETTINGS_URL}&calendar_error=forbidden`))

  const cfg = getMsConfig()
  if (!cfg) return NextResponse.redirect(absolute(`${SETTINGS_URL}&calendar_error=not_configured`))

  const state = signState(ctx.workspaceId, ctx.userId)
  return NextResponse.redirect(buildAuthorizeUrl(cfg, state))
}

function absolute(path: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://autotodo.vencly.com').replace(/\/$/, '')
  return `${base}${path}`
}
