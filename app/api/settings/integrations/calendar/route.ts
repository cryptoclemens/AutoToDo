import { NextResponse } from 'next/server'
import { getSettingsAdminCtx } from '@/lib/settingsAdmin'
import { isMicrosoftConfigured } from '@/lib/microsoftCalendar'

// GET: Verbindungsstatus der Kalenderintegration.
export async function GET() {
  const ctx = await getSettingsAdminCtx()
  if (!ctx) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  let connected = false
  let provider: string | null = null
  let account: { email: string | null; name: string | null } | null = null
  let connectedAt: string | null = null
  try {
    const { data } = await ctx.supabase
      .from('workspace_calendar_configs')
      .select('provider, account_email, account_name, connected_at')
      .eq('workspace_id', ctx.workspaceId)
      .maybeSingle() as {
        data: { provider: string; account_email: string | null; account_name: string | null; connected_at: string | null } | null
      }
    if (data) {
      connected = true
      provider = data.provider
      account = { email: data.account_email, name: data.account_name }
      connectedAt = data.connected_at
    }
  } catch { /* Migration 046 noch nicht deployed */ }

  return NextResponse.json({
    connected,
    provider,
    account,
    connectedAt,
    microsoftAvailable: isMicrosoftConfigured(),
    isAdmin: ctx.isAdmin,
  })
}

// DELETE: Kalenderverbindung trennen (Tokens löschen).
export async function DELETE() {
  const ctx = await getSettingsAdminCtx()
  if (!ctx) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  if (!ctx.isAdmin) return NextResponse.json({ error: 'Nur Admins dürfen Integrationen entfernen.' }, { status: 403 })

  await ctx.supabase.from('workspace_calendar_configs').delete().eq('workspace_id', ctx.workspaceId)
  return NextResponse.json({ ok: true })
}
