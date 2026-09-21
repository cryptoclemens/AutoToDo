'use client'

import { useState } from 'react'

interface Candidate { name: string; email: string | null; user_id: string | null }
interface SpeakerEntry {
  speaker_label: string
  matched_member: string | null
  matched_user_id?: string | null
  confidence: 'high' | 'medium' | 'low'
  source?: 'llm' | 'manual' | 'calendar'
}
interface SpeakersResponse {
  speakerMap: SpeakerEntry[]
  candidates: Candidate[]
  calendar: { title: string | null; starts_at: string | null; attendees: { name?: string | null; email?: string | null }[] } | null
  canEdit: boolean
}

const CONF_BADGE: Record<string, string> = {
  high: 'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-500 border-gray-200',
}
const SOURCE_LABEL: Record<string, string> = { llm: 'KI', manual: 'bestätigt', calendar: 'Kalender' }

function candidateValue(c: Candidate): string {
  return c.user_id ?? `n:${c.name}`
}

export default function SpeakerAssignModal({ transcriptId }: { transcriptId: string }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<SpeakersResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [icsBusy, setIcsBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  // speaker_label -> ausgewählter Wert (user_id | "n:Name" | "")
  const [sel, setSel] = useState<Record<string, string>>({})

  async function load() {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/transcripts/${transcriptId}/speakers`)
      if (!res.ok) { setError('Konnte nicht geladen werden.'); return }
      const d: SpeakersResponse = await res.json()
      setData(d)
      const initial: Record<string, string> = {}
      for (const e of d.speakerMap) {
        if (e.matched_user_id) initial[e.speaker_label] = e.matched_user_id
        else if (e.matched_member) {
          const c = d.candidates.find(k => k.name === e.matched_member)
          initial[e.speaker_label] = c ? candidateValue(c) : `n:${e.matched_member}`
        } else initial[e.speaker_label] = ''
      }
      setSel(initial)
    } finally { setLoading(false) }
  }

  function handleOpen() { setOpen(true); if (!data) load() }

  async function handleIcs(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIcsBusy(true); setError('')
    try {
      const ics = await file.text()
      const res = await fetch(`/api/transcripts/${transcriptId}/calendar-link`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ics }),
      })
      if (!res.ok) { setError((await res.json()).error ?? 'Kalender-Import fehlgeschlagen.'); return }
      await load() // Kandidaten neu laden (jetzt inkl. Teilnehmer)
    } finally { setIcsBusy(false); e.target.value = '' }
  }

  async function save() {
    if (!data) return
    setSaving(true); setError(''); setNotice('')
    try {
      const assignments = data.speakerMap.map(e => {
        const v = sel[e.speaker_label] ?? ''
        if (!v) return { speaker_label: e.speaker_label, matched_user_id: null, matched_member: null }
        if (v.startsWith('n:')) return { speaker_label: e.speaker_label, matched_member: v.slice(2) }
        return { speaker_label: e.speaker_label, matched_user_id: v }
      })
      const res = await fetch(`/api/transcripts/${transcriptId}/speakers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      })
      if (!res.ok) { setError((await res.json()).error ?? 'Speichern fehlgeschlagen.'); return }
      const body = await res.json().catch(() => ({}))
      const n = typeof body.responsibleUpdated === 'number' ? body.responsibleUpdated : 0
      if (n > 0) {
        setNotice(`Gespeichert · ${n} Verantwortliche${n === 1 ? 'r' : ''} aktualisiert.`)
        setTimeout(() => setOpen(false), 1400)
      } else {
        setOpen(false)
      }
    } finally { setSaving(false) }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 transition-colors"
      >
        Sprecher zuordnen
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Sprecher zuordnen</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {loading && <p className="text-sm text-gray-400 text-center py-8">Wird geladen…</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {notice && <p className="text-sm text-green-700">{notice}</p>}

              {!loading && data && (
                <>
                  {/* Kalender-Kontext */}
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                    {data.calendar ? (
                      <p className="text-xs text-gray-600">
                        📅 <span className="font-medium">{data.calendar.title ?? 'Meeting'}</span>
                        {' · '}{data.calendar.attendees.length} Teilnehmer aus Kalender
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Kein Kalender verknüpft. Teilnehmer aus einer .ics-Datei als Kandidaten hinzufügen:
                      </p>
                    )}
                    {data.canEdit && (
                      <label className="inline-flex items-center gap-2 mt-2 text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                        <input type="file" accept=".ics,text/calendar" className="hidden" onChange={handleIcs} disabled={icsBusy} />
                        {icsBusy ? 'Import läuft…' : (data.calendar ? '.ics ersetzen' : '.ics anhängen')}
                      </label>
                    )}
                  </div>

                  {/* Sprecher-Liste */}
                  {data.speakerMap.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">
                      Keine Sprecher im Transkript erkannt (keine Sprecherkennzeichnungen).
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {data.speakerMap.map(e => (
                        <li key={e.speaker_label} className="flex items-center gap-2">
                          <span className="text-sm text-gray-700 font-medium w-24 shrink-0 truncate" title={e.speaker_label}>
                            {e.speaker_label}
                          </span>
                          {data.canEdit ? (
                            <select
                              value={sel[e.speaker_label] ?? ''}
                              onChange={ev => setSel(s => ({ ...s, [e.speaker_label]: ev.target.value }))}
                              className="flex-1 h-8 text-sm border border-gray-200 rounded-lg px-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
                            >
                              <option value="">— nicht zugeordnet —</option>
                              {data.candidates.map(c => (
                                <option key={candidateValue(c)} value={candidateValue(c)}>
                                  {c.name}{c.user_id ? '' : ' (extern)'}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="flex-1 text-sm text-gray-600">{e.matched_member ?? '—'}</span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded-full border shrink-0 ${CONF_BADGE[e.confidence] ?? ''}`}>
                            {SOURCE_LABEL[e.source ?? 'llm'] ?? 'KI'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {data && data.canEdit && data.speakerMap.length > 0 && (
              <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">
                <button onClick={() => setOpen(false)} className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Abbrechen
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Speichert…' : 'Zuordnung speichern'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
