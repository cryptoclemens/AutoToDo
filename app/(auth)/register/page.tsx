'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LegalModal from '@/components/legal/LegalModal'
import { useTranslations } from 'next-intl'

const LLM_PROVIDERS = [
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    placeholder: 'sk-ant-api03-…',
    models: [
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (empfohlen)' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (schnell & günstig)' },
    ],
    needsEndpoint: false,
    apiKeyHint: 'Den API-Key findest du in der Anthropic Console unter',
    apiKeyLinkLabel: 'console.anthropic.com → API Keys',
    apiKeyLink: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'openai',
    label: 'OpenAI (GPT)',
    placeholder: 'sk-…',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o (empfohlen)' },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini (günstig)' },
    ],
    needsEndpoint: false,
    apiKeyHint: 'Den API-Key findest du im OpenAI Developer Portal unter',
    apiKeyLinkLabel: 'platform.openai.com → API Keys',
    apiKeyLink: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'azure_openai',
    label: 'Azure OpenAI (Microsoft)',
    placeholder: 'Azure API-Key',
    models: [
      { id: 'gpt-4o', label: 'gpt-4o' },
      { id: 'gpt-4o-mini', label: 'gpt-4o-mini' },
    ],
    needsEndpoint: true,
    apiKeyHint: 'Den API-Key findest du im Azure Portal unter deiner Azure OpenAI-Ressource →',
    apiKeyLinkLabel: 'portal.azure.com → Keys and Endpoint',
    apiKeyLink: 'https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/OpenAI',
  },
]

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, c => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] ?? c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const [step, setStep] = useState<'account' | 'workspace' | 'llm'>('account')
  const [existingUserId, setExistingUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        // Check if user already has a workspace — if so, go to dashboard
        const { data: membership } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', data.user.id)
          .limit(1)
          .maybeSingle()
        if (membership) {
          router.replace('/dashboard')
          return
        }
        setExistingUserId(data.user.id)
        setStep('workspace')
      }
    })
  }, [router])

  // Account
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agbAccepted, setAgbAccepted] = useState(false)

  // Workspace
  const [workspaceName, setWorkspaceName] = useState('')
  const [slug, setSlug] = useState('')
  const [friendsCode, setFriendsCode] = useState('')

  // LLM (optional)
  const [llmProvider, setLlmProvider] = useState('anthropic')
  const [llmModel, setLlmModel] = useState('claude-sonnet-4-6')
  const [llmApiKey, setLlmApiKey] = useState('')
  const [llmEndpoint, setLlmEndpoint] = useState('')
  const [llmSaving, setLlmSaving] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const providerData = LLM_PROVIDERS.find(p => p.id === llmProvider) ?? LLM_PROVIDERS[0]

  function handleWorkspaceNameChange(value: string) {
    setWorkspaceName(value)
    setSlug(slugify(value))
  }

  function handleLlmProviderChange(v: string) {
    setLlmProvider(v)
    const pd = LLM_PROVIDERS.find(p => p.id === v) ?? LLM_PROVIDERS[0]
    setLlmModel(pd.models[0].id)
    setLlmEndpoint('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (step === 'account') {
      if (password.length < 8) { setError(t('errorPasswordLength')); return }
      if (!agbAccepted) { setError(t('errorAgbRequired')); return }
      setError('')
      setStep('workspace')
      return
    }

    if (step === 'workspace') {
      setError('')
      setLoading(true)

      const supabase = createClient()
      let userId = existingUserId

      if (!userId) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (authError) { setError(authError.message); setLoading(false); return }
        if (!authData.user) { setError(t('errorRegisterFailed')); setLoading(false); return }
        userId = authData.user.id
      }

      // Legal consent speichern (fire-and-forget, non-blocking)
      fetch('/api/legal/consent', { method: 'POST' }).catch(() => {})

      // Auto-accept any pending invitations for this email (fire-and-forget)
      fetch('/api/workspaces', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {})

      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName, slug, userId }),
      })

      if (!res.ok) {
        const { error: wsError } = await res.json()
        setError(wsError ?? t('errorWorkspaceFailed'))
        setLoading(false)
        return
      }

      // Redeem friends code if provided (non-blocking on error)
      if (friendsCode.trim()) {
        await fetch('/api/friends-code/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: friendsCode.trim().toUpperCase() }),
        }).catch(() => {})
      }

      setLoading(false)
      setStep('llm')
      return
    }
  }

  async function handleLlmSave() {
    if (!llmApiKey.trim()) { router.push('/onboarding'); router.refresh(); return }
    if (providerData.needsEndpoint && !llmEndpoint.trim()) {
      setError('Bitte Endpoint-URL eingeben oder diesen Schritt überspringen.')
      return
    }
    setLlmSaving(true)
    try {
      const res = await fetch('/api/settings/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: llmProvider,
          model: llmModel,
          apiKey: llmApiKey,
          endpoint: providerData.needsEndpoint ? llmEndpoint.trim() : undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ?? 'Fehler beim Speichern der KI-Konfiguration.')
        setLlmSaving(false)
        return
      }
    } catch {
      // Non-blocking: proceed even if save fails
    }
    router.push('/onboarding')
    router.refresh()
  }

  // Step indicator
  const stepNum = step === 'account' ? 1 : step === 'workspace' ? 2 : 3

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3].map(n => (
            <div key={n} className={`h-1.5 rounded-full flex-1 transition-colors ${n <= stepNum ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>
        <CardTitle>{t('registerTitle')}</CardTitle>
        <CardDescription>
          {step === 'account' && t('step1')}
          {step === 'workspace' && t('step2')}
          {step === 'llm' && t('step3')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Steps 1 & 2 share a form */}
        {step !== 'llm' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 'account' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">{t('fullName')}</Label>
                  <Input id="name" type="text" placeholder={t('namePlaceholder')} value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input id="email" type="email" placeholder={t('emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Input id="password" type="password" placeholder={t('passwordPlaceholder')} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
                </div>
                <div className="flex items-start gap-3 pt-1">
                  <input
                    id="agb" type="checkbox" checked={agbAccepted} onChange={e => setAgbAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="agb" className="text-sm text-gray-600 cursor-pointer leading-snug">
                    <LegalModal initialTab="agb" trigger={<span className="text-blue-600 hover:underline font-medium">{t('agbLink')}</span>} />{' '}
                    {t('agbAnd')}{' '}
                    <LegalModal initialTab="datenschutz" trigger={<span className="text-blue-600 hover:underline font-medium">{t('datenschutzLink')}</span>} />{' '}
                    {t('agbSuffix')}
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="workspaceName">{t('workspaceName')}</Label>
                  <Input id="workspaceName" type="text" placeholder={t('workspaceNamePlaceholder')} value={workspaceName} onChange={e => handleWorkspaceNameChange(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="friendsCode">
                    Friends-Code{' '}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="friendsCode"
                    type="text"
                    placeholder="FRIEND-XXXXXX"
                    value={friendsCode}
                    onChange={e => setFriendsCode(e.target.value.toUpperCase())}
                    className="font-mono text-sm tracking-wider"
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-400">
                    Hast du einen Friends-Code erhalten? Gib ihn hier ein und erhalte vollen Team-Zugang.
                  </p>
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}

            <div className="flex gap-2">
              {step === 'workspace' && (
                <Button type="button" variant="outline" onClick={() => setStep('account')} className="flex-1">{t('back')}</Button>
              )}
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? t('creating') : t('continue')}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: optional LLM */}
        {step === 'llm' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs text-blue-700">{t('llmHint')}</p>
            </div>

            <div className="space-y-2">
              <Label>{t('llmProvider')}</Label>
              <select
                value={llmProvider}
                onChange={e => handleLlmProviderChange(e.target.value)}
                className="w-full h-9 text-sm border border-input rounded-md px-3 bg-background"
              >
                {LLM_PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>{t('llmModel')}</Label>
              <select
                value={llmModel}
                onChange={e => setLlmModel(e.target.value)}
                className="w-full h-9 text-sm border border-input rounded-md px-3 bg-background"
              >
                {providerData.models.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {providerData.needsEndpoint && (
              <div className="space-y-2">
                <Label>{t('llmEndpoint')}</Label>
                <Input
                  placeholder="https://mein-resource.openai.azure.com"
                  value={llmEndpoint}
                  onChange={e => setLlmEndpoint(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-400">{t('llmEndpointHint')}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('llmApiKey')}</Label>
              <Input
                type="password"
                placeholder={providerData.placeholder}
                value={llmApiKey}
                onChange={e => setLlmApiKey(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-400">
                {providerData.apiKeyHint}{' '}
                <a
                  href={providerData.apiKeyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  {providerData.apiKeyLinkLabel}
                </a>
              </p>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { router.push('/onboarding'); router.refresh() }}>
                {t('skip')}
              </Button>
              <Button type="button" className="flex-1" disabled={llmSaving} onClick={handleLlmSave}>
                {llmSaving ? t('saving') : t('saveAndFinish')}
              </Button>
            </div>
          </div>
        )}

        {step === 'account' && (
          <p className="text-center text-sm text-gray-500 mt-4">
            {t('alreadyRegistered')}{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">{t('login')}</Link>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
