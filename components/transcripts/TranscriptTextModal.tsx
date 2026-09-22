'use client'

import { useState, useCallback, useMemo } from 'react'

interface Props {
  transcriptId: string
  filename: string
}

interface DiarSeg { start: number; end: number; speaker_cluster: string; text: string }
interface SpeakerMapLite { speaker_label: string; matched_member: string | null }
interface TextResponse {
  text: string
  diarization: DiarSeg[] | null
  speakerMap: SpeakerMapLite[] | null
}

// Feste, gut unterscheidbare Farbpalette; je Cluster zyklisch nach erstem Auftreten.
const PALETTE = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#65a30d', '#dc2626']

interface SpeakerInfo { cluster: string; name: string; color: string }

/**
 * Baut die geordnete Sprecher-Liste (erstes Auftreten) mit aufgelöstem Anzeigenamen
 * (bestätigter Mitgliedsname aus speaker_map, sonst Cluster-Label) und stabiler Farbe.
 */
export function buildSpeakers(diar: DiarSeg[], speakerMap: SpeakerMapLite[] | null): Map<string, SpeakerInfo> {
  const nameByCluster = new Map<string, string>()
  for (const e of speakerMap ?? []) {
    if (e.matched_member) nameByCluster.set(e.speaker_label, e.matched_member)
  }
  const out = new Map<string, SpeakerInfo>()
  for (const seg of diar) {
    if (out.has(seg.speaker_cluster)) continue
    const color = PALETTE[out.size % PALETTE.length]
    out.set(seg.speaker_cluster, {
      cluster: seg.speaker_cluster,
      name: nameByCluster.get(seg.speaker_cluster) ?? seg.speaker_cluster,
      color,
    })
  }
  return out
}

export default function TranscriptTextModal({ transcriptId, filename }: Props) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<TextResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [view, setView] = useState<'speaker' | 'text'>('speaker')

  const handleOpen = useCallback(async () => {
    setOpen(true)
    if (data !== null || error !== null) return
    setLoading(true)
    try {
      const res = await fetch(`/api/transcripts/${transcriptId}/text`)
      const body = await res.json()
      if (!res.ok) { setError(body.error ?? 'Fehler beim Laden.'); return }
      setData({ text: body.text ?? '', diarization: body.diarization ?? null, speakerMap: body.speakerMap ?? null })
    } catch {
      setError('Fehler beim Laden des Transkripts.')
    } finally {
      setLoading(false)
    }
  }, [transcriptId, data, error])

  const hasDiar = !!(data?.diarization && data.diarization.length > 0)
  const speakers = useMemo(
    () => (hasDiar ? buildSpeakers(data!.diarization!, data!.speakerMap) : null),
    [hasDiar, data],
  )
  // Sprecheransicht nur zeigen, wenn Diarisierung vorhanden ist.
  const effectiveView: 'speaker' | 'text' = hasDiar ? view : 'text'

  const handleCopy = useCallback(() => {
    if (!data) return
    let toCopy = data.text
    if (effectiveView === 'speaker' && speakers) {
      toCopy = data.diarization!
        .map(s => `${speakers.get(s.speaker_cluster)?.name ?? s.speaker_cluster}: ${s.text}`)
        .join('\n')
    }
    navigator.clipboard.writeText(toCopy).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [data, effectiveView, speakers])

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
                <p className="text-xs text-gray-400 mt-0.5">
                  {hasDiar ? 'Transkript nach Sprecher' : 'Vollständiges Transkript'}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {hasDiar && (
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                    <button
                      onClick={() => setView('speaker')}
                      className={`px-2.5 py-1.5 transition-colors ${effectiveView === 'speaker' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      Nach Sprecher
                    </button>
                    <button
                      onClick={() => setView('text')}
                      className={`px-2.5 py-1.5 border-l border-gray-200 transition-colors ${effectiveView === 'text' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      Nur Text
                    </button>
                  </div>
                )}
                <button
                  onClick={handleCopy}
                  disabled={!data || loading}
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

            {/* Legende (nur Sprecheransicht) */}
            {effectiveView === 'speaker' && speakers && (
              <div className="flex flex-wrap gap-1.5 px-5 py-3 border-b border-gray-100 shrink-0">
                {Array.from(speakers.values()).map(sp => (
                  <span
                    key={sp.cluster}
                    className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border"
                    style={{ color: sp.color, borderColor: sp.color, backgroundColor: `${sp.color}14` }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sp.color }} />
                    {sp.name}
                  </span>
                ))}
              </div>
            )}

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
              ) : error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : effectiveView === 'speaker' && speakers && data ? (
                <div className="space-y-2.5">
                  {data.diarization!.map((seg, i) => {
                    const sp = speakers.get(seg.speaker_cluster)
                    const color = sp?.color ?? '#6b7280'
                    return (
                      <div
                        key={i}
                        className="pl-3 py-1 rounded-r"
                        style={{ borderLeft: `3px solid ${color}`, backgroundColor: `${color}0a` }}
                      >
                        <div className="text-xs font-medium mb-0.5" style={{ color }}>
                          {sp?.name ?? seg.speaker_cluster}
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{seg.text}</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                  {data?.text}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
