'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import LopTableRow from './LopTableRow'
import LopItemDialog, { type LopItem } from './LopItemDialog'
import ReviewBanner from './ReviewBanner'
import AiReviewPanel from './AiReviewPanel'
import ResponsibleSelect, { type WorkspaceMember } from './ResponsibleSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Priority = 'hoch' | 'mittel' | 'niedrig'

interface Props {
  initialItems: LopItem[]
  projectId: string
  canEdit: boolean
  showAddForm?: boolean
  onShowAddFormChange?: (v: boolean) => void
}

export default function LopTable({ initialItems, projectId, canEdit, showAddForm: externalShowAddForm, onShowAddFormChange }: Props) {
  const t = useTranslations('lop')
  const [items, setItems] = useState<LopItem[]>(initialItems)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterResponsible, setFilterResponsible] = useState<string>('all')
  const [filterSearch, setFilterSearch] = useState('')
  const [showReviewPanel, setShowReviewPanel] = useState(false)
  const [selectedItem, setSelectedItem] = useState<LopItem | null>(null)
  const [internalShowAddForm, setInternalShowAddForm] = useState(false)

  const showAddForm = externalShowAddForm ?? internalShowAddForm
  const setShowAddForm = onShowAddFormChange ?? setInternalShowAddForm

  const [members, setMembers] = useState<WorkspaceMember[]>([])

  useEffect(() => {
    fetch('/api/members')
      .then(r => r.ok ? r.json() : [])
      .then((data: WorkspaceMember[]) => setMembers(data))
      .catch(() => {})
  }, [])

  const reviewItems = items.filter(i => i.requires_review)
  const reviewCount = reviewItems.length

  // Distinct responsible values for filter dropdown
  const responsibleOptions = useMemo(() => {
    const values = items
      .map(i => i.responsible)
      .filter((r): r is string => !!r)
    return Array.from(new Set(values)).sort()
  }, [items])

  const filtered = items.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false
    if (filterResponsible !== 'all' && item.responsible !== filterResponsible) return false
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
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i))
    setSelectedItem(prev => prev?.id === id ? { ...prev, ...changes } : prev)

    const res = await fetch(`/api/lop/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })

    if (!res.ok) {
      setItems(initialItems)
    }
  }

  async function handleAccept(id: string, changes: Partial<LopItem>) {
    await handleUpdate(id, changes)
    // Close panel if no more review items remain
    setItems(prev => {
      const remaining = prev.filter(i => i.id !== id ? i.requires_review : false)
      if (remaining.length === 0) setShowReviewPanel(false)
      return prev
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Diesen LOP-Punkt wirklich löschen?')) return
    await deleteItem(id)
  }

  async function deleteItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    if (selectedItem?.id === id) setSelectedItem(null)
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
        expanded={showReviewPanel}
        onToggle={() => setShowReviewPanel(v => !v)}
      />

      {showReviewPanel && (
        <AiReviewPanel
          items={reviewItems}
          canEdit={canEdit}
          onAccept={handleAccept}
          onReject={deleteItem}
        />
      )}

      {/* Filter-Leiste */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Input
          placeholder={t('filters.search')}
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
          className="w-44 h-8 text-sm"
        />
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v ?? 'all')}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder={t('status_label')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
            <SelectItem value="offen">{t('status.offen')}</SelectItem>
            <SelectItem value="in_bearbeitung">{t('status.in_bearbeitung')}</SelectItem>
            <SelectItem value="abgeschlossen">{t('status.abgeschlossen')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={v => setFilterPriority(v ?? 'all')}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder={t('priority_label')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allPriorities')}</SelectItem>
            <SelectItem value="hoch">{t('priority.hoch')}</SelectItem>
            <SelectItem value="mittel">{t('priority.mittel')}</SelectItem>
            <SelectItem value="niedrig">{t('priority.niedrig')}</SelectItem>
          </SelectContent>
        </Select>
        {responsibleOptions.length > 0 && (
          <Select value={filterResponsible} onValueChange={v => setFilterResponsible(v ?? 'all')}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder={t('responsible')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allResponsible')}</SelectItem>
              {responsibleOptions.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {t('filters.showing', { count: filtered.length, total: items.length })}
        </span>
      </div>

      {/* Tabelle */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-3 py-2 text-center w-8">#</th>
              <th className="px-3 py-2 text-left">{t('title')}</th>
              <th className="px-3 py-2 text-left w-36">{t('status_label')}</th>
              <th className="px-3 py-2 text-left w-32">{t('responsible')}</th>
              <th className="px-3 py-2 text-left w-28">{t('dueDate')}</th>
              <th className="px-3 py-2 text-left w-24">{t('priority_label')}</th>
              <th className="px-3 py-2 text-left">{t('result')}</th>
              <th className="px-3 py-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                  {items.length === 0
                    ? t('noItems')
                    : t('filters.noMatch')}
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <LopTableRow
                  key={item.id}
                  item={item}
                  index={index}
                  canEdit={canEdit}
                  members={members}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onOpenDetail={() => setSelectedItem(item)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Neuer LOP-Punkt */}
      {canEdit && (
        <AddLopItemForm
          projectId={projectId}
          members={members}
          onAdd={handleNewItem}
          open={showAddForm}
          onOpenChange={setShowAddForm}
        />
      )}

      {/* Detail-Dialog */}
      <LopItemDialog
        item={selectedItem}
        canEdit={canEdit}
        members={members}
        onClose={() => setSelectedItem(null)}
        onUpdate={handleUpdate}
      />
    </div>
  )
}

// ─── Inline-Formular für neuen LOP-Punkt ──────────────────────────────────────
function AddLopItemForm({
  projectId,
  members,
  onAdd,
  open,
  onOpenChange,
}: {
  projectId: string
  members: WorkspaceMember[]
  onAdd: (item: LopItem) => void
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [title, setTitle] = useState('')
  const [responsible, setResponsible] = useState<string | null>(null)
  const [responsibleUserId, setResponsibleUserId] = useState<string | null>(null)
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
        responsible,
        responsible_user_id: responsibleUserId,
        due_date: dueDate || null,
        priority,
      }),
    })

    if (!res.ok) {
      const { error: e } = await res.json()
      setError(e ?? 'Fehler beim Erstellen.')
      setLoading(false)
      return
    }

    const item = await res.json()
    onAdd(item)
    setTitle('')
    setResponsible(null)
    setResponsibleUserId(null)
    setDueDate('')
    setPriority('mittel')
    onOpenChange(false)
    setLoading(false)
  }

  if (!open) return null

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
        <div className="flex-1">
          <ResponsibleSelect
            responsible={responsible}
            responsibleUserId={responsibleUserId}
            members={members}
            onChange={(r, uid) => { setResponsible(r); setResponsibleUserId(uid) }}
            className="w-full text-sm h-9"
            placeholder="Verantwortlich"
          />
        </div>
        <Input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="w-40 text-sm"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Abbrechen
        </Button>
        <Button type="submit" size="sm" disabled={loading} style={{ backgroundColor: 'var(--brand)' }} className="text-white">
          {loading ? 'Wird gespeichert…' : 'Hinzufügen'}
        </Button>
      </div>
    </form>
  )
}
