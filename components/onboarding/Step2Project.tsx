'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  workspaceId: string
  userId: string
  onDone: (projectId: string) => void
}

export default function Step2Project({ workspaceId, userId, onDone }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, name, description: description || null }),
    })

    if (!res.ok) {
      setError('Projekt konnte nicht erstellt werden.')
      setLoading(false)
      return
    }

    const { id } = await res.json()
    onDone(id)
  }

  function handleSkip() {
    onDone('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schritt 2 – Erstes Projekt anlegen</CardTitle>
        <CardDescription>Erstellen Sie Ihr erstes Projekt für die LOP-Verwaltung.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Projektname</Label>
            <Input
              id="projectName"
              placeholder="z.B. BOWA Geothermie Q2 2026"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Kurzbeschreibung <span className="text-gray-400">(optional)</span></Label>
            <Textarea
              id="description"
              placeholder="Worum geht es in diesem Projekt?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleSkip} className="flex-1">
              Überspringen
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Wird erstellt…' : 'Projekt erstellen'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
