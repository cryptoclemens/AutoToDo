import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const schema = z.object({
  workspaceId: z.string().uuid(),
  emails: z.array(z.string().email()).min(1).max(20),
  role: z.enum(['editor', 'viewer', 'project_admin', 'workspace_admin']),
})

export async function POST(request: NextRequest) {
  const authClient = createAuthClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const { workspaceId, emails, role } = parsed.data

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Prüfen ob Nutzer Admin-Rechte hat
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!member || !['workspace_owner', 'workspace_admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const invitations = emails.map(email => ({
    workspace_id: workspaceId,
    email,
    role,
    token: randomUUID(),
    invited_by: user.id,
  }))

  const { error } = await supabase.from('invitations').insert(invitations)
  if (error) {
    return NextResponse.json({ error: 'Einladungen konnten nicht gespeichert werden.' }, { status: 500 })
  }

  // TODO: E-Mails via Resend senden (Phase 1, Meilenstein 3.4)

  return NextResponse.json({ ok: true, count: invitations.length })
}
