import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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
    // Create the redirect response first so cookies can be attached directly to it.
    // Using createClient() from @/lib/supabase/server writes to next/headers cookieStore
    // which is NOT reflected on a manually created NextResponse — this pattern avoids that.
    const response = NextResponse.redirect(`${origin}/dashboard`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.setSession({ access_token, refresh_token })
    if (!error) {
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=desktop_auth_failed`)
}
