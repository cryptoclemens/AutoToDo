'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  projectId: string
  initialName: string
  canEdit: boolean
}

export default function ProjectTitleEditor({ projectId, initialName, canEdit }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) { toast.error('Projektname darf nicht leer sein.'); return }
    if (trimmed === initialName) { setEditing(false); return }

    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Fehler beim Speichern')
      }
      toast.success('Projektname aktualisiert.')
      setEditing(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') { setName(initialName); setEditing(false) }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className="text-2xl font-bold text-gray-900 border-b-2 border-blue-400 bg-transparent outline-none w-full max-w-md"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50 shrink-0"
        >
          {saving ? '…' : '✓'}
        </button>
        <button
          onClick={() => { setName(initialName); setEditing(false) }}
          className="text-xs text-gray-400 hover:text-gray-600 px-1 shrink-0"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group">
      <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
      {canEdit && (
        <button
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-gray-500 p-1"
          title="Projektname bearbeiten"
        >
          ✏
        </button>
      )}
    </div>
  )
}
