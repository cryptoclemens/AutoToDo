'use client'

import { useState, useEffect } from 'react'

const CHANGE_LABELS: Record<string, string> = {
  ai_create: 'KI erstellt',
  ai_update: 'KI aktualisiert',
  manual_edit: 'Manuell bearbeitet',
  status_change: 'Status geändert',
  api_update: 'API-Update',
}

interface AuditEntry {
  id: string
  item_id: string
  changed_by: string
  change_type: string
  new_values: Record<string, string | null | undefined> | null
  created_at: string
  lop_items: {
    title: string
    project_id: string
    projects: { name: string }
  } | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/audit')
      .then(r => r.json())
      .then(d => { setEntries(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-gray-400">Lädt…</p>

  if (entries.length === 0) {
    return <p className="text-sm text-gray-400">Noch keine Aktivitäten aufgezeichnet.</p>
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-3">Die letzten 100 Änderungen im Workspace.</p>
      <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
        {entries.map(entry => (
          <div key={entry.id} className="flex items-start justify-between px-4 py-3 bg-white hover:bg-gray-50 gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-700 bg-gray-100 rounded px-1.5 py-0.5">
                  {CHANGE_LABELS[entry.change_type] ?? entry.change_type}
                </span>
                {entry.new_values?.status && (
                  <span className="text-xs text-blue-600">→ {entry.new_values.status}</span>
                )}
              </div>
              <p className="text-sm text-gray-800 mt-0.5 truncate">
                {entry.lop_items?.title ?? `Punkt ${entry.item_id.slice(0, 8)}`}
              </p>
              {entry.lop_items?.projects?.name && (
                <p className="text-xs text-gray-400">{entry.lop_items.projects.name}</p>
              )}
            </div>
            <time className="text-xs text-gray-400 shrink-0 mt-0.5">{formatDate(entry.created_at)}</time>
          </div>
        ))}
      </div>
    </div>
  )
}
