'use client'

import { useState, useEffect, useCallback } from 'react'

interface DayData {
  lop: string[]
  meetings: string[]
}

const MAX_LEN = 200

function combine(day: DayData): string {
  const parts = [...day.lop, ...day.meetings].filter(Boolean)
  if (parts.length === 0) return ''
  const joined = parts.join('; ')
  return joined.length <= MAX_LEN ? joined : joined.slice(0, MAX_LEN - 1).trimEnd() + '…'
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
}

function daysInMonth(month: string): string[] {
  const [y, m] = month.split('-').map(Number)
  const count = new Date(y, m, 0).getDate()
  return Array.from({ length: count }, (_, i) => {
    const d = String(i + 1).padStart(2, '0')
    return `${month}-${d}`
  })
}

function dayLabel(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })
}

interface Props {
  onClose: () => void
  projectId?: string
  projectName?: string
}

export default function TaetigkeitsnachweisModal({ onClose, projectId, projectName }: Props) {
  const today = new Date()
  const initMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const [month, setMonth] = useState(initMonth)
  const [loading, setLoading] = useState(false)
  const [rawDays, setRawDays] = useState<Record<string, DayData>>({})
  const [fields, setFields] = useState<Record<string, string>>({})

  const load = useCallback(async (m: string) => {
    setLoading(true)
    try {
      const url = projectId
        ? `/api/taetigkeitsnachweise?month=${m}&projectId=${projectId}`
        : `/api/taetigkeitsnachweise?month=${m}`
      const res = await fetch(url)
      if (!res.ok) return
      const data: { days: Record<string, DayData> } = await res.json()
      setRawDays(data.days)
      const f: Record<string, string> = {}
      for (const [date, day] of Object.entries(data.days)) {
        f[date] = combine(day)
      }
      setFields(f)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load(month) }, [month, load])

  function prevMonth() {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  function nextMonth() {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const activeDays = daysInMonth(month).filter(d => rawDays[d] || fields[d])

  return (
    <>
      <style>{`
        @media print {
          body > *:not(#tn-print-root) { display: none !important; }
          #tn-print-root { position: fixed; inset: 0; background: white; overflow: auto; }
          .tn-no-print { display: none !important; }
          .tn-table { font-size: 11px; }
        }
      `}</style>

      <div className="tn-no-print fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div id="tn-print-root" className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="tn-no-print flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              Tätigkeitsnachweis{projectName ? ` – ${projectName}` : ''}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Month nav */}
          <div className="tn-no-print flex items-center gap-3 px-6 py-3 border-b border-gray-50">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-800 min-w-[140px] text-center">
              {formatMonthLabel(month)}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="ml-auto">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4V1h6v3M3 9H1.5A.5.5 0 0 1 1 8.5v-3A.5.5 0 0 1 1.5 5h9a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5H9m-6 0v3h6V9H3z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Drucken / PDF
              </button>
            </div>
          </div>

          {/* Print-only header */}
          <div className="hidden print:block px-6 pt-4 pb-2">
            <h1 className="text-lg font-bold">
              Tätigkeitsnachweis{projectName ? ` – ${projectName}` : ''} – {formatMonthLabel(month)}
            </h1>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400">Laden…</div>
            ) : activeDays.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-sm text-gray-400 gap-1">
                <span>Keine Einträge in {formatMonthLabel(month)}</span>
                <span className="text-xs">Tätigkeiten erscheinen, wenn du als Verantwortlicher in LOP-Punkten eingetragen bist.</span>
              </div>
            ) : (
              <table className="tn-table w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 whitespace-nowrap w-28">Tag</th>
                    <th className="text-left py-2 text-xs font-semibold text-gray-500">Tätigkeit</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDays.map(date => {
                    const val = fields[date] ?? ''
                    const remaining = MAX_LEN - val.length
                    return (
                      <tr key={date} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                        <td className="py-2 pr-4 text-xs text-gray-500 whitespace-nowrap align-top pt-2.5">
                          {dayLabel(date)}
                        </td>
                        <td className="py-1.5 align-top">
                          <div className="relative">
                            <input
                              type="text"
                              maxLength={MAX_LEN}
                              autoComplete="off"
                              autoCorrect="off"
                              spellCheck={false}
                              name={`tn-${date}`}
                              value={val}
                              onChange={e => setFields(prev => ({ ...prev, [date]: e.target.value }))}
                              className="w-full text-xs bg-transparent border border-transparent rounded px-1.5 py-1 focus:outline-none focus:border-blue-300 focus:bg-white group-hover:border-gray-200 transition-colors text-gray-800 placeholder:text-gray-300"
                              placeholder="–"
                            />
                            {remaining <= 40 && (
                              <span className={`absolute right-1.5 top-1.5 text-xs tabular-nums ${remaining <= 10 ? 'text-red-400' : 'text-amber-400'}`}>
                                {remaining}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="tn-no-print px-6 py-3 border-t border-gray-50 text-xs text-gray-400">
            Automatisch befüllt aus LOP-Punkten und Meetings – editierbar, max. {MAX_LEN} Zeichen.
          </div>
        </div>
      </div>
    </>
  )
}
