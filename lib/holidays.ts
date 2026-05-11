export const BUNDESLAENDER = [
  { code: 'BW', name: 'Baden-Württemberg' },
  { code: 'BY', name: 'Bayern' },
  { code: 'BE', name: 'Berlin' },
  { code: 'BB', name: 'Brandenburg' },
  { code: 'HB', name: 'Bremen' },
  { code: 'HH', name: 'Hamburg' },
  { code: 'HE', name: 'Hessen' },
  { code: 'MV', name: 'Mecklenburg-Vorpommern' },
  { code: 'NI', name: 'Niedersachsen' },
  { code: 'NW', name: 'Nordrhein-Westfalen' },
  { code: 'RP', name: 'Rheinland-Pfalz' },
  { code: 'SL', name: 'Saarland' },
  { code: 'SN', name: 'Sachsen' },
  { code: 'ST', name: 'Sachsen-Anhalt' },
  { code: 'SH', name: 'Schleswig-Holstein' },
  { code: 'TH', name: 'Thüringen' },
]

function easter(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function shift(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function fmt(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getGermanHolidays(year: number, bundesland?: string | null): Set<string> {
  const e = easter(year)
  const h = new Set<string>()

  // Bundesweit
  h.add(`${year}-01-01`)           // Neujahr
  h.add(fmt(shift(e, -2)))         // Karfreitag
  h.add(fmt(shift(e, 1)))          // Ostermontag
  h.add(`${year}-05-01`)           // Tag der Arbeit
  h.add(fmt(shift(e, 39)))         // Christi Himmelfahrt
  h.add(fmt(shift(e, 50)))         // Pfingstmontag
  h.add(`${year}-10-03`)           // Tag der Deutschen Einheit
  h.add(`${year}-12-25`)           // 1. Weihnachtstag
  h.add(`${year}-12-26`)           // 2. Weihnachtstag

  if (!bundesland) return h

  if (['BW', 'BY', 'ST'].includes(bundesland))
    h.add(`${year}-01-06`)         // Heilige Drei Könige

  if (['BE', 'MV'].includes(bundesland))
    h.add(`${year}-03-08`)         // Internationaler Frauentag

  if (['BW', 'BY', 'HE', 'NW', 'RP', 'SL'].includes(bundesland))
    h.add(fmt(shift(e, 60)))       // Fronleichnam

  if (['BY', 'SL'].includes(bundesland))
    h.add(`${year}-08-15`)         // Mariä Himmelfahrt

  if (bundesland === 'TH')
    h.add(`${year}-09-20`)         // Weltkindertag

  if (['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH'].includes(bundesland))
    h.add(`${year}-10-31`)         // Reformationstag

  if (['BW', 'BY', 'NW', 'RP', 'SL'].includes(bundesland))
    h.add(`${year}-11-01`)         // Allerheiligen

  if (bundesland === 'SN') {
    // Buß- und Bettag: Mittwoch vor dem 23. November
    const nov23 = new Date(year, 10, 23)
    h.add(fmt(shift(nov23, -((nov23.getDay() + 4) % 7))))
  }

  return h
}

export function getWorkingDays(year: number, month: number, bundesland?: string | null): string[] {
  const holidays = getGermanHolidays(year, bundesland)
  const daysInMonth = new Date(year, month, 0).getDate()
  const result: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    const dow = date.getDay()
    const dateStr = fmt(date)
    if (dow !== 0 && dow !== 6 && !holidays.has(dateStr)) result.push(dateStr)
  }
  return result
}
