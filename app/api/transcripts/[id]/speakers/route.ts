import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { resolveProjectAccess } from '@/lib/projectAccess'
import { loadMemberRows } from '@/lib/memberRows'
import { buildCandidates, type CalendarAttendee, type SpeakerCandidate } from '@/lib/speakerCandidates'
import type { SpeakerMapEntry } from '@/lib/llm/types'

function serviceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type TranscriptRow = {
  id: string; project_id: string; workspace_id: string
  speaker_map: SpeakerMapEntry[] | null
}

async function loadContext(req: NextRequest, transcriptId: string) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { error: 'Nicht authentifiziert.', status: 401 as const }

  const supabase = serviceDb()
  const { data: transcript } = await supabase
    .from('transcripts')
    .select('id, project_id, workspace_id, speaker_map')
    .eq('id', transcriptId)
    .maybeSingle() as { data: TranscriptRow | null }
  if (!transcript) return { error: 'Nicht gefunden.', status: 404 as const }

  const access = await resolveProjectAccess(supabase, user.id, transcript.project_id)
  if (!access) return { error: 'Keine Berechtigung.', status: 403 as const }

  // Kandidaten: Mitglieder + Kalender-Teilnehmer
  const members = await loadMemberRows(supabase, transcript.workspace_id, transcript.project_id)
  let attendees: CalendarAttendee[] = []
  let calendar: { title: string | null; starts_at: string | null; attendees: CalendarAttendee[] } | null = null
  try {
    const { data: link } = await supabase
      .from('meeting_calendar_links')
      .select('title, starts_at, attendees')
      .eq('transcript_id', transcriptId).maybeSingle() as {
        data: { title: string | null; starts_at: string | null; attendees: CalendarAttendee[] } | null
      }
    if (link) { attendees = link.attendees ?? []; calendar = link }
  } catch { /* Migration 045 noch nicht deployed */ }

  const candidates = buildCandidates(members, attendees)
  return { user, supabase, transcript, access, candidates, calendar }
}

// GET: aktuelle Sprecher-Zuordnung + Kandidaten + Kalender
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await loadContext(req, params.id)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  return NextResponse.json({
    speakerMap: ctx.transcript.speaker_map ?? [],
    candidates: ctx.candidates,
    calendar: ctx.calendar,
    canEdit: ctx.access.canEdit,
  })
}

const patchSchema = z.object({
  assignments: z.array(z.object({
    speaker_label: z.string().min(1),
    matched_user_id: z.string().uuid().nullable().optional(),
    matched_member: z.string().max(120).nullable().optional(),
  })).min(1).max(50),
})

// POST: manuelle Bestätigung/Korrektur der Sprecher-Zuordnung
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await loadContext(req, params.id)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  if (!ctx.access.canEdit) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })

  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })

  const byUserId = new Map<string, SpeakerCandidate>()
  for (const c of ctx.candidates) if (c.user_id) byUserId.set(c.user_id, c)

  // Bestehende Map als Basis, per speaker_label überschreiben
  const map = new Map<string, SpeakerMapEntry>()
  for (const e of ctx.transcript.speaker_map ?? []) map.set(e.speaker_label, e)

  for (const a of parsed.data.assignments) {
    let matched_member: string | null = null
    let matched_user_id: string | null = null
    if (a.matched_user_id) {
      const c = byUserId.get(a.matched_user_id)
      if (c) { matched_member = c.name; matched_user_id = c.user_id }
    } else if (a.matched_member && a.matched_member.trim()) {
      matched_member = a.matched_member.trim()
    }
    map.set(a.speaker_label, {
      speaker_label: a.speaker_label,
      matched_member,
      matched_user_id,
      confidence: 'high',
      source: 'manual',
    })
  }

  const speakerMap = Array.from(map.values())
  const { error } = await ctx.supabase.from('transcripts')
    .update({ speaker_map: speakerMap })
    .eq('id', ctx.transcript.id)
  if (error) return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 })

  return NextResponse.json({ ok: true, speakerMap })
}
