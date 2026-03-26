'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, c => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] ?? c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'account' | 'workspace'>('account')

  // Account-Felder
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Workspace-Felder
  const [workspaceName, setWorkspaceName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleWorkspaceNameChange(value: string) {
    setWorkspaceName(value)
    if (!slugManuallyEdited) {
      setSlug(slugify(value))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (step === 'account') {
      if (password.length < 8) {
        setError('Passwort muss mindestens 8 Zeichen haben.')
        return
      }
      setError('')
      setStep('workspace')
      return
    }

    // Schritt 2: Registrierung + Workspace anlegen
    setError('')
    setLoading(true)

    const supabase = createClient()

    // 1. Nutzer registrieren
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      setError('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.')
      setLoading(false)
      return
    }

    // 2. Workspace anlegen (via API Route, da service_role benötigt)
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: workspaceName,
        slug,
        userId: authData.user.id,
      }),
    })

    if (!res.ok) {
      const { error: wsError } = await res.json()
      setError(wsError ?? 'Workspace konnte nicht erstellt werden.')
      setLoading(false)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kostenlos starten</CardTitle>
        <CardDescription>
          {step === 'account'
            ? 'Erstellen Sie Ihr Konto.'
            : 'Richten Sie Ihren Workspace ein.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'account' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Vollständiger Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Max Mustermann"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="max@firma.de"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mindestens 8 Zeichen"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="workspaceName">Workspace-Name</Label>
                <Input
                  id="workspaceName"
                  type="text"
                  placeholder="z.B. ACME Consulting"
                  value={workspaceName}
                  onChange={e => handleWorkspaceNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="slug"
                    type="text"
                    placeholder="acme-consulting"
                    value={slug}
                    onChange={e => {
                      setSlug(slugify(e.target.value))
                      setSlugManuallyEdited(true)
                    }}
                    required
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">.autotodo.app</span>
                </div>
                <p className="text-xs text-gray-400">
                  Nur Kleinbuchstaben, Zahlen und Bindestriche.
                </p>
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
          )}

          <div className="flex gap-2">
            {step === 'workspace' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('account')}
                className="flex-1"
              >
                Zurück
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Wird erstellt…' : step === 'account' ? 'Weiter' : 'Workspace erstellen'}
            </Button>
          </div>
        </form>

        {step === 'account' && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Bereits registriert?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Anmelden
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
