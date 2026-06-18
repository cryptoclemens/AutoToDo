import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/superAdmin'
import { z } from 'zod'

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function checkAdmin() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null
  if (!await isSuperAdmin(user.id)) return null
  return user
}

// GET /api/admin/link-responsible?workspaceId=xxx
// Returns workspace members with display names for the link UI
export async function GET(request: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId')

  const supabase = db()

  if (workspaceId) {
    // Return members for a specific workspace
    const { data: members, error } = await supabase
      .from('workspace_members')
      .select('user_id, role')
      .eq('workspace_id', workspaceId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const enriched = await Promise.all((members ?? []).map(async (m: { user_id: string; role: string }) => {
      const { data: { user: u } } = await supabase.auth.admin.getUserById(m.user_id)
      return {
        user_id: m.user_id,
        role: m.role,
        email: u?.email ?? '',
        display_name: u?.user_metadata?.full_name || u?.user_metadata?.name || u?.email || m.user_id,
      }
    }))

    return NextResponse.json(enriched)
  }

  // No workspaceId — return all workspaces for selection
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name')
    .order('name')

  return NextResponse.json(workspaces ?? [])
}

const linkSchema = z.object({
  freetext: z.string().min(1),
  userId: z.string().uuid(),
  workspaceId: z.string().uuid(),
})

// POST /api/admin/link-responsible
// Links a freetext responsible name to a real user account
export async function POST(request: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

  const body = await request.json()
  const parsed = linkSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })

  const { freetext, userId, workspaceId } = parsed.data

  const supabase = db()

  // Get the user's display name
  const { data: { user: targetUser } } = await supabase.auth.admin.getUserById(userId)
  if (!targetUser) return NextResponse.json({ error: 'Nutzer nicht gefunden.' }, { status: 404 })

  const displayName =
    targetUser.user_metadata?.full_name ||
    targetUser.user_metadata?.name ||
    targetUser.email ||
    userId

  // Update all lop_items in this workspace where responsible matches freetext
  const { count, error } = await supabase
    .from('lop_items')
    .update({
      responsible_user_id: userId,
      responsible: displayName,
    })
    .eq('workspace_id', workspaceId)
    .eq('responsible', freetext)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, updated: count ?? 0, displayName })
}
