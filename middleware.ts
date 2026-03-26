import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = ['/login', '/register', '/invite', '/auth', '/_next', '/favicon.ico']
const PROTECTED_PATHS = ['/dashboard', '/projects', '/settings', '/onboarding']

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'autotodo.app'

  // Subdomain extrahieren
  const subdomain = hostname
    .replace(`.${appDomain}`, '')
    .replace(':3000', '') // Lokale Entwicklung
    .split(':')[0]

  const isRootDomain = subdomain === appDomain || subdomain === 'www' || subdomain === 'localhost'
  const isApiSubdomain = subdomain === 'api'

  // Root-Domain → Marketing + Auth (kein Workspace-Kontext)
  if (isRootDomain || isApiSubdomain) {
    return NextResponse.next()
  }

  // Workspace-Subdomain → Session auffrischen + Kontext injizieren
  const { supabaseResponse, user } = await updateSession(request)

  // Workspace-Slug in Header für Server Components
  supabaseResponse.headers.set('x-workspace-slug', subdomain)

  // Auth-Schutz: Geschützte Routen nur für eingeloggte Nutzer
  const pathname = request.nextUrl.pathname
  const isProtectedPath = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  if (isProtectedPath && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Eingeloggte Nutzer von Auth-Seiten wegschicken
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Alle Anfragen außer:
     * - _next/static (statische Dateien)
     * - _next/image (Bildoptimierung)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
