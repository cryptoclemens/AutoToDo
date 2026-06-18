'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Redemption {
  id: string
  redeemed_at: string
  redeemed_email: string | null
  workspace_id: string | null
  workspace_name: string | null
}

interface FriendsCode {
  id: string
  code: string
  label: string | null
  created_at: string
  redeemed_at: string | null
  redeemed_by_user_id: string | null
  redeemed_workspace_id: string | null
  max_uses: number
  use_count: number
  workspace_name: string | null
  redeemed_email: string | null
  lopCount: number | null
  transcriptCount: number | null
  lastActivity: string | null
  redemptions: Redemption[]
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
  const [newMaxUses, setNewMaxUses] = useState(1)
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set())
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [kpis, setKpis] = useState<WorkspaceKpis | null>(null)
  const [kpisLoading, setKpisLoading] = useState(false)
  const [digestDiag, setDigestDiag] = useState<Record<string, unknown> | null>(null)
  const [digestTesting, setDigestTesting] = useState(false)
  const [respNames, setRespNames] = useState<{ name: string; count: number }[]>([])
  const [respFrom, setRespFrom] = useState('')
  const [respTo, setRespTo] = useState('')
  const [respMerging, setRespMerging] = useState(false)

  // Link freetext name to user account
  const [linkWorkspaces, setLinkWorkspaces] = useState<{ id: string; name: string }[]>([])
  const [linkWorkspaceId, setLinkWorkspaceId] = useState('')
  const [linkMembers, setLinkMembers] = useState<{ user_id: string; email: string; display_name: string; role: string }[]>([])
  const [linkMembersLoading, setLinkMembersLoading] = useState(false)
  const [linkFreetext, setLinkFreetext] = useState('')
  const [linkUserId, setLinkUserId] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkResult, setLinkResult] = useState<string | null>(null)

  const loadRespNames = useCallback(async () => {
    const res = await fetch('/api/admin/responsible-names')
    if (res.ok) setRespNames(await res.json())
  }, [])

  useEffect(() => { loadRespNames() }, [loadRespNames])

  const loadLinkWorkspaces = useCallback(async () => {
    const res = await fetch('/api/admin/link-responsible')
    if (res.ok) setLinkWorkspaces(await res.json())
  }, [])

  useEffect(() => { loadLinkWorkspaces() }, [loadLinkWorkspaces])

  const loadLinkMembers = useCallback(async (wsId: string) => {
    if (!wsId) { setLinkMembers([]); return }
    setLinkMembersLoading(true)
    const res = await fetch(`/api/admin/link-responsible?workspaceId=${wsId}`)
    if (res.ok) setLinkMembers(await res.json())
    setLinkMembersLoading(false)
  }, [])

  async function handleRespMerge() {
    if (!respFrom || !respTo || respFrom === respTo) return
    setRespMerging(true)
    const res = await fetch('/api/admin/responsible-names', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: respFrom, to: respTo }),
    })
    if (res.ok) {
      const { updated } = await res.json() as { updated: number }
      toast.success(`${updated} LOP-Punkte aktualisiert.`)
      setRespFrom('')
      setRespTo('')
      await loadRespNames()
    } else {
      toast.error('Zusammenführen fehlgeschlagen.')
    }
    setRespMerging(false)
  }

  async function handleLink() {
    if (!linkFreetext || !linkUserId || !linkWorkspaceId) return
    setLinking(true)
    setLinkResult(null)
    const res = await fetch('/api/admin/link-responsible', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freetext: linkFreetext, userId: linkUserId, workspaceId: linkWorkspaceId }),
    })
    if (res.ok) {
      const { updated, displayName } = await res.json() as { updated: number; displayName: string }
      toast.success(`${updated} LOP-Punkte mit „${displayName}" verknüpft.`)
      setLinkResult(`${updated} LOP-Punkte aktualisiert → Verantwortlicher: „${displayName}"`)
      setLinkFreetext('')
      setLinkUserId('')
      await loadRespNames()
    } else {
      toast.error('Verknüpfen fehlgeschlagen.')
    }
    setLinking(false)
  }

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
      body: JSON.stringify({ label: newLabel.trim() || null, max_uses: newMaxUses }),
    })
    if (res.ok) {
      const code = await res.json() as FriendsCode
      setCodes(prev => [{
        ...code,
        max_uses: newMaxUses,
        use_count: 0,
        workspace_name: null,
        redeemed_email: null,
        redemptions: [],
      }, ...prev])
      setNewLabel('')
      setNewMaxUses(1)
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

  function toggleExpand(id: string) {
    setExpandedCodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  async function handleDigestTest() {
    setDigestTesting(true)
    setDigestDiag(null)
    try {
      const res = await fetch('/api/admin/digest-test')
      const data = await res.json()
      setDigestDiag(data)
    } catch {
      toast.error('Diagnose fehlgeschlagen.')
    } finally {
      setDigestTesting(false)
    }
  }

  const available = codes.filter(c => c.use_count < c.max_uses)
  const redeemed = codes.filter(c => c.use_count >= c.max_uses)

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
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs text-gray-500 whitespace-nowrap">Max. Einlösungen</label>
            <Input
              type="number"
              min={1}
              max={100}
              value={newMaxUses}
              onChange={e => setNewMaxUses(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="text-sm w-16 text-center"
            />
          </div>
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
                <th className="px-6 py-2.5 text-left">Einlösungen</th>
                <th className="px-6 py-2.5 text-left">Erstellt</th>
                <th className="px-6 py-2.5 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {available.map(c => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/70">
                  <td className="px-6 py-3 font-mono font-semibold text-gray-900 tracking-wider">{c.code}</td>
                  <td className="px-6 py-3 text-gray-500">{c.label ?? <span className="text-gray-300">–</span>}</td>
                  <td className="px-6 py-3">
                    {c.max_uses === 1 ? (
                      <span className="text-xs text-gray-400">Einmalig</span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        c.use_count > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {c.use_count}/{c.max_uses} genutzt
                      </span>
                    )}
                  </td>
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
          <div className="px-6 py-8 text-center text-gray-400 text-sm">Noch keine Codes vollständig eingelöst.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-2.5 text-left">Code</th>
                <th className="px-6 py-2.5 text-left">Account / Workspace</th>
                <th className="px-6 py-2.5 text-left">Eingelöst</th>
                <th className="px-6 py-2.5 text-left">Nutzung</th>
                <th className="px-6 py-2.5 text-left">Letzte Aktivität</th>
                <th className="px-6 py-2.5 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {redeemed.map(c => {
                const isMulti = c.max_uses > 1
                const isActive = (c.lopCount ?? 0) > 0 || (c.transcriptCount ?? 0) > 0
                const isExpanded = expandedCodes.has(c.id)

                return (
                  <>
                    <tr
                      key={c.id}
                      className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${selectedWorkspaceId === c.redeemed_workspace_id ? 'bg-blue-50/60' : ''}`}
                    >
                      <td className="px-6 py-3 font-mono text-xs text-gray-500 tracking-wider">{c.code}</td>

                      {isMulti ? (
                        <td className="px-6 py-3">
                          <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                            {c.use_count} Nutzer / {c.use_count} Workspace{c.use_count !== 1 ? 's' : ''}
                          </span>
                        </td>
                      ) : (
                        <td className="px-6 py-3">
                          <div className="text-gray-700 text-xs">{c.redeemed_email ?? <span className="text-gray-300">–</span>}</div>
                          <div className="text-gray-400 text-xs">{c.workspace_name ?? ''}</div>
                        </td>
                      )}

                      <td className="px-6 py-3 text-gray-400 text-xs">
                        {isMulti
                          ? (c.redemptions[0] ? new Date(c.redemptions[0].redeemed_at).toLocaleDateString('de-DE') : '–')
                          : (c.redeemed_at ? new Date(c.redeemed_at).toLocaleDateString('de-DE') : '–')
                        }
                      </td>

                      <td className="px-6 py-3">
                        {isMulti ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {c.use_count}/{c.max_uses} eingelöst
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                              isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                              {isActive ? 'Aktiv' : 'Nicht genutzt'}
                            </span>
                            {c.lopCount !== null && (
                              <span className="text-xs text-gray-400">{c.lopCount} LOP · {c.transcriptCount} Transkripte</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-3 text-xs text-gray-400">
                        {!isMulti && (c.lastActivity ? new Date(c.lastActivity).toLocaleDateString('de-DE') : '–')}
                      </td>

                      <td className="px-6 py-3 flex items-center gap-1">
                        {isMulti ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-blue-600 hover:bg-blue-50 font-medium"
                            onClick={() => toggleExpand(c.id)}
                          >
                            {isExpanded ? 'Einklappen ↑' : 'Details ↓'}
                          </Button>
                        ) : (
                          c.redeemed_workspace_id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-blue-600 hover:bg-blue-50 font-medium"
                              onClick={() => loadKpis(c.redeemed_workspace_id!)}
                            >
                              KPIs →
                            </Button>
                          )
                        )}
                      </td>
                    </tr>

                    {/* Expandable sub-rows for multi-use codes */}
                    {isMulti && isExpanded && c.redemptions.map((r, i) => (
                      <tr key={r.id} className="bg-blue-50/30 border-b border-blue-50">
                        <td className="px-6 py-2.5 pl-10 text-xs text-gray-400">#{i + 1}</td>
                        <td className="px-6 py-2.5">
                          <div className="text-xs text-gray-700">{r.redeemed_email ?? <span className="text-gray-300">–</span>}</div>
                          <div className="text-xs text-gray-400">{r.workspace_name ?? ''}</div>
                        </td>
                        <td className="px-6 py-2.5 text-xs text-gray-400">
                          {new Date(r.redeemed_at).toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-6 py-2.5" />
                        <td className="px-6 py-2.5" />
                        <td className="px-6 py-2.5">
                          {r.workspace_id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs text-blue-600 hover:bg-blue-50"
                              onClick={() => loadKpis(r.workspace_id!)}
                            >
                              KPIs →
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                )
              })}
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

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Aktivität (letzte 8 Wochen)</h3>
                <div className="flex items-end gap-1 h-16">
                  {kpis.weeklyActivity.map((w, i) => {
                    const max = Math.max(...kpis.weeklyActivity.map(x => x.count), 1)
                    const h = Math.round((w.count / max) * 48) + 4
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${w.date}: ${w.count} Items`}>
                        <div className="w-full rounded-sm bg-blue-500 opacity-70 hover:opacity-100 transition-opacity" style={{ height: `${h}px` }} />
                        <span className="text-xs text-gray-300" style={{ fontSize: '9px' }}>
                          {new Date(w.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

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

      {/* Verantwortliche normalisieren */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Verantwortliche zusammenführen</h2>
        <p className="text-xs text-gray-400 mb-4">
          Namen-Aliase normalisieren – alle LOP-Punkte mit dem &quot;Von&quot;-Namen werden auf den &quot;Nach&quot;-Namen umgestellt.
        </p>

        {/* Namen-Übersicht */}
        {respNames.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {respNames.map(r => (
              <span
                key={r.name}
                className="inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full cursor-pointer hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                onClick={() => setRespFrom(prev => prev === r.name ? '' : r.name)}
                style={{ outline: respFrom === r.name ? '2px solid #3b82f6' : undefined }}
              >
                {r.name}
                <span className="text-gray-400 font-medium">{r.count}</span>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-36">
            <label className="text-xs text-gray-400">Von</label>
            <select
              value={respFrom}
              onChange={e => setRespFrom(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">– Name wählen –</option>
              {respNames.map(r => (
                <option key={r.name} value={r.name}>{r.name} ({r.count})</option>
              ))}
            </select>
          </div>
          <div className="pt-5 text-gray-400 text-lg">→</div>
          <div className="flex flex-col gap-1 flex-1 min-w-36">
            <label className="text-xs text-gray-400">Nach</label>
            <select
              value={respTo}
              onChange={e => setRespTo(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">– Ziel wählen –</option>
              {respNames.filter(r => r.name !== respFrom).map(r => (
                <option key={r.name} value={r.name}>{r.name} ({r.count})</option>
              ))}
            </select>
          </div>
          <div className="pt-5">
            <Button
              onClick={handleRespMerge}
              disabled={respMerging || !respFrom || !respTo}
              variant="outline"
              size="sm"
              className="rounded-lg border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40"
            >
              {respMerging ? 'Wird zusammengeführt…' : 'Zusammenführen'}
            </Button>
          </div>
        </div>

        {respFrom && respTo && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
            {respNames.find(r => r.name === respFrom)?.count ?? 0} LOP-Punkte werden von &quot;{respFrom}&quot; auf &quot;{respTo}&quot; umgestellt.
          </p>
        )}
      </div>

      {/* Name mit Account verknüpfen */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Name mit Account verknüpfen</h2>
        <p className="text-xs text-gray-400 mb-4">
          Freitext-Verantwortliche (z.B. &quot;Markus Wanzek&quot;) mit einem echten Supabase-Account verbinden.
          Setzt <code className="bg-gray-100 px-1 rounded">responsible_user_id</code> und aktualisiert den Anzeigenamen auf allen betroffenen LOP-Punkten.
        </p>

        <div className="space-y-4">
          {/* Workspace Selektor */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Workspace</label>
            <select
              value={linkWorkspaceId}
              onChange={e => {
                setLinkWorkspaceId(e.target.value)
                setLinkFreetext('')
                setLinkUserId('')
                setLinkResult(null)
                loadLinkMembers(e.target.value)
              }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">– Workspace wählen –</option>
              {linkWorkspaces.map(ws => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          </div>

          {linkWorkspaceId && (
            <div className="flex items-end gap-3 flex-wrap">
              {/* Freitext-Name Dropdown */}
              <div className="flex flex-col gap-1 flex-1 min-w-40">
                <label className="text-xs text-gray-400">Freitext-Verantwortlicher</label>
                <select
                  value={linkFreetext}
                  onChange={e => { setLinkFreetext(e.target.value); setLinkResult(null) }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">– Name wählen –</option>
                  {respNames.map(r => (
                    <option key={r.name} value={r.name}>{r.name} ({r.count})</option>
                  ))}
                </select>
              </div>

              <div className="pb-2 text-gray-400 text-lg shrink-0">→</div>

              {/* Account Dropdown */}
              <div className="flex flex-col gap-1 flex-1 min-w-40">
                <label className="text-xs text-gray-400">
                  Workspace-Mitglied
                  {linkMembersLoading && <span className="ml-1 text-gray-300">(lädt…)</span>}
                </label>
                <select
                  value={linkUserId}
                  onChange={e => { setLinkUserId(e.target.value); setLinkResult(null) }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  disabled={linkMembersLoading}
                >
                  <option value="">– Mitglied wählen –</option>
                  {linkMembers.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.display_name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pb-0.5">
                <Button
                  onClick={handleLink}
                  disabled={linking || !linkFreetext || !linkUserId}
                  size="sm"
                  className="rounded-lg text-white shrink-0 disabled:opacity-40"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  {linking ? 'Wird verknüpft…' : 'Verknüpfen'}
                </Button>
              </div>
            </div>
          )}

          {linkFreetext && linkUserId && !linkResult && (
            <p className="text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
              {respNames.find(r => r.name === linkFreetext)?.count ?? 0} LOP-Punkte werden mit dem gewählten Account verknüpft und der Freitext-Name wird auf den Account-Anzeigenamen aktualisiert.
            </p>
          )}

          {linkResult && (
            <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
              ✓ {linkResult}
            </p>
          )}
        </div>
      </div>

      {/* Digest-Diagnose */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">E-Mail-Digest Diagnose</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Simuliert den Versand (dry run) – es werden keine E-Mails verschickt.
              Cron läuft Mo–Fr um 16:00 UTC (= 18:00 CEST).
            </p>
          </div>
          <Button
            onClick={handleDigestTest}
            disabled={digestTesting}
            variant="outline"
            size="sm"
            className="rounded-lg shrink-0"
          >
            {digestTesting ? 'Teste…' : 'Digest testen (dry run)'}
          </Button>
        </div>

        {digestDiag && (
          <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
            {digestDiag.skipped ? (
              <p className="text-sm text-red-600 font-medium">
                ⚠ Übersprungen: {String(digestDiag.skipped)}
                <span className="block text-xs font-normal text-gray-500 mt-1">
                  → <strong>RESEND_API_KEY</strong> fehlt in der Server-Konfiguration (.env).
                </span>
              </p>
            ) : digestDiag.reason ? (
              <div>
                <p className="text-sm text-amber-700 font-medium">Keine E-Mails würden gesendet.</p>
                <p className="text-xs text-gray-500 mt-1">{String(digestDiag.reason)}</p>
                {digestDiag.debug != null && (
                  <pre className="text-xs text-gray-400 mt-2 bg-white p-2 rounded border border-gray-100 overflow-auto">
                    {JSON.stringify(digestDiag.debug, null, 2)}
                  </pre>
                )}
              </div>
            ) : digestDiag.dry_run ? (
              <div>
                <p className="text-sm text-green-700 font-medium">
                  ✓ Würde an {Number(digestDiag.total_users ?? 0)} Nutzer ({Number(digestDiag.total_items ?? 0)} Aufgaben) senden.
                </p>
                <ul className="mt-2 space-y-1">
                  {(digestDiag.would_send_to as Array<{ email: string; itemCount: number }> ?? []).map((r, i) => (
                    <li key={i} className="text-xs text-gray-600">
                      {r.email} – {r.itemCount} Aufgabe{r.itemCount !== 1 ? 'n' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <pre className="text-xs text-gray-500 overflow-auto">{JSON.stringify(digestDiag, null, 2)}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
