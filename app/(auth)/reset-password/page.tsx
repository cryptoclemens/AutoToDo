'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings/password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>E-Mail gesendet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Wir haben eine E-Mail an <strong>{email}</strong> gesendet.
            Bitte folgen Sie dem Link, um Ihr Passwort zurückzusetzen.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full mt-4">Zurück zum Login</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passwort zurücksetzen</CardTitle>
        <CardDescription>Wir senden Ihnen einen Reset-Link per E-Mail.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@firma.de"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Wird gesendet…' : 'Reset-Link senden'}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/login" className="text-blue-600 hover:underline">← Zurück zum Login</Link>
        </p>
      </CardContent>
    </Card>
  )
}
