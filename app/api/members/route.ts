import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'
import { resolveProjectAccess } from '@/lib/projectAccess'

export async function GET(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Bei Projektbezug den Workspace AUS DEM PROJEKT ableiten (auch fremde Firmen),
  // damit die Verantwortlichen-Auswahl die richtigen Mitglieder zeigt.
  const projectId = request.nextUrl.searchParams.get('projectId')
  let workspaceId: string
  if (projectId) {
    const access = await resolveProjectAccess(supabase, user.id, projectId)
    if (!access) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
    workspaceId = access.workspaceId
  } else {
    const home = await resolveWorkspace(supabase, user.id, headers().get('x-workspace-slug') ?? '')
    if (!home) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })
    workspaceId = home.id
  }

  // Workspace members via existing RPC
  const { data: wsMembers, error } = await supabase.rpc('get_workspace_members_with_email', {
    p_workspace_id: workspaceId,
  })

  if (error) {
    return NextResponse.json({ error: 'Fehler beim Laden der Mitglieder.' }, { status: 500 })
  }

  const members = [...(wsMembers ?? [])]
  const seenIds = new Set(members.map((m: { user_id: string }) => m.user_id))

  // Also include project members for this workspace (project-scoped users)
  if (projectId) {
    const { data: pmRows } = await supabase
      .from('project_members')
      .select('user_id, role')
      .eq('project_id', projectId) as { data: Array<{ user_id: string; role: string }> | null }

    if (pmRows?.length) {
      const pmUserIds = pmRows.map(r => r.user_id).filter(id => !seenIds.has(id))
      if (pmUserIds.length) {
        const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
        for (const pmUserId of pmUserIds) {
          const u = users.find(u => u.id === pmUserId)
          if (!u) continue
          const pmRole = pmRows.find(r => r.user_id === pmUserId)?.role ?? 'viewer'
          members.push({
            user_id: u.id,
            role: pmRole,
            email: u.email ?? '',
            display_name: (u.user_metadata?.full_name as string | undefined)
              || (u.user_metadata?.name as string | undefined)
              || u.email
              || u.id,
            joined_at: u.created_at,
          })
        }
      }
    }
  }

  return NextResponse.json(members)
}
