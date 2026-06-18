'use client'

import { useState } from 'react'

interface PersonProgress {
  name: string
  done: number
  total: number
}

interface BurnEntry {
  label: string
  count: number
}

interface Props {
  personProgress: PersonProgress[]
  burnRate: BurnEntry[]
  brandColor?: string
}

export default function DashboardAnalytics({ personProgress, burnRate, brandColor }: Props) {
  const [open, setOpen] = useState(false)

  const hasPerson = personProgress.length > 0
  const hasBurn = burnRate.some(b => b.count > 0)
  if (!hasPerson && !hasBurn) return null

  const maxBurn = Math.max(...burnRate.map(x => x.count), 1)
  const totalDone = burnRate.reduce((s, b) => s + b.count, 0)

  return (
    <div className="mb-8 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      {/* Toggle-Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Auswertungen</span>
          {!open && (
            <div className="flex items-center gap-2">
              {hasPerson && (
                <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
                  Fortschritt pro Person
                </span>
              )}
              {hasBurn && (
                <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
                  Burn-Rate
                </span>
              )}
            </div>
          )}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={`text-gray-400 dark:text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">

          {/* Fortschritt pro Person */}
          {hasPerson && (
            <div className="p-5">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Fortschritt pro Person
              </h2>
              <div className="space-y-3">
                {personProgress.map(p => {
                  const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0
                  return (
                    <div key={p.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[60%]">{p.name}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 ml-2">
                          {p.done}/{p.total} erledigt
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: brandColor ?? '#2563eb' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Burn-Rate */}
          {hasBurn && (
            <div className="p-5">
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Erledigte Tasks pro Woche
                </h2>
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 ml-2">
                  {totalDone} in 8 Wochen
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Letzte 8 Kalenderwochen</p>

              {/* Bar chart */}
              <div className="space-y-2">
                {burnRate.map((w, i) => {
                  const pct = maxBurn > 0 ? (w.count / maxBurn) * 100 : 0
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-24 shrink-0 tabular-nums">{w.label}</span>
                      <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all flex items-center"
                          style={{
                            width: `${Math.max(pct, w.count > 0 ? 4 : 0)}%`,
                            backgroundColor: w.count > 0 ? (brandColor ?? '#2563eb') : 'transparent',
                            opacity: 0.75,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-5 text-right shrink-0">
                        {w.count > 0 ? w.count : '–'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
