import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { encrypt } from '@/lib/encryption'
import { resolveWorkspace } from '@/lib/workspace'

const supabaseAdmin = () => createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAdminCtx() {
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

  const isAdmin = ['workspace_owner', 'workspace_admin'].includes(member?.role ?? '')
  return { workspaceId: workspace.id, isAdmin }
}

export async function GET() {
  const ctx = await getAdminCtx()
  if (!ctx) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = supabaseAdmin()
  const { data } = await supabase
    .from('workspace_notion_configs')
    .select('connected_at')
    .eq('workspace_id', ctx.workspaceId)
    .maybeSingle() as { data: { connected_at: string } | null }

  return NextResponse.json({ configured: !!data, connectedAt: data?.connected_at ?? null })
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminCtx()
  if (!ctx) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  if (!ctx.isAdmin) return NextResponse.json({ error: 'Nur Admins dürfen Integrationen konfigurieren.' }, { status: 403 })

  const { token } = await req.json() as { token?: string }
  if (!token?.trim()) return NextResponse.json({ error: 'Kein Token angegeben.' }, { status: 400 })

  // Validate token against Notion API before saving
  const testRes = await fetch('https://api.notion.com/v1/users/me', {
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      'Notion-Version': '2022-06-28',
    },
  })
  if (!testRes.ok) {
    return NextResponse.json({ error: 'Ungültiger Notion-Token. Bitte prüfe den Integration-Token.' }, { status: 400 })
  }

  const encryptedToken = encrypt(token.trim())
  const supabase = supabaseAdmin()
  const { error } = await supabase
    .from('workspace_notion_configs')
    .upsert({
      workspace_id: ctx.workspaceId,
      encrypted_token: encryptedToken,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id' })

  if (error) return NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const ctx = await getAdminCtx()
  if (!ctx) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  if (!ctx.isAdmin) return NextResponse.json({ error: 'Nur Admins dürfen Integrationen entfernen.' }, { status: 403 })

  const supabase = supabaseAdmin()
  await supabase
    .from('workspace_notion_configs')
    .delete()
    .eq('workspace_id', ctx.workspaceId)

  return NextResponse.json({ ok: true })
}
