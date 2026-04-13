'use client'

import { useEffect, useState } from 'react'

interface WorkspaceRow {
  id: string
  name: string
  slug: string
  plan: string
  created_at: string
  memberCount: number
  projectCount: number
  lopCount: number
  transcriptCount: number
  lastActivity: string | null
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '–'
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AdminWorkspacesClient() {
  const [rows, setRows] = useState<WorkspaceRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/workspaces-list')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setRows(d)
        else setError(d.error ?? 'Fehler beim Laden.')
      })
      .catch(() => setError('Netzwerkfehler.'))
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Workspace suchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="ml-3 text-xs text-gray-400">{filtered.length} Workspaces</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">Laden…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="pb-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                <th className="pb-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Plan</th>
                <th className="pb-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Mitglieder</th>
                <th className="pb-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Projekte</th>
                <th className="pb-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">LOP</th>
                <th className="pb-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Transkripte</th>
                <th className="pb-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Erstellt</th>
                <th className="pb-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Letzte Aktivität</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(ws => (
                <tr key={ws.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 pr-4">
                    <span className="font-medium text-gray-900">{ws.name}</span>
                    <span className="ml-1.5 text-gray-400 text-xs">{ws.slug}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      ws.plan === 'pro' ? 'bg-blue-50 text-blue-700' :
                      ws.plan === 'beta' ? 'bg-purple-50 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {ws.plan}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right text-gray-700">{ws.memberCount}</td>
                  <td className="py-2.5 pr-4 text-right text-gray-700">{ws.projectCount}</td>
                  <td className="py-2.5 pr-4 text-right text-gray-700">{ws.lopCount}</td>
                  <td className="py-2.5 pr-4 text-right text-gray-700">{ws.transcriptCount}</td>
                  <td className="py-2.5 pr-4 text-gray-500">{fmt(ws.created_at)}</td>
                  <td className="py-2.5 text-gray-500">{fmt(ws.lastActivity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
