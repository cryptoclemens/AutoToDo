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

// GET /api/projects/[id]/context-notes — active (non-archived) notes for a project
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = serviceDb()
  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('project_context_notes')
    .select('id, text, category, relevant_from, relevant_until, created_at, transcript_id')
    .eq('project_id', params.id)
    .eq('workspace_id', workspace.id)
    .is('archived_at', null)
    .order('relevant_until', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ notes: [] })
  return NextResponse.json({ notes: data ?? [] })
}

// PATCH /api/projects/[id]/context-notes — archive a note { noteId }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { noteId } = await req.json()
  if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 })

  const supabase = serviceDb()
  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  await supabase
    .from('project_context_notes')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('project_id', params.id)
    .eq('workspace_id', workspace.id)

  return NextResponse.json({ ok: true })
}
