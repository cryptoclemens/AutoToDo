import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  // Verify transcript belongs to this workspace
  const { data: transcript } = await supabase
    .from('transcripts')
    .select('id, project_id')
    .eq('id', params.id)
    .eq('workspace_id', workspace.id)
    .single()
  if (!transcript) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: items } = await supabase
    .from('lop_items')
    .select('id, title, responsible, status, source, due_date, priority')
    .eq('transcript_id', params.id)
    .eq('project_id', transcript.project_id)
    .order('created_at', { ascending: true }) as {
      data: Array<{
        id: string; title: string; responsible: string | null
        status: string; source: string | null; due_date: string | null; priority: string | null
      }> | null
    }

  const created = (items ?? []).filter(i => i.source === 'ai')
  const updated = (items ?? []).filter(i => i.source !== 'ai')

  return NextResponse.json({ created, updated })
}
