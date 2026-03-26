'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Props {
  projectId: string
}

type InputMode = 'text' | 'file'

export function TranscriptUploadForm({ projectId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<InputMode>('text')
  const [pastedText, setPastedText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [meetingDate, setMeetingDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleClose() {
    setOpen(false)
    setPastedText('')
    setFile(null)
    setMeetingDate('')
    setMode('text')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'text' && !pastedText.trim()) {
      toast.error('Bitte Transkript einfügen.')
      return
    }
    if (mode === 'file' && !file) {
      toast.error('Bitte Datei auswählen.')
      return
    }

    setUploading(true)
    try {
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

      if (!res.ok) throw new Error(data.error ?? 'Upload fehlgeschlagen')

      toast.success('Transkript eingereicht. Verarbeitung läuft…')
      handleClose()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Upload')
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
        ↑ Transkript hochladen
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 w-full max-w-xl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">Transkript einreichen</h3>
        <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
      </div>

      {/* Modus-Umschalter */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 text-xs w-fit">
        <button
          type="button"
          onClick={() => setMode('text')}
          className={`px-3 py-1.5 rounded-md transition-colors ${mode === 'text' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Text einfügen
        </button>
        <button
          type="button"
          onClick={() => setMode('file')}
          className={`px-3 py-1.5 rounded-md transition-colors ${mode === 'file' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Datei hochladen
        </button>
      </div>

      {/* Eingabe je nach Modus */}
      {mode === 'text' ? (
        <div className="space-y-1.5">
          <Label className="text-xs">Transkript (Copy & Paste)</Label>
          <Textarea
            value={pastedText}
            onChange={e => setPastedText(e.target.value)}
            placeholder="Meeting-Protokoll oder Transkript hier einfügen…"
            rows={10}
            className="text-sm resize-y font-mono"
            autoFocus
          />
          <p className="text-xs text-gray-400">{pastedText.length.toLocaleString('de-DE')} Zeichen</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-xs">Datei (.txt oder .rtf)</Label>
          <Input
            ref={fileRef}
            type="file"
            accept=".txt,.rtf"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="text-xs"
          />
          <p className="text-xs text-gray-400">Max. 500 KB · .txt oder .rtf · Wird verschlüsselt gespeichert</p>
        </div>
      )}

      {/* Datum */}
      <div className="space-y-1.5">
        <Label className="text-xs">Meeting-Datum (optional)</Label>
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
          disabled={uploading}
          size="sm"
          style={{ backgroundColor: 'var(--brand)' }}
          className="text-white"
        >
          {uploading ? 'Wird eingereicht…' : 'Einreichen'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
          Abbrechen
        </Button>
      </div>
    </form>
  )
}
