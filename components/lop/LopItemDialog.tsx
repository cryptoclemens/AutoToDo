'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import ResponsibleSelect, { type WorkspaceMember } from './ResponsibleSelect'
import { useStatusLabels } from '@/lib/statusLabels'

interface ActivityInfo {
  created: { name: string; date: string; byAi: boolean } | null
  lastEdited: { name: string; date: string; byAi: boolean } | null
}

type Status = 'offen' | 'in_bearbeitung' | 'abgeschlossen' | 'geparkt' | 'backlog'
type Priority = 'hoch' | 'mittel' | 'niedrig'

export interface LopLink {
  url: string
  label?: string
}

export interface CoResponsible {
  name: string
  user_id?: string | null
}

export interface LopItem {
  id: string
  title: string
  description: string | null
  responsible: string | null
  responsible_user_id: string | null
  due_date: string | null
  priority: Priority
  status: Status
  result: string | null
  requires_review: boolean
  ai_confidence: number | null
  source_quote: string | null
  links?: LopLink[]
  co_responsibles?: CoResponsible[]
  parent_id?: string | null
  merged_into_id?: string | null
}

interface Props {
  item: LopItem | null
  canEdit: boolean
  members: WorkspaceMember[]
  existingNames?: string[]
  /** Alle Punkte des Projekts – für Teilaufgaben (parent_id), Eltern-Anzeige und Verknüpfungs-Auswahl */
  allItems?: LopItem[]
  onClose: () => void
  onUpdate: (id: string, changes: Partial<LopItem>) => Promise<void>
  onDelete?: (id: string) => void
  onPark: (id: string) => void
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function isValidUrl(s: string): boolean {
  try { new URL(s); return true } catch { return false }
}

export default function LopItemDialog({ item, canEdit, members, existingNames = [], allItems = [], onClose, onUpdate, onDelete, onPark }: Props) {
  const t = useTranslations('lop')
  const router = useRouter()
  const statusLabels = useStatusLabels()
  const [draft, setDraft] = useState<LopItem | null>(null)
  const [saving, setSaving] = useState(false)

  // Aufteilen (F-21b): Teilaufgaben-Titel
  const [splitOpen, setSplitOpen] = useState(false)
  const [subtaskTitles, setSubtaskTitles] = useState<string[]>(['', ''])
  const [splitSaving, setSplitSaving] = useState(false)

  // Verknüpfen (F-21a): verwandte Punkte
  const [related, setRelated] = useState<{ id: string; title: string; status: string }[]>([])
  const [linkSaving, setLinkSaving] = useState(false)

  // Abgeleitete Beziehungen aus allItems
  const children = item ? allItems.filter(i => i.parent_id === item.id) : []
  const parentItem = item?.parent_id ? allItems.find(i => i.id === item.parent_id) ?? null : null
  const doneChildren = children.filter(c => c.status === 'abgeschlossen').length
  const [activity, setActivity] = useState<ActivityInfo | null>(null)
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [linkError, setLinkError] = useState('')

  // Reminder state
  const [reminderActive, setReminderActive] = useState(false)
  const [reminderId, setReminderId] = useState<string | null>(null)
  const [reminderFrequency, setReminderFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly')
  const [reminderDayOfWeek, setReminderDayOfWeek] = useState<number>(0) // 0=Montag
  const [reminderDayOfMonth, setReminderDayOfMonth] = useState<number>(1)
  const [reminderSaving, setReminderSaving] = useState(false)

  useEffect(() => {
    setDraft(item ? { ...item, links: item.links ?? [], co_responsibles: item.co_responsibles ?? [] } : null)
    setActivity(null)
    setNewLinkUrl('')
    setNewLinkLabel('')
    setLinkError('')
    // Reset reminder state
    setReminderActive(false)
    setReminderId(null)
    setReminderFrequency('weekly')
    setReminderDayOfWeek(0)
    setReminderDayOfMonth(1)
    // Split/Verknüpfungs-State zurücksetzen
    setSplitOpen(false)
    setSubtaskTitles(['', ''])
    setRelated([])
  }, [item])

  const loadActivity = useCallback(async (id: string) => {
    const res = await fetch(`/api/lop/${id}/activity`)
    if (res.ok) setActivity(await res.json())
  }, [])

  const loadReminder = useCallback(async (lopItemId: string) => {
    const res = await fetch(`/api/reminders?lopItemId=${lopItemId}`)
    if (res.ok) {
      const json = await res.json()
      if (json.reminder) {
        setReminderActive(true)
        setReminderId(json.reminder.id)
        setReminderFrequency(json.reminder.frequency)
        if (json.reminder.day_of_week !== null) setReminderDayOfWeek(json.reminder.day_of_week)
        if (json.reminder.day_of_month !== null) setReminderDayOfMonth(json.reminder.day_of_month)
      }
    }
  }, [])

  const loadRelated = useCallback(async (id: string) => {
    const res = await fetch(`/api/lop/relations?itemId=${id}`)
    if (res.ok) setRelated(await res.json())
  }, [])

  useEffect(() => {
    if (item?.id) {
      loadActivity(item.id)
      loadReminder(item.id)
      loadRelated(item.id)
    }
  }, [item?.id, loadActivity, loadReminder, loadRelated])

  async function handleSplit() {
    if (!draft) return
    const titles = subtaskTitles.map(s => s.trim()).filter(Boolean)
    if (titles.length === 0) return
    setSplitSaving(true)
    const res = await fetch('/api/lop/split', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: draft.id, subtasks: titles.map(title => ({ title })) }),
    })
    setSplitSaving(false)
    if (res.ok) {
      onClose()
      router.refresh()
    }
  }

  async function handleLink(relatedId: string) {
    if (!draft || !relatedId) return
    setLinkSaving(true)
    const res = await fetch('/api/lop/relations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: draft.id, relatedId }),
    })
    setLinkSaving(false)
    if (res.ok) loadRelated(draft.id)
  }

  async function handleUnlink(relatedId: string) {
    if (!draft) return
    setLinkSaving(true)
    const res = await fetch('/api/lop/relations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: draft.id, relatedId }),
    })
    setLinkSaving(false)
    if (res.ok) setRelated(prev => prev.filter(r => r.id !== relatedId))
  }

  async function handleReminderToggle(active: boolean) {
    if (!draft) return
    if (!active && reminderId) {
      // Delete reminder
      setReminderSaving(true)
      await fetch(`/api/reminders/${reminderId}`, { method: 'DELETE' })
      setReminderActive(false)
      setReminderId(null)
      setReminderSaving(false)
    } else if (!active) {
      setReminderActive(false)
    } else {
      setReminderActive(true)
    }
  }

  async function handleReminderSave() {
    if (!draft) return
    setReminderSaving(true)
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lopItemId: draft.id,
        frequency: reminderFrequency,
        dayOfWeek: (reminderFrequency === 'weekly' || reminderFrequency === 'biweekly') ? reminderDayOfWeek : null,
        dayOfMonth: reminderFrequency === 'monthly' ? reminderDayOfMonth : null,
      }),
    })
    if (res.ok) {
      const json = await res.json()
      setReminderId(json.reminder?.id ?? null)
    }
    setReminderSaving(false)
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    await onUpdate(draft.id, {
      title: draft.title,
      description: draft.description,
      responsible: draft.responsible,
      responsible_user_id: draft.responsible_user_id,
      due_date: draft.due_date,
      priority: draft.priority,
      status: draft.status,
      result: draft.result,
      links: draft.links ?? [],
      co_responsibles: draft.co_responsibles ?? [],
    })
    setSaving(false)
    onClose()
  }

  function addLink() {
    const url = newLinkUrl.trim()
    if (!url) return
    if (!isValidUrl(url)) { setLinkError('Ungültige URL (https://… erforderlich)'); return }
    setLinkError('')
    setDraft(d => d ? { ...d, links: [...(d.links ?? []), { url, label: newLinkLabel.trim() || undefined }] } : d)
    setNewLinkUrl('')
    setNewLinkLabel('')
  }

  function removeLink(idx: number) {
    setDraft(d => d ? { ...d, links: (d.links ?? []).filter((_, i) => i !== idx) } : d)
  }

  return (
    <Dialog open={!!item} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6">
            {canEdit && draft ? (
              <Input
                value={draft.title}
                onChange={e => setDraft(d => d ? { ...d, title: e.target.value } : d)}
                className="text-base font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0 -ml-0.5"
              />
            ) : (
              item?.title
            )}
          </DialogTitle>
        </DialogHeader>

        {draft && (
          <div className="space-y-4 py-1 max-h-[60vh] overflow-y-auto pr-1">
            {/* Beschreibung */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Beschreibung</Label>
              {canEdit ? (
                <Textarea
                  value={draft.description ?? ''}
                  onChange={e => setDraft(d => d ? { ...d, description: e.target.value || null } : d)}
                  rows={3}
                  className="text-sm resize-none"
                  placeholder="Keine Beschreibung"
                />
              ) : (
                <p className="text-sm text-gray-700">{draft.description ?? <span className="text-gray-400 italic">–</span>}</p>
              )}
            </div>

            {/* Status + Priorität */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Status</Label>
                {canEdit ? (
                  <Select
                    value={draft.status}
                    onValueChange={v => setDraft(d => d ? { ...d, status: v as Status } : d)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offen">{statusLabels.offen}</SelectItem>
                      <SelectItem value="in_bearbeitung">{statusLabels.in_bearbeitung}</SelectItem>
                      <SelectItem value="abgeschlossen">{statusLabels.abgeschlossen}</SelectItem>
                      <SelectItem value="geparkt">{statusLabels.geparkt}</SelectItem>
                      <SelectItem value="backlog">{statusLabels.backlog ?? 'Backlog'}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <StatusBadge status={draft.status} />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Priorität</Label>
                {canEdit ? (
                  <Select
                    value={draft.priority}
                    onValueChange={v => setDraft(d => d ? { ...d, priority: v as Priority } : d)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoch">Hoch</SelectItem>
                      <SelectItem value="mittel">Mittel</SelectItem>
                      <SelectItem value="niedrig">Niedrig</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <PriorityBadge priority={draft.priority} />
                )}
              </div>
            </div>

            {/* Verantwortlich + Fälligkeit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Verantwortlich</Label>
                {canEdit ? (
                  <ResponsibleSelect
                    key={draft.id}
                    responsible={draft.responsible}
                    responsibleUserId={draft.responsible_user_id}
                    members={members}
                    existingNames={existingNames}
                    onChange={(responsible, responsibleUserId) =>
                      setDraft(d => d ? { ...d, responsible, responsible_user_id: responsibleUserId } : d)
                    }
                  />
                ) : (
                  <p className="text-sm text-gray-700">
                    {(() => {
                      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                      const rawValue = draft.responsible_user_id
                        ? (members.find(m => m.user_id === draft.responsible_user_id)?.display_name ?? null)
                        : draft.responsible && UUID_RE.test(draft.responsible)
                          ? (members.find(m => m.user_id === draft.responsible)?.display_name ?? null)
                          : draft.responsible
                      return rawValue ?? <span className="text-gray-400 italic">–</span>
                    })()}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Fälligkeit</Label>
                {canEdit ? (
                  <Input
                    type="date"
                    value={draft.due_date ?? ''}
                    onChange={e => setDraft(d => d ? { ...d, due_date: e.target.value || null } : d)}
                    className="h-8 text-sm"
                  />
                ) : (
                  <p className="text-sm text-gray-700">
                    {draft.due_date
                      ? new Date(draft.due_date).toLocaleDateString('de-DE')
                      : <span className="text-gray-400 italic">–</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Co-Verantwortliche */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Co-Verantwortliche</Label>
              {/* Chips */}
              {(draft.co_responsibles ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(draft.co_responsibles ?? []).map((cr, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                      {cr.name}
                      {canEdit && (
                        <button
                          onClick={() => setDraft(d => d ? { ...d, co_responsibles: (d.co_responsibles ?? []).filter((_, i) => i !== idx) } : d)}
                          className="hover:text-red-500 transition-colors ml-0.5"
                          title="Entfernen"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {/* Add dropdown (edit mode) */}
              {canEdit && (
                <select
                  className="h-8 text-sm border border-gray-200 rounded-lg px-2 bg-white text-gray-600 w-full focus:outline-none focus:ring-1 focus:ring-blue-300"
                  value=""
                  onChange={e => {
                    const val = e.target.value
                    if (!val) return
                    const member = members.find(m => m.user_id === val)
                    if (!member) return
                    const already = (draft.co_responsibles ?? []).some(cr => cr.user_id === val || cr.name === member.display_name)
                    if (already) return
                    setDraft(d => d ? { ...d, co_responsibles: [...(d.co_responsibles ?? []), { name: member.display_name, user_id: member.user_id }] } : d)
                    e.target.value = ''
                  }}
                >
                  <option value="">+ Co-Verantwortlichen hinzufügen…</option>
                  {members
                    .filter(m => {
                      const already = (draft.co_responsibles ?? []).some(cr => cr.user_id === m.user_id)
                      const isMain = draft.responsible_user_id === m.user_id
                      return !already && !isMain
                    })
                    .map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
                    ))
                  }
                </select>
              )}
              {/* View-only empty */}
              {!canEdit && (draft.co_responsibles ?? []).length === 0 && (
                <p className="text-sm text-gray-400 italic">–</p>
              )}
            </div>

            {/* Ergebnis */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Ergebnis / Notiz</Label>
              {canEdit ? (
                <Textarea
                  value={draft.result ?? ''}
                  onChange={e => setDraft(d => d ? { ...d, result: e.target.value || null } : d)}
                  rows={2}
                  className="text-sm resize-none"
                  placeholder="Ergebnis eintragen…"
                />
              ) : (
                <p className="text-sm text-gray-700">{draft.result ?? <span className="text-gray-400 italic">–</span>}</p>
              )}
            </div>

            {/* Externe Links */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Externe Links</Label>

              {/* Existing links */}
              {(draft.links ?? []).length > 0 && (
                <ul className="space-y-1">
                  {(draft.links ?? []).map((link, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0 text-blue-600 hover:underline truncate"
                        title={link.url}
                      >
                        {link.label || link.url}
                      </a>
                      {canEdit && (
                        <button
                          onClick={() => removeLink(idx)}
                          className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                          title="Link entfernen"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Add link form (edit mode only) */}
              {canEdit && (
                <div className="space-y-1.5">
                  <Input
                    value={newLinkUrl}
                    onChange={e => { setNewLinkUrl(e.target.value); setLinkError('') }}
                    placeholder="https://…"
                    className="h-8 text-sm"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }}
                  />
                  <div className="flex gap-2">
                    <Input
                      value={newLinkLabel}
                      onChange={e => setNewLinkLabel(e.target.value)}
                      placeholder="Bezeichnung (optional)"
                      className="h-8 text-sm flex-1"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLink}
                      className="h-8 px-3 shrink-0"
                    >
                      + Link
                    </Button>
                  </div>
                  {linkError && <p className="text-xs text-red-500">{linkError}</p>}
                </div>
              )}

              {/* View-only: no links */}
              {!canEdit && (draft.links ?? []).length === 0 && (
                <p className="text-sm text-gray-400 italic">–</p>
              )}
            </div>

            {/* Erinnerung */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-500">Regelmäßige Erinnerung</Label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs text-gray-500">{reminderActive ? 'Aktiv' : 'Inaktiv'}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={reminderActive}
                    onClick={() => handleReminderToggle(!reminderActive)}
                    disabled={!canEdit || reminderSaving}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 ${reminderActive ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${reminderActive ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </button>
                </label>
              </div>

              {reminderActive && canEdit && (
                <div className="space-y-2 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">Häufigkeit</Label>
                    <select
                      value={reminderFrequency}
                      onChange={e => setReminderFrequency(e.target.value as typeof reminderFrequency)}
                      className="h-8 text-sm border border-gray-200 rounded-lg px-2 bg-white text-gray-700 w-full focus:outline-none focus:ring-1 focus:ring-blue-300"
                    >
                      <option value="daily">Täglich</option>
                      <option value="weekly">Wöchentlich</option>
                      <option value="biweekly">Zweiwöchentlich</option>
                      <option value="monthly">Monatlich</option>
                    </select>
                  </div>

                  {(reminderFrequency === 'weekly' || reminderFrequency === 'biweekly') && (
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-400">Wochentag</Label>
                      <select
                        value={reminderDayOfWeek}
                        onChange={e => setReminderDayOfWeek(Number(e.target.value))}
                        className="h-8 text-sm border border-gray-200 rounded-lg px-2 bg-white text-gray-700 w-full focus:outline-none focus:ring-1 focus:ring-blue-300"
                      >
                        <option value={0}>Montag</option>
                        <option value={1}>Dienstag</option>
                        <option value={2}>Mittwoch</option>
                        <option value={3}>Donnerstag</option>
                        <option value={4}>Freitag</option>
                        <option value={5}>Samstag</option>
                        <option value={6}>Sonntag</option>
                      </select>
                    </div>
                  )}

                  {reminderFrequency === 'monthly' && (
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-400">Tag des Monats</Label>
                      <select
                        value={reminderDayOfMonth}
                        onChange={e => setReminderDayOfMonth(Number(e.target.value))}
                        className="h-8 text-sm border border-gray-200 rounded-lg px-2 bg-white text-gray-700 w-full focus:outline-none focus:ring-1 focus:ring-blue-300"
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>{d}.</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleReminderSave}
                    disabled={reminderSaving}
                    className="h-8 px-3 text-sm border border-blue-200 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    {reminderSaving ? 'Wird gespeichert…' : reminderId ? 'Erinnerung aktualisieren' : 'Erinnerung speichern'}
                  </button>
                </div>
              )}

              {reminderActive && !canEdit && (
                <p className="text-xs text-gray-500">
                  Erinnerung aktiv ({reminderFrequency === 'daily' ? 'täglich' : reminderFrequency === 'weekly' ? 'wöchentlich' : reminderFrequency === 'biweekly' ? 'zweiwöchentlich' : 'monatlich'})
                </p>
              )}
            </div>

            {/* Teilaufgaben & Verknüpfungen */}
            <div className="space-y-3 border-t pt-3">
              {/* Eltern-Punkt */}
              {parentItem && (
                <p className="text-xs text-gray-500">
                  {t('split.partOf')}{' '}
                  <span className="font-medium text-gray-600 dark:text-gray-300">{parentItem.title}</span>
                </p>
              )}

              {/* Teilaufgaben (Kinder) */}
              {children.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">
                    {t('split.subtasks')} · {doneChildren}/{children.length}
                  </Label>
                  <ul className="space-y-1">
                    {children.map(c => (
                      <li key={c.id} className="flex items-center gap-2 text-sm">
                        <span className={c.status === 'abgeschlossen' ? 'text-green-600' : 'text-gray-300'}>
                          {c.status === 'abgeschlossen' ? '✓' : '○'}
                        </span>
                        <span className={`flex-1 min-w-0 truncate ${c.status === 'abgeschlossen' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                          {c.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Aufteilen (F-21b) */}
              {canEdit && (
                splitOpen ? (
                  <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <Label className="text-xs text-gray-500">{t('split.intoSubtasks')}</Label>
                    {subtaskTitles.map((val, idx) => (
                      <Input
                        key={idx}
                        value={val}
                        onChange={e => setSubtaskTitles(prev => prev.map((v, i) => i === idx ? e.target.value : v))}
                        placeholder={`${t('split.subtaskPlaceholder')} ${idx + 1}`}
                        className="h-8 text-sm"
                      />
                    ))}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSubtaskTitles(prev => [...prev, ''])}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        + {t('split.addRow')}
                      </button>
                      <div className="ml-auto flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSplitOpen(false)}>{t('split.cancel')}</Button>
                        <Button
                          size="sm"
                          onClick={handleSplit}
                          disabled={splitSaving || subtaskTitles.every(s => !s.trim())}
                          style={{ backgroundColor: 'var(--brand)' }}
                          className="text-white"
                        >
                          {splitSaving ? t('split.saving') : t('split.create')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSplitOpen(true)}
                    className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
                  >
                    <span className="text-sm leading-none">⑂</span> {t('split.button')}
                  </button>
                )
              )}

              {/* Verknüpfte Punkte (F-21a) */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">{t('relations.label')}</Label>
                {related.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {related.map(r => (
                      <span key={r.id} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
                        {r.title}
                        {canEdit && (
                          <button
                            onClick={() => handleUnlink(r.id)}
                            disabled={linkSaving}
                            className="hover:text-red-500 transition-colors ml-0.5"
                            title={t('relations.unlink')}
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {canEdit && (
                  <select
                    className="h-8 text-sm border border-gray-200 rounded-lg px-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 w-full focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    value=""
                    disabled={linkSaving}
                    onChange={e => { if (e.target.value) handleLink(e.target.value); e.target.value = '' }}
                  >
                    <option value="">+ {t('relations.add')}…</option>
                    {allItems
                      .filter(i =>
                        i.id !== draft.id &&
                        i.id !== draft.parent_id &&
                        i.parent_id !== draft.id &&
                        !related.some(r => r.id === i.id))
                      .map(i => (
                        <option key={i.id} value={i.id}>{i.title}</option>
                      ))}
                  </select>
                )}
                {!canEdit && related.length === 0 && (
                  <p className="text-sm text-gray-400 italic">–</p>
                )}
              </div>
            </div>

            {/* KI-Metadaten */}
            {(draft.source_quote || draft.ai_confidence !== null) && (
              <div className="border-t pt-3 space-y-2">
                {draft.ai_confidence !== null && (
                  <p className="text-xs text-gray-400">
                    KI-Konfidenz: {Math.round(draft.ai_confidence * 100)} %
                  </p>
                )}
                {draft.source_quote && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Quellentext (aus Transkript)</Label>
                    <p className="text-xs text-gray-500 italic bg-gray-50 rounded p-2 border">
                      &ldquo;{draft.source_quote}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Aktivitäts-Footer */}
            {activity && (activity.created || activity.lastEdited) && (
              <div className="border-t pt-3 space-y-1">
                {activity.created && (
                  <p className="text-xs text-gray-400">
                    Erstellt von{' '}
                    <span className="font-medium text-gray-500">
                      {activity.created.byAi ? 'KI' : activity.created.name}
                    </span>
                    {' · '}{fmtDate(activity.created.date)}
                  </p>
                )}
                {activity.lastEdited && (
                  <p className="text-xs text-gray-400">
                    Zuletzt bearbeitet von{' '}
                    <span className="font-medium text-gray-500">
                      {activity.lastEdited.byAi ? 'KI' : activity.lastEdited.name}
                    </span>
                    {' · '}{fmtDate(activity.lastEdited.date)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-row items-center gap-2">
          {canEdit && draft && draft.status !== 'geparkt' && draft.status !== 'backlog' && (
            <Button
              variant="outline"
              size="sm"
              className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
              onClick={() => { onPark(draft.id); onClose() }}
            >
              <>💡 {t('parkItem')}</>
            </Button>
          )}
          {canEdit && draft && (draft.status === 'geparkt' || draft.status === 'backlog') && (
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => { onPark(draft.id); onClose() }}
            >
              <>↩ {t('unparkItem')}</>
            </Button>
          )}
          {canEdit && onDelete && draft && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700 mr-auto"
              onClick={() => { onClose(); onDelete(draft.id) }}
            >
              Punkt löschen
            </Button>
          )}
          {canEdit && (
            <>
              <Button variant="outline" size="sm" onClick={onClose}>Abbrechen</Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: 'var(--brand)' }}
                className="text-white"
              >
                {saving ? 'Wird gespeichert…' : 'Speichern'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
