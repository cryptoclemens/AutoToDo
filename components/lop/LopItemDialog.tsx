'use client'

import { useState, useEffect, useCallback } from 'react'
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

interface ActivityInfo {
  created: { name: string; date: string; byAi: boolean } | null
  lastEdited: { name: string; date: string; byAi: boolean } | null
}

type Status = 'offen' | 'in_bearbeitung' | 'abgeschlossen'
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
}

interface Props {
  item: LopItem | null
  canEdit: boolean
  members: WorkspaceMember[]
  existingNames?: string[]
  onClose: () => void
  onUpdate: (id: string, changes: Partial<LopItem>) => Promise<void>
  onDelete?: (id: string) => void
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function isValidUrl(s: string): boolean {
  try { new URL(s); return true } catch { return false }
}

export default function LopItemDialog({ item, canEdit, members, existingNames = [], onClose, onUpdate, onDelete }: Props) {
  const [draft, setDraft] = useState<LopItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [activity, setActivity] = useState<ActivityInfo | null>(null)
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [linkError, setLinkError] = useState('')

  useEffect(() => {
    setDraft(item ? { ...item, links: item.links ?? [], co_responsibles: item.co_responsibles ?? [] } : null)
    setActivity(null)
    setNewLinkUrl('')
    setNewLinkLabel('')
    setLinkError('')
  }, [item])

  const loadActivity = useCallback(async (id: string) => {
    const res = await fetch(`/api/lop/${id}/activity`)
    if (res.ok) setActivity(await res.json())
  }, [])

  useEffect(() => {
    if (item?.id) loadActivity(item.id)
  }, [item?.id, loadActivity])

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
                      <SelectItem value="offen">Offen</SelectItem>
                      <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                      <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
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
