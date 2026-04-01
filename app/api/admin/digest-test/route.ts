import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/superAdmin'

/** Super-admin only: calls the daily-digest endpoint in dry_run mode and returns diagnostics. */
export async function GET(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  if (!(await isSuperAdmin(user.id))) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 })

  // Call the digest endpoint in dry_run mode, injecting the CRON_SECRET if set
  const origin = req.nextUrl.origin
  const cronSecret = process.env.CRON_SECRET
  const headers: Record<string, string> = {}
  if (cronSecret) headers['Authorization'] = `Bearer ${cronSecret}`

  const res = await fetch(`${origin}/api/cron/daily-digest?dry_run=true`, { headers })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
