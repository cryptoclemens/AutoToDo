'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const PROVIDERS = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    models: [
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (empfohlen)' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (schnell & günstig)' },
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o (empfohlen)' },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini (günstig)' },
    ],
  },
]

interface Props {
  initial: {
    configured: boolean
    provider?: string
    model?: string
    apiKeyMasked?: string
  }
}

export function LlmSettingsForm({ initial }: Props) {
  const [provider, setProvider] = useState(initial.provider ?? 'anthropic')
  const [model, setModel] = useState(initial.model ?? PROVIDERS[0].models[0].id)
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  const providerData = PROVIDERS.find(p => p.id === provider) ?? PROVIDERS[0]

  const handleProviderChange = (v: string | null) => {
    const p = v ?? 'anthropic'
    setProvider(p)
    const pd = PROVIDERS.find(x => x.id === p) ?? PROVIDERS[0]
    setModel(pd.models[0].id)
  }

  const handleSave = async () => {
    if (!apiKey) {
      toast.error('Bitte API-Key eingeben.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/settings/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, apiKey }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Fehler beim Speichern')
      }
      toast.success('LLM-Konfiguration gespeichert.')
      setApiKey('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await fetch('/api/settings/llm', { method: 'DELETE' })
      toast.success('LLM-Konfiguration entfernt.')
      setApiKey('')
    } catch {
      toast.error('Fehler beim Entfernen.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="space-y-6">
      {initial.configured && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
          <span className="text-green-600 text-sm font-medium">
            LLM konfiguriert: {initial.provider} / {initial.model}
          </span>
          <span className="text-gray-400 text-xs font-mono ml-auto">{initial.apiKeyMasked}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Provider</Label>
          <Select value={provider} onValueChange={v => handleProviderChange(v ?? null)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Modell</Label>
          <Select value={model} onValueChange={v => setModel(v ?? providerData.models[0].id)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providerData.models.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>API-Key</Label>
          <Input
            type="password"
            placeholder={initial.configured ? 'Neuen Key eingeben (leer = unverändert)' : 'sk-ant-... oder sk-...'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-400">
            Der Key wird AES-256-GCM verschlüsselt gespeichert. Kein Klartext in der Datenbank.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
          {saving ? 'Speichern…' : 'Speichern'}
        </Button>
        {initial.configured && (
          <Button variant="outline" onClick={handleRemove} disabled={removing} className="text-red-600 border-red-200 hover:bg-red-50">
            {removing ? 'Entfernen…' : 'API-Key entfernen'}
          </Button>
        )}
      </div>
    </div>
  )
}
