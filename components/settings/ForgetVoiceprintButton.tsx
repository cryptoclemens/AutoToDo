'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ForgetVoiceprintButton() {
  const [busy, setBusy] = useState(false)
  async function forget() {
    setBusy(true)
    try {
      const res = await fetch('/api/settings/voiceprints', { method: 'DELETE' })
      if (res.ok) toast.success('Stimmprofil gelöscht.')
      else toast.error('Löschen fehlgeschlagen.')
    } finally { setBusy(false) }
  }
  return (
    <div className="pt-2">
      <p className="text-xs text-gray-500 mb-2">
        Für die automatische Sprecher-Erkennung kann ein Stimm-Merkmal gespeichert werden.
        Du kannst es jederzeit löschen.
      </p>
      <Button variant="outline" size="sm" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
        onClick={forget} disabled={busy}>
        {busy ? 'Lösche…' : 'Stimmprofil löschen'}
      </Button>
    </div>
  )
}
