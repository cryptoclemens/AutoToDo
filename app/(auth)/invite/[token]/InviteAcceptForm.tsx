'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  token: string
  workspaceName: string
  email: string
  role: string
}

export default function InviteAcceptForm({ token, workspaceName, email, role }: Props) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Einladung serverseitig akzeptieren
    const res = await fetch('/api/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (!res.ok) {
      const { error } = await res.json()
      setError(error ?? 'Einladung konnte nicht akzeptiert werden.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Einladung annehmen</CardTitle>
        <CardDescription>
          Sie wurden eingeladen, <strong>{workspaceName}</strong> beizutreten ({role}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAccept} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ihr Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>E-Mail</Label>
            <Input value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort wählen</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mindestens 8 Zeichen"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Wird verarbeitet…' : 'Beitreten'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
