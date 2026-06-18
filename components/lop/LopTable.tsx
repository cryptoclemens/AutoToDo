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

interface Idea {
  id: string
  title: string
  note: string | null
  created_by_name: string | null
  created_at: string
  source: 'idea' | 'parked_lop'
}

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

  const [ideas, setIdeas] = useState<Idea[]>([])
  const [ideasOpen, setIdeasOpen] = useState(false)
  const [ideaFormOpen, setIdeaFormOpen] = useState(false)
  const [ideaTitle, setIdeaTitle] = useState('')
  const [ideaNote, setIdeaNote] = useState('')
  const [ideaSubmitting, setIdeaSubmitting] = useState(false)
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null)
  const [editIdeaTitle, setEditIdeaTitle] = useState('')
  const [editIdeaNote, setEditIdeaNote] = useState('')
  const [editIdeaSaving, setEditIdeaSaving] = useState(false)

  const showAddForm = externalShowAddForm ?? internalShowAddForm
  const setShowAddForm = onShowAddFormChange ?? setInternalShowAddForm

  const [members, setMembers] = useState<WorkspaceMember[]>([])

  useEffect(() => {
    fetch(`/api/members?projectId=${encodeURIComponent(projectId)}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: WorkspaceMember[]) => setMembers(data))
      .catch(() => {})
  }, [projectId])

  function fetchIdeas() {
    fetch(`/api/ideas?projectId=${encodeURIComponent(projectId)}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Idea[]) => setIdeas(data))
      .catch(() => {})
  }

  useEffect(() => { fetchIdeas() }, [projectId])

  // Sync local items when server refreshes data (triggered by router.refresh())
  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  // Auto-refresh every 5 min when no dialog, form, or active recording
  useEffect(() => {
    const interval = setInterval(() => {
      const isRecording = typeof window !== 'undefined' && window.__autoToDo?.isRecording()
      if (!selectedItem && !showAddForm && !showReviewPanel && !showMergeDialog && !isRecording) {
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

  const STATUS_ORDER: Record<string, number> = { offen: 0, in_bearbeitung: 1, abgeschlossen: 2, geparkt: 3, backlog: 4 }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const filtered = items
    .filter(item => {
      if (standupMode && item.status === 'abgeschlossen') return false
      if (standupMode && item.status === 'backlog') return false
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

  const backlogItems = standupMode ? items.filter(i => i.status === 'backlog') : []

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

  async function handleParkItem(id: string) {
    const item = items.find(i => i.id === id)
    const targetStatus = (item?.status as string) === 'geparkt' ? 'offen' : 'geparkt'
    const res = await fetch(`/api/lop/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: targetStatus }),
    })
    if (res.ok) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: targetStatus as LopItem['status'] } : i))
      setSelectedItem(prev => prev?.id === id ? { ...prev, status: targetStatus as LopItem['status'] } : prev)
      fetchIdeas()
    }
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

  async function handleIdeaAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!ideaTitle.trim()) return
    setIdeaSubmitting(true)
    const res = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, title: ideaTitle, note: ideaNote || undefined }),
    })
    if (res.ok) {
      const idea: Idea = await res.json()
      setIdeas(prev => [idea, ...prev])
      setIdeaTitle('')
      setIdeaNote('')
      setIdeaFormOpen(false)
    }
    setIdeaSubmitting(false)
  }

  async function handleIdeaDelete(id: string) {
    const idea = ideas.find(i => i.id === id)
    const url = idea?.source === 'parked_lop' ? `/api/lop/${id}` : `/api/ideas/${id}`
    const res = await fetch(url, { method: 'DELETE' })
    if (res.ok) setIdeas(prev => prev.filter(i => i.id !== id))
  }

  async function handleIdeaPromote(idea: Idea) {
    if (idea.source === 'parked_lop') {
      const res = await fetch(`/api/lop/${idea.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'offen' }),
      })
      if (res.ok) {
        setIdeas(prev => prev.filter(i => i.id !== idea.id))
        setItems(prev => prev.map(i => i.id === idea.id ? { ...i, status: 'offen' as LopItem['status'] } : i))
      }
    } else {
      const res = await fetch(`/api/ideas/${idea.id}`, { method: 'PATCH' })
      if (res.ok) {
        setIdeas(prev => prev.filter(i => i.id !== idea.id))
        router.refresh()
      }
    }
  }

  function startEditIdea(idea: Idea) {
    setEditingIdeaId(idea.id)
    setEditIdeaTitle(idea.title)
    setEditIdeaNote(idea.note ?? '')
  }

  async function handleIdeaUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingIdeaId || !editIdeaTitle.trim()) return
    setEditIdeaSaving(true)
    const res = await fetch(`/api/ideas/${editingIdeaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editIdeaTitle, note: editIdeaNote || undefined }),
    })
    if (res.ok) {
      const updated: Idea = await res.json()
      setIdeas(prev => prev.map(i => i.id === editingIdeaId ? { ...i, ...updated } : i))
      setEditingIdeaId(null)
    }
    setEditIdeaSaving(false)
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
                <SelectItem value="backlog">{t('status.backlog')}</SelectItem>
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
                          onPark={handleParkItem}
                          onOpenDetail={() => setSelectedItem(item)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}

          {/* Backlog-Sektion im Stand-up */}
          {backlogItems.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl bg-slate-50 dark:bg-slate-800/40 border border-b-0 border-gray-100 dark:border-gray-700">
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Backlog</span>
                <span className="text-xs text-gray-400 ml-1">({backlogItems.length})</span>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-b-xl border border-gray-100 dark:border-gray-700 px-4 py-3 space-y-2">
                {backlogItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-1 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium truncate">{item.title}</p>
                      {item.responsible && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.responsible}</p>
                      )}
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleUpdate(item.id, { status: 'offen' as LopItem['status'] })}
                        className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 font-medium transition-colors"
                        title="In aktive Aufgaben verschieben"
                      >
                        Aktivieren
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
                    onPark={handleParkItem}
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
        existingNames={responsibleOptions}
        onClose={() => setSelectedItem(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onPark={handleParkItem}
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

      {/* Ideenspeicher */}
      {standupMode ? (
        /* Standup: immer sichtbar, gedimmt unter den offenen Punkten */
        <div className="mt-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl bg-gray-50 border border-b-0 border-gray-100 dark:bg-gray-800/50 dark:border-gray-700">
            <span className="text-lg leading-none">💡</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ideenspeicher</span>
            <span className="text-xs text-gray-300 ml-1">({ideas.length})</span>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-b-xl border border-gray-100 dark:border-gray-700 px-4 py-3">
            {ideas.length === 0 ? (
              <p className="text-xs text-gray-300 py-1">Noch keine Ideen hinterlegt.</p>
            ) : (
              <ul className="space-y-2">
                {ideas.map(idea => (
                  <li key={idea.id} className="group">
                    {editingIdeaId === idea.id && idea.source === 'idea' ? (
                      <form onSubmit={handleIdeaUpdate} className="space-y-1.5 py-1">
                        <input
                          className="w-full text-xs border border-input rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          value={editIdeaTitle}
                          onChange={e => setEditIdeaTitle(e.target.value)}
                          required
                          autoFocus
                        />
                        <textarea
                          className="w-full text-xs border border-input rounded px-2 py-1 bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                          value={editIdeaNote}
                          onChange={e => setEditIdeaNote(e.target.value)}
                          rows={2}
                          maxLength={500}
                        />
                        <div className="flex gap-1.5">
                          <button type="submit" disabled={editIdeaSaving} className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                            {editIdeaSaving ? '…' : 'Speichern'}
                          </button>
                          <button type="button" onClick={() => setEditingIdeaId(null)} className="text-xs px-2 py-0.5 rounded border text-gray-500 hover:bg-gray-50">
                            Abbrechen
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start gap-2 py-0.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-300 font-medium">
                            {idea.title}
                            {idea.source === 'parked_lop' && (
                              <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                                {t('parkedBadge')}
                              </span>
                            )}
                          </p>
                          {idea.note && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{idea.note}</p>}
                        </div>
                        {canEdit && (
                          <div className="flex gap-1 shrink-0">
                            {idea.source === 'parked_lop' ? (
                              <button
                                type="button"
                                title="LOP-Punkt bearbeiten"
                                onClick={() => setSelectedItem(items.find(i => i.id === idea.id) ?? null)}
                                className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-xs"
                              >✎</button>
                            ) : (
                              <button
                                type="button"
                                title="Idee bearbeiten"
                                onClick={() => startEditIdea(idea)}
                                className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-xs"
                              >✎</button>
                            )}
                            <button
                              type="button"
                              title="Zu LOP-Punkt umwandeln"
                              onClick={() => handleIdeaPromote(idea)}
                              className="p-1 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors text-xs font-medium"
                            >→ Aufgabe</button>
                            <button
                              type="button"
                              title="Idee löschen"
                              onClick={() => handleIdeaDelete(idea.id)}
                              className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        /* Normalansicht: ausklappbarer Abschnitt unterhalb der Tabelle */
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setIdeasOpen(v => !v)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <span className="text-base leading-none">💡</span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Ideenspeicher</span>
            {ideas.length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">{ideas.length}</span>
            )}
            <svg
              className={`ml-auto w-3.5 h-3.5 text-gray-400 transition-transform ${ideasOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 14 14" fill="none"
            >
              <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {ideasOpen && (
            <div className="mt-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 space-y-3">
              {ideas.length === 0 && !ideaFormOpen && (
                <p className="text-xs text-gray-400">Noch keine Ideen. Halte lose Gedanken ohne Umsetzungsdruck fest.</p>
              )}

              {ideas.map(idea => (
                <div key={idea.id} className="group py-1 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  {editingIdeaId === idea.id && idea.source === 'idea' ? (
                    <form onSubmit={handleIdeaUpdate} className="space-y-2">
                      <input
                        className="w-full text-sm border border-input rounded-md px-3 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        value={editIdeaTitle}
                        onChange={e => setEditIdeaTitle(e.target.value)}
                        required
                        autoFocus
                      />
                      <textarea
                        className="w-full text-sm border border-input rounded-md px-3 py-1.5 bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                        value={editIdeaNote}
                        onChange={e => setEditIdeaNote(e.target.value)}
                        rows={2}
                        maxLength={500}
                        placeholder="Kurze Erklärung (optional)"
                      />
                      <div className="flex gap-2">
                        <button type="submit" disabled={editIdeaSaving} className="text-xs px-2.5 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium">
                          {editIdeaSaving ? 'Speichert…' : 'Speichern'}
                        </button>
                        <button type="button" onClick={() => setEditingIdeaId(null)} className="text-xs px-2.5 py-1 rounded-md border text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                          Abbrechen
                        </button>
                      </div>
                    </form>
                  ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2">
                        {idea.title}
                        {idea.source === 'parked_lop' && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                            {t('parkedBadge')}
                          </span>
                        )}
                      </p>
                      {idea.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 whitespace-pre-wrap">{idea.note}</p>}
                      <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                        {idea.created_by_name ?? 'Unbekannt'} · {new Date(idea.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {canEdit && (
                      idea.source === 'parked_lop' ? (
                        <button
                          type="button"
                          title="LOP-Punkt bearbeiten"
                          onClick={() => setSelectedItem(items.find(i => i.id === idea.id) ?? null)}
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-xs font-medium"
                        >✎</button>
                      ) : (
                        <button
                          type="button"
                          title="Idee bearbeiten"
                          onClick={() => startEditIdea(idea)}
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-xs font-medium"
                        >✎</button>
                      )
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        title="Zu LOP-Punkt umwandeln"
                        onClick={() => handleIdeaPromote(idea)}
                        className="p-1 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors text-xs font-medium"
                      >
                        → Aufgabe
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        title="Idee löschen"
                        onClick={() => handleIdeaDelete(idea.id)}
                        className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  </div>
                  )}
                </div>
              ))}

              {canEdit && !ideaFormOpen && (
                <button
                  type="button"
                  onClick={() => setIdeaFormOpen(true)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
                >
                  <span className="text-base leading-none">+</span> Idee hinzufügen
                </button>
              )}

              {ideaFormOpen && (
                <form onSubmit={handleIdeaAdd} className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                  <Input
                    placeholder="Idee (Titel) *"
                    value={ideaTitle}
                    onChange={e => setIdeaTitle(e.target.value)}
                    required
                    autoFocus
                    className="text-sm"
                  />
                  <textarea
                    placeholder="Kurze Erklärung (optional, max. 3 Sätze)"
                    value={ideaNote}
                    onChange={e => setIdeaNote(e.target.value)}
                    rows={2}
                    maxLength={500}
                    className="w-full text-sm border border-input rounded-md px-3 py-2 bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => { setIdeaFormOpen(false); setIdeaTitle(''); setIdeaNote('') }}>
                      Abbrechen
                    </Button>
                    <Button type="submit" size="sm" disabled={ideaSubmitting} style={{ backgroundColor: 'var(--brand)' }} className="text-white">
                      {ideaSubmitting ? 'Wird gespeichert…' : 'Speichern'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
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
