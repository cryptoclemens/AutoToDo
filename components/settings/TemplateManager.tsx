'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TemplateItem {
  title: string
  priority?: 'hoch' | 'mittel' | 'niedrig'
  due_offset_days?: number
}

interface Template {
  id: string
  name: string
  items: TemplateItem[]
  created_at: string
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newItems, setNewItems] = useState<TemplateItem[]>([{ title: '' }])
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/settings/templates')
      if (r.ok) { const d: { templates: Template[] } = await r.json(); setTemplates(d.templates) }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    const validItems = newItems.filter(i => i.title.trim())
    if (!newName.trim() || validItems.length === 0) return
    setSaving(true)
    try {
      const r = await fetch('/api/settings/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), items: validItems }),
      })
      if (r.ok) {
        toast.success('Vorlage gespeichert.')
        setCreating(false)
        setNewName('')
        setNewItems([{ title: '' }])
        load()
      } else {
        toast.error('Fehler beim Speichern.')
      }
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Vorlage wirklich löschen?')) return
    await fetch(`/api/settings/templates?id=${id}`, { method: 'DELETE' })
    setTemplates(prev => prev.filter(t => t.id !== id))
    toast.success('Vorlage gelöscht.')
  }

  function updateItem(idx: number, field: keyof TemplateItem, value: string | number | undefined) {
    setNewItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  return (
    <div className="space-y-4">
      {/* Bestehende Vorlagen */}
      {loading ? (
        <p className="text-sm text-gray-400">Lade Vorlagen…</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-gray-400">Noch keine Vorlagen angelegt.</p>
      ) : (
        <div className="space-y-2">
          {templates.map(t => (
            <div key={t.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                <button onClick={() => handleDelete(t.id)} className="text-xs text-red-400 hover:text-red-600">
                  Löschen
                </button>
              </div>
              <ul className="space-y-0.5">
                {t.items.map((item, i) => (
                  <li key={i} className="text-xs text-gray-500 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-gray-300 shrink-0" />
                    {item.title}
                    {item.priority === 'hoch' && <span className="text-red-400 text-[10px]">hoch</span>}
                    {item.due_offset_days != null && <span className="text-gray-400 text-[10px]">+{item.due_offset_days}d</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Neue Vorlage anlegen */}
      {!creating ? (
        <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
          + Neue Vorlage
        </Button>
      ) : (
        <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/50 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Neue Vorlage</h4>
          <Input
            placeholder={'Name der Vorlage (z.B. "Standard-Kick-off")'}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="text-sm"
          />

          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">LOP-Punkte</p>
            {newItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder={`Punkt ${idx + 1}`}
                  value={item.title}
                  onChange={e => updateItem(idx, 'title', e.target.value)}
                  className="text-sm flex-1"
                />
                <select
                  value={item.priority ?? 'mittel'}
                  onChange={e => updateItem(idx, 'priority', e.target.value)}
                  className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white text-gray-600"
                >
                  <option value="hoch">Hoch</option>
                  <option value="mittel">Mittel</option>
                  <option value="niedrig">Niedrig</option>
                </select>
                <input
                  type="number"
                  min={0}
                  max={365}
                  placeholder="Tage"
                  title="Fälligkeit in Tagen ab heute"
                  value={item.due_offset_days ?? ''}
                  onChange={e => updateItem(idx, 'due_offset_days', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="text-xs border border-gray-200 rounded px-2 py-1.5 w-16 bg-white text-gray-600"
                />
                {newItems.length > 1 && (
                  <button onClick={() => setNewItems(prev => prev.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-400 text-lg leading-none">×</button>
                )}
              </div>
            ))}
            <button
              onClick={() => setNewItems(prev => [...prev, { title: '' }])}
              className="text-xs text-blue-600 hover:underline"
            >
              + Punkt hinzufügen
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? 'Speichern…' : 'Vorlage speichern'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setCreating(false); setNewName(''); setNewItems([{ title: '' }]) }}>
              Abbrechen
            </Button>
          </div>
          <p className="text-xs text-gray-400">&bdquo;Tage&ldquo; = Fälligkeit in X Tagen ab Anwendung der Vorlage</p>
        </div>
      )}
    </div>
  )
}
