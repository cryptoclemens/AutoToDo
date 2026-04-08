'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  systemAudioDevice: () => string | null
  setTranscriptHandler: (fn: (transcript: string) => void) => void
  clearTranscriptHandler: () => void
  setStateHandler: (fn: (s: { recording: boolean; paused: boolean }) => void) => void
  clearStateHandler: () => void
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

  // Device settings
  const [showDeviceMenu, setShowDeviceMenu] = useState(false)
  const [devices, setDevices] = useState<string[]>([])
  const [selectedDevice, setSelectedDevice] = useState('')
  const [systemAudioDevice, setSystemAudioDevice] = useState<string | null>(null)
  const deviceMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setIsMounted(true) }, [])

  // Sync state from keyboard shortcuts via bridge events
  useEffect(() => {
    function onBridgeState(e: Event) {
      const { recording, paused } = (e as CustomEvent).detail as { recording: boolean; paused: boolean; label: string }
      if (!recording) setRecordState('idle')
      else if (paused) setRecordState('paused')
      else setRecordState('recording')
    }
    window.addEventListener('__autotodo-state', onBridgeState)
    return () => window.removeEventListener('__autotodo-state', onBridgeState)
  }, [])

  // Sync system audio device from bridge
  useEffect(() => {
    function onSystemAudio(e: Event) {
      const { device } = (e as CustomEvent).detail as { device: string | null }
      setSystemAudioDevice(device)
    }
    window.addEventListener('__autotodo-system-audio', onSystemAudio)
    // Also read current state from bridge if already loaded
    // Guard: old bridge versions may not have systemAudioDevice()
    const bridge = getBridge()
    if (bridge && typeof bridge.systemAudioDevice === 'function') {
      setSystemAudioDevice(bridge.systemAudioDevice())
    }
    return () => window.removeEventListener('__autotodo-system-audio', onSystemAudio)
  }, [])

  // Load stored mic preference
  useEffect(() => {
    const stored = localStorage.getItem('autotodo_mic_device') ?? ''
    setSelectedDevice(stored)
  }, [])

  // Close device menu on outside click
  useEffect(() => {
    if (!showDeviceMenu) return
    function onOutsideClick(e: MouseEvent) {
      if (deviceMenuRef.current && !deviceMenuRef.current.contains(e.target as Node)) {
        setShowDeviceMenu(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [showDeviceMenu])

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

  async function openDeviceMenu() {
    const tauri = getTauri()
    if (!tauri) return
    const list = await tauri.core.invoke<string[]>('list_audio_inputs').catch(() => [] as string[])
    setDevices(list)
    setShowDeviceMenu(true)
  }

  async function selectDevice(name: string) {
    const tauri = getTauri()
    if (!tauri) return
    await tauri.core.invoke('set_audio_input', { deviceName: name }).catch(() => {})
    localStorage.setItem('autotodo_mic_device', name)
    setSelectedDevice(name)
    setShowDeviceMenu(false)
  }

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

  const showControls = recordState === 'idle' || recordState === 'recording' || recordState === 'paused'

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-slate-900">Whisper Medium nicht installiert</h3>
              <p className="text-sm text-slate-500">Für die automatische Transkription wird das Whisper Medium Modell benötigt (~1.5 GB). Es wird einmalig heruntergeladen und lokal gespeichert.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setRecordState('idle')}>
                Abbrechen
              </Button>
              <Button size="sm" className="rounded-lg" onClick={handleDownloadAndStart}>
                Jetzt herunterladen
              </Button>
            </div>
          </div>
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
            {systemAudioDevice && (
              <span className="ml-1 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                🎙+🔊
              </span>
            )}
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

      {/* Device settings gear – shown when not actively transcribing/downloading */}
      {showControls && (
        <div className="relative" ref={deviceMenuRef}>
          <button
            onClick={showDeviceMenu ? () => setShowDeviceMenu(false) : openDeviceMenu}
            title="Audio-Einstellungen"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-sm"
          >
            ⚙
          </button>

          {showDeviceMenu && (
            <div className="absolute right-0 top-9 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-2 min-w-[240px]">
              <p className="text-xs text-slate-400 px-2 py-1 font-medium">Mikrofon</p>
              {devices.length === 0 && (
                <p className="text-xs text-slate-400 px-2 py-1">Keine Geräte gefunden</p>
              )}
              {devices.map(name => (
                <button
                  key={name}
                  onClick={() => selectDevice(name)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                    (selectedDevice === name || (!selectedDevice && devices[0] === name))
                      ? 'text-blue-600 font-medium'
                      : 'text-slate-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    (selectedDevice === name || (!selectedDevice && devices[0] === name))
                      ? 'bg-blue-500'
                      : 'bg-slate-300'
                  }`} />
                  {name}
                </button>
              ))}
              {systemAudioDevice && (
                <>
                  <div className="my-1.5 border-t border-slate-100" />
                  <div className="px-2 py-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-xs text-slate-500">
                      Systemsound: <span className="text-blue-600 font-medium">{systemAudioDevice}</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
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
