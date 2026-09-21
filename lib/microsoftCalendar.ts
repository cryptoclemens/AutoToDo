// Microsoft-365-Kalenderanbindung (Microsoft Graph) für das Sprecher-Namensmatching.
// OAuth 2.0 Authorization-Code-Flow (v2.0-Endpunkt) + Token-Refresh + Event-Abruf.
// Tokens werden verschlüsselt in workspace_calendar_configs abgelegt und nur serverseitig
// über die Service-Role verwendet.

import { encrypt, decrypt } from '@/lib/encryption'
import type { SupabaseClient } from '@supabase/supabase-js'

const GRAPH = 'https://graph.microsoft.com/v1.0'
// Nötige Scopes: Kalender lesen + offline_access für den Refresh-Token + Basisprofil.
const SCOPES = 'openid profile email offline_access Calendars.Read'
// Refresh, sobald weniger als 5 Minuten Restgültigkeit.
const REFRESH_SKEW_MS = 5 * 60 * 1000

export interface MsConfig {
  clientId: string
  clientSecret: string
  tenant: string
  redirectUri: string
}

export interface CalendarAttendeeLite {
  name: string | null
  email: string | null
}

export interface CalendarEventLite {
  id: string
  subject: string | null
  starts_at: string | null
  ends_at: string | null
  attendees: CalendarAttendeeLite[]
}

interface StoredTokens {
  access_token: string
  refresh_token: string
  expires_at: string // ISO
  scope?: string
}

/** Liest die Microsoft-OAuth-Konfiguration aus der Umgebung. `null`, wenn nicht konfiguriert. */
export function getMsConfig(): MsConfig | null {
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  const tenant = process.env.MICROSOFT_TENANT || 'common'
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://autotodo.vencly.com').replace(/\/$/, '')
  const redirectUri = `${appUrl}/api/settings/integrations/calendar/microsoft/callback`
  return { clientId, clientSecret, tenant, redirectUri }
}

export function isMicrosoftConfigured(): boolean {
  return getMsConfig() !== null
}

function authorityBase(tenant: string): string {
  return `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0`
}

// --- OAuth-State (CSRF): verschlüsselt+authentifiziert, kein Server-Store nötig ---
const STATE_MAX_AGE_MS = 15 * 60 * 1000

interface OAuthState { w: string; u: string; t: number }

/** Erzeugt einen signierten (verschlüsselten) State-Parameter. */
export function signState(workspaceId: string, userId: string): string {
  const payload: OAuthState = { w: workspaceId, u: userId, t: Date.now() }
  // base64url, damit der String URL-sicher als Query-Parameter transportiert wird.
  return Buffer.from(encrypt(JSON.stringify(payload)), 'utf8').toString('base64url')
}

/** Prüft und entschlüsselt den State-Parameter. `null`, wenn ungültig oder abgelaufen. */
export function verifyState(state: string): { workspaceId: string; userId: string } | null {
  try {
    const json = decrypt(Buffer.from(state, 'base64url').toString('utf8'))
    const parsed = JSON.parse(json) as OAuthState
    if (!parsed.w || !parsed.u || !parsed.t) return null
    if (Date.now() - parsed.t > STATE_MAX_AGE_MS) return null
    return { workspaceId: parsed.w, userId: parsed.u }
  } catch {
    return null
  }
}

/** Baut die Authorize-URL für den Consent-Redirect. */
export function buildAuthorizeUrl(cfg: MsConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    response_type: 'code',
    redirect_uri: cfg.redirectUri,
    response_mode: 'query',
    scope: SCOPES,
    state,
    prompt: 'select_account',
  })
  return `${authorityBase(cfg.tenant)}/authorize?${params.toString()}`
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
}

async function requestToken(cfg: MsConfig, body: Record<string, string>): Promise<StoredTokens> {
  const res = await fetch(`${authorityBase(cfg.tenant)}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      ...body,
    }).toString(),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Microsoft-Token-Anfrage fehlgeschlagen (${res.status}): ${detail.slice(0, 300)}`)
  }
  const data = await res.json() as TokenResponse
  const expiresAt = new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString()
  return {
    access_token: data.access_token,
    // Bei Refresh liefert MS nicht immer einen neuen Refresh-Token — Aufrufer behält den alten.
    refresh_token: data.refresh_token ?? '',
    expires_at: expiresAt,
    scope: data.scope,
  }
}

/** Tauscht den Authorization-Code gegen Tokens. */
export function exchangeCode(cfg: MsConfig, code: string): Promise<StoredTokens> {
  return requestToken(cfg, { grant_type: 'authorization_code', code, scope: SCOPES })
}

function refreshTokens(cfg: MsConfig, refreshToken: string): Promise<StoredTokens> {
  return requestToken(cfg, { grant_type: 'refresh_token', refresh_token: refreshToken, scope: SCOPES })
}

