'use client'

import { useState, useEffect } from 'react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export interface WorkspaceMember {
  user_id: string
  email: string
  display_name: string
  role: string
}

interface Props {
  responsible: string | null
  responsibleUserId: string | null
  members: WorkspaceMember[]
  existingNames?: string[]
  onChange: (responsible: string | null, responsibleUserId: string | null) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

const NONE = '__none__'
const FREE_TEXT = '__freetext__'

export default function ResponsibleSelect({
  responsible,
  responsibleUserId,
  members,
  existingNames = [],
  onChange,
  className = 'h-8 text-sm',
  placeholder = 'Verantwortlich',
  disabled,
}: Props) {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  // Try to match by responsible_user_id first, then fall back to responsible if it looks like a UUID
  const matchedMember = responsibleUserId
    ? members.find(m => m.user_id === responsibleUserId)
    : (!responsibleUserId && responsible && UUID_RE.test(responsible))
      ? members.find(m => m.user_id === responsible)
      : null

  // Effective userId for the select (may come from legacy responsible field)
  const effectiveUserId = matchedMember?.user_id ?? null

  // Legacy free-text: responsible is set, no member matched, not a UUID
  const isLegacy = !matchedMember && !!responsible && members.length > 0 && !UUID_RE.test(responsible ?? '')

  const [showInput, setShowInput] = useState(isLegacy)

  // Reset when item identity changes (dialog switches to different item)
  useEffect(() => {
    const matched = responsibleUserId
      ? members.some(m => m.user_id === responsibleUserId)
      : (!responsibleUserId && responsible && UUID_RE.test(responsible))
        ? members.some(m => m.user_id === responsible)
        : false
    setShowInput(!matched && !!responsible && members.length > 0 && !UUID_RE.test(responsible ?? '') && !responsibleUserId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responsibleUserId, responsible])

  // No members loaded yet → plain input, but never show a raw UUID
  if (members.length === 0) {
    const isUuid = responsible ? UUID_RE.test(responsible) : false
    return (
      <Input
        value={isUuid ? '' : (responsible ?? '')}
        onChange={e => onChange(e.target.value || null, null)}
        className={className}
        placeholder={isUuid ? 'Lädt…' : placeholder}
        disabled={disabled}
      />
    )
  }

  // Free-text input mode
  if (showInput) {
    const listId = 'responsible-names-list'
    const memberNames = members.map(m => m.display_name)
    const suggestions = Array.from(new Set([...existingNames, ...memberNames]))
      .filter(n => n && n !== responsible)
      .sort()
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex gap-1">
          <Input
            value={responsible ?? ''}
            onChange={e => onChange(e.target.value || null, null)}
            className={`flex-1 ${className}`}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus
            list={suggestions.length > 0 ? listId : undefined}
          />
          {suggestions.length > 0 && (
            <datalist id={listId}>
              {suggestions.map(n => <option key={n} value={n} />)}
            </datalist>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => { setShowInput(false); onChange(null, null) }}
            className="text-xs text-gray-400 hover:text-gray-600 shrink-0 px-1"
            title="Zurück zur Mitgliederliste"
          >
            ↩
          </button>
        </div>
        {suggestions.length > 0 && (
          <p className="text-xs text-gray-400">
            Bitte einen bestehenden Namen aus der Liste wählen
          </p>
        )}
      </div>
    )
  }

  const selectValue = matchedMember ? effectiveUserId! : NONE

  return (
    <Select
      value={selectValue}
      onValueChange={val => {
        if (val === NONE) {
          onChange(null, null)
        } else if (val === FREE_TEXT) {
          setShowInput(true)
          onChange(responsible, null)
        } else {
          const m = members.find(mb => mb.user_id === val)
          if (m) onChange(m.display_name, m.user_id)
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        {/* Render display name explicitly – base-ui resolves SelectValue lazily
            from the portal, causing the raw UUID value to appear before dropdown opens */}
        {matchedMember
          ? <span className="flex-1 text-left truncate text-sm">{matchedMember.display_name}</span>
          : <SelectValue placeholder={placeholder} />}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>– Keiner –</SelectItem>
        {members.map(m => (
          <SelectItem key={m.user_id} value={m.user_id}>
            {m.display_name}
          </SelectItem>
        ))}
        <SelectItem value={FREE_TEXT}>Freitext eingeben…</SelectItem>
      </SelectContent>
    </Select>
  )
}
