import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { resolveProjectAccess } from '@/lib/projectAccess'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin(projectId: string) {
  const authClient = createAuthClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { error: 'Nicht authentifiziert.', status: 401, user: null }

  const supabase = serviceClient()
  // Zugriff über den Workspace DES PROJEKTS (nicht Heimat-Workspace): Admin nötig
  const access = await resolveProjectAccess(supabase, user.id, projectId)
  if (!access || !access.canAdmin) {
    return { error: 'Keine Berechtigung.', status: 403, user: null }
  }
  return { error: null, status: 200, user, supabase }
}

/** GET /api/projects/[id]/members — list project members */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(params.id)
  if (auth.error || !auth.supabase) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase } = auth

  const { data, error } = await supabase
    .from('project_members')
    .select('user_id, role, joined_at')
    .eq('project_id', params.id)

  if (error) return NextResponse.json({ error: 'Fehler beim Laden.' }, { status: 500 })

  // Enrich with user emails
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const userMap = Object.fromEntries(users.map(u => [u.id, { email: u.email, display_name: u.user_metadata?.display_name ?? u.user_metadata?.full_name ?? null }]))

  const members = (data ?? []).map(m => ({
    user_id: m.user_id,
    role: m.role,
    joined_at: m.joined_at,
    email: userMap[m.user_id]?.email ?? null,
    display_name: userMap[m.user_id]?.display_name ?? null,
  }))

  return NextResponse.json(members)
}

/** DELETE /api/projects/[id]/members?userId=<uuid> — remove a project member */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(params.id)
  if (auth.error || !auth.supabase) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase } = auth

  const userId = new URL(req.url).searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Fehlende userId.' }, { status: 400 })

  await supabase.from('project_members').delete()
    .eq('project_id', params.id).eq('user_id', userId)

  return NextResponse.json({ ok: true })
}
