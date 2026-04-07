'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(stored ?? (systemDark ? 'dark' : 'light'))
  }, [])

  function toggle() {
    const next: 'light' | 'dark' = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    window.__setTheme(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
    >
      {theme === 'dark' ? (
        <Sun size={16} />
      ) : (
        <Moon size={16} />
      )}
    </button>
  )
}
