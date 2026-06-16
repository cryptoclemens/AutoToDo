'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface Props {
  currentEmail: string
}

export function AccountSettings({ currentEmail }: Props) {
  const ts = useTranslations('settings')
  const [newEmail, setNewEmail] = useState(currentEmail)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [userDigestFreq, setUserDigestFreq] = useState('workspace_default')
  const [savingDigest, setSavingDigest] = useState(false)

  useEffect(() => {
    fetch('/api/settings/digest-preferences')
      .then(r => r.ok ? r.json() : null)
      .then((d: { frequency: string } | null) => { if (d) setUserDigestFreq(d.frequency) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.full_name ?? data.user?.user_metadata?.name ?? ''
      setDisplayName(name)
    })
  }, [])

  async function handleEmailSave(e: React.FormEvent) {
    e.preventDefault()
    if (newEmail === currentEmail) return
    setSavingEmail(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      toast.success(ts('account.emailSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('account.emailError'))
    } finally {
      setSavingEmail(false)
    }
  }

  async function handleDisplayNameSave(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) { toast.error(ts('account.displayNameEmpty')); return }
    setSavingName(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ data: { full_name: displayName.trim() } })
      if (error) throw error
      toast.success(ts('account.displayNameSuccess'))
    } catch {
      toast.error(ts('account.displayNameError'))
    } finally {
      setSavingName(false)
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (newPw.length < 8) { toast.error(ts('account.passwordMin')); return }
    if (newPw !== confirmPw) { toast.error(ts('account.passwordMismatch')); return }
    setSavingPw(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      toast.success(ts('account.passwordSuccess'))
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('account.passwordError'))
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Anzeigename */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">{ts('account.displayNameTitle')}</h2>
        <form onSubmit={handleDisplayNameSave} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">{ts('account.displayNameLabel')}</Label>
            <Input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              className="text-sm"
              placeholder="z.B. Markus"
            />
            <p className="text-xs text-gray-400">{ts('account.displayNameHint')}</p>
          </div>
          <Button type="submit" size="sm" disabled={savingName || !displayName.trim()}>
            {savingName ? ts('account.displayNameSaving') : ts('account.displayNameSave')}
          </Button>
        </form>
      </div>

      {/* E-Mail */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">{ts('account.emailTitle')}</h2>
        <form onSubmit={handleEmailSave} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">{ts('account.emailLabel')}</Label>
            <Input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              required
              className="text-sm"
            />
            <p className="text-xs text-gray-400">
              {ts('account.emailHint')}
            </p>
          </div>
          <Button type="submit" size="sm" disabled={savingEmail || newEmail === currentEmail}>
            {savingEmail ? ts('account.emailSending') : ts('account.emailChange')}
          </Button>
        </form>
      </div>

      {/* Passwort */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">{ts('account.passwordTitle')}</h2>
        <form onSubmit={handlePasswordSave} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">{ts('account.passwordNew')}</Label>
            <Input
              type="password"
              placeholder={ts('account.passwordPlaceholder')}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              required
              className="text-sm"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{ts('account.passwordConfirm')}</Label>
            <Input
              type="password"
              placeholder={ts('account.passwordRepeat')}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              required
              className="text-sm"
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" size="sm" disabled={savingPw}>
            {savingPw ? ts('account.passwordChanging') : ts('account.passwordChange')}
          </Button>
        </form>
      </div>

      {/* Persönliche Digest-Häufigkeit */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Mein Digest</h3>
        <p className="text-xs text-gray-500 mb-3">
          Überschreibe die Workspace-Einstellung für deinen persönlichen E-Mail-Digest.
        </p>
        <select
          value={userDigestFreq}
          onChange={async e => {
            const val = e.target.value
            setUserDigestFreq(val)
            setSavingDigest(true)
            try {
              const res = await fetch('/api/settings/digest-preferences', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ frequency: val }),
              })
              if (res.ok) toast.success('Digest-Einstellung gespeichert.')
              else toast.error('Fehler beim Speichern.')
            } finally {
              setSavingDigest(false)
            }
          }}
          disabled={savingDigest}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="workspace_default">Workspace-Standard übernehmen</option>
          <option value="daily">Täglich</option>
          <option value="twice_weekly">2× pro Woche (Mo + Do)</option>
          <option value="weekly">Wöchentlich (Montag)</option>
          <option value="disabled">Deaktiviert</option>
        </select>
      </div>
    </div>
  )
}
