'use client'

import { useState } from 'react'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { LopItem } from './LopItemDialog'

type Status = 'offen' | 'in_bearbeitung' | 'abgeschlossen'
type Priority = 'hoch' | 'mittel' | 'niedrig'

interface Props {
  item: LopItem
  index: number
  canEdit: boolean
  onUpdate: (id: string, changes: Partial<LopItem>) => Promise<void>
  onDelete: (id: string) => void
  onOpenDetail: () => void
}

const STATUS_CYCLE: Status[] = ['offen', 'in_bearbeitung', 'abgeschlossen']

export default function LopTableRow({ item, index, canEdit, onUpdate, onDelete, onOpenDetail }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<LopItem>(item)
  const [saving, setSaving] = useState(false)

  function cycleStatus() {
    const nextIndex = (STATUS_CYCLE.indexOf(item.status) + 1) % STATUS_CYCLE.length
    onUpdate(item.id, { status: STATUS_CYCLE[nextIndex] })
  }

  async function handleSave() {
    setSaving(true)
    await onUpdate(item.id, {
      title: draft.title,
      description: draft.description,
      responsible: draft.responsible,
      due_date: draft.due_date,
      priority: draft.priority,
      result: draft.result,
    })
    setSaving(false)
    setEditing(false)
  }

  function handleCancel() {
    setDraft(item)
    setEditing(false)
  }

  const rowBg = item.requires_review ? 'bg-yellow-50' : ''

  if (editing) {
    return (
      <tr className="border-b bg-blue-50">
        <td className="px-3 py-2 text-center text-xs text-gray-400">{index + 1}</td>
        <td className="px-3 py-2" colSpan={2}>
          <Input
            value={draft.title}
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            className="mb-1 text-sm"
            placeholder="Titel"
          />
          <Textarea
            value={draft.description ?? ''}
            onChange={e => setDraft(d => ({ ...d, description: e.target.value || null }))}
            rows={2}
            className="text-xs resize-none"
            placeholder="Beschreibung"
          />
        </td>
        <td className="px-3 py-2">
          <Input
            value={draft.responsible ?? ''}
            onChange={e => setDraft(d => ({ ...d, responsible: e.target.value || null }))}
            className="text-sm"
            placeholder="Name"
          />
        </td>
        <td className="px-3 py-2">
          <Input
            type="date"
            value={draft.due_date ?? ''}
            onChange={e => setDraft(d => ({ ...d, due_date: e.target.value || null }))}
            className="text-sm"
          />
        </td>
        <td className="px-3 py-2">
          <Select
            value={draft.priority}
            onValueChange={v => setDraft(d => ({ ...d, priority: (v ?? 'mittel') as Priority }))}
          >
            <SelectTrigger className="text-sm h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoch">Hoch</SelectItem>
              <SelectItem value="mittel">Mittel</SelectItem>
              <SelectItem value="niedrig">Niedrig</SelectItem>
            </SelectContent>
          </Select>
        </td>
        <td className="px-3 py-2" colSpan={2}>
          <Textarea
            value={draft.result ?? ''}
            onChange={e => setDraft(d => ({ ...d, result: e.target.value || null }))}
            rows={2}
            className="text-xs resize-none"
            placeholder="Ergebnis / Notiz"
          />
        </td>
        <td className="px-3 py-2">
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs px-2">
              {saving ? '…' : '✓'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="h-7 text-xs px-2">
              ✕
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className={`border-b hover:bg-gray-50 group ${rowBg}`}>
      <td className="px-3 py-2.5 text-center text-xs text-gray-400">{index + 1}</td>
      <td className="px-3 py-2.5 max-w-[240px]">
        <button
          onClick={onOpenDetail}
          className="text-left w-full"
          title="Details anzeigen"
        >
          <div className="font-medium text-sm text-gray-900 truncate hover:text-blue-600 hover:underline transition-colors">
            {item.title}
          </div>
          {item.description && (
            <div className="text-xs text-gray-400 truncate mt-0.5">{item.description}</div>
          )}
          {item.requires_review && (
            <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
              KI-Vorschlag
            </span>
          )}
        </button>
      </td>
      <td className="px-3 py-2.5">
        <button onClick={cycleStatus} title="Klicken zum Wechseln" disabled={!canEdit}>
          <StatusBadge status={item.status} />
        </button>
      </td>
      <td className="px-3 py-2.5 text-sm text-gray-600 whitespace-nowrap">
        {item.responsible ?? <span className="text-gray-300">–</span>}
      </td>
      <td className="px-3 py-2.5 text-sm text-gray-600 whitespace-nowrap">
        {item.due_date
          ? new Date(item.due_date).toLocaleDateString('de-DE')
          : <span className="text-gray-300">–</span>}
      </td>
      <td className="px-3 py-2.5">
        <PriorityBadge priority={item.priority} />
      </td>
      <td className="px-3 py-2.5 max-w-[200px]">
        {item.result
          ? <span className="text-xs text-gray-500 truncate block">{item.result}</span>
          : <span className="text-gray-300 text-xs">–</span>}
      </td>
      <td className="px-3 py-2.5 text-right">
        {canEdit && (
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 justify-end transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
              onClick={() => { setDraft(item); setEditing(true) }}
              title="Inline bearbeiten"
            >
              ✏
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
              onClick={() => onDelete(item.id)}
              title="Löschen"
            >
              🗑
            </Button>
          </div>
        )}
      </td>
    </tr>
  )
}
