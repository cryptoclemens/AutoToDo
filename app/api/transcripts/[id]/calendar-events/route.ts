import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveProjectAccess } from '@/lib/projectAccess'
import { getValidAccessToken, fetchUpcomingEvents, isMicrosoftConfigured } from '@/lib/microsoftCalendar'

function serviceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// GET: bevorstehende Meetings aus dem verbundenen Workspace-Kalender (für die Auswahl im Modal).
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = serviceDb()
  const { data: transcript } = await supabase
    .from('transcripts').select('id, project_id, workspace_id')
    .eq('id', params.id).maybeSingle() as {
      data: { id: string; project_id: string; workspace_id: string } | null
    }
  if (!transcript) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  const access = await resolveProjectAccess(supabase, user.id, transcript.project_id)
  if (!access) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })

  if (!isMicrosoftConfigured()) {
    return NextResponse.json({ connected: false, available: false, events: [] })
  }

  const token = await getValidAccessToken(supabase, transcript.workspace_id)
  if (!token) return NextResponse.json({ connected: false, available: true, events: [] })

  try {
    const events = await fetchUpcomingEvents(token)
    return NextResponse.json({ connected: true, available: true, events })
  } catch {
    return NextResponse.json({ connected: true, available: true, events: [], error: 'Kalenderabruf fehlgeschlagen.' })
  }
}
