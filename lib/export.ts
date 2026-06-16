import * as XLSX from 'xlsx'

export function generateArchiveExcel(
  items: Record<string, unknown>[],
  projectName: string,
  workspaceName: string,
  brandColor: string = '#2563EB',
  from?: string,
  to?: string,
): Buffer {
  const wb = XLSX.utils.book_new()

  const hdrs = ['Nr.', 'Titel', 'Beschreibung', 'Verantwortlich', 'Fälligkeitsdatum', 'Abgeschlossen am', 'Priorität', 'Ergebnis', 'Erstellt am']
  const rows = items.map((item, i) => [
    i + 1,
    item.title ?? '',
    item.description ?? '',
    item.responsible ?? '',
    item.due_date ? new Date(item.due_date as string).toLocaleDateString('de-DE') : '',
    item.completed_at ? new Date(item.completed_at as string).toLocaleDateString('de-DE') : '',
    item.priority === 'hoch' ? 'Hoch' : item.priority === 'mittel' ? 'Mittel' : item.priority === 'niedrig' ? 'Niedrig' : (item.priority ?? ''),
    item.result ?? '',
    item.created_at ? new Date(item.created_at as string).toLocaleDateString('de-DE') : '',
  ])

  const ws = XLSX.utils.aoa_to_sheet([hdrs, ...rows])
  ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 50 }, { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 40 }, { wch: 14 }]

  const brandHex = brandColor.replace('#', '').toUpperCase().padEnd(6, '0')
  for (let col = 0; col < hdrs.length; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!ws[cellRef]) continue
    ws[cellRef].s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: brandHex } }, alignment: { horizontal: 'left' } }
  }

  const zeitraum = from && to ? `${from} – ${to}` : from ? `ab ${from}` : to ? `bis ${to}` : 'Gesamt'
  const metaRows = [
    ['Projekt', projectName],
    ['Workspace', workspaceName],
    ['Zeitraum', zeitraum],
    ['Exportiert am', new Date().toLocaleString('de-DE')],
    ['Abgeschlossene Punkte', items.length],
  ]
  const wsMeta = XLSX.utils.aoa_to_sheet(metaRows)
  wsMeta['!cols'] = [{ wch: 24 }, { wch: 40 }]

  XLSX.utils.book_append_sheet(wb, ws, 'Archiv')
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Info')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true }) as Buffer
}



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

export function generateTaetigkeitsnachweisExcel(
  days: Record<string, { lop: string[]; meetings: string[]; plan?: string }>,
  allDays: string[],
  nonWorkingDays: string[],
  month: string,
  userName: string,
  projectName?: string,
): Buffer {
  const wb = XLSX.utils.book_new()
  const nonWorkingSet = new Set(nonWorkingDays)

  const hdrs = ['Datum', 'Wochentag', 'Tätigkeit']
  const rows = allDays.map(date => {
    const d = new Date(date + 'T00:00:00')
    const isNonWorking = nonWorkingSet.has(date)
    const dayData = days[date]
    let text = ''
    if (!isNonWorking && dayData) {
      if (dayData.plan?.trim()) {
        text = dayData.plan.trim()
      } else {
        const parts = (dayData.lop.length > 0 ? dayData.lop : dayData.meetings).filter(Boolean)
        text = parts.join('; ')
      }
    }
    return [
      d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      d.toLocaleDateString('de-DE', { weekday: 'long' }),
      isNonWorking ? '–' : text,
    ]
  })

  const ws = XLSX.utils.aoa_to_sheet([hdrs, ...rows])
  ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 80 }]

  for (let col = 0; col < hdrs.length; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!ws[cellRef]) continue
    ws[cellRef].s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2563EB' } }, alignment: { horizontal: 'left' } }
  }

  const [y, m] = month.split('-').map(Number)
  const monthLabel = new Date(y, m - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  const metaRows = [
    ['Monat', monthLabel],
    ['Mitarbeiter', userName],
    ...(projectName ? [['Projekt', projectName]] : []),
    ['Exportiert am', new Date().toLocaleString('de-DE')],
  ]
  const wsMeta = XLSX.utils.aoa_to_sheet(metaRows)
  wsMeta['!cols'] = [{ wch: 16 }, { wch: 40 }]

  XLSX.utils.book_append_sheet(wb, ws, 'Tätigkeitsnachweis')
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Info')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true }) as Buffer
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
