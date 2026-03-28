import * as XLSX from 'xlsx'

const STATUS_MAP: Record<string, string> = {
  'Offen': 'offen',
  'In Bearbeitung': 'in_bearbeitung',
  'Abgeschlossen': 'abgeschlossen',
  'Open': 'offen',
  'In Progress': 'in_bearbeitung',
  'Done': 'abgeschlossen',
}

const PRIORITY_MAP: Record<string, string> = {
  'Hoch': 'hoch',
  'Mittel': 'mittel',
  'Niedrig': 'niedrig',
  'High': 'hoch',
  'Medium': 'mittel',
  'Low': 'niedrig',
}

export interface ImportRow {
  nr: number | null
  title: string
  description: string
  responsible: string
  dueDate: string | null   // ISO date yyyy-mm-dd or null
  priority: 'hoch' | 'mittel' | 'niedrig' | null
  status: 'offen' | 'in_bearbeitung' | 'abgeschlossen' | null
  result: string
}

/** Parse German date dd.mm.yyyy → ISO yyyy-mm-dd */
function parseDate(raw: string): string | null {
  if (!raw) return null
  const de = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (de) {
    return `${de[3]}-${de[2].padStart(2, '0')}-${de[1].padStart(2, '0')}`
  }
  // Fallback: ISO or any parseable format
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return null
}

/** Parse the "LOP" sheet from an AutoToDo-exported XLSX file. */
export function parseImportSheet(buffer: Buffer): ImportRow[] {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets['LOP']
  if (!ws) throw new Error('Kein "LOP"-Tabellenblatt gefunden. Ist dies eine AutoToDo-XLSX-Datei?')

  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' }) as unknown[][]
  if (raw.length < 2) return []

  const header = (raw[0] as string[]).map(h => String(h).trim())

  const idx = {
    nr:          header.findIndex(h => h === 'Nr.'),
    title:       header.findIndex(h => h === 'Titel'),
    description: header.findIndex(h => h === 'Beschreibung'),
    responsible: header.findIndex(h => h === 'Verantwortlich'),
    dueDate:     header.findIndex(h => h === 'Fälligkeitsdatum'),
    priority:    header.findIndex(h => h === 'Priorität'),
    status:      header.findIndex(h => h === 'Status'),
    result:      header.findIndex(h => h === 'Ergebnis'),
  }

  if (idx.title === -1) {
    throw new Error('Spalte "Titel" nicht gefunden. Bitte lade eine AutoToDo-XLSX-Datei hoch.')
  }

  const rows: ImportRow[] = []
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i] as unknown[]
    const title = String(row[idx.title] ?? '').trim()
    if (!title) continue

    const rawPrio = idx.priority >= 0 ? String(row[idx.priority] ?? '').trim() : ''
    const rawStatus = idx.status >= 0 ? String(row[idx.status] ?? '').trim() : ''
    const rawDate = idx.dueDate >= 0 ? String(row[idx.dueDate] ?? '').trim() : ''
    const rawNr = idx.nr >= 0 ? row[idx.nr] : null

    rows.push({
      nr:          rawNr !== null && rawNr !== '' ? Number(rawNr) || null : null,
      title,
      description: idx.description >= 0 ? String(row[idx.description] ?? '').trim() : '',
      responsible: idx.responsible >= 0 ? String(row[idx.responsible] ?? '').trim() : '',
      dueDate:     rawDate ? parseDate(rawDate) : null,
      priority:    (PRIORITY_MAP[rawPrio] as ImportRow['priority']) ?? null,
      status:      (STATUS_MAP[rawStatus] as ImportRow['status']) ?? null,
      result:      idx.result >= 0 ? String(row[idx.result] ?? '').trim() : '',
    })
  }

  return rows
}

export type ImportChangeType = 'update' | 'add' | 'unchanged'

export interface ImportChange {
  type: ImportChangeType
  nr: number | null
  importRow: ImportRow
  existingId?: string          // set for 'update' and 'unchanged'
  changedFields?: string[]     // human-readable list of changed fields for 'update'
}

type ExistingItem = {
  id: string
  title: string
  description: string | null
  responsible: string | null
  due_date: string | null
  priority: string
  status: string
  result: string | null
}

/** Compute the diff between imported rows and existing DB items. */
export function computeImportDiff(
  importRows: ImportRow[],
  existing: ExistingItem[],
): ImportChange[] {
  const changes: ImportChange[] = []

  for (const row of importRows) {
    // Match by Nr. (1-indexed) when available
    let matched: ExistingItem | undefined
    if (row.nr !== null && row.nr >= 1 && row.nr <= existing.length) {
      matched = existing[row.nr - 1]
    }
    // Fallback: match by exact title
    if (!matched) {
      matched = existing.find(e => e.title.trim().toLowerCase() === row.title.toLowerCase())
    }

    if (!matched) {
      changes.push({ type: 'add', nr: row.nr, importRow: row })
      continue
    }

    const changedFields: string[] = []
    if (row.title && row.title !== matched.title) changedFields.push('Titel')
    if (row.description !== undefined && row.description !== (matched.description ?? '')) changedFields.push('Beschreibung')
    if (row.responsible !== undefined && row.responsible !== (matched.responsible ?? '')) changedFields.push('Verantwortlich')
    if (row.dueDate !== undefined && row.dueDate !== (matched.due_date ?? null)) changedFields.push('Fälligkeitsdatum')
    if (row.priority !== null && row.priority !== matched.priority) changedFields.push('Priorität')
    if (row.status !== null && row.status !== matched.status) changedFields.push('Status')
    if (row.result !== undefined && row.result !== (matched.result ?? '')) changedFields.push('Ergebnis')

    if (changedFields.length === 0) {
      changes.push({ type: 'unchanged', nr: row.nr, importRow: row, existingId: matched.id })
    } else {
      changes.push({ type: 'update', nr: row.nr, importRow: row, existingId: matched.id, changedFields })
    }
  }

  return changes
}
