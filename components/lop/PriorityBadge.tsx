'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'

type Priority = 'hoch' | 'mittel' | 'niedrig'

const prefixMap: Record<Priority, string> = { hoch: '↑ ', mittel: '→ ', niedrig: '↓ ' }
const classMap: Record<Priority, string> = {
  hoch:    'bg-red-50 text-red-700 border-red-200',
  mittel:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  niedrig: 'bg-gray-50 text-gray-500 border-gray-200',
}

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const t = useTranslations('lop.priority')
  return (
    <Badge variant="outline" className={`text-xs font-medium ${classMap[priority] ?? classMap.mittel}`}>
      {prefixMap[priority]}{t(priority)}
    </Badge>
  )
}
