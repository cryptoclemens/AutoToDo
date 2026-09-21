import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { resolveProjectAccess } from '@/lib/projectAccess'
import { deriveSpeakerStubs, type DiarSeg } from '@/lib/diarization'
import type { SpeakerMapEntry } from '@/lib/llm/types'

function serviceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const schema = z.object({
  diarization: z.array(z.object({
    start: z.number(),
    end: z.number(),
    speaker_cluster: z.string().min(1).max(64),
    text: z.string().max(20_000).optional().default(''),
  })).max(5000),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = serviceDb()
  const { data: transcript } = await supabase
    .from('transcripts').select('id, project_id, speaker_map')
    .eq('id', params.id).maybeSingle() as {
      data: { id: string; project_id: string; speaker_map: SpeakerMapEntry[] | null } | null
    }
  if (!transcript) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  const access = await resolveProjectAccess(supabase, user.id, transcript.project_id)
  if (!access || !access.canEdit) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  const diar = parsed.data.diarization as DiarSeg[]

  const update: Record<string, unknown> = { diarization: diar }
  // speaker_map nur befüllen, wenn noch nichts zugeordnet wurde (Bestätigungen nicht überschreiben)
  const existing = transcript.speaker_map ?? []
  if (existing.length === 0) update.speaker_map = deriveSpeakerStubs(diar)

  const { error } = await supabase.from('transcripts').update(update).eq('id', transcript.id)
  if (error) return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 })

  const clusters = new Set(diar.map(d => d.speaker_cluster)).size
  return NextResponse.json({ ok: true, clusters })
}
