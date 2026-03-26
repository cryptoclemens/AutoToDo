import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'
import { z } from 'zod'

const schema = z.object({
  brand_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logo_url: z.string().url().nullable().optional(),
  name: z.string().min(1).max(100).optional(),
})

export async function PATCH(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  // Nur Admins dürfen Branding ändern
  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).single()

  if (!member || !['workspace_owner', 'workspace_admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.brand_color !== undefined) updates.brand_color = parsed.data.brand_color
  if (parsed.data.logo_url !== undefined) updates.logo_url = parsed.data.logo_url
  if (parsed.data.name !== undefined) updates.name = parsed.data.name

  const { data, error } = await supabase
    .from('workspaces').update(updates).eq('id', workspace.id).select().single()

  if (error) return NextResponse.json({ error: 'Aktualisierung fehlgeschlagen.' }, { status: 500 })

  return NextResponse.json(data)
}
