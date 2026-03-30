'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

const PROVIDERS = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    models: [
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (empfohlen)' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (schnell & günstig)' },
    ],
    needsEndpoint: false,
    keyPlaceholder: 'sk-ant-api03-…',
    keyHint: 'Key aus console.anthropic.com',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o (empfohlen)' },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini (günstig)' },
    ],
    needsEndpoint: false,
    keyPlaceholder: 'sk-…',
    keyHint: 'Key aus platform.openai.com',
  },
  {
    id: 'azure_openai',
    label: 'Azure OpenAI (Microsoft Copilot)',
    models: [
      { id: 'gpt-4o', label: 'gpt-4o' },
      { id: 'gpt-4o-mini', label: 'gpt-4o-mini' },
      { id: 'gpt-4-turbo', label: 'gpt-4-turbo' },
    ],
    needsEndpoint: true,
    keyPlaceholder: 'Azure API Key',
    keyHint: 'Key aus Azure Portal → OpenAI Resource → Schlüssel und Endpunkt',
  },
  {
    id: 'perplexity',
    label: 'Perplexity AI',
    models: [
      { id: 'sonar-pro', label: 'Sonar Pro (empfohlen)' },
      { id: 'sonar', label: 'Sonar (schnell & günstig)' },
      { id: 'sonar-reasoning-pro', label: 'Sonar Reasoning Pro' },
    ],
    needsEndpoint: false,
    keyPlaceholder: 'pplx-…',
    keyHint: 'Key aus perplexity.ai/settings/api',
  },
]

interface Props {
  initial: {
    configured: boolean
    provider?: string
    model?: string
    endpoint?: string
    apiKeyMasked?: string
  }
}

export function LlmSettingsForm({ initial }: Props) {
  const ts = useTranslations('settings')
  const [provider, setProvider] = useState(initial.provider ?? 'anthropic')
  const [model, setModel] = useState(initial.model ?? PROVIDERS[0].models[0].id)
  const [customModel, setCustomModel] = useState('')
  const [endpoint, setEndpoint] = useState(initial.endpoint ?? '')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  const providerData = PROVIDERS.find(p => p.id === provider) ?? PROVIDERS[0]
  const isAzure = provider === 'azure_openai'
  const needsEndpoint = providerData.needsEndpoint

  // For Azure: effective model is customModel if set, otherwise selected model
  const effectiveModel = isAzure && customModel.trim() ? customModel.trim() : model

  const handleProviderChange = (v: string | null) => {
    const p = v ?? 'anthropic'
    setProvider(p)
    const pd = PROVIDERS.find(x => x.id === p) ?? PROVIDERS[0]
    setModel(pd.models[0].id)
    setCustomModel('')
  }

  const handleSave = async () => {
    if (!apiKey && !initial.configured) {
      toast.error(ts('llm.enterApiKey'))
      return
    }
    if (needsEndpoint && !endpoint.trim()) {
      toast.error(ts('llm.enterEndpoint'))
      return
    }
    if (!apiKey && initial.configured) {
      toast.error(ts('llm.enterNewApiKey'))
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/settings/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model: effectiveModel,
          apiKey,
          endpoint: needsEndpoint ? endpoint.trim() : undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Fehler beim Speichern')
      }
      toast.success(ts('llm.saved'))
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
      toast.success(ts('llm.removed'))
      setApiKey('')
      setEndpoint('')
    } catch {
      toast.error(ts('llm.removeError'))
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
            {initial.endpoint && <span className="text-green-500 font-normal"> · {initial.endpoint}</span>}
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

        {/* Endpoint (nur für Provider, die eine URL benötigen, z. B. Azure) */}
        {needsEndpoint && (
          <div className="space-y-1.5">
            <Label>Endpoint-URL</Label>
            <Input
              placeholder="https://mein-resource.openai.azure.com"
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-400">{providerData.keyHint}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>{needsEndpoint ? 'Deployment-Name' : 'Modell'}</Label>
          <Select value={model} onValueChange={v => { setModel(v ?? providerData.models[0].id); setCustomModel('') }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providerData.models.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {needsEndpoint && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Oder eigenen Deployment-Namen eingeben:</p>
              <Input
                placeholder="z.B. mein-gpt4o-deployment"
                value={customModel}
                onChange={e => setCustomModel(e.target.value)}
                className="text-sm"
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>API-Key</Label>
          <Input
            type="password"
            placeholder={initial.configured ? 'Neuen Key eingeben (leer = unverändert)' : (providerData.keyPlaceholder ?? 'API Key')}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-400">
            {providerData.keyHint} · Wird AES-256-GCM verschlüsselt gespeichert.
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
