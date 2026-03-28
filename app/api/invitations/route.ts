import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { checkSeatLimit } from '@/lib/plan-gate'

const schema = z.object({
  workspaceId: z.string().uuid(),
  emails: z.array(z.string().email()).min(1).max(20),
  role: z.enum(['editor', 'viewer', 'project_admin', 'workspace_admin']),
  projectId: z.string().uuid().optional(),
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

  const { workspaceId, emails, role, projectId } = parsed.data

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

  // Plan-Gate: Seat-Limit prüfen
  const { data: ws } = await supabase
    .from('workspaces').select('plan, plan_expires_at').eq('id', workspaceId).single() as {
      data: { plan: string; plan_expires_at: string | null } | null
    }
  const seatGate = await checkSeatLimit(supabase, workspaceId, (ws?.plan ?? 'beta') as import('@/lib/plans').Plan, ws?.plan_expires_at)
  if (!seatGate.allowed) {
    return NextResponse.json({ error: seatGate.reason, upgradeHint: seatGate.upgradeHint }, { status: 402 })
  }

  // If projectId provided, validate project belongs to workspace
  if (projectId) {
    const { data: project } = await supabase
      .from('projects').select('id')
      .eq('id', projectId).eq('workspace_id', workspaceId).single()
    if (!project) {
      return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })
    }
  }

  const invitations = emails.map(email => ({
    workspace_id: workspaceId,
    email,
    role,
    token: randomBytes(32).toString('hex'),
    invited_by: user.id,
    project_id: projectId ?? null,
  }))

  const { data: inserted, error } = await supabase
    .from('invitations')
    .insert(invitations)
    .select('email, token')
  if (error || !inserted) {
    return NextResponse.json({ error: 'Einladungen konnten nicht gespeichert werden.' }, { status: 500 })
  }

  // E-Mail-Versand via Resend (optional, wenn RESEND_API_KEY gesetzt)
  if (process.env.RESEND_API_KEY) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autotodo.app'
    for (const inv of inserted) {
      const inviteUrl = `${appUrl}/invite/${inv.token}`
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? 'AutoToDo <noreply@autotodo.app>',
          to: [inv.email],
          subject: 'Du wurdest zu AutoToDo eingeladen',
          html: `<p>Hallo,</p>
<p>Du wurdest eingeladen, AutoToDo beizutreten.</p>
<p><a href="${inviteUrl}" style="background:#2563EB;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Einladung annehmen</a></p>
<p style="color:#666;font-size:12px">Dieser Link ist 7 Tage gültig.</p>`,
        }),
      }).catch(() => { /* E-Mail-Fehler nicht als kritisch behandeln */ })
    }
  }

  return NextResponse.json({
    ok: true,
    count: inserted.length,
    tokens: inserted.map((i: { email: string; token: string }) => ({ email: i.email, token: i.token })),
  })
}
