import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { resolveWorkspace } from '@/lib/workspace'

const schema = z.object({
  digest_enabled: z.boolean(),
})

export async function PATCH(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  // Admin-Check
  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).single()

  const adminRoles = ['workspace_owner', 'workspace_admin']
  if (!member || !adminRoles.includes((member as { role: string }).role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const { error } = await supabase
    .from('workspaces')
    .update({ digest_enabled: parsed.data.digest_enabled })
    .eq('id', workspace.id)

  if (error) return NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
