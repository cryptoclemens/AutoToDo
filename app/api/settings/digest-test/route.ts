import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'

const supabaseAdmin = () => createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Sends a real test digest email to the currently authenticated admin user. */
export async function POST() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const slug = headers().get('x-workspace-slug') ?? ''
  const supabase = supabaseAdmin()
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).single() as { data: { role: string } | null }
  if (!['workspace_owner', 'workspace_admin'].includes(member?.role ?? '')) {
    return NextResponse.json({ error: 'Nur Admins.' }, { status: 403 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY ist nicht gesetzt. Bitte in den Vercel Environment Variables hinterlegen.' }, { status: 500 })

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://autotodo.vencly.com').replace(/\/$/, '')
  const displayName = (user.user_metadata?.full_name as string | undefined) || user.email

  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:#1e293b;padding:24px 32px;">
      <span style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-.3px;">AutoToDo</span>
      <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Test-E-Mail – Tägliche Zusammenfassung</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 8px;font-size:16px;color:#1e293b;">Hallo ${displayName},</p>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;">
        Dies ist eine <strong>Test-E-Mail</strong> vom AutoToDo Digest-System.<br>
        Wenn du diese E-Mail siehst, ist die E-Mail-Konfiguration korrekt eingerichtet! ✓
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;">
        <p style="margin:0;font-size:14px;color:#15803d;font-weight:600;">✓ RESEND_API_KEY ist gesetzt und funktioniert</p>
        <p style="margin:6px 0 0;font-size:13px;color:#166534;">Der echte Digest wird Mo–Fr um 16:00 UTC (18:00 CEST) gesendet – sofern offene LOP-Punkte mit zugeordneten Mitgliedern vorhanden sind.</p>
      </div>
    </div>
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">
        Einstellungen: <a href="${appUrl}/settings" style="color:#2563eb;text-decoration:none;">${appUrl}/settings</a>
      </p>
    </div>
  </div>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? 'AutoToDo <noreply@vencly.app>',
      to: user.email,
      subject: '✓ AutoToDo Test-E-Mail – Digest-Konfiguration OK',
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json({ error: `Resend-Fehler: ${res.status} – ${body}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sentTo: user.email })
}
