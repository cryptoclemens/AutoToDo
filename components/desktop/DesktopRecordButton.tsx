'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  projectId: string
}

type RecordState = 'idle' | 'recording' | 'paused' | 'transcribing'

interface AutoToDoBridge {
  startRecording: () => Promise<void>
  pauseRecording: () => Promise<void>
  resumeRecording: () => Promise<void>
  stopRecording: () => Promise<string | null>
  isRecording: () => boolean
  isPaused: () => boolean
  setTranscriptHandler: (fn: (transcript: string) => void) => void
  clearTranscriptHandler: () => void
}

function getBridge(): AutoToDoBridge | null {
  if (typeof window === 'undefined') return null
  return (window as unknown as { __autoToDo?: AutoToDoBridge }).__autoToDo ?? null
}

export default function DesktopRecordButton({ projectId }: Props) {
  const router = useRouter()
  const [recordState, setRecordState] = useState<RecordState>('idle')
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const bridgeAvailable = useRef(false)

  useEffect(() => {
    setIsMounted(true)
    bridgeAvailable.current = !!getBridge()
  }, [])

  const handleTranscript = useCallback(async (transcript: string) => {
    setRecordState('transcribing')
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/transcripts', {
        method: 'POST',
        body: (() => {
          const fd = new FormData()
          fd.append('projectId', projectId)
          fd.append('text', transcript)
          fd.append('meetingDate', new Date().toISOString().slice(0, 10))
          return fd
        })(),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Unbekannter Fehler')
      } else {
        setResult({ created: data.itemsCreated ?? 0, updated: data.itemsUpdated ?? 0 })
        router.refresh()
      }
    } catch {
      setError('Netzwerkfehler beim Speichern des Transkripts.')
    } finally {
      setRecordState('idle')
    }
  }, [projectId, router])

  useEffect(() => {
    const bridge = getBridge()
    if (!bridge) return
    bridge.setTranscriptHandler(handleTranscript)
    return () => {
      bridge.clearTranscriptHandler()
    }
  }, [handleTranscript])

  if (!isMounted || !getBridge()) return null

  async function handleStart() {
    const bridge = getBridge()
    if (!bridge) return
    setError(null)
    setResult(null)
    await bridge.startRecording()
    setRecordState('recording')
  }

  async function handlePause() {
    const bridge = getBridge()
    if (!bridge) return
    await bridge.pauseRecording()
    setRecordState('paused')
  }

  async function handleResume() {
    const bridge = getBridge()
    if (!bridge) return
    await bridge.resumeRecording()
    setRecordState('recording')
  }

  async function handleStop() {
    const bridge = getBridge()
    if (!bridge) return
    setRecordState('transcribing')
    await bridge.stopRecording()
    // transcript is handled by the registered handler above
  }

  return (
    <div className="flex items-center gap-2">
      {recordState === 'idle' && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          onClick={handleStart}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2" />
          Aufnahme starten
        </Button>
      )}

      {recordState === 'recording' && (
        <>
          <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Aufnahme läuft
          </span>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={handlePause}>
            ⏸ Pause
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50" onClick={handleStop}>
            ■ Stopp
          </Button>
        </>
      )}

      {recordState === 'paused' && (
        <>
          <span className="flex items-center gap-1.5 text-sm text-amber-600 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            Pausiert
          </span>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={handleResume}>
            ▶ Weiter
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50" onClick={handleStop}>
            ■ Stopp
          </Button>
        </>
      )}

      {recordState === 'transcribing' && (
        <span className="flex items-center gap-1.5 text-sm text-slate-500">
          <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Transkribiere &amp; verarbeite…
        </span>
      )}

      {result && recordState === 'idle' && (
        <span className="text-sm text-green-600 font-medium">
          ✓ {result.created} neu · {result.updated} aktualisiert
        </span>
      )}

      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  )
}
