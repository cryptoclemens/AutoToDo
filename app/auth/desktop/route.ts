import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Desktop app auth handoff.
 * After signInWithPassword on the local login page, the desktop app
 * navigates here with tokens as query params to exchange them for
 * proper SSR cookies.
 *
 * GET /auth/desktop?access_token=X&refresh_token=Y
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const access_token = searchParams.get('access_token')
  const refresh_token = searchParams.get('refresh_token')

  if (access_token && refresh_token) {
    const supabase = createClient()
    const { error } = await supabase.auth.setSession({ access_token, refresh_token })
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=desktop_auth_failed`)
}
