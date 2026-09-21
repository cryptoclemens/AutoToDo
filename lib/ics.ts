// Minimaler .ics-Parser (RFC 5545) für Kalender-Namensmatching Phase 1.
// Extrahiert Titel, Zeitraum und Teilnehmer (ATTENDEE/ORGANIZER). Keine Dependency.

export interface IcsEvent {
  title?: string
  starts_at?: string
  ends_at?: string
  attendees: { name?: string; email?: string }[]
}

function icsDate(v: string): string | undefined {
  // Formen: 20260921T140000Z, 20260921T140000, 20260921
  const m = v.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?/)
  if (!m) return undefined
  const [, y, mo, d, h, mi, s] = m
  return h ? `${y}-${mo}-${d}T${h}:${mi}:${s ?? '00'}Z` : `${y}-${mo}-${d}T00:00:00Z`
}

/** Parst das erste VEVENT eines .ics-Texts. */
export function parseIcs(text: string): IcsEvent {
  // Zeilen-Unfolding: Fortsetzungszeilen beginnen mit Space/Tab
  const unfolded = text.replace(/\r?\n[ \t]/g, '')
  const lines = unfolded.split(/\r?\n/)
  const ev: IcsEvent = { attendees: [] }
  const seen = new Set<string>()

  for (const line of lines) {
    const idx = line.indexOf(':')
    if (idx < 0) continue
    const left = line.slice(0, idx)       // z.B. ATTENDEE;CN=Max Mustermann;ROLE=REQ-PARTICIPANT
    const value = line.slice(idx + 1).trim()
    const prop = left.split(';')[0].toUpperCase()

    if (prop === 'SUMMARY' && !ev.title) ev.title = value
    else if (prop === 'DTSTART' && !ev.starts_at) ev.starts_at = icsDate(value)
    else if (prop === 'DTEND' && !ev.ends_at) ev.ends_at = icsDate(value)
    else if (prop === 'ATTENDEE' || prop === 'ORGANIZER') {
      const cn = left.match(/CN=("?)([^;:"]+)\1/i)?.[2]?.trim()
      const email = value.replace(/^mailto:/i, '').trim() || undefined
      const key = (email ?? cn ?? '').toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      ev.attendees.push({ name: cn, email })
    }
  }
  return ev
}
