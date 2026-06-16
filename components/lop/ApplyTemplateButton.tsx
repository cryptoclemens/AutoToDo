'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Template {
  id: string
  name: string
  items: { title: string }[]
}

export default function ApplyTemplateButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    if (!open || templates.length > 0) return
    setLoading(true)
    fetch('/api/settings/templates')
      .then(r => r.ok ? r.json() : { templates: [] })
      .then((d: { templates: Template[] }) => setTemplates(d.templates))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, templates.length])

  async function apply(templateId: string) {
    setApplying(templateId)
    try {
      const r = await fetch(`/api/projects/${projectId}/apply-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })
      const d: { created?: number; error?: string } = await r.json()
      if (r.ok) {
        toast.success(`${d.created} LOP-Punkt${(d.created ?? 0) !== 1 ? 'e' : ''} aus Vorlage angelegt.`)
        setOpen(false)
        router.refresh()
      } else {
        toast.error(d.error ?? 'Fehler beim Anwenden der Vorlage.')
      }
    } finally {
      setApplying(null)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center h-7 gap-1 px-2.5 text-[0.8rem] font-medium border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
      >
        ☰ Vorlage anwenden
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 bg-white rounded-xl border border-gray-200 shadow-lg py-1 min-w-[220px]">
            {loading ? (
              <p className="px-4 py-3 text-xs text-gray-400">Lade Vorlagen…</p>
            ) : templates.length === 0 ? (
              <div className="px-4 py-3">
                <p className="text-xs text-gray-500">Keine Vorlagen vorhanden.</p>
                <a href="/settings?tab=workspace" className="text-xs text-blue-600 hover:underline">Vorlagen anlegen →</a>
              </div>
            ) : (
              templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => apply(t.id)}
                  disabled={applying === t.id}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  <p className="text-sm text-gray-800 font-medium">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.items.length} Punkt{t.items.length !== 1 ? 'e' : ''}</p>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
