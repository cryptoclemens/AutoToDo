import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/superAdmin'

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

  const supabase = db()

  const [
    { data: workspaces },
    { data: memberCounts },
    { data: projectCounts },
    { data: lopCounts },
    { data: transcriptCounts },
    { data: latestLop },
  ] = await Promise.all([
    supabase.from('workspaces').select('id, name, slug, plan, created_at').order('created_at', { ascending: false }),
    supabase.from('workspace_members').select('workspace_id'),
    supabase.from('projects').select('workspace_id').is('archived_at', null),
    supabase.from('lop_items').select('workspace_id, created_at').order('created_at', { ascending: false }),
    supabase.from('transcripts').select('workspace_id'),
    supabase.from('lop_items').select('workspace_id, created_at').order('created_at', { ascending: false }).limit(500),
  ])

  // Build count maps
  const members: Record<string, number> = {}
  for (const r of memberCounts ?? []) members[r.workspace_id] = (members[r.workspace_id] ?? 0) + 1

  const projects: Record<string, number> = {}
  for (const r of projectCounts ?? []) projects[r.workspace_id] = (projects[r.workspace_id] ?? 0) + 1

  const lop: Record<string, number> = {}
  for (const r of lopCounts ?? []) lop[r.workspace_id] = (lop[r.workspace_id] ?? 0) + 1

  const transcripts: Record<string, number> = {}
  for (const r of transcriptCounts ?? []) transcripts[r.workspace_id] = (transcripts[r.workspace_id] ?? 0) + 1

  const lastActivity: Record<string, string> = {}
  for (const r of latestLop ?? []) {
    if (!lastActivity[r.workspace_id]) lastActivity[r.workspace_id] = r.created_at
  }

  const enriched = (workspaces ?? []).map(ws => ({
    ...ws,
    memberCount: members[ws.id] ?? 0,
    projectCount: projects[ws.id] ?? 0,
    lopCount: lop[ws.id] ?? 0,
    transcriptCount: transcripts[ws.id] ?? 0,
    lastActivity: lastActivity[ws.id] ?? null,
  }))

  return NextResponse.json(enriched)
}
