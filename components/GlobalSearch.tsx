'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import type { SearchResult } from '@/app/api/lop/search/route'

const STATUS_LABELS: Record<string, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
  geparkt: 'Geparkt',
}

const STATUS_COLORS: Record<string, string> = {
  offen: 'bg-gray-100 text-gray-600',
  in_bearbeitung: 'bg-blue-100 text-blue-700',
  geparkt: 'bg-yellow-100 text-yellow-700',
}

export default function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Cmd+K / Ctrl+K öffnet Suche
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQ(''); setResults([]) }
  }, [open])

  const search = useCallback((query: string) => {
    clearTimeout(debounceRef.current)
    if (query.length < 2) { setResults([]); return }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/lop/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data: { results: SearchResult[] } = await res.json()
          setResults(data.results)
        }
      } finally {
        setLoading(false)
      }
    }, 200)
  }, [])

  useEffect(() => { search(q) }, [q, search])

  function goTo(projectId: string) {
    router.push(`/projects/${projectId}`)
    setOpen(false)
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      title="Suchen (⌘K)"
      className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <span className="text-xs">Suche</span>
      <kbd className="hidden lg:inline ml-1 text-[10px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded">⌘K</kbd>
    </button>
  )

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] p-4">
      <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 shrink-0">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="LOP-Punkte durchsuchen…"
            className="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
          {loading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />}
          <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">Esc</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-[50vh] overflow-y-auto py-2">
            {results.map(r => (
              <li key={r.id}>
                <button
                  onClick={() => goTo(r.project_id)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {r.project_name}
                        {r.responsible && <> · {r.responsible}</>}
                        {r.due_date && <> · {new Date(r.due_date).toLocaleDateString('de-DE')}</>}
                      </p>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {q.length >= 2 && !loading && results.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">Keine Ergebnisse für „{q}"</p>
        )}

        {q.length < 2 && (
          <p className="px-4 py-6 text-xs text-gray-400 text-center">Mindestens 2 Zeichen eingeben</p>
        )}
      </div>
    </div>,
    document.body
  )
}
