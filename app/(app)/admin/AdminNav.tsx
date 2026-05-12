'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Übersicht' },
  { href: '/admin/workspaces', label: 'Workspaces' },
  { href: '/admin/feedback', label: 'Feedback' },
  { href: '/admin/steuerung', label: 'Steuerung' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <div className="border-b border-gray-200 mb-6">
      <div className="flex items-center gap-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-3 py-3">
          Super-Admin
        </span>
        {links.map(({ href, label }) => {
          const active = href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
