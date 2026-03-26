'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  workspaceId: string
  onDone: () => void
}

type WorkspaceRole = 'editor' | 'viewer' | 'project_admin' | 'workspace_admin'

export default function Step3Invite({ workspaceId, onDone }: Props) {
  const [emails, setEmails] = useState('')
  const [role, setRole] = useState<WorkspaceRole>('editor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const emailList = emails
      .split(/[,\n]/)
      .map(e => e.trim())
      .filter(e => e.includes('@'))

    if (emailList.length === 0) {
      setError('Bitte mindestens eine gültige E-Mail-Adresse eingeben.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, emails: emailList, role }),
    })

    if (!res.ok) {
      const { error } = await res.json()
      setError(error ?? 'Einladungen konnten nicht gesendet werden.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Einladungen gesendet!</CardTitle>
          <CardDescription>Ihr Team erhält in Kürze eine E-Mail.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onDone} className="w-full">Zum Dashboard</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schritt 3 – Team einladen</CardTitle>
        <CardDescription>Laden Sie Kollegen zu Ihrem Workspace ein.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emails">E-Mail-Adressen</Label>
            <textarea
              id="emails"
              className="w-full min-h-[80px] px-3 py-2 text-sm border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="max@firma.de, anna@firma.de"
              value={emails}
              onChange={e => setEmails(e.target.value)}
            />
            <p className="text-xs text-gray-400">Komma- oder zeilengetrennt</p>
          </div>

          <div className="space-y-2">
            <Label>Rolle</Label>
            <Select value={role} onValueChange={v => setRole(v as WorkspaceRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Betrachter (nur lesen)</SelectItem>
                <SelectItem value="editor">Editor (bearbeiten)</SelectItem>
                <SelectItem value="project_admin">Projekt-Admin</SelectItem>
                <SelectItem value="workspace_admin">Workspace-Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onDone} className="flex-1">
              Überspringen
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Wird gesendet…' : 'Einladungen senden'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