/** Ruft das Basisprofil ab, um Anzeigename + E-Mail des verbundenen Kontos zu speichern. */
export async function fetchAccountInfo(accessToken: string): Promise<{ email: string | null; name: string | null }> {
  try {
    const res = await fetch(`${GRAPH}/me?$select=displayName,mail,userPrincipalName`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return { email: null, name: null }
    const me = await res.json() as { displayName?: string; mail?: string; userPrincipalName?: string }
    return { email: me.mail ?? me.userPrincipalName ?? null, name: me.displayName ?? null }
  } catch {
    return { email: null, name: null }
  }
}

/**
 * Persistiert Tokens verschlüsselt. Wird nach dem Code-Austausch und nach jedem Refresh
 * aufgerufen. Nutzt die Service-Role (RLS-frei).
 */
export async function storeTokens(
  supabase: SupabaseClient,
  workspaceId: string,
  tokens: StoredTokens,
  meta?: { account_email?: string | null; account_name?: string | null; connected_by?: string | null },
): Promise<void> {
  const row: Record<string, unknown> = {
    workspace_id: workspaceId,
    provider: 'microsoft',
    encrypted_tokens: encrypt(JSON.stringify(tokens)),
    updated_at: new Date().toISOString(),
  }
  if (meta?.account_email !== undefined) row.account_email = meta.account_email
  if (meta?.account_name !== undefined) row.account_name = meta.account_name
  if (meta?.connected_by) { row.connected_by = meta.connected_by; row.connected_at = new Date().toISOString() }
  await supabase.from('workspace_calendar_configs').upsert(row, { onConflict: 'workspace_id' })
}

/**
 * Liefert einen gültigen Access-Token für den Workspace. Erneuert ihn per Refresh-Token,
 * falls abgelaufen/kurz vor Ablauf, und speichert die neuen Tokens. `null`, wenn keine
 * Verbindung besteht oder die Erneuerung scheitert (z.B. widerrufener Consent).
 */
export async function getValidAccessToken(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<string | null> {
  const cfg = getMsConfig()
  if (!cfg) return null

  const { data } = await supabase
    .from('workspace_calendar_configs')
    .select('encrypted_tokens, provider')
    .eq('workspace_id', workspaceId)
    .maybeSingle() as { data: { encrypted_tokens: string; provider: string } | null }
  if (!data || data.provider !== 'microsoft') return null

  let tokens: StoredTokens
  try {
    tokens = JSON.parse(decrypt(data.encrypted_tokens)) as StoredTokens
  } catch {
    return null
  }

  const expired = !tokens.expires_at || Date.parse(tokens.expires_at) - Date.now() < REFRESH_SKEW_MS
  if (!expired) return tokens.access_token

  if (!tokens.refresh_token) return null
  try {
    const refreshed = await refreshTokens(cfg, tokens.refresh_token)
    // MS gibt beim Refresh nicht immer einen neuen Refresh-Token zurück → alten behalten.
    if (!refreshed.refresh_token) refreshed.refresh_token = tokens.refresh_token
    await storeTokens(supabase, workspaceId, refreshed)
    return refreshed.access_token
  } catch {
    return null
  }
}

interface GraphEvent {
  id: string
  subject?: string
  start?: { dateTime?: string; timeZone?: string }
  end?: { dateTime?: string; timeZone?: string }
  organizer?: { emailAddress?: { name?: string; address?: string } }
  attendees?: Array<{ emailAddress?: { name?: string; address?: string } }>
}

function normalizeAttendees(ev: GraphEvent): CalendarAttendeeLite[] {
  const out: CalendarAttendeeLite[] = []
  const seen = new Set<string>()
  const push = (name?: string, address?: string) => {
    const email = address?.trim().toLowerCase() || null
    const key = email ?? (name?.trim().toLowerCase() ?? '')
    if (!key || seen.has(key)) return
    seen.add(key)
    out.push({ name: name?.trim() || null, email: address?.trim() || null })
  }
  if (ev.organizer?.emailAddress) push(ev.organizer.emailAddress.name, ev.organizer.emailAddress.address)
  for (const a of ev.attendees ?? []) push(a.emailAddress?.name, a.emailAddress?.address)
  return out
}

function graphIso(dt?: { dateTime?: string }): string | null {
  if (!dt?.dateTime) return null
  // Graph liefert dateTime ohne Zeitzonen-Suffix (UTC, wenn Prefer-Header gesetzt). Wir
  // fragen in UTC ab und hängen 'Z' an, falls kein Offset vorhanden ist.
  const s = dt.dateTime
  return /[Z+]|-\d{2}:\d{2}$/.test(s) ? s : `${s}Z`
}

/** Holt die bevorstehenden/laufenden Meetings (Fenster: -2h bis +14 Tage). */
export async function fetchUpcomingEvents(accessToken: string): Promise<CalendarEventLite[]> {
  const start = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  const url = `${GRAPH}/me/calendarView?startDateTime=${encodeURIComponent(start)}&endDateTime=${encodeURIComponent(end)}`
    + `&$select=id,subject,start,end,organizer,attendees&$orderby=start/dateTime&$top=50`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Prefer: 'outlook.timezone="UTC"' },
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Graph-Kalenderabruf fehlgeschlagen (${res.status}): ${detail.slice(0, 200)}`)
  }
  const body = await res.json() as { value?: GraphEvent[] }
  return (body.value ?? []).map(ev => ({
    id: ev.id,
    subject: ev.subject ?? null,
    starts_at: graphIso(ev.start),
    ends_at: graphIso(ev.end),
    attendees: normalizeAttendees(ev),
  }))
}

/** Holt ein einzelnes Event (Teilnehmer) per ID. `null`, wenn nicht gefunden. */
export async function fetchEvent(accessToken: string, eventId: string): Promise<CalendarEventLite | null> {
  const url = `${GRAPH}/me/events/${encodeURIComponent(eventId)}?$select=id,subject,start,end,organizer,attendees`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Prefer: 'outlook.timezone="UTC"' },
  })
  if (!res.ok) return null
  const ev = await res.json() as GraphEvent
  return {
    id: ev.id,
    subject: ev.subject ?? null,
    starts_at: graphIso(ev.start),
    ends_at: graphIso(ev.end),
    attendees: normalizeAttendees(ev),
  }
}
