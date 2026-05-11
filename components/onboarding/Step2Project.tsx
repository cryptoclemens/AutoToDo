'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BUNDESLAENDER } from '@/lib/holidays'

interface Props {
  workspaceId: string
  userId: string
  onDone: (projectId: string) => void
}

export default function Step2Project({ workspaceId, userId: _userId, onDone }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [bundesland, setBundesland] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, name, description: description || null, bundesland: bundesland || null }),
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
          <div className="space-y-2">
            <Label htmlFor="bundesland">
              Bundesland <span className="text-gray-400">(optional)</span>
            </Label>
            <select
              id="bundesland"
              value={bundesland}
              onChange={e => setBundesland(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">– Kein Bundesland –</option>
              {BUNDESLAENDER.map(bl => (
                <option key={bl.code} value={bl.code}>{bl.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400">
              Wird für den Tätigkeitsnachweis verwendet — Feiertage und Wochenenden dieses Bundeslandes werden ausgeblendet.
            </p>
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
