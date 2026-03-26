import * as XLSX from 'xlsx'

const STATUS_LABELS: Record<string, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
  abgeschlossen: 'Abgeschlossen',
}

const PRIORITY_LABELS: Record<string, string> = {
  hoch: 'Hoch',
  mittel: 'Mittel',
  niedrig: 'Niedrig',
}

export function generateLopExcel(
  items: Record<string, unknown>[],
  projectName: string,
  workspaceName: string,
  brandColor: string = '#2563EB'
): Buffer {
  const wb = XLSX.utils.book_new()

  // Header row
  const headers = [
    'Nr.',
    'Titel',
    'Beschreibung',
    'Verantwortlich',
    'Fälligkeitsdatum',
    'Priorität',
    'Status',
    'Ergebnis',
    'Erstellt am',
  ]

  // Data rows
  const rows = items.map((item, i) => [
    i + 1,
    item.title ?? '',
    item.description ?? '',
    item.responsible ?? '',
    item.due_date ? new Date(item.due_date as string).toLocaleDateString('de-DE') : '',
    PRIORITY_LABELS[(item.priority as string) ?? ''] ?? (item.priority ?? ''),
    STATUS_LABELS[(item.status as string) ?? ''] ?? (item.status ?? ''),
    item.result ?? '',
    item.created_at ? new Date(item.created_at as string).toLocaleDateString('de-DE') : '',
  ])

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // Column widths
  ws['!cols'] = [
    { wch: 5 },
    { wch: 40 },
    { wch: 50 },
    { wch: 20 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
    { wch: 40 },
    { wch: 14 },
  ]

  // Style header row
  const brandHex = brandColor.replace('#', '').toUpperCase().padEnd(6, '0')
  for (let col = 0; col < headers.length; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!ws[cellRef]) continue
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: brandHex } },
      alignment: { horizontal: 'left' },
    }
  }

  // Metadata sheet
  const metaRows = [
    ['Projekt', projectName],
    ['Workspace', workspaceName],
    ['Exportiert am', new Date().toLocaleString('de-DE')],
    ['Anzahl Punkte', items.length],
  ]
  const wsMeta = XLSX.utils.aoa_to_sheet(metaRows)
  wsMeta['!cols'] = [{ wch: 20 }, { wch: 40 }]

  XLSX.utils.book_append_sheet(wb, ws, 'LOP')
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Info')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true }) as Buffer
}
