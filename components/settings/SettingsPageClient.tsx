'use client'

import { useState } from 'react'
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

type Tab = 'konto' | 'workspace' | 'team' | 'ki' | 'api' | 'webhooks' | 'audit'

const ROLE_LABELS: Record<string, string> = {
  workspace_owner: 'Inhaber',
  workspace_admin: 'Admin',
  project_admin: 'Projekt-Admin',
  editor: 'Editor',
  viewer: 'Betrachter',
}

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

interface Props {
  userEmail: string
  isAdmin: boolean
  workspace: { id: string; name: string; brand_color: string; logo_url: string | null; digest_enabled: boolean }
  members: Member[]
  llmInitial: {
    configured: boolean
    provider?: string
    model?: string
    endpoint?: string
    apiKeyMasked?: string
  }
  apiKeys: ApiKey[]
}

const TAB_IDS: Array<{ id: Tab; adminOnly?: boolean }> = [
  { id: 'konto' },
  { id: 'workspace', adminOnly: true },
  { id: 'team', adminOnly: true },
  { id: 'ki', adminOnly: true },
  { id: 'api', adminOnly: true },
  { id: 'webhooks', adminOnly: true },
  { id: 'audit', adminOnly: true },
]

export function SettingsPageClient({ userEmail, isAdmin, workspace, members, llmInitial, apiKeys }: Props) {
  const [tab, setTab] = useState<Tab>('konto')
  const ts = useTranslations('settings')
  const [digestEnabled, setDigestEnabled] = useState(workspace.digest_enabled)
  const [digestSaving, setDigestSaving] = useState(false)
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>(
    Object.fromEntries(members.map(m => [m.user_id, m.role]))
  )
  const [rolesSaving, setRolesSaving] = useState<Record<string, boolean>>({})

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
      toast.success(next ? 'Täglicher Digest aktiviert.' : 'Täglicher Digest deaktiviert.')
    } catch {
      setDigestEnabled(!next)
      toast.error('Fehler beim Speichern.')
    } finally {
      setDigestSaving(false)
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
      if (!res.ok) { toast.error('Fehler beim Speichern.'); return }
      setMemberRoles(prev => ({ ...prev, [userId]: newRole }))
      toast.success('Rolle aktualisiert.')
    } finally {
      setRolesSaving(prev => ({ ...prev, [userId]: false }))
    }
  }

  const visibleTabs = TAB_IDS.filter(t => !t.adminOnly || isAdmin)

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{ts('title')}</h1>

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
            </div>
          </div>
        </div>
      )}

      {/* Team */}
      {tab === 'team' && isAdmin && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-2">{ts('teamCount', { count: members.length })}</p>
          <WorkspaceInviteForm workspaceId={workspace.id} />
          <div className="space-y-2">
            {members.map(m => {
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
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {ROLE_LABELS[currentRole] ?? currentRole}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* KI-Konfiguration */}
      {tab === 'ki' && isAdmin && (
        <div>
          <p className="text-sm text-gray-500 mb-6">{ts('kiDesc')}</p>
          <LlmSettingsForm initial={llmInitial} />
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

      {/* Audit-Log */}
      {tab === 'audit' && isAdmin && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Aktivitätsverlauf</h3>
          <AuditLog />
        </div>
      )}
    </div>
  )
}
