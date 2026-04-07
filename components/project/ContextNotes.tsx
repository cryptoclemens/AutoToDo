'use client'

import { useState, useEffect } from 'react'

interface ContextNote {
  id: string
  text: string
  category: 'availability' | 'decision' | 'risk' | 'info'
  relevant_from: string | null
  relevant_until: string | null
  created_at: string
}

const CATEGORY_CONFIG = {
  availability: { icon: '🗓', label: 'Verfügbarkeit', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
  decision:     { icon: '✓',  label: 'Entscheidung',  bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800' },
  risk:         { icon: '⚠',  label: 'Risiko',        bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800' },
  info:         { icon: 'ℹ',  label: 'Info',          bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-700' },
}

function isExpiredToday(relevant_until: string | null): boolean {
  if (!relevant_until) return false
  return new Date(relevant_until) < new Date(new Date().toDateString())
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}

interface Props {
  projectId: string
}

export default function ContextNotes({ projectId }: Props) {
  const [notes, setNotes] = useState<ContextNote[]>([])
  const [expanded, setExpanded] = useState(true)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/context-notes`)
      .then(r => r.ok ? r.json() : { notes: [] })
      .then(d => { setNotes(d.notes ?? []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [projectId])

  async function archive(noteId: string) {
    setNotes(prev => prev.filter(n => n.id !== noteId))
    await fetch(`/api/projects/${projectId}/context-notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId }),
    })
  }

  // Filter out expired notes (relevant_until in the past)
  const active = notes.filter(n => !isExpiredToday(n.relevant_until))

  if (!loaded || active.length === 0) return null

  // Today-relevant: notes where relevant_until >= today or no date
  const today = new Date().toISOString().slice(0, 10)
  const todayRelevant = active.filter(n => !n.relevant_until || n.relevant_until >= today)
  const upcoming = active.filter(n => n.relevant_until && n.relevant_until >= today)

  void upcoming // used implicitly via todayRelevant

  return (
    <div className="mb-5 rounded-2xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">Kontext</span>
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{active.length}</span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Notes list */}
      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {todayRelevant.map(note => {
            const cfg = CATEGORY_CONFIG[note.category] ?? CATEGORY_CONFIG.info
            return (
              <div key={note.id} className={`flex items-start gap-3 px-4 py-3 ${cfg.bg}`}>
                <span className="text-base shrink-0 mt-0.5">{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${cfg.text}`}>{note.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium ${cfg.text} opacity-70`}>{cfg.label}</span>
                    {note.relevant_until && (
                      <span className="text-xs text-gray-400">bis {formatDate(note.relevant_until)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => archive(note.id)}
                  className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
                  title="Erledigt / ausblenden"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
