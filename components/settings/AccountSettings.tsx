'use client'

import { useState } from 'react'
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
    </div>
  )
}
