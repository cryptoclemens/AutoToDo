import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'
import { z } from 'zod'

const BUNDESLAENDER = ['BW','BY','BE','BB','HB','HH','HE','MV','NI','NW','RP','SL','SN','ST','SH','TH']

const schema = z.object({
  brand_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  branding_inherited: z.boolean().optional(),
  bundesland: z.string().refine(v => v === null || BUNDESLAENDER.includes(v)).nullable().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).maybeSingle()

  if (!member || !['workspace_owner', 'workspace_admin', 'project_admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.brand_color !== undefined) updates.brand_color = parsed.data.brand_color
  if (parsed.data.branding_inherited !== undefined) updates.branding_inherited = parsed.data.branding_inherited
  if (parsed.data.bundesland !== undefined) updates.bundesland = parsed.data.bundesland

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', params.id)
    .eq('workspace_id', workspace.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Aktualisierung fehlgeschlagen.' }, { status: 500 })

  return NextResponse.json(data)
}
