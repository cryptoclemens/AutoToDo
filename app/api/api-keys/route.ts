import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'
import { generateApiKey } from '@/lib/apiKeyAuth'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  scope: z.array(z.enum(['read', 'write'])).default(['read']),
  expires_at: z.string().datetime().nullable().optional(),
})

async function getAdminContext() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return null

  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).single()

  if (!member || !['workspace_owner', 'workspace_admin'].includes(member.role)) return null

  return { user, supabase, workspace }
}

export async function GET() {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })

  const { data } = await ctx.supabase
    .from('api_keys')
    .select('id, name, key_prefix, scope, expires_at, last_used_at, created_at, revoked_at')
    .eq('workspace_id', ctx.workspace.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const { key, prefix, hash } = generateApiKey()

  const { data, error } = await ctx.supabase
    .from('api_keys')
    .insert({
      workspace_id: ctx.workspace.id,
      name: parsed.data.name,
      key_hash: hash,
      key_prefix: prefix,
      scope: parsed.data.scope,
      expires_at: parsed.data.expires_at ?? null,
      created_by: ctx.user.id,
    })
    .select('id, name, key_prefix, scope, expires_at, created_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'API-Key konnte nicht erstellt werden.' }, { status: 500 })
  }

  // Key wird nur einmal zurückgegeben
  return NextResponse.json({ ...data, key })
}
