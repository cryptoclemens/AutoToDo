'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const ROLE_OPTIONS = [
  { value: 'editor', label: 'Editor – kann LOP-Punkte bearbeiten & Transkripte hochladen' },
  { value: 'viewer', label: 'Betrachter – nur lesen & exportieren' },
  { value: 'project_admin', label: 'Projekt-Admin – kann Projekte verwalten' },
]

interface InviteLink {
  email: string
  url: string
}

interface Props {
  workspaceId: string
  projectName: string
}

export default function ProjectInviteButton({ workspaceId, projectName }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [loading, setLoading] = useState(false)
  const [links, setLinks] = useState<InviteLink[]>([])

  function handleClose() {
    setOpen(false)
    setEmail('')
    setRole('editor')
    setLinks([])
  }

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
        ok?: boolean
        error?: string
        tokens?: Array<{ email: string; token: string }>
      }
      if (!res.ok) throw new Error(data.error ?? 'Fehler beim Erstellen der Einladung')

      const generatedLinks = (data.tokens ?? []).map(t => ({
        email: t.email,
        url: `${window.location.origin}/invite/${t.token}`,
      }))
      setLinks(generatedLinks)
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

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        + Mitglied einladen
      </Button>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 w-full max-w-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Mitglied einladen</h3>
          <p className="text-xs text-gray-400 mt-0.5">Projekt: {projectName}</p>
        </div>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
        Die eingeladene Person erhält Zugang zum gesamten Workspace.
        Projektspezifische Berechtigungen (nur ein Projekt) sind in Phase 2 geplant.
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">E-Mail-Adresse(n)</Label>
          <Input
            type="text"
            placeholder="name@beispiel.de, weitere@mail.de"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="text-sm"
            autoFocus
          />
          <p className="text-xs text-gray-400">Mehrere Adressen mit Komma oder Leerzeichen trennen.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Rolle</Label>
          <Select value={role} onValueChange={v => setRole(v ?? 'editor')}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map(r => (
                <SelectItem key={r.value} value={r.value} className="text-sm">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          size="sm"
          disabled={loading}
          style={{ backgroundColor: 'var(--brand)' }}
          className="text-white"
        >
          {loading ? 'Wird erstellt…' : 'Einladungslink generieren'}
        </Button>
      </form>

      {/* Generierte Links zum Kopieren */}
      {links.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-gray-600">
            Einladungslinks (bitte manuell versenden):
          </p>
          {links.map(l => (
            <div key={l.email} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-1">
              <p className="text-xs text-gray-500">{l.email}</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-gray-700 flex-1 truncate bg-white border rounded px-2 py-1">
                  {l.url}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs shrink-0 h-7"
                  onClick={() => copyLink(l.url)}
                >
                  Kopieren
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
