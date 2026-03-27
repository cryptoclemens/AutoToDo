'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'

type Status = 'offen' | 'in_bearbeitung' | 'abgeschlossen'

const classMap: Record<Status, string> = {
  offen:          'bg-gray-100 text-gray-700 border-gray-200',
  in_bearbeitung: 'bg-blue-50 text-blue-700 border-blue-200',
  abgeschlossen:  'bg-green-50 text-green-700 border-green-200',
}

export default function StatusBadge({ status }: { status: Status }) {
  const t = useTranslations('lop.status')
  return (
    <Badge variant="outline" className={`text-xs font-medium ${classMap[status] ?? classMap.offen}`}>
      {t(status)}
    </Badge>
  )
}
