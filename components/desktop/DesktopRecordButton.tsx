'use client'

import { useEffect, useState, useCallback } from 'react'
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
  setSystemAudioDevice: (name: string | null) => Promise<void>
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

function isVirtualDevice(name: string) {
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

// ── Audio Settings Modal ─────────────────────────────────────────────────────

interface AudioSettingsModalProps {
  devices: string[]
  selectedMic: string
  selectedSysAudio: string | null
  isFirstTime: boolean
  onSelectMic: (name: string) => void
  onSelectSysAudio: (name: string | null) => void
  onClose: () => void
  onConfirm: () => void
}

function AudioSettingsModal({
  devices, selectedMic, selectedSysAudio, isFirstTime,
  onSelectMic, onSelectSysAudio, onClose, onConfirm,
}: AudioSettingsModalProps) {
  const micDevices = devices.filter(d => !isVirtualDevice(d))
  const virtualDevices = devices.filter(d => isVirtualDevice(d))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Audio-Einstellungen</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none">×</button>
        </div>

        {isFirstTime && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 leading-relaxed">
            Wähle einmalig dein Mikrofon. Die Einstellung wird gespeichert.
          </div>
        )}

        {/* Mikrofon */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-600">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
            <span className="text-sm font-medium text-slate-700">Mikrofon</span>
          </div>
          <p className="text-xs text-slate-400 -mt-1">Deine Stimme — wähle dein physisches Mikrofon.</p>
          <div className="flex flex-col gap-0.5">
            {micDevices.map(name => (
              <button
                key={name}
                onClick={() => onSelectMic(name)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                  selectedMic === name
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selectedMic === name ? 'bg-blue-500' : 'bg-slate-300'}`} />
                {name}
              </button>
            ))}
            {micDevices.length === 0 && (
              <p className="text-xs text-slate-400 px-3 py-1">Keine Mikrofone gefunden</p>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* System-Audio */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-600">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
            <span className="text-sm font-medium text-slate-700">System-Audio</span>
          </div>
          <p className="text-xs text-slate-400 -mt-1">
            Audio der Gesprächspartner (Calls, Videos). Erfordert{' '}
            <span className="font-mono text-slate-500">BlackHole</span> oder{' '}
            <span className="font-mono text-slate-500">Loopback</span>.
          </p>
          <div className="flex flex-col gap-0.5">
            {/* None option */}
            <button
              onClick={() => onSelectSysAudio(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                selectedSysAudio === null
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selectedSysAudio === null ? 'bg-blue-500' : 'bg-slate-300'}`} />
              Kein System-Audio
            </button>
            {virtualDevices.map(name => (
              <button
                key={name}
                onClick={() => onSelectSysAudio(name)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                  selectedSysAudio === name
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selectedSysAudio === name ? 'bg-blue-500' : 'bg-slate-300'}`} />
                {name}
              </button>
            ))}
            {virtualDevices.length === 0 && (
              <p className="text-xs text-slate-400 px-3 py-1 leading-relaxed">
                Kein virtuelles Audio-Gerät gefunden.<br />
                <span className="font-mono">brew install blackhole-2ch</span>
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Info */}
        <ul className="text-xs text-slate-500 space-y-1 leading-relaxed">
          <li><span className="font-medium text-slate-600">Mikrofon:</span> Deine Stimme und Umgebungsgeräusche</li>
          <li><span className="font-medium text-slate-600">System-Audio:</span> Audio der Teilnehmer (Zoom, Teams, etc.)</li>
          <li><span className="font-medium text-slate-600">Beide aktiv:</span> Mikrofon + System-Audio werden automatisch gemischt</li>
        </ul>

        {/* Footer */}
        <div className="flex justify-end">
          <Button size="sm" className="rounded-lg" onClick={onConfirm}>
            {isFirstTime ? 'Aufnahme starten' : 'Fertig'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DesktopRecordButton({ projectId }: Props) {
  const [recordState, setRecordState] = useState<RecordState>('idle')
  const [downloadProgress, setDownloadProgress] = useState('')
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const [showSettings, setShowSettings] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [devices, setDevices] = useState<string[]>([])
  const [selectedMic, setSelectedMic] = useState('')
  const [selectedSysAudio, setSelectedSysAudio] = useState<string | null>(null)
  const [hasConfiguredDevice, setHasConfiguredDevice] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  // Sync state from keyboard shortcuts via bridge events
  useEffect(() => {
    function onBridgeState(e: Event) {
      const { recording, paused } = (e as CustomEvent).detail as { recording: boolean; paused: boolean }
      if (!recording) setRecordState('idle')
      else if (paused) setRecordState('paused')
      else setRecordState('recording')
    }
    window.addEventListener('__autotodo-state', onBridgeState)
    return () => window.removeEventListener('__autotodo-state', onBridgeState)
  }, [])

  // Load stored preferences
  useEffect(() => {
    const storedMic = localStorage.getItem('autotodo_mic_device') ?? ''
    const storedSys = localStorage.getItem('autotodo_system_audio_device') ?? null
    setSelectedMic(storedMic)
    setSelectedSysAudio(storedSys)
    setHasConfiguredDevice(!!storedMic)
  }, [])

  // Read initial system audio device from bridge once mounted
  useEffect(() => {
    const bridge = getBridge()
    if (!bridge) return
    const sys = bridge.systemAudioDevice()
    if (sys) setSelectedSysAudio(sys)
  }, [isMounted])

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
        setTimeout(() => window.location.reload(), 2000)
      }
    } catch {
      setError('Netzwerkfehler beim Speichern des Transkripts.')
    } finally {
      setRecordState('idle')
    }
  }, [projectId])

  useEffect(() => {
    const bridge = getBridge()
    if (!bridge) return
    bridge.setTranscriptHandler(handleTranscript)
    return () => { bridge.clearTranscriptHandler() }
  }, [handleTranscript])

  if (!isMounted || !getBridge()) return null

  async function openSettings(firstTime = false) {
    const tauri = getTauri()
    if (!tauri) return
    const list = await tauri.core.invoke<string[]>('list_audio_inputs').catch(() => [] as string[])
    setDevices(list)
    setIsFirstTime(firstTime)
    setShowSettings(true)
  }

  async function applyMic(name: string) {
    const tauri = getTauri()
    if (!tauri) return
    await tauri.core.invoke('set_audio_input', { deviceName: name }).catch(() => {})
    localStorage.setItem('autotodo_mic_device', name)
    setSelectedMic(name)
    setHasConfiguredDevice(true)
  }

  async function applySysAudio(name: string | null) {
    const bridge = getBridge()
    if (!bridge) return
    await bridge.setSystemAudioDevice(name)
    if (name) {
      localStorage.setItem('autotodo_system_audio_device', name)
    } else {
      localStorage.removeItem('autotodo_system_audio_device')
    }
    setSelectedSysAudio(name)
  }

  async function handleSettingsConfirm() {
    setShowSettings(false)
    if (isFirstTime) {
      await checkWhisperAndStart()
    }
  }

  async function checkAndStart() {
    setError(null)
    setResult(null)
    if (!hasConfiguredDevice) {
      await openSettings(true)
      return
    }
    await checkWhisperAndStart()
  }

  async function checkWhisperAndStart() {
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
  const dualActive = !!selectedSysAudio

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
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setRecordState('idle')}>Abbrechen</Button>
              <Button size="sm" className="rounded-lg" onClick={handleDownloadAndStart}>Jetzt herunterladen</Button>
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
            {dualActive && (
              <span className="ml-1 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full" title={`Mikrofon + ${selectedSysAudio}`}>
                🎙+🔊
              </span>
            )}
          </span>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={handlePause}>⏸ Pause</Button>
          <Button variant="outline" size="sm" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50" onClick={handleStop}>■ Stopp</Button>
        </>
      )}

      {recordState === 'paused' && (
        <>
          <span className="flex items-center gap-1.5 text-sm text-amber-600 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            Pausiert
          </span>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={handleResume}>▶ Weiter</Button>
          <Button variant="outline" size="sm" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50" onClick={handleStop}>■ Stopp</Button>
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

      {/* Settings button */}
      {showControls && (
        <button
          onClick={() => openSettings(false)}
          title="Audio-Einstellungen"
          className="flex items-center gap-1.5 px-2 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors text-xs font-medium"
        >
          <GearIcon className="w-3.5 h-3.5" />
          <span className="max-w-[110px] truncate">
            {selectedMic || 'Mikrofon'}
          </span>
          {dualActive && (
            <span className="text-blue-500 text-xs" title={`System-Audio: ${selectedSysAudio}`}>+🔊</span>
          )}
        </button>
      )}

      {/* Audio Settings Modal */}
      {showSettings && (
        <AudioSettingsModal
          devices={devices}
          selectedMic={selectedMic}
          selectedSysAudio={selectedSysAudio}
          isFirstTime={isFirstTime}
          onSelectMic={applyMic}
          onSelectSysAudio={applySysAudio}
          onClose={() => setShowSettings(false)}
          onConfirm={handleSettingsConfirm}
        />
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
