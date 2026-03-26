'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Props {
  projectId: string
}

export function TranscriptUploadForm({ projectId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [meetingDate, setMeetingDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { toast.error('Bitte Datei auswählen.'); return }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('projectId', projectId)
      if (meetingDate) fd.append('meetingDate', meetingDate)

      const res = await fetch('/api/transcripts', { method: 'POST', body: fd })
      const data = await res.json() as { error?: string }

      if (!res.ok) throw new Error(data.error ?? 'Upload fehlgeschlagen')

      toast.success('Transkript hochgeladen. Verarbeitung läuft…')
      setFile(null)
      setMeetingDate('')
      setOpen(false)
      if (fileRef.current) fileRef.current.value = ''
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
        className="bg-blue-600 hover:bg-blue-700 text-white"
        size="sm"
      >
        + Transkript hochladen
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 w-80 shadow-sm space-y-3">
      <h3 className="font-semibold text-gray-900 text-sm">Transkript hochladen</h3>

      <div className="space-y-1.5">
        <Label className="text-xs">Datei (.txt)</Label>
        <Input
          ref={fileRef}
          type="file"
          accept=".txt"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Meeting-Datum (optional)</Label>
        <Input
          type="date"
          value={meetingDate}
          onChange={e => setMeetingDate(e.target.value)}
          className="text-xs"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={uploading} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          {uploading ? 'Wird hochgeladen…' : 'Hochladen'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Abbrechen
        </Button>
      </div>

      <p className="text-xs text-gray-400">
        Max. 500 KB · Nur .txt · Wird verschlüsselt gespeichert
      </p>
    </form>
  )
}
