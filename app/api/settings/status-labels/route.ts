import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'
import { z } from 'zod'

const labelSchema = z.object({
  offen: z.string().max(40).optional(),
  in_bearbeitung: z.string().max(40).optional(),
  abgeschlossen: z.string().max(40).optional(),
  geparkt: z.string().max(40).optional(),
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

  const { data: ws } = await supabase
    .from('workspaces').select('status_labels').eq('id', workspace.id).single() as {
      data: { status_labels: Record<string, string> | null } | null
    }

  return NextResponse.json({ labels: ws?.status_labels ?? {} })
}

export async function PATCH(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = labelSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Labels.' }, { status: 400 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { data: member } = await supabase
    .from('workspace_members').select('role').eq('workspace_id', workspace.id).eq('user_id', user.id).single() as { data: { role: string } | null }
  if (!member || !['workspace_owner', 'workspace_admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  // Nur nicht-leere Labels speichern; leere Strings = auf Standard zurücksetzen
  const labels: Record<string, string> = {}
  for (const [key, val] of Object.entries(parsed.data)) {
    if (val && val.trim()) labels[key] = val.trim()
  }

  await supabase.from('workspaces').update({ status_labels: Object.keys(labels).length > 0 ? labels : null }).eq('id', workspace.id)
  return NextResponse.json({ ok: true, labels })
}
