'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface Props {
  projectId: string
  notionConfigured?: boolean
}

type InputMode = 'text' | 'file' | 'notion'

export function TranscriptUploadForm({ projectId, notionConfigured = false }: Props) {
  const tt = useTranslations('transcript')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<InputMode>('text')
  const [pastedText, setPastedText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [notionUrl, setNotionUrl] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleClose() {
    setOpen(false)
    setPastedText('')
    setFile(null)
    setNotionUrl('')
    setMeetingDate('')
    setMode('text')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'text' && !pastedText.trim()) {
      toast.error(tt('errorNoText'))
      return
    }
    if (mode === 'file' && !file) {
      toast.error(tt('errorNoFile'))
      return
    }
    if (mode === 'notion' && !notionUrl.trim()) {
      toast.error('Bitte eine Notion-URL oder Seiten-ID eingeben.')
      return
    }

    setUploading(true)
    try {
      if (mode === 'notion') {
        const res = await fetch('/api/transcripts/notion-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageUrl: notionUrl.trim(), projectId, meetingDate: meetingDate || undefined }),
        })
        const data = await res.json() as { error?: string }
        if (!res.ok) throw new Error(data.error ?? 'Fehler beim Notion-Import.')
      } else {
        const fd = new FormData()
        fd.append('projectId', projectId)
        if (meetingDate) fd.append('meetingDate', meetingDate)
        if (mode === 'text') {
          fd.append('text', pastedText.trim())
        } else if (file) {
          fd.append('file', file)
        }
        const res = await fetch('/api/transcripts', { method: 'POST', body: fd })
        const data = await res.json() as { error?: string }
        if (!res.ok) throw new Error(data.error ?? tt('uploadError'))
      }

      toast.success(tt('success'))
      handleClose()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('uploadError'))
    } finally {
      setUploading(false)
    }
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        style={{ backgroundColor: 'var(--brand)' }}
        className="text-white"
        size="sm"
      >
        {tt('uploadButton')}
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 w-full max-w-xl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">{tt('headerTitle')}</h3>
        <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
      </div>

      {/* Modus-Umschalter */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 text-xs w-fit">
        <button
          type="button"
          onClick={() => setMode('text')}
          className={`px-3 py-1.5 rounded-md transition-colors ${mode === 'text' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {tt('pasteMode')}
        </button>
        <button
          type="button"
          onClick={() => setMode('file')}
          className={`px-3 py-1.5 rounded-md transition-colors ${mode === 'file' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {tt('fileMode')}
        </button>
        <button
          type="button"
          onClick={() => setMode('notion')}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${mode === 'notion' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {/* Notion N logo */}
          <svg width="12" height="12" viewBox="0 0 100 100" fill="none" className="shrink-0">
            <rect width="100" height="100" rx="10" fill="currentColor" className="opacity-10"/>
            <path d="M15 20h50l20 20v55H15V20z" fill="none" stroke="currentColor" strokeWidth="6"/>
            <path d="M65 20v20h20" fill="none" stroke="currentColor" strokeWidth="6"/>
            <path d="M30 45h40M30 60h40M30 75h25" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
          </svg>
          Notion
        </button>
      </div>

      {/* Eingabe je nach Modus */}
      {mode === 'text' && (
        <div className="space-y-1.5">
          <Label className="text-xs">{tt('pasteLabel')}</Label>
          <Textarea
            value={pastedText}
            onChange={e => setPastedText(e.target.value)}
            placeholder={tt('textPlaceholder')}
            rows={10}
            className="text-sm resize-y font-mono"
            autoFocus
          />
          <p className="text-xs text-gray-400">{pastedText.length.toLocaleString('de-DE')} {tt('characters')}</p>
        </div>
      )}

      {mode === 'file' && (
        <div className="space-y-1.5">
          <Label className="text-xs">{tt('fileLabel')}</Label>
          <Input
            ref={fileRef}
            type="file"
            accept=".txt,.rtf"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="text-xs"
          />
          <p className="text-xs text-gray-400">{tt('fileHint')}</p>
        </div>
      )}

      {mode === 'notion' && (
        <div className="space-y-3">
          {!notionConfigured && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-amber-500 text-base leading-none mt-0.5">⚠</span>
              <p className="text-xs text-amber-800 leading-relaxed">
                Notion ist noch nicht verbunden.{' '}
                <Link href="/settings#integrations" className="font-medium underline hover:no-underline">
                  Jetzt verbinden unter Einstellungen → Integrationen
                </Link>
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Notion-URL oder Seiten-ID</Label>
            <Input
              type="text"
              placeholder="https://www.notion.so/Meeting-Notizen-abc123..."
              value={notionUrl}
              onChange={e => setNotionUrl(e.target.value)}
              className="text-sm font-mono"
              autoFocus
            />
            <p className="text-xs text-gray-400">
              Kopiere die URL direkt aus Notion. Die Seite muss mit deiner AutoToDo-Integration geteilt sein.
            </p>
          </div>
        </div>
      )}

      {/* Datum */}
      <div className="space-y-1.5">
        <Label className="text-xs">{tt('dateLabel')}</Label>
        <Input
          type="date"
          value={meetingDate}
          onChange={e => setMeetingDate(e.target.value)}
          className="text-xs w-44"
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={uploading || (mode === 'notion' && !notionConfigured && !notionUrl.trim())}
          size="sm"
          style={{ backgroundColor: 'var(--brand)' }}
          className="text-white"
        >
          {uploading
            ? (mode === 'notion' ? 'Importiere…' : tt('submitting'))
            : (mode === 'notion' ? 'Aus Notion importieren' : tt('submit'))}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
          {tt('cancel')}
        </Button>
      </div>
    </form>
  )
}
