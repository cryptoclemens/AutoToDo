import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/superAdmin'
import { z } from 'zod'

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

export async function GET() {
  if (!await assertAdmin()) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 403 })
  }

  const supabase = serviceClient()

  const { data, error } = await supabase
    .from('feedback')
    .select(`
      id,
      message,
      category,
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
  const userIds = [...new Set((data ?? []).map(f => f.user_id).filter(Boolean))]
  const emailMap: Record<string, string> = {}
  for (const uid of userIds) {
    try {
      const { data: u } = await supabase.auth.admin.getUserById(uid)
      if (u?.user?.email) emailMap[uid] = u.user.email
    } catch {
      // ignorieren
    }
  }

  const rows = (data ?? []).map(f => ({
    id: f.id,
    message: f.message,
    category: f.category ?? 'general',
    status: f.status ?? 'new',
    created_at: f.created_at,
    workspace_name: (f.workspaces as { name?: string } | null)?.name ?? null,
    user_email: f.user_id ? (emailMap[f.user_id] ?? f.user_id) : null,
  }))

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
