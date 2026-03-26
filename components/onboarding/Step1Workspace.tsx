'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const BRAND_COLORS = ['#2563EB', '#16A34A', '#DC2626', '#9333EA', '#EA580C', '#0891B2']

interface Props {
  workspace: { id: string; name: string; slug: string }
  onDone: () => void
}

export default function Step1Workspace({ workspace, onDone }: Props) {
  const [name, setName] = useState(workspace.name)
  const [brandColor, setBrandColor] = useState('#2563EB')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/workspaces/' + workspace.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, brand_color: brandColor }),
    })
    const error = res.ok ? null : { message: 'Fehler' }

    if (error) {
      setError('Fehler beim Speichern. Bitte erneut versuchen.')
      setLoading(false)
      return
    }

    onDone()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schritt 1 – Workspace einrichten</CardTitle>
        <CardDescription>Geben Sie Ihrem Workspace ein Gesicht.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="wsName">Workspace-Name</Label>
            <Input
              id="wsName"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Akzentfarbe</Label>
            <div className="flex gap-2 flex-wrap">
              {BRAND_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBrandColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all
                    ${brandColor === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <input
                type="color"
                value={brandColor}
                onChange={e => setBrandColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border border-gray-200"
                title="Eigene Farbe"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Wird gespeichert…' : 'Weiter'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
