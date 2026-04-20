'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'

interface WhisperModel {
  id: string
  name: string
  size: string
  note: string
  recommended?: boolean
}

const MODELS: WhisperModel[] = [
  { id: 'tiny',     name: 'Tiny',     size: '75 MB',  note: 'audio.modelTinyNote' },
  { id: 'base',     name: 'Base',     size: '142 MB', note: 'audio.modelBaseNote' },
  { id: 'small',    name: 'Small',    size: '466 MB', note: 'audio.modelSmallNote' },
  { id: 'medium',   name: 'Medium',   size: '1,5 GB', note: 'audio.modelMediumNote', recommended: true },
  { id: 'large-v3', name: 'Large v3', size: '3,1 GB', note: 'audio.modelLargeNote' },
]

type ModelId = string

interface ModelStatus {
  ready: boolean
  model: string
  path: string
}

export function AudioSettingsTab() {
  const t = useTranslations()
  const [isTauri, setIsTauri] = useState(false)
  const [status, setStatus] = useState<ModelStatus | null>(null)
  const [selected, setSelected] = useState<ModelId>('medium')
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadStatus = useCallback(async (tauri: any) => {
    try {
      const s = await tauri.core.invoke('whisper_model_status') as ModelStatus
      setStatus(s)
      if (s.model && MODELS.some(m => m.id === s.model)) {
        setSelected(s.model as ModelId)
      }
    } catch {}
  }, [])

  useEffect(() => {
    const tauri = (window as typeof window & { __TAURI__?: typeof window.__TAURI__ }).__TAURI__
    if (!tauri) return
    setIsTauri(true)
    loadStatus(tauri)
  }, [loadStatus])

  async function handleDownload() {
    const tauri = (window as typeof window & { __TAURI__?: typeof window.__TAURI__ }).__TAURI__
    if (!tauri) return

    setDownloading(true)
    setProgress(0)
    setError(null)

    const unlisteners: Array<() => void> = []

    const cleanup = () => unlisteners.forEach(u => u())

    const ul1 = await tauri.event.listen<number>('model-download-progress', e => {
      setProgress(e.payload)
    })
    unlisteners.push(ul1)

    const ul2 = await tauri.event.listen<string>('model-download-error', e => {
      setError(e.payload)
      setDownloading(false)
      cleanup()
    })
    unlisteners.push(ul2)

    const ul3 = await tauri.event.listen('model-download-done', async () => {
      setProgress(100)
      setDownloading(false)
      await loadStatus(tauri)
      cleanup()
    })
    unlisteners.push(ul3)

    try {
      await tauri.core.invoke('download_whisper_model', { model: selected })
    } catch (e) {
      setError(String(e))
      setDownloading(false)
      cleanup()
    }
  }

  if (!isTauri) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-500">{t('audio.desktopOnly')}</p>
      </div>
    )
  }

  const activeModel = MODELS.find(m => m.id === selected)
  const isActiveDownloaded = status?.ready && status.model === selected

  return (
    <div className="space-y-8">
      {/* Whisper Model */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('audio.whisperTitle')}</h3>
        <p className="text-xs text-gray-500 mb-4">{t('audio.whisperDesc')}</p>

        {/* Current status badge */}
        {status && (
          <div className={`mb-4 flex items-center gap-2 text-sm px-3 py-2 rounded-md border ${
            status.ready
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <span>{status.ready ? '✓' : '⚠'}</span>
            <span>
              {status.ready
                ? t('audio.modelActive', { model: status.model })
                : t('audio.modelNone')}
            </span>
          </div>
        )}

        {/* Model list */}
        <div className="space-y-2">
          {MODELS.map(m => (
            <label
              key={m.id}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selected === m.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="whisper-model"
                  value={m.id}
                  checked={selected === m.id}
                  onChange={() => setSelected(m.id)}
                  className="accent-blue-600"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{m.name}</span>
                    {m.recommended && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        {t('audio.recommended')}
                      </span>
                    )}
                    {status?.ready && status.model === m.id && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                        {t('audio.installed')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{t(m.note as Parameters<typeof t>[0])}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 shrink-0 ml-4">{m.size}</span>
            </label>
          ))}
        </div>

        {/* Download / progress */}
        <div className="mt-4">
          {downloading ? (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{t('audio.downloading', { model: activeModel?.name ?? selected })}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isActiveDownloaded ? t('audio.redownload') : t('audio.download')}
            </button>
          )}
          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
