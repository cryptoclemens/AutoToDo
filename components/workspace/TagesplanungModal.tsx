'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface HistoryEntry { date: string; text: string }

interface ApiResponse {
  today: string
  plan: string
  suggestion: string
  history: HistoryEntry[]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })
}

const MAX_LEN = 300

interface Props { onClose: () => void }

export default function TagesplanungModal({ onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10)

  const [data, setData] = useState<ApiResponse | null>(null)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/daily-plan?date=${today}&days=14`)
    if (!res.ok) return
    const d: ApiResponse = await res.json()
    setData(d)
    setText(d.plan || d.suggestion)
  }, [today])

  useEffect(() => { load() }, [load])

  async function save(value: string) {
    setSaving(true)
    await fetch('/api/daily-plan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, text: value }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleChange(value: string) {
    setText(value)
    setSaved(false)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(value), 1200)
  }

  const remaining = MAX_LEN - text.length

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Tagesplanung</h2>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(today)}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Today's plan */}
          <div className="px-6 py-5 flex-1 overflow-auto">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Was machst du heute?
            </label>

            {!data ? (
              <div className="h-24 flex items-center justify-center text-sm text-gray-400">Laden…</div>
            ) : (
              <>
                <div className="relative">
                  <textarea
                    value={text}
                    onChange={e => handleChange(e.target.value)}
                    maxLength={MAX_LEN}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    rows={4}
                    placeholder="z.B. Interviews auswerten, Präsentation vorbereiten…"
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

                {/* Suggestion hint */}
                {data.suggestion && !data.plan && text === data.suggestion && (
                  <p className="text-xs text-blue-500 mt-2">
                    ↑ Automatisch aus deinen offenen LOP-Punkten vorausgefüllt – einfach anpassen.
                  </p>
                )}
              </>
            )}

            {/* History */}
            {data && data.history.length > 0 && (
              <div className="mt-5">
                <button
                  onClick={() => setHistoryOpen(o => !o)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className={`transition-transform ${historyOpen ? 'rotate-180' : ''}`}>
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Letzte {data.history.length} Tage anzeigen
                </button>

                {historyOpen && (
                  <div className="mt-2 space-y-2">
                    {data.history.map(h => (
                      <div key={h.date} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                        <span className="text-xs text-gray-400 w-24 shrink-0 pt-0.5">{formatDateShort(h.date)}</span>
                        <p className="text-xs text-gray-600 leading-relaxed">{h.text || <span className="text-gray-300">–</span>}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-3 border-t border-gray-50 flex justify-end">
            <button
              onClick={() => { save(text); onClose() }}
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
