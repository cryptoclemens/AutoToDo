import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { encrypt, decrypt } from '@/lib/encryption'

const supabaseAdmin = () => createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getWorkspaceAndUser() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null

  const headersList = headers()
  const slug = headersList.get('x-workspace-slug') ?? ''
  const supabase = supabaseAdmin()

  const { data: workspace } = await supabase
    .from('workspaces').select('id').eq('slug', slug).single() as {
      data: { id: string } | null
    }
  if (!workspace) return null

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single() as { data: { role: string } | null }

  return { workspaceId: workspace.id, user, role: member?.role }
}

export async function GET() {
  const ctx = await getWorkspaceAndUser()
  if (!ctx) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = supabaseAdmin()
  const { data } = await supabase
    .from('workspace_llm_config')
    .select('provider, model, encrypted_api_key')
    .eq('workspace_id', ctx.workspaceId)
    .single() as { data: { provider: string; model: string; encrypted_api_key: string } | null }

  if (!data) return NextResponse.json({ configured: false })

  return NextResponse.json({
    configured: true,
    provider: data.provider,
    model: data.model,
    // Return masked key for display
    apiKeyMasked: '••••••••' + decrypt(data.encrypted_api_key).slice(-4),
  })
}

export async function POST(req: NextRequest) {
  const ctx = await getWorkspaceAndUser()
  if (!ctx) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const adminRoles = ['workspace_owner', 'workspace_admin']
  if (!adminRoles.includes(ctx.role ?? '')) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const body = await req.json() as { provider: string; model: string; apiKey: string }
  if (!body.provider || !body.model || !body.apiKey) {
    return NextResponse.json({ error: 'provider, model und apiKey sind erforderlich.' }, { status: 400 })
  }

  const encrypted = encrypt(body.apiKey)
  const supabase = supabaseAdmin()

  const { error } = await supabase
    .from('workspace_llm_config')
    .upsert({
      workspace_id: ctx.workspaceId,
      provider: body.provider,
      model: body.model,
      encrypted_api_key: encrypted,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const ctx = await getWorkspaceAndUser()
  if (!ctx) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const adminRoles = ['workspace_owner', 'workspace_admin']
  if (!adminRoles.includes(ctx.role ?? '')) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const supabase = supabaseAdmin()
  await supabase.from('workspace_llm_config').delete().eq('workspace_id', ctx.workspaceId)

  return NextResponse.json({ ok: true })
}
