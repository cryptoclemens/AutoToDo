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

const SYSTEM_AUDIO_KEYWORDS = ['BlackHole', 'Loopback', 'Soundflower', 'Virtual Audio Cable', 'VB-Audio']

function isSystemAudioDevice(name: string) {
  return SYSTEM_AUDIO_KEYWORDS.some(kw => name.includes(kw))
}

function getBridge(): AutoToDoBridge | null {
  if (typeof window === 'undefined') return null
  return window.__autoToDo ?? null
}

function getTauri() {
  if (typeof window === 'undefined') return null
  return window.__TAURI__ ?? null
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
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
  const [showFirstSetup, setShowFirstSetup] = useState(false)
  const [devices, setDevices] = useState<string[]>([])
  const [selectedDevice, setSelectedDevice] = useState('')
  const [hasConfiguredDevice, setHasConfiguredDevice] = useState(false)
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
    setHasConfiguredDevice(!!stored)
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

  async function loadDevices() {
    const tauri = getTauri()
    if (!tauri) return
    const list = await tauri.core.invoke<string[]>('list_audio_inputs').catch(() => [] as string[])
    setDevices(list)
  }

  async function openDeviceMenu() {
    await loadDevices()
    setShowDeviceMenu(true)
  }

  async function selectDevice(name: string) {
    const tauri = getTauri()
    if (!tauri) return
    await tauri.core.invoke('set_audio_input', { deviceName: name }).catch(() => {})
    localStorage.setItem('autotodo_mic_device', name)
    setSelectedDevice(name)
    setHasConfiguredDevice(true)
    setShowDeviceMenu(false)
    setShowFirstSetup(false)
  }

  async function checkAndStart() {
    const tauri = getTauri()
    if (!tauri) return
    setError(null)
    setResult(null)

    // First-time: show device picker before starting
    if (!hasConfiguredDevice) {
      await loadDevices()
      setShowFirstSetup(true)
      return
    }

    setRecordState('checking')
    const status = await tauri.core.invoke<{ ready: boolean }>('whisper_model_status')
    if (!status.ready) {
      setRecordState('needs-model')
      return
    }
    await doStart()
  }

  async function proceedAfterFirstSetup() {
    setShowFirstSetup(false)
    const tauri = getTauri()
    if (!tauri) return
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

  // Split mic vs. system-audio devices for display
  const micDevices = devices.filter(d => !isSystemAudioDevice(d))
  const virtualDevices = devices.filter(d => isSystemAudioDevice(d))

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

      {/* First-time device setup modal */}
      {showFirstSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-slate-900">Mikrofon auswählen</h3>
              <p className="text-sm text-slate-500">
                Wähle einmalig dein Mikrofon. Die Einstellung wird gespeichert.
              </p>
            </div>

            {/* Hint box */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">Tipp:</span> Wähle dein physisches Mikrofon (z.&nbsp;B. OBSBOT oder MacBook Pro-Mikrofon).
              BlackHole / Loopback sind virtuelle Geräte für System-Audio – die wählt AutoToDo automatisch.
            </div>

            {micDevices.length > 0 && (
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-slate-400 font-medium px-1 mb-0.5">Mikrofon</p>
                {micDevices.map(name => (
                  <button
                    key={name}
                    onClick={() => { selectDevice(name).then(proceedAfterFirstSetup) }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                    {name}
                  </button>
                ))}
              </div>
            )}

            {virtualDevices.length > 0 && (
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-slate-400 font-medium px-1 mb-0.5">System-Audio (virtuell – nicht als Mikrofon wählen)</p>
                {virtualDevices.map(name => (
                  <div key={name} className="px-3 py-1.5 rounded-lg text-sm text-slate-400 flex items-center gap-2 cursor-default">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 flex-shrink-0" />
                    {name}
                    <span className="ml-auto text-xs bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">System-Audio</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setShowFirstSetup(false)}>
                Abbrechen
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg text-slate-500" onClick={proceedAfterFirstSetup}>
                Standard verwenden
              </Button>
            </div>
          </div>
        </div>
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

      {/* Device settings button – visible when not actively transcribing/downloading */}
      {showControls && (
        <div className="relative" ref={deviceMenuRef}>
          <button
            onClick={showDeviceMenu ? () => setShowDeviceMenu(false) : openDeviceMenu}
            title="Audio-Einstellungen"
            className="flex items-center gap-1.5 px-2 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors text-xs font-medium"
          >
            <GearIcon className="w-3.5 h-3.5" />
            {selectedDevice
              ? <span className="max-w-[120px] truncate">{selectedDevice}</span>
              : <span>Mikrofon</span>
            }
          </button>

          {showDeviceMenu && (
            <div className="absolute right-0 top-9 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-2 min-w-[260px]">

              {micDevices.length > 0 && (
                <>
                  <p className="text-xs text-slate-400 px-2 py-1 font-medium">Mikrofon</p>
                  {micDevices.map(name => (
                    <button
                      key={name}
                      onClick={() => selectDevice(name)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                        selectedDevice === name ? 'text-blue-600 font-medium' : 'text-slate-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selectedDevice === name ? 'bg-blue-500' : 'bg-slate-300'}`} />
                      {name}
                    </button>
                  ))}
                </>
              )}

              {virtualDevices.length > 0 && (
                <>
                  <div className="my-1.5 border-t border-slate-100" />
                  <p className="text-xs text-slate-400 px-2 py-1 font-medium">System-Audio (virtuell)</p>
                  {virtualDevices.map(name => (
                    <div key={name} className="px-2 py-1.5 flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${systemAudioDevice === name ? 'bg-blue-500' : 'bg-slate-200'}`} />
                      <span className="text-xs text-slate-500 flex-1">{name}</span>
                      {systemAudioDevice === name && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">aktiv</span>
                      )}
                    </div>
                  ))}
                </>
              )}

              {devices.length === 0 && (
                <p className="text-xs text-slate-400 px-2 py-1">Keine Geräte gefunden</p>
              )}

              {systemAudioDevice && !virtualDevices.some(d => d === systemAudioDevice) && (
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
