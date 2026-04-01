import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PROTECTED_PATHS = ['/dashboard', '/projects', '/settings', '/onboarding', '/admin']

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'autotodo.vencly.com'
  const pathname = request.nextUrl.pathname

  // Workspace subdomain only when hostname is truly <slug>.appDomain
  const isWorkspaceSubdomain =
    hostname.endsWith(`.${appDomain}`) &&
    !hostname.startsWith('www.') &&
    !hostname.startsWith('api.')

  if (isWorkspaceSubdomain) {
    const slug = hostname.replace(`.${appDomain}`, '').split(':')[0]
    const { supabaseResponse, user } = await updateSession(request)
    supabaseResponse.headers.set('x-workspace-slug', slug)

    if (PROTECTED_PATHS.some(p => pathname.startsWith(p)) && !user) {
      const url = new URL('/login', request.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    if (user && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // Single-domain deployment (Vercel, localhost) and root domain
  // Public paths: no auth needed
  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // Protected paths: enforce auth
  const { supabaseResponse, user } = await updateSession(request)
  if (!user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
