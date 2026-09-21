// Kandidaten-Helfer für das Sprecher-Namensmatching (Diarisierung Phase 1).
// Kandidaten = Workspace-/Projekt-Mitglieder + Kalender-Teilnehmer.
// Der LLM darf Sprecher NUR auf diese Kandidaten abbilden; alles andere wird verworfen.

export interface SpeakerCandidate {
  name: string
  email: string | null
  user_id: string | null
}

export interface MemberRow {
  user_id: string
  display_name: string
  email: string
}

export interface CalendarAttendee {
  name?: string | null
  email?: string | null
  user_id?: string | null
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

function firstToken(s: string): string {
  return norm(s).split(/\s+/)[0] ?? ''
}

/**
 * Baut die deduplizierte Kandidatenliste. Kalender-Teilnehmer werden – wenn möglich –
 * über ihre E-Mail einem Mitglieds-Account (user_id) zugeordnet.
 */
export function buildCandidates(members: MemberRow[], attendees: CalendarAttendee[] = []): SpeakerCandidate[] {
  const byKey = new Map<string, SpeakerCandidate>()
  const emailToUser = new Map<string, string>()
  for (const m of members) {
    if (m.email) emailToUser.set(norm(m.email), m.user_id)
  }

  const add = (c: SpeakerCandidate) => {
    // Dedupe: bevorzugt user_id, sonst E-Mail, sonst Name
    const key = c.user_id ?? (c.email ? `e:${norm(c.email)}` : `n:${norm(c.name)}`)
    const existing = byKey.get(key)
    if (!existing) { byKey.set(key, c); return }
    // vorhandenen Eintrag anreichern (user_id/E-Mail ergänzen)
    if (!existing.user_id && c.user_id) existing.user_id = c.user_id
    if (!existing.email && c.email) existing.email = c.email
  }

  for (const m of members) {
    if (!m.display_name || m.display_name === m.email) continue
    add({ name: m.display_name, email: m.email || null, user_id: m.user_id })
  }
  for (const a of attendees) {
    const email = a.email ? norm(a.email) : null
    const name = (a.name && a.name.trim()) || (email ? email.split('@')[0] : null)
    if (!name) continue
    const user_id = a.user_id ?? (email ? emailToUser.get(email) ?? null : null)
    add({ name, email: a.email ?? null, user_id })
  }
  return Array.from(byKey.values())
}

/**
 * Löst einen vom LLM gelieferten Sprecher-Namen konservativ auf einen Kandidaten auf.
 * Nur exakte Voll- oder Vornamens-Treffer zählen; ansonsten → verworfen (null),
 * damit halluzinierte Namen nicht durchrutschen.
 */
export function resolveCandidate(
  name: string | null | undefined,
  candidates: SpeakerCandidate[],
): { matched_member: string | null; matched_user_id: string | null } {
  if (!name || !name.trim()) return { matched_member: null, matched_user_id: null }
  const n = norm(name)
  const nFirst = firstToken(name)

  // 1. exakter Voll-Name
  let c = candidates.find(k => norm(k.name) === n)
  // 2. Vornamens-Treffer (LLM liefert oft nur den Vornamen)
  if (!c) c = candidates.find(k => firstToken(k.name) === n || firstToken(k.name) === nFirst)
  if (!c) return { matched_member: null, matched_user_id: null }
  return { matched_member: c.name, matched_user_id: c.user_id }
}

/** Ein bestätigter Sprecher, der einem echten Account zugeordnet wurde. */
export interface ConfirmedSpeaker {
  name: string
  user_id: string
}

/**
 * Propagiert bestätigte Sprecher-Identitäten auf einen (vom LLM als Freitext gelieferten)
 * Verantwortlichen-Namen. Die manuelle Bestätigung dient hier als autoritative
 * Namen→user_id-Tabelle – wir raten NICHT, dass Sprecher == Verantwortlicher, sondern
 * nutzen nur die verlässliche Namensauflösung.
 *
 * Voll-Namens-Treffer zählen immer (sofern eindeutig). Ein Vornamens-Treffer zählt nur,
 * wenn er innerhalb der bestätigten Sprecher auf genau eine user_id zeigt – sonst null
 * (kein Raten bei gleichen Vornamen).
 */
export function resolveResponsibleFromConfirmed(
  responsibleName: string | null | undefined,
  confirmed: ConfirmedSpeaker[],
): string | null {
  if (!responsibleName || !responsibleName.trim()) return null
  const n = norm(responsibleName)

  // 1. exakter Voll-Name — nur wenn eindeutig auf eine user_id
  const full = confirmed.filter(c => norm(c.name) === n)
  if (full.length > 0) {
    const uids = new Set(full.map(c => c.user_id))
    return uids.size === 1 ? full[0].user_id : null
  }

  // 2. Vornamens-Treffer — nur wenn eindeutig
  const nFirst = firstToken(responsibleName)
  const byFirst = confirmed.filter(c => firstToken(c.name) === n || firstToken(c.name) === nFirst)
  if (byFirst.length === 0) return null
  const uids = new Set(byFirst.map(c => c.user_id))
  return uids.size === 1 ? byFirst[0].user_id : null
}
