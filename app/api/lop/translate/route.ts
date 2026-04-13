import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'
import { decrypt } from '@/lib/encryption'
import { translateItems, type TranslateItem } from '@/lib/llm/translate'
import type { LlmConfig } from '@/lib/llm/types'

const BATCH_SIZE = 30

function serviceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = serviceDb()
  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const body = await request.json() as { items: TranslateItem[]; targetLocale: string }
  const { items, targetLocale } = body

  if (!items?.length) return NextResponse.json({ translations: [] })
  if (!['en', 'de'].includes(targetLocale)) {
    return NextResponse.json({ error: 'Ungültige Zielsprache.' }, { status: 400 })
  }

  // Load BYOK extraction key
  const { data: llmConfig } = await supabase
    .from('workspace_llm_config')
    .select('provider, model, encrypted_api_key, endpoint')
    .eq('workspace_id', workspace.id)
    .eq('role', 'extraction')
    .maybeSingle() as {
      data: {
        provider: string; model: string
        encrypted_api_key: string; endpoint: string | null
      } | null
    }

  if (!llmConfig) {
    return NextResponse.json(
      { error: 'Kein LLM-Key konfiguriert. Bitte unter Einstellungen → LLM hinterlegen.' },
      { status: 400 }
    )
  }

  const config: LlmConfig = {
    provider: llmConfig.provider as LlmConfig['provider'],
    model: llmConfig.model,
    apiKey: decrypt(llmConfig.encrypted_api_key),
    endpoint: llmConfig.endpoint ?? undefined,
  }

  try {
    // Batch to avoid token limits
    const all: TranslateItem[] = []
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE)
      const translated = await translateItems(config, batch, targetLocale)
      all.push(...translated)
    }
    return NextResponse.json({ translations: all })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Übersetzung fehlgeschlagen.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
