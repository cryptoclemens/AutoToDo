import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { checkGuestLimit } from '@/lib/plan-gate'

const inviteSchema = z.object({
  email: z.string().email(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify user is workspace member for this project
  const { data: project } = await supabase
    .from('projects').select('id, workspace_id').eq('id', params.id).single() as {
      data: { id: string; workspace_id: string } | null
    }
  if (!project) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })

  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', project.workspace_id).eq('user_id', user.id).single()
  if (!member) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })

  const { data: guests } = await supabase
    .from('project_guests')
    .select('id, email, expires_at, accepted_at, created_at')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ guests: guests ?? [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige E-Mail.' }, { status: 400 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: project } = await supabase
    .from('projects').select('id, workspace_id').eq('id', params.id).single() as {
      data: { id: string; workspace_id: string } | null
    }
  if (!project) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })

  // Only admins+ may invite guests
  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', project.workspace_id).eq('user_id', user.id).single() as {
      data: { role: string } | null
    }
  const allowedRoles = ['workspace_owner', 'workspace_admin', 'project_admin']
  if (!member || !allowedRoles.includes(member.role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  // Plan-Gate: Gast-Limit prüfen
  const { data: ws } = await supabase
    .from('workspaces').select('plan, plan_expires_at').eq('id', project.workspace_id).single() as {
      data: { plan: string; plan_expires_at: string | null } | null
    }
  const guestGate = await checkGuestLimit(supabase, params.id, (ws?.plan ?? 'beta') as import('@/lib/plans').Plan, ws?.plan_expires_at)
  if (!guestGate.allowed) {
    return NextResponse.json({ error: guestGate.reason, upgradeHint: guestGate.upgradeHint }, { status: 402 })
  }

  const token = randomBytes(32).toString('hex')

  const { data: guest, error } = await supabase
    .from('project_guests')
    .insert({
      workspace_id: project.workspace_id,
      project_id: params.id,
      email: parsed.data.email,
      token,
      invited_by: user.id,
    })
    .select('id, email, token, expires_at')
    .single() as { data: { id: string; email: string; token: string; expires_at: string } | null; error: unknown }

  if (error || !guest) {
    // Check for unique constraint violation (duplicate email)
    const errMsg = (error as { message?: string })?.message ?? ''
    if (errMsg.includes('unique') || errMsg.includes('duplicate')) {
      return NextResponse.json({ error: 'Gast wurde bereits eingeladen.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Einladung fehlgeschlagen.' }, { status: 500 })
  }

  // Send guest invite email via Resend (optional)
  if (process.env.RESEND_API_KEY) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autotodo.app'
    const guestUrl = `${appUrl}/guest/${guest.token}`
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? 'AutoToDo <noreply@autotodo.app>',
        to: [guest.email],
        subject: 'Du wurdest als Gast zu einem Projekt eingeladen',
        html: `<p>Hallo,</p>
<p>Du hast Lesezugriff auf ein AutoToDo-Projekt erhalten.</p>
<p><a href="${guestUrl}" style="background:#2563EB;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Projekt ansehen</a></p>
<p style="color:#666;font-size:12px">Dieser Link ist 30 Tage gültig und erfordert keine Registrierung.</p>`,
      }),
    }).catch(() => { /* E-Mail-Fehler nicht als kritisch behandeln */ })
  }

  return NextResponse.json({ id: guest.id, email: guest.email, token: guest.token, expiresAt: guest.expires_at }, { status: 201 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const guestId = searchParams.get('guestId')
  if (!guestId) return NextResponse.json({ error: 'guestId erforderlich.' }, { status: 400 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: project } = await supabase
    .from('projects').select('id, workspace_id').eq('id', params.id).single() as {
      data: { id: string; workspace_id: string } | null
    }
  if (!project) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })

  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', project.workspace_id).eq('user_id', user.id).single() as {
      data: { role: string } | null
    }
  const allowedRoles = ['workspace_owner', 'workspace_admin', 'project_admin']
  if (!member || !allowedRoles.includes(member.role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  await supabase.from('project_guests').delete().eq('id', guestId).eq('project_id', params.id)

  return NextResponse.json({ ok: true })
}
