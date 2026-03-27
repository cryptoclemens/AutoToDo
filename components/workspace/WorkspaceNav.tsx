'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import HowToModal from '@/components/HowToModal'
import SecurityModal from '@/components/SecurityModal'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface Props {
  workspace: { id: string; name: string; slug: string; brand_color: string; logo_url: string | null }
  userRole: string
  userId: string
}

const isAdmin = (role: string) =>
  ['workspace_owner', 'workspace_admin'].includes(role)

function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline-block">
      <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity=".8" />
      <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity=".8" />
      <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" opacity=".8" />
      <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity=".8" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline-block">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function WorkspaceNav({ workspace, userRole, userId: _userId }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')
  const locale = useLocale()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { href: '/dashboard', label: t('dashboard'), icon: <IconDashboard /> },
    ...(isAdmin(userRole) ? [{ href: '/settings', label: t('settings'), icon: <IconSettings /> }] : []),
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

          {/* Desktop Nav-Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors
                  ${pathname.startsWith(href)
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <span className={pathname.startsWith(href) ? 'text-gray-700' : 'text-gray-400'}>{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLocale={locale} />
          <SecurityModal />
          <HowToModal />

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-50 hidden md:flex">
              <span className="hidden sm:inline">Konto</span>
              <span>▾</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-xs text-gray-500 font-medium uppercase tracking-wide">
                {userRole.replace(/_/g, ' ')}
              </div>
              <DropdownMenuSeparator />
              {isAdmin(userRole) && (
                <>
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    {t('settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-600 focus:text-red-600"
              >
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-gray-50"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Menü"
          >
            <span className={`block w-5 h-0.5 bg-gray-600 transition-transform ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-600 transition-opacity ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-gray-600 transition-transform ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
          {navLinks.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-colors
                ${pathname.startsWith(href)
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="text-gray-400">{icon}</span>
              {label}
            </Link>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              onClick={() => { setMobileOpen(false); handleSignOut() }}
              className="flex items-center gap-2 px-3 py-2.5 w-full rounded-md text-sm text-red-600 hover:bg-red-50"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
