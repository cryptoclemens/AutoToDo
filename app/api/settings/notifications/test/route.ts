import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'
import { sendSlackNotification } from '@/lib/slack'

export async function POST(req: Request) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { url?: string }
  const webhookUrl = body.url?.trim()

  if (!webhookUrl) {
    return NextResponse.json({ error: 'Keine Webhook-URL angegeben.' }, { status: 400 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { data: ws } = await supabase
    .from('workspaces')
    .select('name')
    .eq('id', workspace.id)
    .single() as { data: { name: string } | null }

  const workspaceName = ws?.name ?? 'AutoToDo'

  const isTeams =
    webhookUrl.includes('webhook.office.com') ||
    webhookUrl.includes('office365.com') ||
    webhookUrl.includes('powerplatform.com') ||
    webhookUrl.includes('logic.azure.com')

  const platform = isTeams ? 'Microsoft Teams' : 'Slack'

  const testMessage = isTeams
    ? `✅ **AutoToDo Verbindungstest erfolgreich!**\n\nDiese Nachricht bestätigt, dass ${workspaceName} korrekt mit ${platform} verbunden ist. LOP-Benachrichtigungen werden ab jetzt hier erscheinen.`
    : `✅ *AutoToDo Verbindungstest erfolgreich!*\n\nDiese Nachricht bestätigt, dass *${workspaceName}* korrekt mit ${platform} verbunden ist. LOP-Benachrichtigungen werden ab jetzt hier erscheinen.`

  try {
    await sendSlackNotification(webhookUrl, testMessage)
    return NextResponse.json({ ok: true, platform })
  } catch (err) {
    return NextResponse.json(
      { error: `Fehler beim Senden: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}` },
      { status: 500 }
    )
  }
}
