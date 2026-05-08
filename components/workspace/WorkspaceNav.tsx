'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
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
import ThemeToggle from '@/components/ThemeToggle'


interface Props {
  workspace: { id: string; name: string; slug: string; brand_color: string; logo_url: string | null }
  userRole: string
  userId: string
  isSuperAdmin?: boolean
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

function IconSuperAdmin() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline-block">
      <path d="M8 1l1.8 3.6L14 5.5l-3 2.9.7 4.1L8 10.4l-3.7 2.1.7-4.1L2 5.5l4.2-.9L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

function IconDesktop() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline-block">
      <rect x="1" y="2" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 13h6M8 11v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}


interface ProjectLogoData {
  id: string
  logo_url: string | null
  brand_color: string | null
}

export default function WorkspaceNav({ workspace, userRole, userId: _userId, isSuperAdmin }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')
  const locale = useLocale()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktopApp, setIsDesktopApp] = useState(false)
  const [projectLogo, setProjectLogo] = useState<ProjectLogoData | null>(null)

  const projectIdMatch = pathname.match(/\/projects\/([a-f0-9-]{36})/)
  const projectId = projectIdMatch ? projectIdMatch[1] : null

  useEffect(() => {
    setIsDesktopApp(!!window.__autoToDo)
  }, [])

  useEffect(() => {
    if (!projectId) {
      setProjectLogo(null)
      return
    }
    const supabase = createClient()
    supabase
      .from('projects')
      .select('id, logo_url, brand_color')
      .eq('id', projectId)
      .maybeSingle()
      .then(({ data }) => {
        setProjectLogo(data ?? null)
      })
  }, [projectId])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { href: '/dashboard', label: t('dashboard'), icon: <IconDashboard /> },
    ...(isAdmin(userRole) ? [{ href: '/settings', label: t('settings'), icon: <IconSettings /> }] : []),
    ...(isSuperAdmin ? [{ href: '/admin', label: 'Admin', icon: <IconSuperAdmin /> }] : []),
    ...(!isDesktopApp ? [{ href: '/desktop', label: locale === 'en' ? 'Desktop' : 'Desktop-Version', icon: <IconDesktop /> }] : []),
  ]

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-700/50 shadow-sm px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
        {/* Logo / Workspace-Name */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            {workspace.logo_url ? (
              <Image src={workspace.logo_url} alt={workspace.name} width={28} height={28} className="h-7 w-auto object-contain rounded" />
            ) : (
              <span
                className="text-xs font-bold w-8 h-8 flex items-center justify-center rounded-lg text-white shadow-sm"
                style={{ backgroundColor: 'var(--brand, #2563EB)' }}
              >
                {workspace.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm hidden sm:block tracking-tight">
              {workspace.name}
            </span>
          </Link>

          {projectLogo?.logo_url && (
            <div className="flex items-center gap-2">
              <span className="text-gray-300 text-base select-none">›</span>
              <Image
                src={projectLogo.logo_url}
                alt="Project logo"
                width={24}
                height={24}
                className="h-6 w-auto object-contain rounded"
              />
            </div>
          )}

          {/* Desktop Nav-Links */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ href, label, icon }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${active
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <span className={active ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>{icon}</span>
                  {label}
                  {active && (
                    <span
                      className="ml-1 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: 'var(--brand, #2563EB)' }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher currentLocale={locale} />
          <SecurityModal />
          <HowToModal />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors font-medium">
              <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                {userRole.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden sm:inline text-gray-700">Konto</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-lg rounded-xl border-gray-100">
              <div className="px-3 py-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
                {userRole.replace(/_/g, ' ')}
              </div>
              <DropdownMenuSeparator />
              {isAdmin(userRole) && (
                <>
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-lg">
                    {t('settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-600 focus:text-red-600 rounded-lg"
              >
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors
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
              className="flex items-center gap-2 px-3 py-2.5 w-full rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
