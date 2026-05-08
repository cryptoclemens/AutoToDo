import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'

function serviceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Max age in days for notes without a deadline before auto-archiving
const STALE_DAYS: Record<string, number> = {
  info:         14,
  availability: 14,
  risk:         30,
  decision:     30,
}

function isStale(note: { category: string; created_at: string; relevant_until: string | null }): boolean {
  if (note.relevant_until) return false // has deadline — handled separately
  const ageDays = (Date.now() - new Date(note.created_at).getTime()) / 86_400_000
  return ageDays > (STALE_DAYS[note.category] ?? 14)
}

// GET /api/projects/[id]/context-notes
// Side-effect: auto-archives expired and stale notes on each load
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = serviceDb()
  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { data: all } = await supabase
    .from('project_context_notes')
    .select('id, text, category, relevant_from, relevant_until, created_at, transcript_id')
    .eq('project_id', params.id)
    .eq('workspace_id', workspace.id)
    .is('archived_at', null)
    .order('relevant_until', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  const notes = all ?? []
  const today = new Date().toISOString().slice(0, 10)

  // Find notes to auto-archive: past deadline OR stale without deadline
  const toArchive = notes
    .filter(n => (n.relevant_until && n.relevant_until < today) || isStale(n))
    .map(n => n.id)

  if (toArchive.length > 0) {
    await supabase
      .from('project_context_notes')
      .update({ archived_at: new Date().toISOString() })
      .in('id', toArchive)
      .eq('project_id', params.id)
      .eq('workspace_id', workspace.id)
  }

  const active = notes.filter(n => !toArchive.includes(n.id))
  return NextResponse.json({ notes: active, autoArchived: toArchive.length })
}

// PATCH /api/projects/[id]/context-notes
// Body: { noteId }        → archive the note
// Body: { noteId, text } → update note text
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { noteId, text } = body as { noteId?: string; text?: string }
  if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 })

  const supabase = serviceDb()
  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  if (text !== undefined) {
    if (typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'text must be non-empty' }, { status: 400 })
    }
    await supabase
      .from('project_context_notes')
      .update({ text: text.trim() })
      .eq('id', noteId)
      .eq('project_id', params.id)
      .eq('workspace_id', workspace.id)
  } else {
    await supabase
      .from('project_context_notes')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', noteId)
      .eq('project_id', params.id)
      .eq('workspace_id', workspace.id)
  }

  return NextResponse.json({ ok: true })
}
