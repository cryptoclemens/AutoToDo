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
}

interface Props {
  item: LopItem | null
  canEdit: boolean
  members: WorkspaceMember[]
  onClose: () => void
  onUpdate: (id: string, changes: Partial<LopItem>) => Promise<void>
  onDelete?: (id: string) => void
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function LopItemDialog({ item, canEdit, members, onClose, onUpdate, onDelete }: Props) {
  const [draft, setDraft] = useState<LopItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [activity, setActivity] = useState<ActivityInfo | null>(null)

  useEffect(() => {
    setDraft(item ? { ...item } : null)
    setActivity(null)
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
    })
    setSaving(false)
    onClose()
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
                    onChange={(responsible, responsibleUserId) =>
                      setDraft(d => d ? { ...d, responsible, responsible_user_id: responsibleUserId } : d)
                    }
                  />
                ) : (
                  <p className="text-sm text-gray-700">{draft.responsible ?? <span className="text-gray-400 italic">–</span>}</p>
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
