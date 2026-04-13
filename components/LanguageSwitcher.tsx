'use client'

import { useState } from 'react'

export default function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const [isPending, setIsPending] = useState(false)

  async function switchLocale(locale: string) {
    if (locale === currentLocale) return
    setIsPending(true)
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    })
    // Full reload ensures Server Components re-read the new locale cookie
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      <button
        onClick={() => switchLocale('de')}
        disabled={isPending}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          currentLocale === 'de'
            ? 'text-gray-900 bg-gray-100'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        DE
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={() => switchLocale('en')}
        disabled={isPending}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          currentLocale === 'en'
            ? 'text-gray-900 bg-gray-100'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        EN
      </button>
    </div>
  )
}
