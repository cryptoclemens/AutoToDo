'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface FriendsCode {
  id: string
  code: string
  label: string | null
  created_at: string
  redeemed_at: string | null
  redeemed_by_user_id: string | null
  redeemed_workspace_id: string | null
  workspace_name: string | null
  redeemed_email: string | null
}

interface WorkspaceKpis {
  workspace: { id: string; name: string; slug: string; plan: string; created_at: string }
  kpis: {
    memberCount: number
    projectCount: number
    transcriptCount: number
    totalItems: number
    openCount: number
    doneCount: number
    overdueCount: number
    highPrioCount: number
    completionRate: number
  }
  weeklyActivity: { date: string; count: number }[]
  members: { user_id: string; role: string; email: string; display_name: string; last_sign_in: string | null; joined_at: string }[]
}

export default function SteuerungClient() {
  const [codes, setCodes] = useState<FriendsCode[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [kpis, setKpis] = useState<WorkspaceKpis | null>(null)
  const [kpisLoading, setKpisLoading] = useState(false)

  const loadCodes = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/friends-codes')
    if (res.ok) setCodes(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadCodes() }, [loadCodes])

  async function handleGenerate() {
    setGenerating(true)
    const res = await fetch('/api/admin/friends-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newLabel.trim() || null }),
    })
    if (res.ok) {
      const code = await res.json() as FriendsCode
      setCodes(prev => [{ ...code, workspace_name: null, redeemed_email: null }, ...prev])
      setNewLabel('')
      toast.success(`Code ${code.code} erstellt.`)
    } else {
      toast.error('Fehler beim Generieren.')
    }
    setGenerating(false)
  }

  async function handleCopy(code: string) {
    await navigator.clipboard.writeText(code)
    toast.success('Code kopiert.')
  }

  async function loadKpis(workspaceId: string) {
    setSelectedWorkspaceId(workspaceId)
    setKpisLoading(true)
    setKpis(null)
    const res = await fetch(`/api/admin/workspaces/${workspaceId}/kpis`)
    if (res.ok) setKpis(await res.json())
    else toast.error('KPIs konnten nicht geladen werden.')
    setKpisLoading(false)
  }

  const redeemed = codes.filter(c => c.redeemed_at)
  const available = codes.filter(c => !c.redeemed_at)

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Code generieren */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Neuen Friends-Code generieren</h2>
        <div className="flex gap-3">
          <Input
            placeholder="Bezeichnung (optional, z.B. Firma XYZ)"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            className="text-sm flex-1"
            onKeyDown={e => { if (e.key === 'Enter') handleGenerate() }}
          />
          <Button
            onClick={handleGenerate}
            disabled={generating}
            style={{ backgroundColor: 'var(--brand)' }}
            className="text-white rounded-lg shrink-0"
          >
            {generating ? 'Wird erstellt…' : '+ Code generieren'}
          </Button>
        </div>
      </div>

      {/* Verfügbare Codes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-semibold text-gray-900">
            Verfügbare Codes ({available.length})
          </h2>
        </div>
        {loading ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">Wird geladen…</div>
        ) : available.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">Noch keine Codes generiert.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-2.5 text-left">Code</th>
                <th className="px-6 py-2.5 text-left">Bezeichnung</th>
                <th className="px-6 py-2.5 text-left">Erstellt</th>
                <th className="px-6 py-2.5 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {available.map(c => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/70">
                  <td className="px-6 py-3 font-mono font-semibold text-gray-900 tracking-wider">{c.code}</td>
                  <td className="px-6 py-3 text-gray-500">{c.label ?? <span className="text-gray-300">–</span>}</td>
                  <td className="px-6 py-3 text-gray-400">{new Date(c.created_at).toLocaleDateString('de-DE')}</td>
                  <td className="px-6 py-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-gray-500 hover:text-blue-600"
                      onClick={() => handleCopy(c.code)}
                    >
                      Kopieren
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Eingelöste Codes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <h2 className="text-sm font-semibold text-gray-900">
            Eingelöste Codes ({redeemed.length})
          </h2>
        </div>
        {redeemed.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">Noch keine Codes eingelöst.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-2.5 text-left">Code</th>
                <th className="px-6 py-2.5 text-left">Account</th>
                <th className="px-6 py-2.5 text-left">Workspace</th>
                <th className="px-6 py-2.5 text-left">Eingelöst</th>
                <th className="px-6 py-2.5 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {redeemed.map(c => (
                <tr
                  key={c.id}
                  className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${selectedWorkspaceId === c.redeemed_workspace_id ? 'bg-blue-50/60' : ''}`}
                >
                  <td className="px-6 py-3 font-mono text-xs text-gray-500 tracking-wider">{c.code}</td>
                  <td className="px-6 py-3 text-gray-700">{c.redeemed_email ?? <span className="text-gray-300">–</span>}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{c.workspace_name ?? <span className="text-gray-300">–</span>}</td>
                  <td className="px-6 py-3 text-gray-400">{c.redeemed_at ? new Date(c.redeemed_at).toLocaleDateString('de-DE') : '–'}</td>
                  <td className="px-6 py-3">
                    {c.redeemed_workspace_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-blue-600 hover:bg-blue-50 font-medium"
                        onClick={() => loadKpis(c.redeemed_workspace_id!)}
                      >
                        KPIs ansehen →
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* KPI Panel */}
      {selectedWorkspaceId && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <h2 className="text-sm font-semibold text-blue-900">
                {kpis ? kpis.workspace.name : 'Wird geladen…'}
              </h2>
              {kpis && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-1">
                  {kpis.workspace.plan}
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-gray-400"
              onClick={() => { setSelectedWorkspaceId(null); setKpis(null) }}
            >
              ✕ Schließen
            </Button>
          </div>

          {kpisLoading ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">Wird geladen…</div>
          ) : kpis ? (
            <div className="p-6 space-y-6">
              {/* KPI-Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Mitglieder', value: kpis.kpis.memberCount, color: 'text-blue-700', bg: 'bg-blue-50' },
                  { label: 'Projekte', value: kpis.kpis.projectCount, color: 'text-violet-700', bg: 'bg-violet-50' },
                  { label: 'Transkripte', value: kpis.kpis.transcriptCount, color: 'text-amber-700', bg: 'bg-amber-50' },
                  { label: 'LOP-Punkte', value: kpis.kpis.totalItems, color: 'text-slate-700', bg: 'bg-slate-50' },
                ].map(k => (
                  <div key={k.label} className={`${k.bg} rounded-xl p-4`}>
                    <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Offen', value: kpis.kpis.openCount, color: 'text-blue-700', bg: 'bg-blue-50' },
                  { label: 'Überfällig', value: kpis.kpis.overdueCount, color: kpis.kpis.overdueCount > 0 ? 'text-red-700' : 'text-gray-400', bg: kpis.kpis.overdueCount > 0 ? 'bg-red-50' : 'bg-gray-50' },
                  { label: 'Erledigt', value: kpis.kpis.doneCount, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                  { label: 'Erledigungsrate', value: `${kpis.kpis.completionRate}%`, color: 'text-gray-700', bg: 'bg-gray-50' },
                ].map(k => (
                  <div key={k.label} className={`${k.bg} rounded-xl p-4`}>
                    <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Weekly Activity */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Aktivität (letzte 8 Wochen)</h3>
                <div className="flex items-end gap-1 h-16">
                  {kpis.weeklyActivity.map((w, i) => {
                    const max = Math.max(...kpis.weeklyActivity.map(x => x.count), 1)
                    const h = Math.round((w.count / max) * 48) + 4
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${w.date}: ${w.count} Items`}>
                        <div
                          className="w-full rounded-sm bg-blue-500 opacity-70 hover:opacity-100 transition-opacity"
                          style={{ height: `${h}px` }}
                        />
                        <span className="text-xs text-gray-300" style={{ fontSize: '9px' }}>
                          {new Date(w.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Members */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Mitglieder</h3>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/80 text-xs text-gray-400 uppercase tracking-wider">
                        <th className="px-4 py-2 text-left">Name / E-Mail</th>
                        <th className="px-4 py-2 text-left">Rolle</th>
                        <th className="px-4 py-2 text-left">Beigetreten</th>
                        <th className="px-4 py-2 text-left">Letzter Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpis.members.map(m => (
                        <tr key={m.user_id} className="border-b border-gray-100 last:border-0">
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-gray-900 text-xs">{m.display_name}</div>
                            <div className="text-xs text-gray-400">{m.email}</div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{m.role.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-400">{new Date(m.joined_at).toLocaleDateString('de-DE')}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-400">
                            {m.last_sign_in ? new Date(m.last_sign_in).toLocaleDateString('de-DE') : '–'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-xs text-gray-400">
                Workspace erstellt: {new Date(kpis.workspace.created_at).toLocaleDateString('de-DE')}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
