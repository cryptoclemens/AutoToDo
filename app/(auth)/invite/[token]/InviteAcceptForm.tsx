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
  isGenericLink?: boolean
}

export default function InviteAcceptForm({ token, workspaceName, email: emailProp, role, alreadyAccepted, isGenericLink }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState(emailProp)
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(false)
  const [confirmationPending, setConfirmationPending] = useState(false)

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    if (alreadyAccepted) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) { setError(signInError.message); setLoading(false); return }
      router.push('/dashboard')
      router.refresh()
      return
    }

    if (!isLoginMode) {
      // emailRedirectTo routes the Supabase confirmation link back through our
      // auth callback, then on to this invite page so the auto-accept in
      // page.tsx fires once the user has a valid session.
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name }, emailRedirectTo: redirectTo },
      })

      if (signUpError) {
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

      // Email confirmation is required — session is null until the user clicks
      // the confirmation link, which will redirect them back to this invite page.
      if (!signUpData.session) {
        setConfirmationPending(true)
        setLoading(false)
        return
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }
    }

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

    router.push('/dashboard')
    router.refresh()
  }

  if (confirmationPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>E-Mail bestätigen</CardTitle>
          <CardDescription>
            Wir haben dir eine Bestätigungs-E-Mail geschickt. Klicke auf den Link darin –
            danach wirst du automatisch dem Workspace <strong>{workspaceName}</strong> hinzugefügt.
          </CardDescription>
        </CardHeader>
      </Card>
    )
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
          {isGenericLink
            ? <>Du wurdest eingeladen, <strong>{workspaceName}</strong> beizutreten ({role}). Registriere dich oder melde dich an.</>
            : <>Sie wurden eingeladen, <strong>{workspaceName}</strong> beizutreten ({role}).</>
          }
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
            {isGenericLink ? (
              <Input
                type="email"
                placeholder="deine@email.de"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            ) : (
              <Input value={email} disabled />
            )}
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
          {!isLoginMode && (
            <button
              type="button"
              className="text-xs text-gray-500 hover:underline w-full text-center"
              onClick={() => { setIsLoginMode(true); setError('') }}
            >
              Bereits ein Konto? Anmelden
            </button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
