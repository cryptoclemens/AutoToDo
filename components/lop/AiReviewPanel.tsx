'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import type { LopItem } from './LopItemDialog'

type Status = 'offen' | 'in_bearbeitung' | 'abgeschlossen'
type Priority = 'hoch' | 'mittel' | 'niedrig'

interface Props {
  items: LopItem[]
  canEdit: boolean
  onAccept: (id: string, changes: Partial<LopItem>) => Promise<void>
  onReject: (id: string) => Promise<void>
}

function ReviewCard({
  item,
  canEdit,
  onAccept,
  onReject,
}: {
  item: LopItem
  canEdit: boolean
  onAccept: (id: string, changes: Partial<LopItem>) => Promise<void>
  onReject: (id: string) => Promise<void>
}) {
  const [draft, setDraft] = useState({ ...item })
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  async function handleAccept() {
    setAccepting(true)
    await onAccept(item.id, {
      title: draft.title,
      description: draft.description,
      responsible: draft.responsible,
      due_date: draft.due_date,
      priority: draft.priority,
      status: draft.status,
      result: draft.result,
      requires_review: false,
    })
    setAccepting(false)
  }

  async function handleReject() {
    if (!confirm('Diesen KI-Vorschlag wirklich ablehnen und löschen?')) return
    setRejecting(true)
    await onReject(item.id)
    setRejecting(false)
  }

  const confidencePct = item.ai_confidence !== null ? Math.round(item.ai_confidence * 100) : null
  const confidenceColor =
    confidencePct !== null && confidencePct >= 85
      ? 'bg-green-100 text-green-700'
      : confidencePct !== null && confidencePct >= 70
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700'

  return (
    <div className="bg-white border border-yellow-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
          KI-Vorschlag
        </span>
        {confidencePct !== null && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${confidenceColor}`}>
            Konfidenz {confidencePct}&thinsp;%
          </span>
        )}
        {item.source_quote && (
          <span className="text-xs text-gray-400 italic truncate max-w-xs" title={item.source_quote}>
            &ldquo;{item.source_quote.slice(0, 80)}{item.source_quote.length > 80 ? '…' : ''}&rdquo;
          </span>
        )}
      </div>

      {/* Titel */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Titel</label>
        {canEdit ? (
          <Input
            value={draft.title}
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            className="text-sm font-medium"
          />
        ) : (
          <p className="text-sm font-medium">{draft.title}</p>
        )}
      </div>

      {/* Beschreibung */}
      {(draft.description || canEdit) && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Beschreibung</label>
          {canEdit ? (
            <Textarea
              value={draft.description ?? ''}
              onChange={e => setDraft(d => ({ ...d, description: e.target.value || null }))}
              rows={2}
              className="text-sm resize-none"
              placeholder="Keine Beschreibung"
            />
          ) : (
            <p className="text-sm text-gray-700">{draft.description}</p>
          )}
        </div>
      )}

      {/* Status / Priorität / Verantwortlich / Fälligkeit */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Status</label>
          {canEdit ? (
            <Select value={draft.status} onValueChange={v => setDraft(d => ({ ...d, status: v as Status }))}>
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
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Priorität</label>
          {canEdit ? (
            <Select value={draft.priority} onValueChange={v => setDraft(d => ({ ...d, priority: v as Priority }))}>
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
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Verantwortlich</label>
          {canEdit ? (
            <Input
              value={draft.responsible ?? ''}
              onChange={e => setDraft(d => ({ ...d, responsible: e.target.value || null }))}
              className="h-8 text-sm"
              placeholder="–"
            />
          ) : (
            <p className="text-sm">{draft.responsible ?? '–'}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Fälligkeit</label>
          {canEdit ? (
            <Input
              type="date"
              value={draft.due_date ?? ''}
              onChange={e => setDraft(d => ({ ...d, due_date: e.target.value || null }))}
              className="h-8 text-sm"
            />
          ) : (
            <p className="text-sm">
              {draft.due_date ? new Date(draft.due_date).toLocaleDateString('de-DE') : '–'}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={accepting || rejecting}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {accepting ? 'Wird gespeichert…' : '✓ Annehmen'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReject}
          disabled={accepting || rejecting}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          {rejecting ? 'Wird gelöscht…' : '✗ Ablehnen'}
        </Button>
      </div>
    </div>
  )
}

export default function AiReviewPanel({ items, canEdit, onAccept, onReject }: Props) {
  if (items.length === 0) return null

  return (
    <div className="mb-6 space-y-3">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        {items.length} KI-Vorschlag{items.length !== 1 ? 'e' : ''} zur Überprüfung
      </p>
      {items.map(item => (
        <ReviewCard
          key={item.id}
          item={item}
          canEdit={canEdit}
          onAccept={onAccept}
          onReject={onReject}
        />
      ))}
    </div>
  )
}
