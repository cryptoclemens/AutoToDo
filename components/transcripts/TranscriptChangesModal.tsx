'use client'

import { useState } from 'react'

interface LopItem {
  id: string
  title: string
  responsible: string | null
  status: string
  due_date: string | null
  priority: string | null
  ai_suggestion: string | null
}

interface Props {
  transcriptId: string
  itemsCreated: number
  itemsUpdated: number
}

const PRIORITY_COLORS: Record<string, string> = {
  hoch: 'text-red-500',
  mittel: 'text-amber-500',
  niedrig: 'text-gray-300',
}

const STATUS_LABELS: Record<string, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
  abgeschlossen: 'Abgeschlossen',
}

function parseChange(item: LopItem): string | null {
  if (!item.ai_suggestion) return null
  try {
    const s = JSON.parse(item.ai_suggestion)
    const parts: string[] = []
    if (s.status) parts.push(`Status → ${STATUS_LABELS[s.status] ?? s.status}`)
    if (s.title) parts.push(`Umbenannt → „${s.title}"`)
    if (s.result) parts.push(s.result)
    return parts.length > 0 ? parts.join(' · ') : null
  } catch {
    return null
  }
}

export default function TranscriptChangesModal({ transcriptId, itemsCreated, itemsUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<{ created: LopItem[]; updated: LopItem[] } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleOpen() {
    setOpen(true)
    if (data) return
    setLoading(true)
    try {
      const res = await fetch(`/api/transcripts/${transcriptId}/changes`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  if (itemsCreated === 0 && itemsUpdated === 0) {
    return <span className="text-green-600">· 0 neu · 0 aktualisiert</span>
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="ml-2 text-green-600 hover:text-green-700 hover:underline underline-offset-2 transition-colors"
      >
        · {itemsCreated} neu · {itemsUpdated} aktualisiert
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">LOP-Änderungen</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
              {loading && <p className="text-sm text-gray-400 text-center py-8">Wird geladen…</p>}

              {!loading && data && (
                <>
                  {/* Created */}
                  {data.created.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        ✦ {data.created.length} neu
                      </h3>
                      <ul className="space-y-2">
                        {data.created.map(item => (
                          <li key={item.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-green-50 border border-green-100">
                            <span className={`mt-1 text-xs shrink-0 ${PRIORITY_COLORS[item.priority ?? 'mittel'] ?? ''}`}>●</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 leading-snug">{item.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {item.responsible && <span>{item.responsible}</span>}
                                {item.due_date && <span className="ml-2">{new Date(item.due_date).toLocaleDateString('de-DE')}</span>}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">{STATUS_LABELS[item.status] ?? item.status}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Updated */}
                  {data.updated.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        ↻ {data.updated.length} aktualisiert
                      </h3>
                      <ul className="space-y-2">
                        {data.updated.map(item => {
                          const change = parseChange(item)
                          return (
                            <li key={item.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                              <span className={`mt-1 text-xs shrink-0 ${PRIORITY_COLORS[item.priority ?? 'mittel'] ?? ''}`}>●</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 leading-snug">{item.title}</p>
                                {change && (
                                  <p className="text-xs text-blue-600 mt-0.5 font-medium">{change}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {item.responsible && <span>{item.responsible}</span>}
                                </p>
                              </div>
                              <span className="text-xs text-gray-400 shrink-0">{STATUS_LABELS[item.status] ?? item.status}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  )}

                  {data.created.length === 0 && data.updated.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">Keine Details verfügbar.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
