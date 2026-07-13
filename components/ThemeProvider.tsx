'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    __setTheme: (t: 'light' | 'dark') => void
  }
}

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isDesktop = typeof window !== 'undefined' && !!window.__TAURI__

    // Web-/Online-Version: IMMER Light-Mode erzwingen – auch wenn das System im
    // Dark-Mode läuft (schlechte Lesbarkeit in Safari & Co.). Dark-Mode bleibt der
    // nativen Desktop-App (Tauri) vorbehalten.
    if (!isDesktop) {
      applyTheme('light')
      window.__setTheme = () => applyTheme('light')
      return
    }

    // Desktop-App: gespeicherte bzw. System-Präferenz respektieren + Umschalten erlauben
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(stored ?? (systemDark ? 'dark' : 'light'))

    window.__setTheme = (theme: 'light' | 'dark') => {
      applyTheme(theme)
      localStorage.setItem('theme', theme)
    }
  }, [])

  return <>{children}</>
}
