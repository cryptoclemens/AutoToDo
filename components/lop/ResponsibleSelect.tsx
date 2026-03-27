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
  onChange,
  className = 'h-8 text-sm',
  placeholder = 'Verantwortlich',
  disabled,
}: Props) {
  const matchedMember = responsibleUserId
    ? members.find(m => m.user_id === responsibleUserId)
    : null

  // Legacy free-text: responsible is set but doesn't match any member
  const isLegacy = !responsibleUserId && !!responsible && members.length > 0

  const [showInput, setShowInput] = useState(isLegacy)

  // Reset when item identity changes (dialog switches to different item)
  useEffect(() => {
    const matched = responsibleUserId
      ? members.some(m => m.user_id === responsibleUserId)
      : false
    setShowInput(!matched && !!responsible && members.length > 0 && !responsibleUserId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responsibleUserId])

  // No members loaded yet → plain input
  if (members.length === 0) {
    return (
      <Input
        value={responsible ?? ''}
        onChange={e => onChange(e.target.value || null, null)}
        className={className}
        placeholder={placeholder}
        disabled={disabled}
      />
    )
  }

  // Free-text input mode
  if (showInput) {
    return (
      <div className="flex gap-1">
        <Input
          value={responsible ?? ''}
          onChange={e => onChange(e.target.value || null, null)}
          className={`flex-1 ${className}`}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus
        />
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
    )
  }

  const selectValue = matchedMember ? responsibleUserId! : NONE

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
        <SelectValue placeholder={placeholder} />
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
