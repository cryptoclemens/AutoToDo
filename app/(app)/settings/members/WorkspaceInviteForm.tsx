'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

const CHANGEABLE_ROLE_VALUES = ['editor', 'viewer', 'project_admin', 'workspace_admin']

interface InviteLink {
  email: string
  url: string
}

export default function WorkspaceInviteForm({ workspaceId }: { workspaceId: string }) {
  const ts = useTranslations('settings')

  // Email invite state
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [loading, setLoading] = useState(false)
  const [links, setLinks] = useState<InviteLink[]>([])

  // Generic link state
  const [linkRole, setLinkRole] = useState('editor')
  const [generatingLink, setGeneratingLink] = useState(false)
  const [genericLink, setGenericLink] = useState<string | null>(null)
  const [genericLinkId, setGenericLinkId] = useState<string | null>(null)
  const [revokingLink, setRevokingLink] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const emails = email.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean)
    if (emails.length === 0) { toast.error(ts('invite.errorNoEmail')); return }

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
      const count = generatedLinks.length
      toast.success(count === 1 ? ts('invite.success', { count }) : ts('invite.successPlural', { count }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateLink() {
    setGeneratingLink(true)
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, role: linkRole, generateLink: true }),
      })
      const data = await res.json() as { ok?: boolean; error?: string; token?: string; id?: string }
      if (!res.ok) throw new Error(data.error ?? 'Fehler')
      setGenericLink(`${window.location.origin}/invite/${data.token}`)
      setGenericLinkId(data.id ?? null)
      toast.success(ts('invite.linkGenerated'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setGeneratingLink(false)
    }
  }

  async function handleRevokeLink() {
    if (!genericLinkId) return
    setRevokingLink(true)
    try {
      await fetch(`/api/invitations?id=${genericLinkId}`, { method: 'DELETE' })
      setGenericLink(null)
      setGenericLinkId(null)
      toast.success(ts('invite.linkRevoked'))
    } catch {
      toast.error('Fehler beim Widerrufen')
    } finally {
      setRevokingLink(false)
    }
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url)
    toast.success(ts('invite.copied'))
  }

  return (
    <div className="space-y-6">
      {/* Email invite */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">{ts('invite.title')}</h2>

        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">{ts('invite.emailLabel')}</Label>
            <Input
              type="text"
              placeholder={ts('invite.emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="w-40 space-y-1">
            <Label className="text-xs">{ts('invite.roleLabel')}</Label>
            <Select value={role} onValueChange={v => setRole(v ?? 'editor')}>
              <SelectTrigger className="text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANGEABLE_ROLE_VALUES.map(r => (
                  <SelectItem key={r} value={r}>{ts(`changeableRoles.${r}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" size="sm" disabled={loading} style={{ backgroundColor: 'var(--brand)' }} className="text-white h-9">
            {loading ? '…' : ts('invite.submit')}
          </Button>
        </form>

        {links.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs text-gray-500 font-medium">{ts('invite.linksTitle')}</p>
            {links.map((l, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
                <span className="text-xs text-gray-500 shrink-0">{l.email}</span>
                <code className="text-xs text-gray-600 flex-1 truncate">{l.url}</code>
                <Button size="sm" variant="outline" className="text-xs h-6 shrink-0" onClick={() => copyLink(l.url)}>
                  {ts('invite.copy')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generic invite link */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{ts('invite.linkTitle')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{ts('invite.linkHint')}</p>
        </div>

        {!genericLink ? (
          <div className="flex gap-2 items-end">
            <div className="w-44 space-y-1">
              <Label className="text-xs">{ts('invite.roleLabel')}</Label>
              <Select value={linkRole} onValueChange={v => setLinkRole(v ?? 'editor')}>
                <SelectTrigger className="text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANGEABLE_ROLE_VALUES.map(r => (
                    <SelectItem key={r} value={r}>{ts(`changeableRoles.${r}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={generatingLink}
              onClick={handleGenerateLink}
              variant="outline"
              className="h-9"
            >
              {generatingLink ? '…' : ts('invite.generateLink')}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <code className="text-xs text-blue-700 flex-1 truncate">{genericLink}</code>
              <Button size="sm" variant="outline" className="text-xs h-6 shrink-0 border-blue-300" onClick={() => copyLink(genericLink)}>
                {ts('invite.copy')}
              </Button>
            </div>
            <p className="text-xs text-gray-400">{ts('invite.linkExpiry')}</p>
            <button
              type="button"
              onClick={handleRevokeLink}
              disabled={revokingLink}
              className="text-xs text-red-500 hover:text-red-700 hover:underline"
            >
              {revokingLink ? '…' : ts('invite.revokeLink')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
