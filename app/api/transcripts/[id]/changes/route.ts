import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveProjectAccess } from '@/lib/projectAccess'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Transkript per ID laden, Zugriff über dessen Projekt-Workspace prüfen
  const { data: transcript } = await supabase
    .from('transcripts')
    .select('id, project_id')
    .eq('id', params.id)
    .maybeSingle() as { data: { id: string; project_id: string } | null }
  if (!transcript) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const access = await resolveProjectAccess(supabase, user.id, transcript.project_id)
  if (!access) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: items } = await supabase
    .from('lop_items')
    .select('id, title, responsible, status, source, due_date, priority, ai_suggestion')
    .eq('transcript_id', params.id)
    .eq('project_id', transcript.project_id)
    .order('created_at', { ascending: true }) as {
      data: Array<{
        id: string; title: string; responsible: string | null
        status: string; source: string | null; due_date: string | null
        priority: string | null; ai_suggestion: string | null
      }> | null
    }

  // Discriminate by ai_suggestion: new items don't have it set (not written on insert),
  // updated items always have it (ai_suggestion = JSON.stringify(action) on update).
  // Using source==='ai' is wrong because previously AI-created items that are *updated*
  // by this transcript also have source==='ai'.
  const created = (items ?? []).filter(i => i.ai_suggestion === null)
  const updated = (items ?? []).filter(i => i.ai_suggestion !== null)

  return NextResponse.json({ created, updated })
}
