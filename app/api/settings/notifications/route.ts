import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { resolveWorkspace } from '@/lib/workspace'

const patchSchema = z.object({
  digest_enabled: z.boolean().optional(),
  digest_frequency: z.enum(['daily', 'twice_weekly', 'weekly', 'disabled']).optional(),
  slack_webhook_url: z.string().url().nullable().optional(),
  bundesland: z.string().nullable().optional(),
})

async function getAdminWorkspace(user: { id: string }) {
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

  const adminRoles = ['workspace_owner', 'workspace_admin']
  if (!member || !adminRoles.includes((member as { role: string }).role)) return null

  return { supabase, workspace }
}

export async function GET(_request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const ctx = await getAdminWorkspace(user)
  if (!ctx) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })

  const { data } = await ctx.supabase
    .from('workspaces')
    .select('digest_enabled, digest_frequency, slack_webhook_url, bundesland')
    .eq('id', ctx.workspace.id)
    .single()

  return NextResponse.json(data ?? {})
}

export async function PATCH(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })

  const ctx = await getAdminWorkspace(user)
  if (!ctx) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })

  const updates: Record<string, unknown> = {}
  if (parsed.data.digest_enabled !== undefined) updates.digest_enabled = parsed.data.digest_enabled
  if (parsed.data.digest_frequency !== undefined) {
    updates.digest_frequency = parsed.data.digest_frequency
    updates.digest_enabled = parsed.data.digest_frequency !== 'disabled'
  }
  if ('slack_webhook_url' in parsed.data) updates.slack_webhook_url = parsed.data.slack_webhook_url
  if ('bundesland' in parsed.data) updates.bundesland = parsed.data.bundesland

  const { error } = await ctx.supabase
    .from('workspaces')
    .update(updates)
    .eq('id', ctx.workspace.id)

  if (error) return NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
