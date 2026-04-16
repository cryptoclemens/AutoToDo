import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveWorkspace } from '@/lib/workspace'
import { headers } from 'next/headers'
import { runTranscriptProcessing } from '@/lib/processTranscript'

// Allow up to 300s for LLM processing on Vercel Pro
export const maxDuration = 300

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  // Verify transcript belongs to this workspace and user has permission
  const { data: transcript } = await supabase
    .from('transcripts')
    .select('id, workspace_id')
    .eq('id', params.id)
    .eq('workspace_id', workspace.id)
    .single() as { data: { id: string; workspace_id: string } | null }

  if (!transcript) return NextResponse.json({ error: 'Transkript nicht gefunden.' }, { status: 404 })

  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).single() as {
      data: { role: string } | null
    }
  if (!member || member.role === 'viewer') {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  // Reset status to pending so processing can restart
  await supabase.from('transcripts')
    .update({ processing_status: 'pending', processing_error: null, error_message: null })
    .eq('id', params.id)

  const result = await runTranscriptProcessing(params.id)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, itemsCreated: result.itemsCreated, itemsUpdated: result.itemsUpdated })
}
