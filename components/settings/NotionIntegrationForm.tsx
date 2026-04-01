'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Props {
  initial: { configured: boolean; connectedAt: string | null }
}

const STEPS = [
  {
    num: 1,
    title: 'Notion-Integration erstellen',
    desc: (
      <>
        Öffne{' '}
        <a
          href="https://www.notion.so/profile/integrations"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline font-medium"
        >
          notion.so/profile/integrations
        </a>{' '}
        und klicke auf <strong>+ New integration</strong>.
      </>
    ),
  },
  {
    num: 2,
    title: 'Integration benennen & speichern',
    desc: 'Gib einen Namen ein (z.B. „AutoToDo"), wähle deinen Notion-Workspace aus und klicke auf „Save".',
  },
  {
    num: 3,
    title: 'Internal Integration Token kopieren',
    desc: 'Unter dem Tab „Secrets" siehst du den Internal Integration Token (beginnt mit secret_). Klicke auf „Show" und kopiere ihn.',
  },
  {
    num: 4,
    title: 'Token hier einfügen & verbinden',
    desc: 'Füge den Token unten ein und klicke auf „Verbinden". AutoToDo speichert ihn verschlüsselt (AES-256-GCM).',
  },
  {
    num: 5,
    title: 'Notion-Seiten teilen',
    desc: (
      <>
        Öffne in Notion jede Seite, die du importieren möchtest. Klicke oben rechts auf <strong>&bdquo;&hellip;&ldquo; → Connections → AutoToDo</strong>.
        Ohne diesen Schritt kann AutoToDo die Seite nicht lesen.
      </>
    ),
  },
]

export default function NotionIntegrationForm({ initial }: Props) {
  const [configured, setConfigured] = useState(initial.configured)
  const [connectedAt, setConnectedAt] = useState(initial.connectedAt)
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleConnect() {
    if (!token.trim()) { toast.error('Bitte Token eingeben.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/settings/integrations/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Verbindung fehlgeschlagen.')
      setConfigured(true)
      setConnectedAt(new Date().toISOString())
      setToken('')
      toast.success('Notion erfolgreich verbunden!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Verbinden.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await fetch('/api/settings/integrations/notion', { method: 'DELETE' })
      setConfigured(false)
      setConnectedAt(null)
      toast.success('Notion-Verbindung getrennt.')
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {configured ? (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 4.5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-green-800">Notion verbunden</p>
              {connectedAt && (
                <p className="text-xs text-green-600">
                  Seit {new Date(connectedAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
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
        <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#9ca3af" strokeWidth="1.5"/>
              <path d="M7 4v3.5l2 2" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
          <p className="text-sm text-gray-600">Notion ist noch nicht verbunden.</p>
        </div>
      )}

      {/* Step-by-step guide */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          {configured ? 'So funktioniert die Notion-Integration' : 'Schritt-für-Schritt: Notion verbinden'}
        </h3>
        <ol className="space-y-4">
          {STEPS.map(step => (
            <li key={step.num} className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {step.num}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Token input – only show when not yet connected */}
      {!configured && (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-900">
            Internal Integration Token
          </label>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="secret_…"
              value={token}
              onChange={e => setToken(e.target.value)}
              className="font-mono text-sm flex-1"
              autoComplete="off"
            />
            <Button
              onClick={handleConnect}
              disabled={saving || !token.trim()}
              className="rounded-lg"
            >
              {saving ? 'Verbinde…' : 'Verbinden'}
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Der Token wird AES-256-GCM-verschlüsselt gespeichert und verlässt deinen Server nicht im Klartext.
          </p>
        </div>
      )}
    </div>
  )
}
