'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

function SlackTeamsSection() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/settings/notifications')
      .then(r => r.json())
      .then(d => {
        setWebhookUrl(d.slack_webhook_url ?? '')
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slack_webhook_url: webhookUrl || null }),
      })
      if (!res.ok) { toast.error('Fehler beim Speichern.'); return }
      toast.success('Gespeichert.')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return <p className="text-sm text-gray-400">Lädt…</p>

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <p className="text-xs text-gray-500">
        Slack- oder Microsoft Teams-Benachrichtigungen bei neuen und geänderten LOP-Punkten.
        Erstellen Sie einen{' '}
        <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer"
          className="text-blue-600 underline">Slack Incoming Webhook</a>{' '}
        oder einen{' '}
        <a href="https://learn.microsoft.com/de-de/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook"
          target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Teams Incoming Webhook</a>.
      </p>
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://hooks.slack.com/services/… oder Teams-URL"
          value={webhookUrl}
          onChange={e => setWebhookUrl(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Speichert…' : 'Speichern'}
        </Button>
      </div>
      {webhookUrl && (
        <p className="text-xs text-green-600">
          ✓ Aktiv – LOP-Events werden an diese URL gesendet.
        </p>
      )}
    </form>
  )
}

const AVAILABLE_EVENTS = [
  { value: 'lop.item.created', label: 'LOP-Punkt erstellt' },
  { value: 'lop.item.updated', label: 'LOP-Punkt bearbeitet' },
  { value: 'lop.item.status_changed', label: 'Status geändert' },
  { value: 'lop.item.deleted', label: 'LOP-Punkt gelöscht' },
]

interface Endpoint {
  id: string
  url: string
  events: string[]
  active: boolean
  created_at: string
  secret?: string
}

export default function WebhooksSettings() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['lop.item.created', 'lop.item.status_changed'])
  const [saving, setSaving] = useState(false)
  const [newSecret, setNewSecret] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/webhooks')
      .then(r => r.json())
      .then(d => { setEndpoints(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!url || selectedEvents.length === 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, events: selectedEvents }),
      })
      if (!res.ok) { toast.error('Fehler beim Erstellen.'); return }
      const created: Endpoint = await res.json()
      setEndpoints(prev => [created, ...prev])
      setNewSecret(created.secret ?? null)
      setUrl('')
      toast.success('Webhook-Endpunkt erstellt.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Webhook-Endpunkt wirklich löschen?')) return
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' })
    setEndpoints(prev => prev.filter(ep => ep.id !== id))
    toast.success('Endpunkt gelöscht.')
  }

  function toggleEvent(ev: string) {
    setSelectedEvents(prev =>
      prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]
    )
  }

  return (
    <div className="space-y-8">
      {/* Slack / Teams */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Slack / Microsoft Teams</h3>
        <SlackTeamsSection />
      </div>

      <div className="border-t border-gray-100 pt-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Webhook-Endpunkte</h3>
          <p className="text-xs text-gray-500">
            Empfangen Sie Echtzeit-Events per HTTP POST. Jeder Request wird mit einem HMAC-SHA256-Header
            <code className="mx-1 bg-gray-100 px-1 rounded text-xs">X-AutoToDo-Signature</code>signiert.
          </p>
        </div>

        {/* Secret banner (shown once after creation) */}
        {newSecret && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-yellow-800">Signing-Secret (nur einmal sichtbar!)</p>
            <code className="block text-xs bg-yellow-100 rounded p-2 break-all font-mono select-all">{newSecret}</code>
            <p className="text-xs text-yellow-700">Bitte jetzt kopieren und sicher speichern — wird nicht mehr angezeigt.</p>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newSecret); toast.success('Kopiert!') }}>
              Kopieren
            </Button>
          </div>
        )}

        {/* Existing endpoints */}
        {loading ? (
          <p className="text-sm text-gray-400">Lädt…</p>
        ) : endpoints.length === 0 ? (
          <p className="text-sm text-gray-400">Noch keine Endpunkte konfiguriert.</p>
        ) : (
          <div className="space-y-2">
            {endpoints.map(ep => (
              <div key={ep.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-mono text-gray-800 truncate">{ep.url}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{ep.events.join(', ')}</p>
                </div>
                <button
                  onClick={() => handleDelete(ep.id)}
                  className="text-xs text-red-500 hover:text-red-700 shrink-0"
                >
                  Löschen
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create form */}
        <form onSubmit={handleCreate} className="space-y-4 border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700">Neuen Endpunkt hinzufügen</h4>
          <div className="space-y-2">
            <Label htmlFor="webhook-url">URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://meine-app.de/webhook"
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Events</Label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_EVENTS.map(ev => (
                <label key={ev.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(ev.value)}
                    onChange={() => toggleEvent(ev.value)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {ev.label}
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" size="sm" disabled={saving || !url || selectedEvents.length === 0}>
            {saving ? 'Erstellt…' : '+ Endpunkt hinzufügen'}
          </Button>
        </form>
      </div>
    </div>
  )
}
