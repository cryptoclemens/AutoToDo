import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/superAdmin'
import { z } from 'zod'
import { readFileSync } from 'fs'
import { join } from 'path'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function assertAdmin() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null
  if (!await isSuperAdmin(user.id)) return null
  return user
}

async function syncFeedbackMd(supabase: ReturnType<typeof serviceClient>) {
  try {
    const md = readFileSync(join(process.cwd(), 'feedback.md'), 'utf-8')
    // Jede Eintrags-Überschrift, z.B.:
    //   ## F-018 | 2026-05-14 | ✨ Feature-Wunsch | Status: bearbeitet
    //   ## F-027 | 2026-06-03 07:16:32 | ✨ Feature-Wunsch | ✅ bearbeitet
    //   ## F-002 | 2026-04-02 08:20:28 | ✨ Feature-Wunsch | Status: gestrichen
    // Der Resttext der Zeile entscheidet über den Status; ohne Marker bleibt der Eintrag offen.
    const pattern = /^## ([FBG])-(\d+)\b(.*)$/gm
    type Row = { category: string; category_seq: number; status: 'done' | 'rejected' }
    const toUpdate: Row[] = []
    let match = pattern.exec(md)
    while (match !== null) {
      const rest = match[3]
      // "gestrichen"/"abgelehnt" → rejected, sonst "bearbeitet"/"erledigt" → done
      const status: Row['status'] | null = /gestrichen|abgelehnt/i.test(rest)
        ? 'rejected'
        : /bearbeitet|erledigt/i.test(rest)
          ? 'done'
          : null
      if (status) {
        const prefix = match[1]
        const seq = parseInt(match[2], 10)
        const category = prefix === 'F' ? 'feature' : prefix === 'B' ? 'bug' : 'general'
        toUpdate.push({ category, category_seq: seq, status })
      }
      match = pattern.exec(md)
    }
    for (const row of toUpdate) {
      await supabase.from('feedback')
        .update({ status: row.status })
        .eq('category', row.category)
        .eq('category_seq', row.category_seq)
        // nur offene/in Prüfung befindliche Einträge angleichen – manuell gesetzte
        // Status (done/rejected) werden nicht überschrieben
        .in('status', ['new', 'in_review'])
    }
  } catch {
    // feedback.md nicht verfügbar — kein Fehler
  }
}

export async function GET() {
  if (!await assertAdmin()) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 403 })
  }

  const supabase = serviceClient()
  await syncFeedbackMd(supabase)

  const { data, error } = await supabase
    .from('feedback')
    .select(`
      id,
      message,
      category,
      category_seq,
      status,
      created_at,
      workspace_id,
      user_id,
      workspaces ( name )
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Nutzer-Emails via Auth Admin API laden
  const userIds = Array.from(new Set((data ?? []).map(f => f.user_id).filter(Boolean)))
  const emailMap: Record<string, string> = {}
  for (const uid of userIds) {
    try {
      const { data: u } = await supabase.auth.admin.getUserById(uid)
      if (u?.user?.email) emailMap[uid] = u.user.email
    } catch {
      // ignorieren
    }
  }

  const rows = (data ?? []).map(f => {
    const cat = f.category ?? 'general'
    const prefix = cat === 'feature' ? 'F' : cat === 'bug' ? 'B' : 'G'
    const feedbackId = f.category_seq ? `${prefix}-${String(f.category_seq).padStart(3, '0')}` : null
    return {
      id: f.id,
      feedback_id: feedbackId,
      message: f.message,
      category: cat,
      status: f.status ?? 'new',
      created_at: f.created_at,
      workspace_name: (f.workspaces as { name?: string } | null)?.name ?? null,
      user_email: f.user_id ? (emailMap[f.user_id] ?? f.user_id) : null,
    }
  })

  return NextResponse.json(rows)
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['new', 'in_review', 'done', 'rejected']),
})

export async function PATCH(request: NextRequest) {
  if (!await assertAdmin()) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const supabase = serviceClient()
  const { error } = await supabase
    .from('feedback')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
