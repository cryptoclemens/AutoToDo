'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import BrandingForm from '@/app/(app)/settings/branding/BrandingForm'
import WorkspaceInviteForm from '@/app/(app)/settings/members/WorkspaceInviteForm'
import { LlmSettingsForm } from '@/app/(app)/settings/llm/LlmSettingsForm'
import ApiKeyList from '@/app/(app)/settings/api/ApiKeyList'
import { AccountSettings } from './AccountSettings'
import WebhooksSettings from './WebhooksSettings'
import AuditLog from './AuditLog'
import BillingTab from './BillingTab'
import NotionIntegrationForm from './NotionIntegrationForm'
import { AudioSettingsTab } from './AudioSettingsTab'
import { Plan } from '@/lib/plans'
import { BUNDESLAENDER } from '@/lib/holidays'

type Tab = 'konto' | 'workspace' | 'team' | 'ki' | 'api' | 'webhooks' | 'audit' | 'billing' | 'integrations' | 'audio'

const CHANGEABLE_ROLES = ['workspace_admin', 'project_admin', 'editor', 'viewer']

interface Member {
  user_id: string
  role: string
  joined_at: string
  email?: string
  display_name?: string
}

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  scope: string[]
  expires_at: string | null
  last_used_at: string | null
  created_at: string
  revoked_at: string | null
}

interface PendingInvitation {
  id: string
  email: string
  role: string
  created_at: string
  expires_at: string
  project_id: string | null
}

interface Props {
  userEmail: string
  isAdmin: boolean
  workspace: { id: string; name: string; brand_color: string; logo_url: string | null; digest_enabled: boolean; bundesland: string | null; plan?: string; plan_expires_at?: string | null }
  members: Member[]
  pendingInvitations: PendingInvitation[]
  llmInitial: {
    extraction: { configured: boolean; provider?: string; model?: string; endpoint?: string; apiKeyMasked?: string }
    transcription: { configured: boolean; provider?: string; model?: string; apiKeyMasked?: string }
  }
  apiKeys: ApiKey[]
  mollieEnabled: boolean
  billing?: {
    plan: Plan
    planExpiresAt: string | null
    seatCount: number
    projectCount: number
    transcriptsThisMonth: number
  }
  notionInitial: { configured: boolean; connectedAt: string | null }
  version?: string
}

const TAB_IDS: Array<{ id: Tab; adminOnly?: boolean }> = [
  { id: 'konto' },
  { id: 'workspace', adminOnly: true },
  { id: 'team', adminOnly: true },
  { id: 'billing', adminOnly: true },
  { id: 'ki', adminOnly: true },
  { id: 'integrations', adminOnly: true },
  { id: 'api', adminOnly: true },
  { id: 'webhooks', adminOnly: true },
  { id: 'audit', adminOnly: true },
  { id: 'audio' },
]

