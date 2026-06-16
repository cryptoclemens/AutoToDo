import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'
import { z } from 'zod'

const itemSchema = z.object({
  title: z.string().min(1).max(300),
  priority: z.enum(['hoch', 'mittel', 'niedrig']).optional(),
  due_offset_days: z.number().int().min(0).max(365).optional(),
})

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  items: z.array(itemSchema).min(1).max(50),
})

function getSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAdminWorkspace(supabase: ReturnType<typeof getSupabase>, userId: string) {
  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, userId, slug)
  if (!workspace) return null

  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', userId).single() as { data: { role: string } | null }

  if (!member || !['workspace_owner', 'workspace_admin'].includes(member.role)) return null
  return workspace
}

export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = getSupabase()
  const workspace = await getAdminWorkspace(supabase, user.id)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden oder keine Berechtigung.' }, { status: 403 })

  const { data: templates } = await supabase
    .from('lop_templates')
    .select('id, name, items, created_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false }) as {
      data: Array<{ id: string; name: string; items: unknown[]; created_at: string }> | null
    }

  return NextResponse.json({ templates: templates ?? [] })
}

export async function POST(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = getSupabase()
  const workspace = await getAdminWorkspace(supabase, user.id)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden oder keine Berechtigung.' }, { status: 403 })

  const body = await request.json()
  const parsed = templateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Vorlage.' }, { status: 400 })

  const { data: tmpl, error } = await supabase
    .from('lop_templates')
    .insert({ workspace_id: workspace.id, name: parsed.data.name, items: parsed.data.items })
    .select('id, name, items, created_at')
    .single() as { data: { id: string; name: string; items: unknown[]; created_at: string } | null; error: unknown }

  if (error || !tmpl) return NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 })
  return NextResponse.json(tmpl, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: 'Ungültige ID.' }, { status: 400 })

  const supabase = getSupabase()
  const workspace = await getAdminWorkspace(supabase, user.id)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden oder keine Berechtigung.' }, { status: 403 })

  await supabase.from('lop_templates').delete().eq('id', id).eq('workspace_id', workspace.id)
  return NextResponse.json({ ok: true })
}
