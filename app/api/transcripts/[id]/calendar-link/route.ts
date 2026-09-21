import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { resolveProjectAccess } from '@/lib/projectAccess'
import { parseIcs } from '@/lib/ics'

function serviceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function auth(req: NextRequest, transcriptId: string) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { error: 'Nicht authentifiziert.', status: 401 as const }
  const supabase = serviceDb()
  const { data: transcript } = await supabase
    .from('transcripts').select('id, project_id, workspace_id')
    .eq('id', transcriptId).maybeSingle() as {
      data: { id: string; project_id: string; workspace_id: string } | null
    }
  if (!transcript) return { error: 'Nicht gefunden.', status: 404 as const }
  const access = await resolveProjectAccess(supabase, user.id, transcript.project_id)
  if (!access || !access.canEdit) return { error: 'Keine Berechtigung.', status: 403 as const }
  return { user, supabase, transcript }
}

const schema = z.object({
  ics: z.string().max(500_000).optional(),
  title: z.string().max(300).nullable().optional(),
  starts_at: z.string().datetime().nullable().optional(),
  attendees: z.array(z.object({
    name: z.string().max(120).nullable().optional(),
    email: z.string().email().nullable().optional(),
  })).max(200).optional(),
})

// POST: Kalender-Verknüpfung setzen (aus .ics oder manuell)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await auth(req, params.id)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })

  let title = parsed.data.title ?? null
  let starts_at = parsed.data.starts_at ?? null
  let ends_at: string | null = null
  let attendees = (parsed.data.attendees ?? []).map(a => ({ name: a.name ?? null, email: a.email ?? null }))
  let provider: 'ics' | 'manual' = 'manual'

  if (parsed.data.ics && parsed.data.ics.trim()) {
    const ev = parseIcs(parsed.data.ics)
    provider = 'ics'
    title = title ?? ev.title ?? null
    starts_at = starts_at ?? ev.starts_at ?? null
    ends_at = ev.ends_at ?? null
    if (attendees.length === 0) attendees = ev.attendees.map(a => ({ name: a.name ?? null, email: a.email ?? null }))
  }

  if (attendees.length === 0) {
    return NextResponse.json({ error: 'Keine Teilnehmer gefunden.' }, { status: 400 })
  }

  const { data, error } = await ctx.supabase.from('meeting_calendar_links')
    .upsert({
      transcript_id: ctx.transcript.id,
      workspace_id: ctx.transcript.workspace_id,
      provider,
      title,
      starts_at,
      ends_at,
      attendees,
      created_by: ctx.user.id,
    }, { onConflict: 'transcript_id' })
    .select('title, starts_at, attendees')
    .single()

  if (error) return NextResponse.json({ error: 'Verknüpfung fehlgeschlagen.' }, { status: 500 })
  return NextResponse.json({ ok: true, calendar: data })
}

// DELETE: Kalender-Verknüpfung entfernen
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await auth(req, params.id)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  await ctx.supabase.from('meeting_calendar_links').delete().eq('transcript_id', ctx.transcript.id)
  return NextResponse.json({ ok: true })
}
