'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function switchLocale(locale: string) {
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    })
    startTransition(() => router.refresh())
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
