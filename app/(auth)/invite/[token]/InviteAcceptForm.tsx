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
  alreadyAccepted?: boolean
}

export default function InviteAcceptForm({ token, workspaceName, email, role, alreadyAccepted }: Props) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // Invited users who already have an account switch to login mode
  const [isLoginMode, setIsLoginMode] = useState(false)

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // Already-accepted: just sign in and go to dashboard
    if (alreadyAccepted) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError(signInError.message); setLoading(false); return }
      router.push('/dashboard')
      router.refresh()
      return
    }

    if (!isLoginMode) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })

      if (signUpError) {
        // User already has an account → switch to login mode
        if (
          signUpError.message.toLowerCase().includes('already registered') ||
          signUpError.message.toLowerCase().includes('already been registered') ||
          signUpError.message.toLowerCase().includes('user already exists')
        ) {
          setIsLoginMode(true)
          setError('Du hast bereits ein Konto. Bitte melde dich mit deinem Passwort an.')
          setLoading(false)
          return
        }
        setError(signUpError.message)
        setLoading(false)
        return
      }
    } else {
      // Login mode: sign in with existing credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }
    }

    // Accept the invitation server-side.
    // The accept route resolves the user by session cookie or email lookup (fallback).
    const res = await fetch('/api/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (!res.ok) {
      const data = await res.json() as { error?: string }
      setError(data.error ?? 'Einladung konnte nicht akzeptiert werden.')
      setLoading(false)
      return
    }

    // Invited users always go to dashboard — no workspace setup needed
    router.push('/dashboard')
    router.refresh()
  }

  if (alreadyAccepted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Einladung bereits angenommen</CardTitle>
          <CardDescription>
            Diese Einladung zu <strong>{workspaceName}</strong> wurde bereits verwendet.
            Melde dich an, um auf deinen Workspace zuzugreifen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAccept} className="space-y-4">
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input value={email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Wird angemeldet…' : 'Anmelden'}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
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
          {!isLoginMode && (
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
          )}
          <div className="space-y-2">
            <Label>E-Mail</Label>
            <Input value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              {isLoginMode ? 'Ihr Passwort' : 'Passwort wählen'}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={isLoginMode ? '••••••••' : 'Mindestens 8 Zeichen'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Wird verarbeitet…' : isLoginMode ? 'Anmelden & beitreten' : 'Beitreten'}
          </Button>
          {isLoginMode && (
            <button
              type="button"
              className="text-xs text-gray-500 hover:underline w-full text-center"
              onClick={() => { setIsLoginMode(false); setError('') }}
            >
              Zurück zur Registrierung
            </button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
