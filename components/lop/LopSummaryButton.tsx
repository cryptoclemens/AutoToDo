'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

export default function LopSummaryButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    setSummary(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/summarize`, { method: 'POST' })
      const data: { summary?: string; error?: string } = await res.json()
      if (!res.ok) { setError(data.error ?? 'Fehler beim Generieren.'); return }
      setSummary(data.summary ?? '')
    } catch {
      setError('Netzwerkfehler. Bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center h-7 gap-1 px-2.5 text-[0.8rem] font-medium border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors disabled:opacity-60"
      >
        {loading ? (
          <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span>✦</span>
        )}
        KI-Zusammenfassung
      </button>

      {(summary !== null || error) && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => { setSummary(null); setError(null) }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <span>✦</span> KI-Zusammenfassung
              </h2>
              <button
                onClick={() => { setSummary(null); setError(null) }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >✕</button>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
            )}
            {summary && (
              <>
                <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
                <p className="text-xs text-gray-400 mt-4">Generiert aus den aktuell offenen LOP-Punkten · Nicht speichern</p>
              </>
            )}

            <div className="flex justify-end gap-2 mt-5">
              {summary && (
                <button
                  onClick={generate}
                  disabled={loading}
                  className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 disabled:opacity-60"
                >
                  Neu generieren
                </button>
              )}
              <button
                onClick={() => { setSummary(null); setError(null) }}
                className="text-sm bg-gray-900 text-white rounded-lg px-4 py-1.5 hover:bg-gray-700"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
