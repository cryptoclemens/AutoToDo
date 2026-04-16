'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RetryButton({ transcriptId }: { transcriptId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleRetry() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/transcripts/${transcriptId}/retry`, { method: 'POST' })
      const data = await res.json() as { error?: string; itemsCreated?: number }
      if (!res.ok) {
        setError(data.error ?? `Fehler (${res.status})`)
      } else {
        router.refresh()
      }
    } catch {
      setError('Netzwerkfehler – bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={handleRetry}
        disabled={loading}
        className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:no-underline"
      >
        {loading ? 'Wird verarbeitet…' : 'Erneut verarbeiten'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
