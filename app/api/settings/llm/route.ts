import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { encrypt, decrypt } from '@/lib/encryption'
import { resolveWorkspace } from '@/lib/workspace'

type Role = 'extraction' | 'transcription'

const supabaseAdmin = () => createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getWorkspaceAndUser() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null

  const slug = headers().get('x-workspace-slug') ?? ''
  const supabase = supabaseAdmin()

  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return null

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single() as { data: { role: string } | null }

  return { workspaceId: workspace.id, user, role: member?.role }
}

function formatConfig(data: { provider: string; model: string; encrypted_api_key: string; endpoint: string | null } | null) {
  if (!data) return { configured: false }
  return {
    configured: true,
    provider: data.provider,
    model: data.model,
    endpoint: data.endpoint ?? undefined,
    apiKeyMasked: '••••••••' + decrypt(data.encrypted_api_key).slice(-4),
  }
}

export async function GET() {
  const ctx = await getWorkspaceAndUser()
  if (!ctx) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = supabaseAdmin()
  const { data: rows } = await supabase
    .from('workspace_llm_config')
    .select('role, provider, model, encrypted_api_key, endpoint')
    .eq('workspace_id', ctx.workspaceId) as {
      data: Array<{ role: string; provider: string; model: string; encrypted_api_key: string; endpoint: string | null }> | null
    }

  const extraction = (rows ?? []).find(r => r.role === 'extraction') ?? null
  const transcription = (rows ?? []).find(r => r.role === 'transcription') ?? null

  return NextResponse.json({
    extraction: formatConfig(extraction),
    transcription: formatConfig(transcription),
  })
}

export async function POST(req: NextRequest) {
  const ctx = await getWorkspaceAndUser()
  if (!ctx) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const adminRoles = ['workspace_owner', 'workspace_admin']
  if (!adminRoles.includes(ctx.role ?? '')) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const body = await req.json() as { role?: string; provider: string; model: string; apiKey: string; endpoint?: string }
  const role: Role = (body.role === 'transcription' ? 'transcription' : 'extraction')

  if (!body.provider || !body.model || !body.apiKey) {
    return NextResponse.json({ error: 'provider, model und apiKey sind erforderlich.' }, { status: 400 })
  }
  if (body.provider === 'azure_openai' && !body.endpoint) {
    return NextResponse.json({ error: 'Endpoint-URL ist für Azure OpenAI erforderlich.' }, { status: 400 })
  }

  const encrypted = encrypt(body.apiKey)
  const supabase = supabaseAdmin()

  const { error } = await supabase
    .from('workspace_llm_config')
    .upsert({
      workspace_id: ctx.workspaceId,
      role,
      provider: body.provider,
      model: body.model,
      encrypted_api_key: encrypted,
      key_preview: body.apiKey.slice(0, 4) + "..." + body.apiKey.slice(-4),
      endpoint: body.endpoint ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,role' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const ctx = await getWorkspaceAndUser()
  if (!ctx) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const adminRoles = ['workspace_owner', 'workspace_admin']
  if (!adminRoles.includes(ctx.role ?? '')) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const role: Role = searchParams.get('role') === 'transcription' ? 'transcription' : 'extraction'

  const supabase = supabaseAdmin()
  await supabase
    .from('workspace_llm_config')
    .delete()
    .eq('workspace_id', ctx.workspaceId)
    .eq('role', role)

  return NextResponse.json({ ok: true })
}
