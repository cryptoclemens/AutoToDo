'use client'

import { useState } from 'react'
import LopTableRow from './LopTableRow'
import ReviewBanner from './ReviewBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Status = 'offen' | 'in_bearbeitung' | 'abgeschlossen'
type Priority = 'hoch' | 'mittel' | 'niedrig'

interface LopItem {
  id: string
  title: string
  description: string | null
  responsible: string | null
  due_date: string | null
  priority: Priority
  status: Status
  result: string | null
  requires_review: boolean
  ai_confidence: number | null
  source_quote: string | null
}

interface Props {
  initialItems: LopItem[]
  projectId: string
  canEdit: boolean
}

export default function LopTable({ initialItems, projectId, canEdit }: Props) {
  const [items, setItems] = useState<LopItem[]>(initialItems)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterSearch, setFilterSearch] = useState('')
  const [showReviewOnly, setShowReviewOnly] = useState(false)
  const reviewCount = items.filter(i => i.requires_review).length

  const filtered = items.filter(item => {
    if (showReviewOnly && !item.requires_review) return false
    if (filterStatus !== 'all' && item.status !== filterStatus) return false
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false
    if (filterSearch) {
      const q = filterSearch.toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        item.responsible?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      )
    }
    return true
  })

  async function handleUpdate(id: string, changes: Partial<LopItem>) {
    // Optimistisches Update
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i))

    const res = await fetch(`/api/lop/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })

    if (!res.ok) {
      // Rollback bei Fehler
      setItems(initialItems)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Diesen LOP-Punkt wirklich löschen?')) return
    setItems(prev => prev.filter(i => i.id !== id))

    const res = await fetch(`/api/lop/${id}`, { method: 'DELETE' })
    if (!res.ok) setItems(initialItems)
  }

  function handleNewItem(item: LopItem) {
    setItems(prev => [item, ...prev])
  }

  return (
    <div>
      <ReviewBanner
        count={reviewCount}
        onShowReview={() => setShowReviewOnly(v => !v)}
      />

      {/* Filter-Leiste */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Input
          placeholder="Suchen…"
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
          className="w-48 h-8 text-sm"
        />
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v ?? 'all')}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="offen">Offen</SelectItem>
            <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
            <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={v => setFilterPriority(v ?? 'all')}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Priorität" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Prioritäten</SelectItem>
            <SelectItem value="hoch">Hoch</SelectItem>
            <SelectItem value="mittel">Mittel</SelectItem>
            <SelectItem value="niedrig">Niedrig</SelectItem>
          </SelectContent>
        </Select>
        {showReviewOnly && (
          <button
            onClick={() => setShowReviewOnly(false)}
            className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full border border-yellow-200"
          >
            ⚠ Nur Review-Punkte ✕
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} von {items.length} Punkte{items.length !== 1 ? 'n' : ''}
        </span>
      </div>

      {/* Tabelle */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-3 py-2 text-center w-8">#</th>
              <th className="px-3 py-2 text-left">Titel</th>
              <th className="px-3 py-2 text-left w-36">Status</th>
              <th className="px-3 py-2 text-left w-32">Verantwortlich</th>
              <th className="px-3 py-2 text-left w-28">Fälligkeit</th>
              <th className="px-3 py-2 text-left w-24">Priorität</th>
              <th className="px-3 py-2 text-left">Ergebnis</th>
              <th className="px-3 py-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                  {items.length === 0
                    ? 'Noch keine LOP-Punkte vorhanden.'
                    : 'Keine Punkte entsprechen dem Filter.'}
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <LopTableRow
                  key={item.id}
                  item={item}
                  index={index}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Neuer LOP-Punkt */}
      {canEdit && (
        <AddLopItemForm projectId={projectId} onAdd={handleNewItem} />
      )}
    </div>
  )
}

// ─── Inline-Formular für neuen LOP-Punkt ──────────────────────────────────────
function AddLopItemForm({
  projectId,
  onAdd,
}: {
  projectId: string
  onAdd: (item: LopItem) => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [responsible, setResponsible] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>('mittel')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/lop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        title,
        responsible: responsible || null,
        due_date: dueDate || null,
        priority,
      }),
    })

    if (!res.ok) {
      const { error } = await res.json()
      setError(error ?? 'Fehler beim Erstellen.')
      setLoading(false)
      return
    }

    const item = await res.json()
    onAdd(item)
    setTitle('')
    setResponsible('')
    setDueDate('')
    setPriority('mittel')
    setOpen(false)
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
      >
        + LOP-Punkt hinzufügen
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-white border border-blue-200 rounded-lg p-4 space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Titel des LOP-Punktes *"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="flex-1 text-sm"
          autoFocus
        />
        <Select value={priority} onValueChange={v => setPriority((v ?? 'mittel') as Priority)}>
          <SelectTrigger className="w-28 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoch">Hoch</SelectItem>
            <SelectItem value="mittel">Mittel</SelectItem>
            <SelectItem value="niedrig">Niedrig</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Verantwortlich"
          value={responsible}
          onChange={e => setResponsible(e.target.value)}
          className="flex-1 text-sm"
        />
        <Input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="w-40 text-sm"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Abbrechen
        </Button>
        <Button type="submit" size="sm" disabled={loading} style={{ backgroundColor: 'var(--brand)' }}>
          {loading ? 'Wird gespeichert…' : 'Hinzufügen'}
        </Button>
      </div>
    </form>
  )
}
