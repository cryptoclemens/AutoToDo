'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RetryButton({ transcriptId }: { transcriptId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRetry() {
    setLoading(true)
    try {
      await fetch(`/api/transcripts/${transcriptId}/retry`, { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRetry}
      disabled={loading}
      className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:no-underline"
    >
      {loading ? 'Wird verarbeitet…' : 'Erneut verarbeiten'}
    </button>
  )
}
