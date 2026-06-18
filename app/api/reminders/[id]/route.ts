import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

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

  // Verify ownership before delete
  const { data: reminder } = await supabase
    .from('recurring_reminders')
    .select('id, user_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!reminder) return NextResponse.json({ error: 'Erinnerung nicht gefunden.' }, { status: 404 })
  if (reminder.user_id !== user.id) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })

  const { error } = await supabase
    .from('recurring_reminders')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
