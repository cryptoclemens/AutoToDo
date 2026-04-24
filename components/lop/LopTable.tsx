'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import LopTableRow from './LopTableRow'
import LopItemDialog, { type LopItem } from './LopItemDialog'
import ReviewBanner from './ReviewBanner'
import AiReviewPanel from './AiReviewPanel'
import MergeSuggestionDialog from './MergeSuggestionDialog'
import ResponsibleSelect, { type WorkspaceMember } from './ResponsibleSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { findSimilarPairs, type SimilarPair } from '@/lib/similarity'

type Priority = 'hoch' | 'mittel' | 'niedrig'

interface TranslationMap {
  [id: string]: { title: string; description: string | null }
}

interface Props {
  initialItems: LopItem[]
  projectId: string
  currentLocale?: string
  canEdit: boolean
  showAddForm?: boolean
  onShowAddFormChange?: (v: boolean) => void
}

export default function LopTable({ initialItems, projectId, currentLocale, canEdit, showAddForm: externalShowAddForm, onShowAddFormChange }: Props) {
  const t = useTranslations('lop')
  const router = useRouter()
  const [items, setItems] = useState<LopItem[]>(initialItems)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterResponsible, setFilterResponsible] = useState<string>('all')
  const [filterSearch, setFilterSearch] = useState('')
  const [showReviewPanel, setShowReviewPanel] = useState(false)
  const [selectedItem, setSelectedItem] = useState<LopItem | null>(null)
  const [internalShowAddForm, setInternalShowAddForm] = useState(false)
  const [standupMode, setStandupMode] = useState(false)
  const [mergePairs, setMergePairs] = useState<SimilarPair[]>([])
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [translations, setTranslations] = useState<TranslationMap>({})
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState('')
  const showTranslateButton = currentLocale === 'en'
  const isTranslated = Object.keys(translations).length > 0

  const showAddForm = externalShowAddForm ?? internalShowAddForm
  const setShowAddForm = onShowAddFormChange ?? setInternalShowAddForm

  const [members, setMembers] = useState<WorkspaceMember[]>([])

  useEffect(() => {
    fetch(`/api/members?projectId=${encodeURIComponent(projectId)}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: WorkspaceMember[]) => setMembers(data))
      .catch(() => {})
  }, [projectId])

  // Sync local items when server refreshes data (triggered by router.refresh())
  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  // Auto-refresh every 5 min when no dialog or form is open
  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedItem && !showAddForm && !showReviewPanel && !showMergeDialog) {
        router.refresh()
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedItem, showAddForm, showReviewPanel, showMergeDialog, router])

  const reviewItems = items.filter(i => i.requires_review)
  const reviewCount = reviewItems.length

  // Distinct responsible values for filter dropdown
  const responsibleOptions = useMemo(() => {
    const values = items
      .map(i => i.responsible)
      .filter((r): r is string => !!r)
    return Array.from(new Set(values)).sort()
  }, [items])

  const STATUS_ORDER: Record<string, number> = { offen: 0, in_bearbeitung: 1, abgeschlossen: 2 }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const filtered = items
    .filter(item => {
      if (standupMode && item.status === 'abgeschlossen') return false
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
    .sort((a, b) => {
      if (standupMode) {
        // Sort: overdue first, then today, then open/in-progress by priority
        const PRIORITY_ORDER: Record<string, number> = { hoch: 0, mittel: 1, niedrig: 2 }
        const dueA = a.due_date ? new Date(a.due_date) : null
        const dueB = b.due_date ? new Date(b.due_date) : null
        const overdueA = dueA && dueA < today ? 1 : 0
        const overdueB = dueB && dueB < today ? 1 : 0
        if (overdueA !== overdueB) return overdueB - overdueA
        return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
      }
      return (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0)
    })

  // Apply translations to display items (originals kept in state for saving)
  const displayFiltered = useMemo(() => {
    if (!isTranslated) return filtered
    return filtered.map(item => {
      const tr = translations[item.id]
      if (!tr) return item
      return { ...item, title: tr.title, description: tr.description }
    })
  }, [filtered, translations, isTranslated])

  // Stand-up sections
  const standupSections = standupMode ? [
    {
      key: 'overdue',
      label: 'Überfällig',
      color: 'text-red-700',
      bg: 'bg-red-50',
      dot: 'bg-red-500',
      items: displayFiltered.filter(i => i.due_date && new Date(i.due_date) < today),
    },
    {
      key: 'today',
      label: 'Heute fällig',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      dot: 'bg-amber-500',
      items: displayFiltered.filter(i => {
        if (!i.due_date) return false
        const d = new Date(i.due_date)
        return d >= today && d < tomorrow
      }),
    },
    {
      key: 'inprogress',
      label: 'In Bearbeitung',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      dot: 'bg-blue-500',
      items: displayFiltered.filter(i => i.status === 'in_bearbeitung' && (!i.due_date || new Date(i.due_date) >= tomorrow)),
    },
    {
      key: 'open',
      label: 'Offen',
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      dot: 'bg-slate-400',
      items: displayFiltered.filter(i => i.status === 'offen' && (!i.due_date || new Date(i.due_date) >= tomorrow)),
    },
  ].filter(s => s.items.length > 0) : []

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
      // Check for similar pairs after accepting AI items
      const open = prev.filter(i => i.status !== 'abgeschlossen')
      const pairs = findSimilarPairs(open)
      if (pairs.length > 0) {
        setMergePairs(pairs)
        setShowMergeDialog(true)
      }
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
    setItems(prev => {
      const updated = [item, ...prev]
      const open = updated.filter(i => i.status !== 'abgeschlossen')
      const pairs = findSimilarPairs(open)
      if (pairs.length > 0) {
        setMergePairs(pairs)
        setShowMergeDialog(true)
      }
      return updated
    })
  }

  async function handleMerge(keepId: string, deleteId: string) {
    const res = await fetch(`/api/lop/${deleteId}`, { method: 'DELETE' })
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== deleteId))
      if (selectedItem?.id === deleteId) setSelectedItem(null)
    }
  }

  async function handleTranslate() {
    if (isTranslated) { setTranslations({}); return }
    setTranslating(true)
    setTranslateError('')
    try {
      const payload = items.map(i => ({ id: i.id, title: i.title, description: i.description }))
      const res = await fetch('/api/lop/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload, targetLocale: currentLocale }),
      })
      const data = await res.json()
      if (!res.ok) { setTranslateError(data.error ?? 'Fehler'); return }
      const map: TranslationMap = {}
      for (const t of data.translations ?? []) map[t.id] = { title: t.title, description: t.description }
      setTranslations(map)
    } catch {
      setTranslateError('Netzwerkfehler')
    } finally {
      setTranslating(false)
    }
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

      {/* Filter-Leiste + Stand-up Toggle */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {!standupMode && (
          <>
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
          </>
        )}

        {standupMode && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-semibold text-blue-700">Daily Stand-up</span>
            <span className="text-xs text-blue-500">· {displayFiltered.length} offene Punkte</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {!standupMode && (
            <span className="text-xs text-gray-400">
              {t('filters.showing', { count: displayFiltered.length, total: items.length })}
            </span>
          )}
          {showTranslateButton && items.length > 0 && (
            <div className="flex flex-col items-end gap-0.5">
              <button
                onClick={handleTranslate}
                disabled={translating}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border
                  ${isTranslated
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'}
                  disabled:opacity-50`}
                title={isTranslated ? 'Show original German' : 'Translate to English via BYOK LLM'}
              >
                {translating ? (
                  <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v2M6 9v2M1 6h2M9 6h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M6 1c-1.5 2-1.5 8 0 10M6 1c1.5 2 1.5 8 0 10M1 6h10" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                )}
                {translating ? 'Translating…' : isTranslated ? 'Original' : 'Translate'}
              </button>
              {translateError && (
                <span className="text-xs text-red-500">{translateError}</span>
              )}
            </div>
          )}
          <button
            onClick={() => setStandupMode(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${standupMode
                ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'}`}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="4" r="2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M2 11c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Stand-up
          </button>
        </div>
      </div>

      {/* Stand-up-Modus: Sektionen */}
      {standupMode ? (
        <div className="space-y-4">
          {standupSections.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 py-12 text-center text-gray-400 text-sm">
              Keine offenen Punkte – alles erledigt!
            </div>
          ) : (
            standupSections.map(section => (
              <div key={section.key}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-t-xl ${section.bg} border border-b-0 border-gray-100 dark:border-gray-800`}>
                  <span className={`w-2 h-2 rounded-full ${section.dot}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${section.color}`}>{section.label}</span>
                  <span className="text-xs text-gray-400 ml-1">({section.items.length})</span>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-b-xl border border-gray-100 dark:border-gray-800 overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {section.items.map((item, index) => (
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Normale Tabellen-Ansicht */
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-3 py-2.5 text-center w-8">#</th>
                <th className="px-3 py-2.5 text-left">{t('title')}</th>
                <th className="px-3 py-2.5 text-left w-36">{t('status_label')}</th>
                <th className="px-3 py-2.5 text-left w-32">{t('responsible')}</th>
                <th className="px-3 py-2.5 text-left w-28">{t('dueDate')}</th>
                <th className="px-3 py-2.5 text-left w-24">{t('priority_label')}</th>
                <th className="px-3 py-2.5 text-left">{t('result')}</th>
                <th className="px-3 py-2.5 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {displayFiltered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                    {items.length === 0
                      ? t('noItems')
                      : t('filters.noMatch')}
                  </td>
                </tr>
              ) : (
                displayFiltered.map((item, index) => (
                  <LopTableRow
                    key={item.id}
                    item={item}
                    index={index}
                    canEdit={canEdit}
                    members={members}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onOpenDetail={() => setSelectedItem(items.find(i => i.id === item.id) ?? item)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

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
        onDelete={handleDelete}
      />

      {/* Merge-Vorschlag-Dialog */}
      {showMergeDialog && mergePairs.length > 0 && (
        <MergeSuggestionDialog
          pairs={mergePairs}
          items={items}
          onMerge={handleMerge}
          onDismiss={() => { setShowMergeDialog(false); setMergePairs([]) }}
        />
      )}
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
    <form onSubmit={handleSubmit} className="mt-3 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-3">
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
