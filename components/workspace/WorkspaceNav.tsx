'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  workspace: { id: string; name: string; slug: string; brand_color: string; logo_url: string | null }
  userRole: string
  userId: string
}

const isAdmin = (role: string) =>
  ['workspace_owner', 'workspace_admin'].includes(role)

export default function WorkspaceNav({ workspace, userRole, userId: _userId }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/projects', label: 'Projekte' },
    ...(isAdmin(userRole) ? [{ href: '/settings', label: 'Einstellungen' }] : []),
  ]

  return (
    <nav className="bg-white border-b border-gray-200 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
        {/* Logo / Workspace-Name */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            {workspace.logo_url ? (
              <Image src={workspace.logo_url} alt={workspace.name} width={28} height={28} className="h-7 w-auto object-contain" />
            ) : (
              <span
                className="text-sm font-bold px-2 py-1 rounded text-white"
                style={{ backgroundColor: 'var(--brand, #2563EB)' }}
              >
                {workspace.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="font-semibold text-gray-900 text-sm hidden sm:block">
              {workspace.name}
            </span>
          </Link>

          {/* Nav-Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors
                  ${pathname.startsWith(href)
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Nutzer-Menü */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-50">
            <span className="hidden sm:inline">Konto</span>
            <span>▾</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-xs text-gray-500 font-medium uppercase tracking-wide">
              {userRole.replace('_', ' ')}
            </div>
            <DropdownMenuSeparator />
            {isAdmin(userRole) && (
              <>
                <DropdownMenuItem onClick={() => router.push('/settings/branding')}>
                  Branding
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings/members')}>
                  Team
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings/llm')}>
                  KI-Konfiguration
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings/api')}>
                  API-Keys
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 focus:text-red-600"
            >
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
