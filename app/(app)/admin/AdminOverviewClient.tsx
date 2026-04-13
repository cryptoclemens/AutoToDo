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

interface LopActivity {
  type: 'lop'
  id: string
  title: string
  status: string
  responsible: string | null
  actor: string | null
  workspace_name: string | null
  workspace_id: string
  timestamp: string
}

interface TranscriptActivity {
  type: 'transcript'
  id: string
  workspace_name: string | null
  workspace_id: string
  timestamp: string
}

interface WorkspaceActivity {
  type: 'workspace'
  id: string
  name: string
  timestamp: string
}

type ActivityItem = LopActivity | TranscriptActivity | WorkspaceActivity

interface ActivityData {
  lopActivity: LopActivity[]
  transcriptActivity: TranscriptActivity[]
  workspaceActivity: WorkspaceActivity[]
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

const STATUS_STYLES: Record<string, string> = {
  offen: 'bg-orange-50 text-orange-700',
  in_bearbeitung: 'bg-blue-50 text-blue-700',
  abgeschlossen: 'bg-green-50 text-green-700',
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function AdminOverviewClient() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/overview').then(r => r.json()),
      fetch('/api/admin/activity').then(r => r.json()),
    ]).then(([overview, act]) => {
      if (overview.error) { setError(overview.error); return }
      setData(overview)
      if (!act.error) setActivity(act)
    }).catch(() => setError('Fehler beim Laden.'))
  }, [])

  if (error) return <p className="text-red-600 text-sm">{error}</p>
  if (!data) return <p className="text-sm text-gray-400">Laden…</p>

  const planEntries = Object.entries(data.planCounts).sort((a, b) => b[1] - a[1])

  // Merge all activity into one timeline, sorted newest first
  const timeline: ActivityItem[] = [
    ...(activity?.lopActivity ?? []),
    ...(activity?.transcriptActivity ?? []),
    ...(activity?.workspaceActivity ?? []),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 30)

  return (
    <div className="space-y-8">
      {/* Workspaces */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Workspaces</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="Gesamt" value={data.totalWorkspaces} />
          <KpiCard label="Aktiv (30 Tage)" value={data.activeWorkspaces} sub="LOP-Aktivität" />
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

      {/* Aktivitäts-Feed */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Letzte Aktivitäten</h2>
        {activity === null ? (
          <p className="text-sm text-gray-400">Laden…</p>
        ) : timeline.length === 0 ? (
          <p className="text-sm text-gray-400">Keine Aktivitäten.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100 bg-gray-50/70">
                  <th className="px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Zeit</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Typ</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Details</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Workspace</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Nutzer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timeline.map(item => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                      {fmtDate(item.timestamp)}
                    </td>
                    <td className="px-4 py-2.5">
                      {item.type === 'lop' && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">LOP</span>
                      )}
                      {item.type === 'transcript' && (
                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Transkript</span>
                      )}
                      {item.type === 'workspace' && (
                        <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">Workspace</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 max-w-xs">
                      {item.type === 'lop' && (
                        <div>
                          <span className="text-gray-800 text-xs font-medium truncate block max-w-[240px]">{item.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_STYLES[item.status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                          {item.responsible && (
                            <span className="ml-1.5 text-xs text-gray-400">→ {item.responsible}</span>
                          )}
                        </div>
                      )}
                      {item.type === 'transcript' && (
                        <span className="text-xs text-gray-500">Neues Transkript hochgeladen</span>
                      )}
                      {item.type === 'workspace' && (
                        <span className="text-xs text-gray-800 font-medium">{item.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">
                      {item.type !== 'workspace' ? (item.workspace_name ?? '–') : '–'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">
                      {item.type === 'lop' ? (item.actor ?? item.responsible ?? '–') : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
