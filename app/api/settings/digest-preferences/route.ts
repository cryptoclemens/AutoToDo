import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'
import { z } from 'zod'

const VALID_FREQUENCIES = ['workspace_default', 'daily', 'twice_weekly', 'weekly', 'disabled'] as const
const schema = z.object({
  frequency: z.enum(VALID_FREQUENCIES),
})

export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { data } = await supabase
    .from('user_digest_preferences')
    .select('frequency')
    .eq('user_id', user.id)
    .eq('workspace_id', workspace.id)
    .maybeSingle() as { data: { frequency: string } | null }

  return NextResponse.json({ frequency: data?.frequency ?? 'workspace_default' })
}

export async function PATCH(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Häufigkeit.' }, { status: 400 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  await supabase
    .from('user_digest_preferences')
    .upsert({
      user_id: user.id,
      workspace_id: workspace.id,
      frequency: parsed.data.frequency,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,workspace_id' })

  return NextResponse.json({ ok: true })
}