export function SettingsPageClient({ userEmail, isAdmin, workspace, members, pendingInvitations, llmInitial, apiKeys, mollieEnabled, billing, notionInitial, version }: Props) {
  const [tab, setTab] = useState<Tab>('konto')
  const ts = useTranslations('settings')

  // Read ?tab= param client-side after mount (useSearchParams is unreliable during SSR)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('tab') as Tab | null
    const valid = TAB_IDS.map(x => x.id)
    if (t && valid.includes(t)) setTab(t)
  }, [])
  const [digestEnabled, setDigestEnabled] = useState(workspace.digest_enabled)
  const [digestSaving, setDigestSaving] = useState(false)
  const [digestTestSending, setDigestTestSending] = useState(false)
  const [bundesland, setBundesland] = useState<string | null>(workspace.bundesland)
  const [bundeslandSaving, setBundeslandSaving] = useState(false)
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>(
    Object.fromEntries(members.map(m => [m.user_id, m.role]))
  )
  const [memberList, setMemberList] = useState(members)
  const [rolesSaving, setRolesSaving] = useState<Record<string, boolean>>({})
  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [invitations, setInvitations] = useState(pendingInvitations)
  const [revokingInvite, setRevokingInvite] = useState<string | null>(null)

  async function handleDigestToggle() {
    const next = !digestEnabled
    setDigestEnabled(next)
    setDigestSaving(true)
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digest_enabled: next }),
      })
      if (!res.ok) throw new Error()
      toast.success(ts('digestSaved', { status: next ? ts('digestStatusActive') : ts('digestStatusDisabled') }))
    } catch {
      setDigestEnabled(!next)
      toast.error(ts('digestError'))
    } finally {
      setDigestSaving(false)
    }
  }

  async function handleDigestTestSend() {
    setDigestTestSending(true)
    try {
      const res = await fetch('/api/settings/digest-test', { method: 'POST' })
      const data = await res.json() as { ok?: boolean; sentTo?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Unbekannter Fehler.')
      toast.success(`Test-E-Mail gesendet an ${data.sentTo}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Senden.')
    } finally {
      setDigestTestSending(false)
    }
  }

  async function handleBundeslandChange(value: string | null) {
    setBundesland(value)
    setBundeslandSaving(true)
    try {
      await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundesland: value }),
      })
    } finally {
      setBundeslandSaving(false)
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setRolesSaving(prev => ({ ...prev, [userId]: true }))
    try {
      const res = await fetch(`/api/settings/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) { toast.error(ts('roleError')); return }
      setMemberRoles(prev => ({ ...prev, [userId]: newRole }))
      toast.success(ts('roleSaved'))
    } finally {
      setRolesSaving(prev => ({ ...prev, [userId]: false }))
    }
  }

  async function handleRemoveMember(userId: string) {
    setRemovingMember(userId)
    try {
      const res = await fetch(`/api/settings/members/${userId}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Mitglied konnte nicht entfernt werden.'); return }
      setMemberList(prev => prev.filter(m => m.user_id !== userId))
      toast.success('Mitglied entfernt.')
    } finally {
      setRemovingMember(null)
    }
  }

  async function handleRevokeInvitation(invitationId: string) {
    setRevokingInvite(invitationId)
    try {
      const res = await fetch(`/api/invitations?id=${invitationId}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Einladung konnte nicht widerrufen werden.'); return }
      setInvitations(prev => prev.filter(i => i.id !== invitationId))
      toast.success('Einladung widerrufen.')
    } finally {
      setRevokingInvite(null)
    }
  }

  const visibleTabs = TAB_IDS.filter(t => !t.adminOnly || isAdmin)

  return (
    <div className="max-w-3xl">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{ts('title')}</h1>
        {version && (
          <span className="text-xs text-gray-400 font-mono">v{version}</span>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1 mb-8 w-fit">
        {visibleTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors whitespace-nowrap
              ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {ts(`tabs.${t.id}`)}
          </button>
        ))}
      </div>

      {/* Konto */}
      {tab === 'konto' && (
        <AccountSettings currentEmail={userEmail} />
      )}

      {/* Workspace Branding */}
      {tab === 'workspace' && isAdmin && (
        <div className="space-y-8">
          <div>
            <p className="text-sm text-gray-500 mb-6">{ts('workspaceDesc')}</p>
            <BrandingForm workspace={workspace} />
          </div>

          {/* E-Mail-Digest */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{ts('digestTitle')}</h3>
            <p className="text-xs text-gray-500 mb-4">{ts('digestDesc')}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={digestEnabled}
                disabled={digestSaving}
                onClick={handleDigestToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  digestEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                style={digestEnabled ? { backgroundColor: 'var(--brand, #2563EB)' } : {}}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                    digestEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">
                {ts('digestLabel')} {digestEnabled ? ts('digestActive') : ts('digestDisabled')}
              </span>
              <button
                type="button"
                onClick={handleDigestTestSend}
                disabled={digestTestSending}
                className="ml-4 text-xs text-blue-600 hover:underline disabled:opacity-50"
              >
                {digestTestSending ? 'Sende…' : 'Test-E-Mail senden'}
              </button>
            </div>
          </div>

          {/* Bundesland für Feiertage */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{ts('bundeslandTitle')}</h3>
            <p className="text-xs text-gray-500 mb-3">{ts('bundeslandDesc')}</p>
            <select
              value={bundesland ?? ''}
              onChange={e => handleBundeslandChange(e.target.value || null)}
              disabled={bundeslandSaving}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">{ts('bundeslandNone')}</option>
              {BUNDESLAENDER.map(bl => (
                <option key={bl.code} value={bl.code}>{bl.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Team */}
      {tab === 'team' && isAdmin && (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-2">{ts('teamCount', { count: memberList.length })}</p>
            <WorkspaceInviteForm workspaceId={workspace.id} />
          </div>

          {/* Aktive Mitglieder */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mitglieder</h3>
            <div className="space-y-2">
              {memberList.map(m => {
                const currentRole = memberRoles[m.user_id] ?? m.role
                const canChange = currentRole !== 'workspace_owner'
                return (
                  <Card key={m.user_id}>
                    <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 font-medium truncate">
                          {m.display_name ?? m.email ?? `${m.user_id.slice(0, 8)}…`}
                        </p>
                        {m.email && m.display_name && (
                          <p className="text-xs text-gray-400 truncate">{m.email}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">
                          {new Date(m.joined_at).toLocaleDateString('de-DE')}
                        </span>
                        {canChange ? (
                          <select
                            value={currentRole}
                            disabled={rolesSaving[m.user_id]}
                            onChange={e => handleRoleChange(m.user_id, e.target.value)}
                            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {CHANGEABLE_ROLES.map(r => (
                              <option key={r} value={r}>{ts(`changeableRoles.${r}`)}</option>
                            ))}
                          </select>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {ts(`roles.${currentRole}` as Parameters<typeof ts>[0]) ?? currentRole}
                          </Badge>
                        )}
                        {canChange && (
                          <button
                            onClick={() => handleRemoveMember(m.user_id)}
                            disabled={removingMember === m.user_id}
                            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 ml-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            title="Mitglied entfernen"
                          >
                            {removingMember === m.user_id ? '…' : 'Entfernen'}
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Ausstehende Einladungen */}
          {invitations.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Ausstehende Einladungen ({invitations.length})
              </h3>
              <div className="space-y-2">
                {invitations.map(inv => (
                  <Card key={inv.id} className="border-dashed border-amber-200 bg-amber-50/50">
                    <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 font-medium truncate">{inv.email}</p>
                        <p className="text-xs text-gray-400">
                          {inv.role}{inv.project_id ? ' · Projekteinladung' : ''} · läuft ab {new Date(inv.expires_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                          Ausstehend
                        </Badge>
                        <button
                          onClick={() => handleRevokeInvitation(inv.id)}
                          disabled={revokingInvite === inv.id}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          {revokingInvite === inv.id ? '…' : 'Widerrufen'}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Billing */}
      {tab === 'billing' && isAdmin && billing && (
        <BillingTab
          plan={billing.plan}
          planExpiresAt={billing.planExpiresAt}
          seatCount={billing.seatCount}
          projectCount={billing.projectCount}
          transcriptsThisMonth={billing.transcriptsThisMonth}
          mollieEnabled={mollieEnabled}
        />
      )}

      {/* KI-Konfiguration */}
      {tab === 'ki' && isAdmin && (
        <div>
          <p className="text-sm text-gray-500 mb-6">{ts('kiDesc')}</p>
          <LlmSettingsForm extractionInitial={llmInitial.extraction} transcriptionInitial={llmInitial.transcription} />
        </div>
      )}

      {/* API-Keys */}
      {tab === 'api' && isAdmin && (
        <div>
          <p className="text-sm text-gray-500 mb-6">{ts('apiDesc')}</p>
          <ApiKeyList initialKeys={apiKeys} />
        </div>
      )}

      {/* Webhooks */}
      {tab === 'webhooks' && isAdmin && (
        <WebhooksSettings />
      )}

      {/* Integrationen */}
      {tab === 'integrations' && isAdmin && (
        <div className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Notion</h2>
            <p className="text-xs text-gray-500 mb-6">
              Importiere Meeting-Notizen direkt aus Notion in AutoToDo. Die KI extrahiert daraus automatisch LOP-Punkte.
            </p>
            <NotionIntegrationForm initial={notionInitial} />
          </div>
        </div>
      )}

      {/* Audit-Log */}
      {tab === 'audit' && isAdmin && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-4">{ts('auditTitle')}</h3>
          <AuditLog />
        </div>
      )}

      {/* Audio-Einstellungen */}
      {tab === 'audio' && (
        <div>
          <p className="text-sm text-gray-500 mb-6">{ts('audioDesc')}</p>
          <AudioSettingsTab />
        </div>
      )}
    </div>
  )
}
