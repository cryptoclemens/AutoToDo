'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const DEFAULT_LABELS: Record<string, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
  abgeschlossen: 'Abgeschlossen',
  geparkt: 'Geparkt',
}

export default function StatusLabelEditor() {
  const [labels, setLabels] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/settings/status-labels')
      .then(r => r.ok ? r.json() : null)
      .then((d: { labels: Record<string, string> } | null) => {
        if (d) setLabels(d.labels ?? {})
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const r = await fetch('/api/settings/status-labels', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(labels),
      })
      if (r.ok) toast.success('Status-Bezeichnungen gespeichert.')
      else toast.error('Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return <p className="text-sm text-gray-400">Lade…</p>

  return (
    <div className="space-y-3">
      {Object.entries(DEFAULT_LABELS).map(([key, defaultLabel]) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-36 shrink-0">
            Standard: <span className="font-medium">{defaultLabel}</span>
          </span>
          <Input
            value={labels[key] ?? ''}
            onChange={e => setLabels(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={defaultLabel}
            className="text-sm max-w-[200px]"
            maxLength={40}
          />
          {labels[key] && (
            <button
              onClick={() => setLabels(prev => { const n = { ...prev }; delete n[key]; return n })}
              className="text-xs text-gray-400 hover:text-gray-600"
              title="Zurücksetzen"
            >
              ↺
            </button>
          )}
        </div>
      ))}
      <Button size="sm" onClick={handleSave} disabled={saving} className="mt-2">
        {saving ? 'Speichern…' : 'Status-Labels speichern'}
      </Button>
      <p className="text-xs text-gray-400">Leere Felder = Standard-Bezeichnung wird verwendet</p>
    </div>
  )
}
