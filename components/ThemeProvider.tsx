'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    __setTheme: (t: 'light' | 'dark') => void
  }
}

function applyTheme(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('theme', theme)
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial: 'light' | 'dark' = stored ?? (systemDark ? 'dark' : 'light')
    applyTheme(initial)

    window.__setTheme = (theme: 'light' | 'dark') => {
      applyTheme(theme)
    }
  }, [])

  return <>{children}</>
}
