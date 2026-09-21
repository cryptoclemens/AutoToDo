'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  initial: {
    connected: boolean
    provider: string | null
    account: { email: string | null; name: string | null } | null
    connectedAt: string | null
    microsoftAvailable: boolean
  }
}

const ERROR_LABELS: Record<string, string> = {
  forbidden: 'Nur Admins dürfen den Kalender verbinden.',
  not_configured: 'Microsoft 365 ist auf dem Server nicht konfiguriert.',
  missing_params: 'Der Rücksprung von Microsoft war unvollständig.',
  bad_state: 'Sicherheitsprüfung fehlgeschlagen (State abgelaufen). Bitte erneut versuchen.',
  session_mismatch: 'Die Sitzung passt nicht zum gestarteten Vorgang. Bitte erneut versuchen.',
  exchange_failed: 'Der Token-Austausch mit Microsoft ist fehlgeschlagen.',
  access_denied: 'Der Zugriff wurde bei Microsoft abgelehnt.',
}

export default function CalendarIntegrationForm({ initial }: Props) {
  const [connected, setConnected] = useState(initial.connected)
  const [account, setAccount] = useState(initial.account)
  const [connectedAt, setConnectedAt] = useState(initial.connectedAt)
  const [disconnecting, setDisconnecting] = useState(false)

  // Rückmeldung aus dem OAuth-Callback (Query-Parameter) als Toast anzeigen.
  useEffect(() => {
    const url = new URL(window.location.href)
    const ok = url.searchParams.get('calendar_connected')
    const err = url.searchParams.get('calendar_error')
    if (ok) {
      toast.success('Microsoft 365 erfolgreich verbunden!')
      setConnected(true)
    } else if (err) {
      toast.error(ERROR_LABELS[err] ?? `Verbindung fehlgeschlagen (${err}).`)
    }
    if (ok || err) {
      url.searchParams.delete('calendar_connected')
      url.searchParams.delete('calendar_error')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  function handleConnect() {
    window.location.href = '/api/settings/integrations/calendar/microsoft/connect'
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await fetch('/api/settings/integrations/calendar', { method: 'DELETE' })
      setConnected(false)
      setAccount(null)
      setConnectedAt(null)
      toast.success('Kalenderverbindung getrennt.')
    } finally {
      setDisconnecting(false)
    }
  }

  if (!initial.microsoftAvailable && !connected) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-sm font-medium text-amber-800 mb-1">Microsoft 365 noch nicht eingerichtet</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          Diese Integration braucht eine registrierte Azure-App. Der Server-Administrator muss{' '}
          <code className="font-mono bg-amber-100 px-1 rounded">MICROSOFT_CLIENT_ID</code> und{' '}
          <code className="font-mono bg-amber-100 px-1 rounded">MICROSOFT_CLIENT_SECRET</code>{' '}
          (optional <code className="font-mono bg-amber-100 px-1 rounded">MICROSOFT_TENANT</code>) in der Server-Umgebung setzen.
          Redirect-URI:{' '}
          <code className="font-mono bg-amber-100 px-1 rounded break-all">
            {`${typeof window !== 'undefined' ? window.location.origin : ''}/api/settings/integrations/calendar/microsoft/callback`}
          </code>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {connected ? (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 4.5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-green-800">
                Microsoft 365 verbunden{account?.name ? ` · ${account.name}` : ''}
              </p>
              <p className="text-xs text-green-600">
                {account?.email ? account.email : ''}
                {connectedAt && (
                  <> {account?.email ? '· ' : ''}seit {new Date(connectedAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</>
                )}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? 'Trenne…' : 'Verbindung trennen'}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#9ca3af" strokeWidth="1.5" />
                <path d="M7 4v3.5l2 2" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <p className="text-sm text-gray-600">Noch kein Kalender verbunden.</p>
          </div>
          <Button onClick={handleConnect} className="rounded-lg">
            Mit Microsoft 365 verbinden
          </Button>
        </div>
      )}

      <p className="text-xs text-gray-400 leading-relaxed">
        AutoToDo liest ausschließlich Meeting-Titel und Teilnehmerlisten (Scope{' '}
        <code className="font-mono">Calendars.Read</code>), um beim Zuordnen von Sprechern echte
        Namen vorzuschlagen. Die Tokens werden AES-256-GCM-verschlüsselt gespeichert.
      </p>
    </div>
  )
}
