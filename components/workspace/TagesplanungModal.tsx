'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface DayPlan { plan: string; suggestion: string }

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

function offsetDate(base: string, days: number): string {
  const d = new Date(base + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDate(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Heute'
  if (dateStr === offsetDate(todayStr, -1)) return 'Gestern'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })
}

const MAX_LEN = 300
const HISTORY_DAYS = 14

interface Props { onClose: () => void }

export default function TagesplanungModal({ onClose }: Props) {
  const today = isoToday()

  const [date, setDate] = useState(today)
  const [cache, setCache] = useState<Record<string, DayPlan>>({})
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  // All history entries (excluding currently viewed date)
  const [history, setHistory] = useState<{ date: string; text: string }[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFuture = date > today

  const loadDate = useCallback(async (d: string) => {
    if (cache[d]) {
      setText(cache[d].plan || cache[d].suggestion)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/daily-plan?date=${d}&days=${HISTORY_DAYS}`)
      if (!res.ok) return
      const json = await res.json()
      // Populate cache for all returned history too
      const newCache: Record<string, DayPlan> = {}
      newCache[d] = { plan: json.plan, suggestion: json.suggestion }
      for (const h of json.history ?? []) {
        newCache[h.date] = { plan: h.text, suggestion: '' }
      }
      setCache(prev => ({ ...prev, ...newCache }))
      setText(json.plan || json.suggestion)
      setHistory(json.history ?? [])
    } finally {
      setLoading(false)
    }
  }, [cache])

  useEffect(() => { loadDate(date) }, [date]) // eslint-disable-line react-hooks/exhaustive-deps

  async function save(value: string, targetDate: string) {
    setSaving(true)
    setCache(prev => ({ ...prev, [targetDate]: { plan: value, suggestion: prev[targetDate]?.suggestion ?? '' } }))
    // Update history text too if we saved a past entry
    setHistory(prev => prev.map(h => h.date === targetDate ? { ...h, text: value } : h))
    await fetch('/api/daily-plan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: targetDate, text: value }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleChange(value: string) {
    setText(value)
    setSaved(false)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(value, date), 1200)
  }

  function goDay(delta: number) {
    const next = offsetDate(date, delta)
    if (next > today) return // Keine Zukunft
    setDate(next)
    setSaved(false)
  }

  const remaining = MAX_LEN - text.length
  const isToday = date === today
  const currentData = cache[date]
  const isSuggested = !!(currentData && !currentData.plan && currentData.suggestion && text === currentData.suggestion)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Tagesplanung</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Day navigation */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-50">
            <button
              onClick={() => goDay(-1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              title="Vorheriger Tag"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className="flex-1 text-center">
              <p className="text-sm font-semibold text-gray-800">{formatDate(date, today)}</p>
              {!isToday && (
                <p className="text-xs text-gray-400">{formatDateShort(date)}</p>
              )}
            </div>

            <button
              onClick={() => goDay(+1)}
              disabled={isToday}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Nächster Tag"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {!isToday && (
              <button
                onClick={() => setDate(today)}
                className="text-xs text-blue-500 hover:text-blue-700 transition-colors ml-1"
              >
                Heute
              </button>
            )}
          </div>

          {/* Plan editor */}
          <div className="px-6 py-5 flex-1 overflow-auto">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {isToday ? 'Was machst du heute?' : 'Was hast du gemacht?'}
            </label>

            {loading ? (
              <div className="h-24 flex items-center justify-center text-sm text-gray-400">Laden…</div>
            ) : isFuture ? (
              <p className="text-sm text-gray-400 text-center py-6">Keine Einträge für zukünftige Tage.</p>
            ) : (
              <>
                <div className="relative">
                  <textarea
                    key={date}
                    value={text}
                    onChange={e => handleChange(e.target.value)}
                    maxLength={MAX_LEN}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    rows={4}
                    placeholder={isToday ? 'z.B. Interviews auswerten, Präsentation vorbereiten…' : 'Nachträglich ergänzen…'}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none text-gray-800 placeholder:text-gray-300"
                    autoFocus
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs tabular-nums ${remaining <= 30 ? (remaining <= 10 ? 'text-red-400' : 'text-amber-400') : 'text-gray-300'}`}>
                      {remaining <= 60 ? `${remaining} Zeichen` : ''}
                    </span>
                    <span className={`text-xs transition-opacity ${saving ? 'text-gray-400 opacity-100' : saved ? 'text-green-500 opacity-100' : 'opacity-0'}`}>
                      {saving ? 'Speichern…' : '✓ Gespeichert'}
                    </span>
                  </div>
                </div>

                {isSuggested && (
                  <p className="text-xs text-blue-500 mt-2">
                    ↑ Automatisch aus offenen LOP-Punkten vorausgefüllt – einfach anpassen.
                  </p>
                )}
              </>
            )}

            {/* History list */}
            {history.length > 0 && (
              <div className="mt-5">
                <button
                  onClick={() => setHistoryOpen(o => !o)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className={`transition-transform ${historyOpen ? 'rotate-180' : ''}`}>
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Weitere {history.filter(h => h.date !== date).length} Tage
                </button>

                {historyOpen && (
                  <div className="mt-2 space-y-0">
                    {history.filter(h => h.date !== date).map(h => (
                      <button
                        key={h.date}
                        onClick={() => setDate(h.date)}
                        className="w-full flex gap-3 py-2 border-b border-gray-50 last:border-0 text-left hover:bg-gray-50 rounded-lg px-1 transition-colors group"
                      >
                        <span className="text-xs text-gray-400 w-24 shrink-0 pt-0.5 group-hover:text-gray-600">{formatDateShort(h.date)}</span>
                        <p className="text-xs text-gray-600 leading-relaxed truncate">
                          {h.text || <span className="text-gray-300">–</span>}
                        </p>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 mt-0.5 text-gray-300 group-hover:text-gray-500">
                          <path d="M2 2h6v6M8 2L2 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-3 border-t border-gray-50 flex justify-end">
            <button
              onClick={() => { if (saveTimer.current) clearTimeout(saveTimer.current); save(text, date); onClose() }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
            >
              Speichern & schließen
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
