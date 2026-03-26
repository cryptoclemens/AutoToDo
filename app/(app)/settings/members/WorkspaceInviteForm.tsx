'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const ROLE_OPTIONS = [
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Betrachter' },
  { value: 'project_admin', label: 'Projekt-Admin' },
  { value: 'workspace_admin', label: 'Workspace-Admin' },
]

interface InviteLink {
  email: string
  url: string
}

export default function WorkspaceInviteForm({ workspaceId }: { workspaceId: string }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [loading, setLoading] = useState(false)
  const [links, setLinks] = useState<InviteLink[]>([])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const emails = email.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean)
    if (emails.length === 0) { toast.error('Bitte E-Mail-Adresse eingeben.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, emails, role }),
      })
      const data = await res.json() as {
        ok?: boolean; error?: string
        tokens?: Array<{ email: string; token: string }>
      }
      if (!res.ok) throw new Error(data.error ?? 'Fehler')

      const generatedLinks = (data.tokens ?? []).map(t => ({
        email: t.email,
        url: `${window.location.origin}/invite/${t.token}`,
      }))
      setLinks(prev => [...generatedLinks, ...prev])
      setEmail('')
      toast.success(`${generatedLinks.length} Einladung${generatedLinks.length > 1 ? 'en' : ''} erstellt.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url)
    toast.success('Link kopiert.')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">Mitglied einladen</h2>

      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">E-Mail</Label>
          <Input
            type="text"
            placeholder="name@beispiel.de"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="text-sm"
          />
        </div>
        <div className="w-40 space-y-1">
          <Label className="text-xs">Rolle</Label>
          <Select value={role} onValueChange={v => setRole(v ?? 'editor')}>
            <SelectTrigger className="text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" size="sm" disabled={loading} style={{ backgroundColor: 'var(--brand)' }} className="text-white h-9">
          {loading ? '…' : 'Einladen'}
        </Button>
      </form>

      {links.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs text-gray-500 font-medium">Einladungslinks zum manuellen Versenden:</p>
          {links.map((l, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
              <span className="text-xs text-gray-500 shrink-0">{l.email}</span>
              <code className="text-xs text-gray-600 flex-1 truncate">{l.url}</code>
              <Button size="sm" variant="outline" className="text-xs h-6 shrink-0" onClick={() => copyLink(l.url)}>
                Kopieren
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
