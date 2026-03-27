import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveWorkspace } from '@/lib/workspace'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { z } from 'zod'

const createSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
})

export async function GET(_request: NextRequest) {
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
    .from('webhook_endpoints')
    .select('id, url, events, active, created_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  // Only admins can manage webhooks
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single()

  const adminRoles = ['workspace_owner', 'workspace_admin']
  if (!member || !adminRoles.includes((member as { role: string }).role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const secret = crypto.randomBytes(32).toString('hex')

  const { data, error } = await supabase
    .from('webhook_endpoints')
    .insert({ workspace_id: workspace.id, url: parsed.data.url, events: parsed.data.events, secret })
    .select('id, url, events, active, created_at, secret')
    .single()

  if (error) return NextResponse.json({ error: 'Erstellen fehlgeschlagen.' }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
