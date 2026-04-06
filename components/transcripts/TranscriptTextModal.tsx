'use client'

import { useState, useCallback } from 'react'

interface Props {
  transcriptId: string
  filename: string
}

export default function TranscriptTextModal({ transcriptId, filename }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleOpen = useCallback(async () => {
    setOpen(true)
    if (text !== null) return
    setLoading(true)
    try {
      const res = await fetch(`/api/transcripts/${transcriptId}/text`)
      const data = await res.json()
      setText(res.ok ? data.text : `Fehler: ${data.error}`)
    } catch {
      setText('Fehler beim Laden des Transkripts.')
    } finally {
      setLoading(false)
    }
  }, [transcriptId, text])

  const handleCopy = useCallback(() => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [text])

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
      >
        Transkript anzeigen
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{filename}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Vollständiges Transkript</p>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <button
                  onClick={handleCopy}
                  disabled={!text || loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  {copied ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Kopiert
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <rect x="4" y="4" width="8" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M9 4V2.5A.5.5 0 0 0 8.5 2h-7A.5.5 0 0 0 1 2.5v7a.5.5 0 0 0 .5.5H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      Kopieren
                    </>
                  )}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                  <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity=".25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Wird geladen…
                </div>
              ) : (
                <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                  {text}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
