'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Props {
  currentEmail: string
}

export function AccountSettings({ currentEmail }: Props) {
  const [newEmail, setNewEmail] = useState(currentEmail)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  async function handleEmailSave(e: React.FormEvent) {
    e.preventDefault()
    if (newEmail === currentEmail) return
    setSavingEmail(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      toast.success('Bestätigungs-E-Mail gesendet. Bitte prüfen Sie Ihren Posteingang.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Ändern der E-Mail.')
    } finally {
      setSavingEmail(false)
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (newPw.length < 8) { toast.error('Passwort muss mindestens 8 Zeichen haben.'); return }
    if (newPw !== confirmPw) { toast.error('Passwörter stimmen nicht überein.'); return }
    setSavingPw(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      toast.success('Passwort erfolgreich geändert.')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Ändern des Passworts.')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* E-Mail */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">E-Mail-Adresse</h2>
        <form onSubmit={handleEmailSave} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">E-Mail-Adresse</Label>
            <Input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              required
              className="text-sm"
            />
            <p className="text-xs text-gray-400">
              Eine Bestätigungs-E-Mail wird an die neue Adresse gesendet.
            </p>
          </div>
          <Button type="submit" size="sm" disabled={savingEmail || newEmail === currentEmail}>
            {savingEmail ? 'Wird gesendet…' : 'E-Mail ändern'}
          </Button>
        </form>
      </div>

      {/* Passwort */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Passwort ändern</h2>
        <form onSubmit={handlePasswordSave} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Neues Passwort</Label>
            <Input
              type="password"
              placeholder="Mindestens 8 Zeichen"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              required
              className="text-sm"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Passwort bestätigen</Label>
            <Input
              type="password"
              placeholder="Passwort wiederholen"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              required
              className="text-sm"
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" size="sm" disabled={savingPw}>
            {savingPw ? 'Wird geändert…' : 'Passwort ändern'}
          </Button>
        </form>
      </div>
    </div>
  )
}
