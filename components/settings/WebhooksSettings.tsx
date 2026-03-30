'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

function WebhookHelpPopover() {
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-block align-middle ml-1">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold hover:bg-gray-300 leading-none flex items-center justify-center"
        aria-label="Hilfe"
      >
        ?
      </button>
      {open && (
        <div className="absolute z-50 left-0 top-6 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-xs text-gray-700 space-y-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-base leading-none"
          >
            ×
          </button>

          {/* Slack */}
          <div>
            <p className="font-semibold text-gray-900 mb-1.5 flex items-center gap-1.5">
              <span className="text-base">📢</span> Slack – Webhook-URL einrichten
            </p>
            <ol className="list-decimal list-inside space-y-1 leading-relaxed">
              <li>Öffne <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">api.slack.com/apps</a> und klicke <strong>Create New App</strong></li>
              <li>Wähle <strong>From scratch</strong>, gib einen Namen ein und wähle deinen Workspace</li>
              <li>Links unter <strong>Features</strong> auf <strong>Incoming Webhooks</strong> klicken</li>
              <li>Schalter <strong>Activate Incoming Webhooks</strong> aktivieren</li>
              <li>Unten auf <strong>Add New Webhook to Workspace</strong> klicken</li>
              <li>Kanal auswählen → <strong>Allow</strong></li>
              <li>Die generierte URL (<code className="bg-gray-100 px-1 rounded">https://hooks.slack.com/services/…</code>) kopieren und hier einfügen</li>
            </ol>
          </div>

          <div className="border-t border-gray-100" />

          {/* Teams */}
          <div>
            <p className="font-semibold text-gray-900 mb-1.5 flex items-center gap-1.5">
              <span className="text-base">💬</span> Microsoft Teams – Webhook-URL einrichten
            </p>
            <ol className="list-decimal list-inside space-y-1 leading-relaxed">
              <li>Öffne den gewünschten Teams-<strong>Kanal</strong></li>
              <li>Klicke auf <strong>···</strong> (Mehr Optionen) neben dem Kanalnamen</li>
              <li>Wähle <strong>Connectors</strong> (oder <strong>Workflows</strong> in neuen Teams-Versionen)</li>
              <li>Suche nach <strong>Incoming Webhook</strong> und klicke <strong>Konfigurieren</strong></li>
              <li>Vergib einen Namen (z.B. "AutoToDo"), optional ein Logo hochladen</li>
              <li>Auf <strong>Erstellen</strong> klicken</li>
              <li>Die generierte URL (<code className="bg-gray-100 px-1 rounded">https://…webhook.office.com/…</code>) kopieren und hier einfügen</li>
            </ol>
            <p className="mt-1.5 text-gray-500 italic">
              Neuere Teams-Versionen: Connectors → <strong>Workflows</strong> → &ldquo;Post to a channel when a webhook request is received&rdquo;
            </p>
          </div>
        </div>
      )}
    </span>
  )
}

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

  const isTeams = webhookUrl.includes('webhook.office.com') || webhookUrl.includes('office365.com')
  const isSlack = webhookUrl.includes('hooks.slack.com')

  if (!loaded) return <p className="text-sm text-gray-400">Lädt…</p>

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <p className="text-xs text-gray-500">
        Benachrichtigungen bei neuen und geänderten LOP-Punkten — für Slack und Microsoft Teams.
        <WebhookHelpPopover />
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="url"
            placeholder="https://hooks.slack.com/… oder https://…webhook.office.com/…"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            className="flex-1 pr-16"
          />
          {(isSlack || isTeams) && (
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-1.5 py-0.5 rounded ${
              isTeams ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
            }`}>
              {isTeams ? 'Teams' : 'Slack'}
            </span>
          )}
        </div>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Speichert…' : 'Speichern'}
        </Button>
      </div>
      {webhookUrl && (
        <p className="text-xs text-green-600">
          ✓ Aktiv – LOP-Events werden {isTeams ? 'an Microsoft Teams' : isSlack ? 'an Slack' : 'an diese URL'} gesendet.
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
