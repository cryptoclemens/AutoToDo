'use client'

import { useState, useEffect, useRef } from 'react'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { LopItem } from './LopItemDialog'
import ResponsibleSelect, { type WorkspaceMember } from './ResponsibleSelect'

type Status = 'offen' | 'in_bearbeitung' | 'abgeschlossen'
type Priority = 'hoch' | 'mittel' | 'niedrig'

interface Props {
  item: LopItem
  index: number
  canEdit: boolean
  members: WorkspaceMember[]
  onUpdate: (id: string, changes: Partial<LopItem>) => Promise<void>
  onDelete: (id: string) => void
  onOpenDetail: () => void
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'offen', label: 'Offen' },
  { value: 'in_bearbeitung', label: 'In Bearbeitung' },
  { value: 'abgeschlossen', label: 'Abgeschlossen' },
]

export default function LopTableRow({ item, index, canEdit, members, onUpdate, onDelete, onOpenDetail }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<LopItem>(item)
  const [saving, setSaving] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const editRowRef = useRef<HTMLTableRowElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  // Escape key + outside click to cancel edit mode
  useEffect(() => {
    if (!editing) return
    const cancelEdit = () => { setDraft(item); setEditing(false) }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') cancelEdit()
    }
    function onMouseDown(e: MouseEvent) {
      if (editRowRef.current && !editRowRef.current.contains(e.target as Node)) {
        cancelEdit()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onMouseDown)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  // Close status dropdown on outside click
  useEffect(() => {
    if (!statusDropdownOpen) return
    function onMouseDown(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [statusDropdownOpen])

  async function handleSave() {
    setSaving(true)
    await onUpdate(item.id, {
      title: draft.title,
      description: draft.description,
      responsible: draft.responsible,
      responsible_user_id: draft.responsible_user_id,
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

  const isDone = item.status === 'abgeschlossen'
  const rowBg = item.requires_review ? 'bg-amber-50/60' : isDone ? 'bg-gray-50/80' : ''
  const rowOpacity = isDone ? 'opacity-50' : ''

  if (editing) {
    return (
      <tr ref={editRowRef} className="border-b bg-blue-50/60">
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
          <ResponsibleSelect
            responsible={draft.responsible}
            responsibleUserId={draft.responsible_user_id}
            members={members}
            onChange={(responsible, responsibleUserId) =>
              setDraft(d => ({ ...d, responsible, responsible_user_id: responsibleUserId }))
            }
            className="text-sm h-8"
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
    <tr className={`border-b border-gray-100 hover:bg-slate-50/70 group transition-all ${rowBg} ${rowOpacity}`}>
      <td className="px-3 py-3 text-center text-xs text-gray-300 font-mono">{index + 1}</td>
      <td className="px-3 py-3 max-w-[240px]">
        <button
          onClick={onOpenDetail}
          className="text-left w-full"
          title="Details anzeigen"
        >
          <div
            className="font-medium text-sm text-gray-900 truncate hover:text-blue-600 transition-colors"
            title={item.title}
          >
            {item.title}
          </div>
          {item.description && (
            <div
              className="text-xs text-gray-400 truncate mt-0.5 leading-relaxed"
              title={item.description}
            >
              {item.description}
            </div>
          )}
          {item.requires_review && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              KI-Vorschlag
            </span>
          )}
        </button>
      </td>
      <td className="px-3 py-3">
        {canEdit ? (
          <div ref={statusRef} className="relative inline-block">
            <button
              onClick={() => setStatusDropdownOpen(o => !o)}
              title="Status ändern"
              className="hover:scale-105 transition-transform"
            >
              <StatusBadge status={item.status} />
            </button>
            {statusDropdownOpen && (
              <div className="absolute z-50 left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${item.status === opt.value ? 'bg-gray-50/80' : ''}`}
                    onClick={() => {
                      setStatusDropdownOpen(false)
                      onUpdate(item.id, { status: opt.value })
                    }}
                  >
                    <StatusBadge status={opt.value} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <StatusBadge status={item.status} />
        )}
      </td>
      <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
        {(() => {
          const resolved = item.responsible_user_id
            ? (members.find(m => m.user_id === item.responsible_user_id)?.display_name ?? item.responsible)
            : item.responsible
          return resolved
            ? <span className="font-medium text-gray-700">{resolved}</span>
            : <span className="text-gray-300">–</span>
        })()}
      </td>
      <td className="px-3 py-3 text-sm whitespace-nowrap">
        {item.due_date
          ? (() => {
              const due = new Date(item.due_date)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const overdue = !isDone && due < today
              return (
                <span className={`inline-flex items-center gap-1 ${overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  {overdue && (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-label="Überfällig">
                      <path d="M6.5 1L12 12H1L6.5 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      <path d="M6.5 5v3M6.5 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                  {due.toLocaleDateString('de-DE')}
                </span>
              )
            })()
          : <span className="text-gray-300">–</span>}
      </td>
      <td className="px-3 py-3">
        <PriorityBadge priority={item.priority} />
      </td>
      <td className="px-3 py-3 max-w-[200px]">
        {item.result
          ? <span className="text-xs text-gray-500 truncate block leading-relaxed" title={item.result}>{item.result}</span>
          : <span className="text-gray-300 text-xs">–</span>}
      </td>
      <td className="px-3 py-3 text-right">
        {canEdit && (
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 justify-end transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              onClick={() => { setDraft(item); setEditing(true) }}
              title="Inline bearbeiten"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M9 2l2 2-7 7H2v-2l7-7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
              onClick={() => onDelete(item.id)}
              title="Löschen"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 3h9M5 3V2h3v1M4 3v7a1 1 0 001 1h3a1 1 0 001-1V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </div>
        )}
      </td>
    </tr>
  )
}
