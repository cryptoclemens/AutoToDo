'use client'

import { useState, useEffect } from 'react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_notice_dismissed')) setVisible(true)
  }, [])

  if (!visible) return null

  function dismiss() {
    localStorage.setItem('cookie_notice_dismissed', '1')
    setVisible(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs text-gray-600">
          Diese Website verwendet ausschließlich technisch notwendige Cookies für die
          Authentifizierung (§ 25 Abs. 2 TDDDG). Es werden keine Tracking- oder
          Analyse-Cookies eingesetzt.
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 text-xs font-medium bg-gray-900 text-white rounded-md px-3 py-1.5 hover:bg-gray-700 transition-colors"
        >
          Verstanden
        </button>
      </div>
    </div>
  )
}
