import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  brand_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logo_url: z.string().url().nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Admin-Prüfung
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!member || !['workspace_owner', 'workspace_admin'].includes(member.role as string)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const { error } = await supabase
    .from('workspaces')
    .update(parsed.data)
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: 'Aktualisierung fehlgeschlagen.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
