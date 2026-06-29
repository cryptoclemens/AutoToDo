'use client'

import { useState, useEffect, useRef } from 'react'

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

// Higher = shown first
const IMPORTANCE: Record<string, number> = { risk: 4, decision: 3, availability: 2, info: 1 }

const MAX_VISIBLE = 10
const MAX_TEXT_LEN = 120

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
  const [expanded, setExpanded] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [expandedTexts, setExpandedTexts] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)
  const [autoArchived, setAutoArchived] = useState(0)
  const [reviewedAt, setReviewedAt] = useState<string | null>(null)
  const [confirmingReview, setConfirmingReview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/context-notes`)
      .then(r => r.ok ? r.json() : { notes: [] })
      .then(d => {
        setNotes(d.notes ?? [])
        setReviewedAt(d.reviewedAt ?? null)
        setLoaded(true)
        if (d.autoArchived > 0) {
          setAutoArchived(d.autoArchived)
          setTimeout(() => setAutoArchived(0), 4000)
        }
      })
      .catch(() => setLoaded(true))
  }, [projectId])

  // F-23: Aktualität des Kontext-Bereichs – Hinweis, wenn seit ≥ 7 Tagen nicht geprüft
  const REVIEW_STALE_DAYS = 7
  const reviewAgeDays = reviewedAt
    ? Math.floor((Date.now() - new Date(reviewedAt).getTime()) / 86_400_000)
    : null
  const reviewStale = reviewAgeDays === null || reviewAgeDays >= REVIEW_STALE_DAYS

  async function confirmReview() {
    setConfirmingReview(true)
    const res = await fetch(`/api/projects/${projectId}/context-notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmReview: true }),
    })
    if (res.ok) {
      const d = await res.json()
      setReviewedAt(d.reviewedAt ?? new Date().toISOString())
    }
    setConfirmingReview(false)
  }

  useEffect(() => {
    if (editingId && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [editingId])

  async function archive(noteId: string) {
    setNotes(prev => prev.filter(n => n.id !== noteId))
    await fetch(`/api/projects/${projectId}/context-notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId }),
    })
  }

  function startEdit(note: ContextNote) {
    setEditingId(note.id)
    setEditText(note.text)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditText('')
  }

  async function saveEdit(noteId: string) {
    const text = editText.trim()
    if (!text) return
    setSaving(true)
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, text } : n))
    setEditingId(null)
    await fetch(`/api/projects/${projectId}/context-notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId, text }),
    })
    setSaving(false)
  }

  // Filter expired notes
  const active = notes.filter(n => !isExpiredToday(n.relevant_until))

  if (!loaded || active.length === 0) return null

  // Sort: importance desc → closest deadline first → most recent first
  const sorted = [...active].sort((a, b) => {
    const imp = (IMPORTANCE[b.category] ?? 1) - (IMPORTANCE[a.category] ?? 1)
    if (imp !== 0) return imp
    if (a.relevant_until && b.relevant_until) return a.relevant_until.localeCompare(b.relevant_until)
    if (a.relevant_until) return -1
    if (b.relevant_until) return 1
    return b.created_at.localeCompare(a.created_at)
  })

  const hasMore = sorted.length > MAX_VISIBLE
  const visible = showAll ? sorted : sorted.slice(0, MAX_VISIBLE)

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
          {autoArchived > 0 && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 animate-pulse">
              {autoArchived} abgelaufen bereinigt
            </span>
          )}
          {reviewStale && (
            <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
              Aktualität prüfen
            </span>
          )}
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
          {/* F-23: Aktualitäts-Hinweis + Bestätigung */}
          {reviewStale && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-50">
              <span className="text-base shrink-0">🕑</span>
              <p className="flex-1 text-xs text-orange-800 leading-snug">
                {reviewAgeDays === null
                  ? 'Der Kontext wurde noch nie auf Aktualität geprüft. Bitte sieh die Einträge durch und entferne Veraltetes.'
                  : `Der Kontext wurde seit ${reviewAgeDays} Tagen nicht geprüft. Bitte sieh die Einträge durch und entferne Veraltetes.`}
              </p>
              <button
                onClick={confirmReview}
                disabled={confirmingReview}
                className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 font-medium transition-colors"
              >
                {confirmingReview ? '…' : 'Als aktuell bestätigen'}
              </button>
            </div>
          )}
          {visible.map(note => {
            const cfg = CATEGORY_CONFIG[note.category] ?? CATEGORY_CONFIG.info
            const isEditing = editingId === note.id

            return (
              <div key={note.id} className={`flex items-start gap-3 px-4 py-3 ${cfg.bg}`}>
                <span className="text-base shrink-0 mt-0.5">{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <textarea
                        ref={textareaRef}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        rows={3}
                        className={`w-full text-sm rounded border px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 ${cfg.text} bg-white border-gray-300`}
                        onKeyDown={e => {
                          if (e.key === 'Escape') cancelEdit()
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEdit(note.id)
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(note.id)}
                          disabled={saving}
                          className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Speichern
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-xs px-2 py-0.5 rounded border border-gray-300 text-gray-500 hover:bg-gray-50"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const isLong = note.text.length > MAX_TEXT_LEN
                        const isTextExpanded = expandedTexts.has(note.id)
                        const displayText = isLong && !isTextExpanded
                          ? note.text.slice(0, MAX_TEXT_LEN).trimEnd() + '…'
                          : note.text
                        return (
                          <>
                            <p className={`text-sm leading-snug ${cfg.text}`}>
                              {displayText}
                              {isLong && (
                                <button
                                  onClick={() => setExpandedTexts(prev => {
                                    const next = new Set(prev)
                                    if (isTextExpanded) next.delete(note.id)
                                    else next.add(note.id)
                                    return next
                                  })}
                                  className="ml-1 text-xs underline opacity-60 hover:opacity-100"
                                >
                                  {isTextExpanded ? 'weniger' : 'mehr'}
                                </button>
                              )}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs font-medium ${cfg.text} opacity-70`}>{cfg.label}</span>
                              {note.relevant_until && (
                                <span className="text-xs text-gray-400">bis {formatDate(note.relevant_until)}</span>
                              )}
                            </div>
                          </>
                        )
                      })()}
                    </>
                  )}
                </div>
                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {/* Edit button */}
                    <button
                      onClick={() => startEdit(note)}
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                      title="Bearbeiten"
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M9 2l2 2-7 7H2V9l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {/* Archive button */}
                    <button
                      onClick={() => archive(note.id)}
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                      title="Erledigt / ausblenden"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {/* Show more / less toggle */}
          {hasMore && (
            <button
              onClick={() => setShowAll(s => !s)}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {showAll ? `Weniger anzeigen` : `${sorted.length - MAX_VISIBLE} weitere anzeigen`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
