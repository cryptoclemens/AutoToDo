import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'

/**
 * Prüfung für Ziel-URLs, die Workspace-Admins selbst eintragen (Webhooks,
 * Slack/Teams, Azure-OpenAI-Endpunkt). Der Server ruft diese URLs auf — ohne
 * Prüfung erreicht ein Eintrag wie `http://supabase-kong:8000/…` oder
 * `http://169.254.169.254/` interne Dienste (SSRF), und ein fremder Server
 * kann dem Prozess beliebige Antworten unterschieben (Audit 24.10.2026, F1).
 */

// Getrennte Listen: Eine BlockList prüft IPv4-Adressen auch gegen IPv6-Regeln
// wie `::ffff:0:0/96` — in einer gemeinsamen Liste wäre damit jede IPv4 „intern“.
const PRIVATE_V4 = new BlockList()
for (const [net, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
  ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) PRIVATE_V4.addSubnet(net, prefix, 'ipv4')
const PRIVATE_V6 = new BlockList()
for (const [net, prefix] of [
  ['::', 128], ['::1', 128], ['::ffff:0:0', 96], ['64:ff9b::', 96], ['100::', 64],
  ['2001:db8::', 32], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
] as const) PRIVATE_V6.addSubnet(net, prefix, 'ipv6')

/**
 * IPv4-mapped IPv6 wird als IPv4 geprüft — in beiden Schreibweisen:
 * `::ffff:10.0.0.1` und `::ffff:a00:1` (so normalisiert `new URL()`).
 */
export function isPublicAddress(ip: string): boolean {
  const dotted = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip)
  if (dotted) return isPublicAddress(dotted[1])
  const hex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(ip)
  if (hex) {
    const hi = parseInt(hex[1], 16)
    const lo = parseInt(hex[2], 16)
    return isPublicAddress(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`)
  }
  const family = isIP(ip)
  if (family === 4) return !PRIVATE_V4.check(ip, 'ipv4')
  if (family === 6) return !PRIVATE_V6.check(ip, 'ipv6')
  return false
}

/**
 * Gibt `null` zurück, wenn die URL ein öffentliches HTTPS-Ziel ist, sonst den
 * Grund. Jede aufgelöste Adresse muss öffentlich sein.
 * Bekannte Restlücke: DNS-Rebinding zwischen Prüfung und Abruf.
 */
export async function checkPublicHttpsUrl(raw: string): Promise<string | null> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return 'Ungültige URL.'
  }
  if (url.protocol !== 'https:') return 'Nur https-URLs sind erlaubt.'
  if (url.username || url.password) return 'Zugangsdaten in der URL sind nicht erlaubt.'
  if (url.port && url.port !== '443') return 'Nur der Standard-Port 443 ist erlaubt.'
  // WHATWG normalisiert `0177.0.0.1`, `0x7f.1` usw. bereits zu `127.0.0.1`.
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (isIP(host)) return isPublicAddress(host) ? null : 'Interne Adressen sind nicht erlaubt.'
  if (!host.includes('.') || host.endsWith('.local') || host.endsWith('.internal')) {
    return 'Interne Hostnamen sind nicht erlaubt.'
  }
  let addresses: { address: string }[]
  try {
    addresses = await lookup(host, { all: true, verbatim: true })
  } catch {
    return 'Hostname lässt sich nicht auflösen.'
  }
  if (!addresses.length || !addresses.every(a => isPublicAddress(a.address))) {
    return 'Der Hostname zeigt auf eine interne Adresse.'
  }
  return null
}

/** Zusätzlich zur öffentlichen Adresse: Host muss auf eine der Endungen passen. */
export async function checkHostSuffix(raw: string, suffixes: readonly string[]): Promise<string | null> {
  let host: string
  try {
    host = new URL(raw).hostname.toLowerCase()
  } catch {
    return 'Ungültige URL.'
  }
  if (!suffixes.some(s => host.endsWith(s))) return 'Dieser Host ist hier nicht erlaubt.'
  return checkPublicHttpsUrl(raw)
}

export const AZURE_OPENAI_SUFFIXES = [
  '.openai.azure.com',
  '.cognitiveservices.azure.com',
  '.services.ai.azure.com',
] as const

export const CHAT_WEBHOOK_SUFFIXES = [
  '.slack.com',
  '.webhook.office.com',
  '.office365.com',
  '.logic.azure.com',
  '.powerplatform.com',
] as const

/** Wirft, wenn der Azure-Endpunkt nicht auf Azure zeigt (Prüfung beim Aufruf, auch für Altdaten). */
export async function assertAzureEndpoint(endpoint: string): Promise<void> {
  const reason = await checkHostSuffix(endpoint, AZURE_OPENAI_SUFFIXES)
  if (reason) throw new Error(`Azure-Endpunkt abgelehnt: ${reason}`)
}

/**
 * fetch für benutzerdefinierte Ziele: prüft vor dem Abruf und folgt keiner
 * Weiterleitung (eine 302 auf eine interne Adresse wäre sonst ein Umweg).
 */
export async function fetchUserUrl(raw: string, init: RequestInit): Promise<Response> {
  const reason = await checkPublicHttpsUrl(raw)
  if (reason) throw new Error(`Ziel-URL abgelehnt: ${reason}`)
  return fetch(raw, { ...init, redirect: 'manual' })
}
