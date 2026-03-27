'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import BrandingForm from '@/app/(app)/settings/branding/BrandingForm'
import WorkspaceInviteForm from '@/app/(app)/settings/members/WorkspaceInviteForm'
import { LlmSettingsForm } from '@/app/(app)/settings/llm/LlmSettingsForm'
import ApiKeyList from '@/app/(app)/settings/api/ApiKeyList'
import { AccountSettings } from './AccountSettings'

type Tab = 'konto' | 'workspace' | 'team' | 'ki' | 'api'

const ROLE_LABELS: Record<string, string> = {
  workspace_owner: 'Inhaber',
  workspace_admin: 'Admin',
  project_admin: 'Projekt-Admin',
  editor: 'Editor',
  viewer: 'Betrachter',
}

interface Member {
  user_id: string
  role: string
  joined_at: string
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
  workspace: { id: string; name: string; brand_color: string; logo_url: string | null }
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

const TABS: Array<{ id: Tab; label: string; adminOnly?: boolean }> = [
  { id: 'konto', label: 'Konto' },
  { id: 'workspace', label: 'Workspace', adminOnly: true },
  { id: 'team', label: 'Team', adminOnly: true },
  { id: 'ki', label: 'KI-Konfiguration', adminOnly: true },
  { id: 'api', label: 'API-Keys', adminOnly: true },
]

export function SettingsPageClient({ userEmail, isAdmin, workspace, members, llmInitial, apiKeys }: Props) {
  const [tab, setTab] = useState<Tab>('konto')

  const visibleTabs = TABS.filter(t => !t.adminOnly || isAdmin)

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Einstellungen</h1>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-8 w-fit">
        {visibleTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors whitespace-nowrap
              ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Konto */}
      {tab === 'konto' && (
        <AccountSettings currentEmail={userEmail} />
      )}

      {/* Workspace Branding */}
      {tab === 'workspace' && isAdmin && (
        <div>
          <p className="text-sm text-gray-500 mb-6">Logo und Akzentfarbe deines Workspaces anpassen.</p>
          <BrandingForm workspace={workspace} />
        </div>
      )}

      {/* Team */}
      {tab === 'team' && isAdmin && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-2">{members.length} Mitglieder in diesem Workspace</p>
          <WorkspaceInviteForm workspaceId={workspace.id} />
          <div className="space-y-2">
            {members.map(m => (
              <Card key={m.user_id}>
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <span className="text-sm text-gray-700 font-mono">{m.user_id.slice(0, 8)}…</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {new Date(m.joined_at).toLocaleDateString('de-DE')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {ROLE_LABELS[m.role] ?? m.role}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* KI-Konfiguration */}
      {tab === 'ki' && isAdmin && (
        <div>
          <p className="text-sm text-gray-500 mb-6">
            Hinterlegen Sie Ihren eigenen API-Key (BYOK). Ihre Transkripte werden direkt an den gewählten Anbieter geschickt.
          </p>
          <LlmSettingsForm initial={llmInitial} />
        </div>
      )}

      {/* API-Keys */}
      {tab === 'api' && isAdmin && (
        <div>
          <p className="text-sm text-gray-500 mb-6">
            Erstelle API-Keys für den programmatischen Zugriff auf AutoToDo.
          </p>
          <ApiKeyList initialKeys={apiKeys} />
        </div>
      )}
    </div>
  )
}
