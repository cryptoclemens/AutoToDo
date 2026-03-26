'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'E-Mail oder Passwort falsch.'
        : error.message)
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anmelden</CardTitle>
        <CardDescription>Melden Sie sich in Ihrem Workspace an.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@firma.de"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Passwort</Label>
              <Link href="/reset-password" className="text-xs text-blue-600 hover:underline">
                Vergessen?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Anmelden…' : 'Anmelden'}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Noch kein Konto?{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            Kostenlos registrieren
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
