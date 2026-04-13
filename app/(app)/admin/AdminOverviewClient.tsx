'use client'

import { useEffect, useState } from 'react'

interface OverviewData {
  totalWorkspaces: number
  planCounts: Record<string, number>
  activeWorkspaces: number
  newWorkspacesMonth: number
  totalUsers: number
  newUsersMonth: number
  activeUsersMonth: number
  totalTranscripts: number
  totalLopItems: number
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminOverviewClient() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/overview')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Fehler beim Laden.'))
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-sm text-gray-400">Laden…</p>

  const planEntries = Object.entries(data.planCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-8">
      {/* Workspaces */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Workspaces</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="Gesamt" value={data.totalWorkspaces} />
          <KpiCard label="Aktiv (30 Tage)" value={data.activeWorkspaces} sub="lop_item Aktivität" />
          <KpiCard label="Neu (diesen Monat)" value={data.newWorkspacesMonth} />
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Pläne</p>
            {planEntries.length === 0
              ? <p className="text-sm text-gray-400">–</p>
              : planEntries.map(([plan, count]) => (
                <div key={plan} className="flex justify-between items-center text-sm py-0.5">
                  <span className="text-gray-600 capitalize">{plan}</span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))
            }
          </div>
        </div>
      </section>

      {/* Nutzer */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Nutzer</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <KpiCard label="Gesamt" value={data.totalUsers} />
          <KpiCard label="Neu (diesen Monat)" value={data.newUsersMonth} />
          <KpiCard label="Aktiv (30 Tage)" value={data.activeUsersMonth} sub="letzter Login" />
        </div>
      </section>

      {/* Inhalte */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Inhalte</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <KpiCard label="Transkripte" value={data.totalTranscripts} />
          <KpiCard label="LOP-Punkte" value={data.totalLopItems} />
        </div>
      </section>
    </div>
  )
}
