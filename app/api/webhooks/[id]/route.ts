import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check ownership via workspace membership
  const { data: endpoint } = await supabase
    .from('webhook_endpoints')
    .select('workspace_id')
    .eq('id', params.id)
    .single()

  if (!endpoint) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', (endpoint as { workspace_id: string }).workspace_id)
    .eq('user_id', user.id)
    .single()

  const adminRoles = ['workspace_owner', 'workspace_admin']
  if (!member || !adminRoles.includes((member as { role: string }).role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  await supabase.from('webhook_endpoints').delete().eq('id', params.id)

  return NextResponse.json({ ok: true })
}
