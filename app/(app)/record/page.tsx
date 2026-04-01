'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

type Project = { id: string; name: string }
type RecordState = 'idle' | 'recording' | 'transcribing' | 'processing' | 'done' | 'error'

export default function RecordPage() {
  const t = useTranslations('record')
  const router = useRouter()

  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState('')
  const [meetingName, setMeetingName] = useState('')
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().slice(0, 10))
  const [state, setState] = useState<RecordState>('idle')
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [transcriptId, setTranscriptId] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((data: { projects?: Project[] }) => {
        const list = data.projects ?? []
        setProjects(list)
        if (list.length > 0) setProjectId(list[0].id)
      })
      .catch(() => {})
  }, [])

  function startTimer() {
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }
  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg'

      const mr = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(1000)
      mediaRecorderRef.current = mr
      setState('recording')
      startTimer()
    } catch {
      setError(t('micError'))
    }
  }

  async function stopAndSend() {
    const mr = mediaRecorderRef.current
    if (!mr) return
    stopTimer()

    await new Promise<void>(resolve => {
      mr.onstop = () => resolve()
      mr.stop()
      mr.stream.getTracks().forEach(t => t.stop())
    })

    setState('transcribing')

    const mimeType = mr.mimeType.split(';')[0]
    const blob = new Blob(chunksRef.current, { type: mimeType })

    const formData = new FormData()
    formData.append('audio', blob, `recording.${mimeType.split('/')[1] ?? 'webm'}`)
    formData.append('projectId', projectId)
    formData.append('meetingDate', meetingDate)
    if (meetingName.trim()) formData.append('meetingName', meetingName.trim())

    try {
      setState('processing')
      const res = await fetch('/api/transcripts/audio', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(body.error ?? t('uploadError'))
      }

      const data = await res.json() as { id: string }
      setTranscriptId(data.id)
      setState('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : t('uploadError'))
      setState('error')
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const canRecord = projectId && (state === 'idle' || state === 'error')
  const isRecording = state === 'recording'
  const isBusy = state === 'transcribing' || state === 'processing'

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('title')}</h1>
        <p className="text-sm text-gray-500 mb-8">{t('subtitle')}</p>

        {/* Project + Meeting fields */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('project')}</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              disabled={isRecording || isBusy}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {projects.length === 0 && <option value="">{t('noProjects')}</option>}
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('meetingName')}</label>
            <input
              type="text"
              value={meetingName}
              onChange={e => setMeetingName(e.target.value)}
              placeholder={t('meetingNamePlaceholder')}
              disabled={isRecording || isBusy}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('meetingDate')}</label>
            <input
              type="date"
              value={meetingDate}
              onChange={e => setMeetingDate(e.target.value)}
              disabled={isRecording || isBusy}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Record button */}
        {state !== 'done' && (
          <div className="flex flex-col items-center gap-4">
            {isRecording && (
              <div className="flex items-center gap-2 text-red-600 font-mono text-lg font-bold">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                {formatTime(seconds)}
              </div>
            )}

            {isBusy && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {state === 'transcribing' ? t('transcribing') : t('processing')}
              </div>
            )}

            {!isRecording && !isBusy && (
              <button
                onClick={startRecording}
                disabled={!canRecord}
                className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white flex items-center justify-center shadow-lg transition-colors focus:outline-none focus:ring-4 focus:ring-red-300"
                aria-label={t('startRecording')}
              >
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="6" />
                </svg>
              </button>
            )}

            {isRecording && (
              <button
                onClick={stopAndSend}
                className="w-24 h-24 rounded-full bg-gray-800 hover:bg-gray-900 text-white flex items-center justify-center shadow-lg transition-colors focus:outline-none focus:ring-4 focus:ring-gray-400"
                aria-label={t('stopRecording')}
              >
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            )}

            <p className="text-xs text-gray-400 text-center">
              {isRecording ? t('tapToStop') : t('tapToStart')}
            </p>
          </div>
        )}

        {/* Done state */}
        {state === 'done' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-800 font-medium text-center">{t('successMessage')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setState('idle'); setError(''); setSeconds(0) }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('newRecording')}
              </button>
              {transcriptId && (
                <button
                  onClick={() => router.push(`/projects/${projectId}`)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {t('viewProject')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* OpenAI hint */}
        {state === 'idle' && (
          <p className="mt-8 text-xs text-gray-400 text-center">
            {t('whisperHint')}{' '}
            <a href="/settings?tab=ki" className="text-blue-500 hover:underline">{t('whisperHintLink')}</a>
          </p>
        )}
      </div>
    </div>
  )
}
