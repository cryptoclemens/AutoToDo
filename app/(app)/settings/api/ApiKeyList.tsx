'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

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
  initialKeys: ApiKey[]
}

export default function ApiKeyList({ initialKeys }: Props) {
  const ts = useTranslations('settings')
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newScope, setNewScope] = useState<'read' | 'write'>('read')
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, scope: [newScope] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Fehler')
      setNewKey(data.key)
      setKeys(prev => [data, ...prev])
      setNewName('')
      setShowForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(id: string, name: string) {
    if (!confirm(ts('apiKeys.revokeConfirm', { name }))) return
    const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setKeys(prev => prev.map(k => k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k))
      toast.success(ts('apiKeys.revokeSuccess'))
    } else {
      toast.error(ts('apiKeys.revokeError'))
    }
  }

  async function copyKey(key: string) {
    await navigator.clipboard.writeText(key)
    toast.success(ts('apiKeys.copied'))
  }

  return (
    <div className="space-y-4">
      {/* Neuer Key anzeigen */}
      {newKey && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-green-800">
            {ts('apiKeys.newKeyBanner')}
          </p>
          <div className="flex items-center gap-2 bg-white border border-green-300 rounded-lg px-3 py-2">
            <code className="text-xs text-gray-800 flex-1 break-all">{newKey}</code>
            <Button size="sm" variant="outline" className="shrink-0 text-xs h-6" onClick={() => copyKey(newKey)}>
              {ts('apiKeys.copyKey')}
            </Button>
          </div>
          <Button size="sm" variant="ghost" className="text-xs text-green-700" onClick={() => setNewKey(null)}>
            {ts('apiKeys.confirm')}
          </Button>
        </div>
      )}

      {/* Keys Liste */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{ts('apiKeys.title')}</h2>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={() => setShowForm(v => !v)}
          >
            {ts('apiKeys.newKey')}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">{ts('apiKeys.nameLabel')}</Label>
              <Input
                placeholder={ts('apiKeys.namePlaceholder')}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                className="text-sm h-8"
                autoFocus
              />
            </div>
            <div className="w-28 space-y-1">
              <Label className="text-xs">{ts('apiKeys.scopeLabel')}</Label>
              <select
                value={newScope}
                onChange={e => setNewScope(e.target.value as 'read' | 'write')}
                className="w-full h-8 text-sm border border-input rounded-md px-2"
              >
                <option value="read">{ts('apiKeys.scopeRead')}</option>
                <option value="write">{ts('apiKeys.scopeWrite')}</option>
              </select>
            </div>
            <Button type="submit" size="sm" className="h-8" disabled={creating}
              style={{ backgroundColor: 'var(--brand)' }} >
              <span className="text-white">{creating ? '…' : ts('apiKeys.create')}</span>
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setShowForm(false)}>
              ✕
            </Button>
          </form>
        )}

        {keys.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            {ts('apiKeys.empty')}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {keys.map(k => (
              <div key={k.id} className={`flex items-center gap-3 px-4 py-3 ${k.revoked_at ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">{k.name}</span>
                    {k.revoked_at && <Badge variant="outline" className="text-xs text-red-600 border-red-200">{ts('apiKeys.revoked')}</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <code className="text-xs text-gray-500">{k.key_prefix}…</code>
                    <span className="text-xs text-gray-400">{k.scope?.join(', ')}</span>
                    {k.last_used_at && (
                      <span className="text-xs text-gray-400">
                        {ts('apiKeys.lastUsed')} {new Date(k.last_used_at).toLocaleDateString('de-DE')}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(k.created_at).toLocaleDateString('de-DE')}
                </span>
                {!k.revoked_at && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 text-xs h-7 shrink-0"
                    onClick={() => handleRevoke(k.id, k.name)}
                  >
                    {ts('apiKeys.revoked')}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">{ts('apiKeys.apiAccess')}</p>
        <p>Basis-URL: <code className="font-mono">https://autotodo.app/api/v1</code></p>
        <p>Header: <code className="font-mono">Authorization: Bearer ak_live_…</code></p>
        <p>Endpunkte: <code className="font-mono">GET /projects</code> · <code className="font-mono">GET /lop?projectId=…</code> · <code className="font-mono">POST /transcripts</code></p>
      </div>
    </div>
  )
}
