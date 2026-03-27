import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const LEGAL_VERSION = '2026-03-27'

export async function POST(_request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from('user_consents')
    .upsert(
      { user_id: user.id, legal_version: LEGAL_VERSION, accepted_at: new Date().toISOString() },
      { onConflict: 'user_id,legal_version' }
    )

  if (error) return NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
