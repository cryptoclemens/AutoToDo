'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Workspace-ID aus Session via API
    const res = await fetch('/api/workspace/current')
    if (!res.ok) { router.push('/login'); return }
    const { workspaceId } = await res.json()

    const createRes = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, name, description: description || null }),
    })

    if (!createRes.ok) {
      const { error } = await createRes.json()
      setError(error ?? 'Fehler beim Erstellen.')
      setLoading(false)
      return
    }

    const { id } = await createRes.json()
    router.push(`/projects/${id}`)
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">Neues Projekt</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neues Projekt anlegen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Projektname *</Label>
              <Input
                id="name"
                placeholder="z.B. BOWA Geothermie Q2 2026"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung <span className="text-gray-400">(optional)</span></Label>
              <Textarea
                id="description"
                placeholder="Worum geht es in diesem Projekt?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
            <div className="flex gap-2 pt-2">
              <Link href="/dashboard">
                <Button type="button" variant="outline">Abbrechen</Button>
              </Link>
              <Button type="submit" disabled={loading} style={{ backgroundColor: 'var(--brand)' }}>
                {loading ? 'Wird erstellt…' : 'Projekt erstellen'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
