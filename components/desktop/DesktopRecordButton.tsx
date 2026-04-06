'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  projectId: string
}

type RecordState = 'idle' | 'checking' | 'needs-model' | 'downloading' | 'recording' | 'paused' | 'transcribing'

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

declare global {
  interface Window {
    __autoToDo?: AutoToDoBridge
    __TAURI__?: {
      core: { invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T> }
      event: { listen: <T>(event: string, cb: (e: { payload: T }) => void) => Promise<() => void> }
    }
  }
}

function getBridge(): AutoToDoBridge | null {
  if (typeof window === 'undefined') return null
  return window.__autoToDo ?? null
}

function getTauri() {
  if (typeof window === 'undefined') return null
  return window.__TAURI__ ?? null
}

export default function DesktopRecordButton({ projectId }: Props) {
  const router = useRouter()
  const [recordState, setRecordState] = useState<RecordState>('idle')
  const [downloadProgress, setDownloadProgress] = useState('')
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  const handleTranscript = useCallback(async (transcript: string) => {
    setRecordState('transcribing')
    setError(null)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('projectId', projectId)
      fd.append('text', transcript)
      fd.append('meetingDate', new Date().toISOString().slice(0, 10))
      const res = await fetch('/api/transcripts', { method: 'POST', body: fd })
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
    return () => { bridge.clearTranscriptHandler() }
  }, [handleTranscript])

  if (!isMounted || !getBridge()) return null

  async function checkAndStart() {
    const tauri = getTauri()
    if (!tauri) return
    setError(null)
    setResult(null)
    setRecordState('checking')

    const status = await tauri.core.invoke<{ ready: boolean }>('whisper_model_status')
    if (!status.ready) {
      setRecordState('needs-model')
      return
    }
    await doStart()
  }

  async function doStart() {
    const bridge = getBridge()
    if (!bridge) return
    await bridge.startRecording()
    setRecordState('recording')
  }

  async function handleDownloadAndStart() {
    const tauri = getTauri()
    if (!tauri) return
    setRecordState('downloading')
    setDownloadProgress('Starte Download…')

    const unlisten = await tauri.event.listen<string>('model-download-error', (e) => {
      setError('Download fehlgeschlagen: ' + e.payload)
      setRecordState('idle')
    })

    const unlistenDone = await tauri.event.listen<void>('model-download-done', async () => {
      unlisten()
      unlistenDone()
      setDownloadProgress('')
      await doStart()
    })

    // progress events
    tauri.event.listen<string>('model-download-progress', (e) => {
      setDownloadProgress(e.payload)
    })

    await tauri.core.invoke('download_whisper_model', { model: 'medium' })
  }

  async function handlePause() {
    await getBridge()?.pauseRecording()
    setRecordState('paused')
  }

  async function handleResume() {
    await getBridge()?.resumeRecording()
    setRecordState('recording')
  }

  async function handleStop() {
    setRecordState('transcribing')
    await getBridge()?.stopRecording()
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {recordState === 'idle' && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          onClick={checkAndStart}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2" />
          Aufnahme starten
        </Button>
      )}

      {recordState === 'checking' && (
        <span className="text-sm text-slate-400">Prüfe Whisper…</span>
      )}

      {recordState === 'needs-model' && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <span className="text-amber-700">Whisper Medium ist nicht installiert.</span>
          <Button size="sm" className="rounded-lg h-7 text-xs" onClick={handleDownloadAndStart}>
            Jetzt herunterladen
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg h-7 text-xs" onClick={() => setRecordState('idle')}>
            Abbrechen
          </Button>
        </div>
      )}

      {recordState === 'downloading' && (
        <span className="flex items-center gap-1.5 text-sm text-blue-600">
          <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {downloadProgress || 'Whisper wird heruntergeladen…'}
        </span>
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
