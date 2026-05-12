'use client'

import { useEffect, useState } from 'react'

interface FeedbackRow {
  id: string
  message: string
  category: string
  status: string
  created_at: string
  workspace_name: string | null
  user_email: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Allgemein',
  bug: 'Fehler',
  feature: 'Feature-Wunsch',
  other: 'Sonstiges',
}

const CATEGORY_STYLES: Record<string, string> = {
  bug: 'bg-red-50 text-red-700',
  feature: 'bg-blue-50 text-blue-700',
  general: 'bg-gray-100 text-gray-600',
  other: 'bg-amber-50 text-amber-700',
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Neu', style: 'bg-violet-50 text-violet-700' },
  { value: 'in_review', label: 'In Prüfung', style: 'bg-amber-50 text-amber-700' },
  { value: 'done', label: 'Erledigt', style: 'bg-green-50 text-green-700' },
  { value: 'rejected', label: 'Abgelehnt', style: 'bg-gray-100 text-gray-500' },
]

function getStatusStyle(status: string) {
  return STATUS_OPTIONS.find(o => o.value === status)?.style ?? 'bg-gray-100 text-gray-500'
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminFeedbackClient() {
  const [rows, setRows] = useState<FeedbackRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/feedback')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setRows(d)
        else setError(d.error ?? 'Fehler beim Laden.')
      })
      .catch(() => setError('Netzwerkfehler.'))
  }, [])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      }
    } finally {
      setUpdating(null)
    }
  }

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (rows.length === 0 && !error) return <p className="text-sm text-gray-400">Laden…</p>

  const filtered = filter === 'all' ? rows : rows.filter(r => r.status === filter)

  const counts = STATUS_OPTIONS.reduce<Record<string, number>>((acc, o) => {
    acc[o.value] = rows.filter(r => r.status === o.value).length
    return acc
  }, {})

  return (
    <div>
      {/* Filter-Tabs */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Alle ({rows.length})
        </button>
        {STATUS_OPTIONS.map(o => (
          <button
            key={o.value}
            onClick={() => setFilter(o.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === o.value ? 'bg-gray-900 text-white' : `${o.style} hover:opacity-80`
            }`}
          >
            {o.label} ({counts[o.value] ?? 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400">Keine Einträge.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(row => (
            <div key={row.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_STYLES[row.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {CATEGORY_LABELS[row.category] ?? row.category}
                    </span>
                    <span className="text-xs text-gray-400">{fmtDate(row.created_at)}</span>
                    {row.workspace_name && (
                      <span className="text-xs text-gray-400">· {row.workspace_name}</span>
                    )}
                    {row.user_email && (
                      <span className="text-xs text-gray-400">· {row.user_email}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{row.message}</p>
                </div>

                {/* Status-Dropdown */}
                <div className="flex-shrink-0">
                  <select
                    value={row.status}
                    disabled={updating === row.id}
                    onChange={e => updateStatus(row.id, e.target.value)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${getStatusStyle(row.status)}`}
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
