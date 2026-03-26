'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Polls every 5s when transcripts are being processed
export default function TranscriptsRefresher() {
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh()
    }, 5000)
    return () => clearInterval(timer)
  }, [router])

  return null
}
