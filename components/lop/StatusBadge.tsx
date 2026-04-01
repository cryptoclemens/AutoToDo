'use client'

import { useTranslations } from 'next-intl'

type Status = 'offen' | 'in_bearbeitung' | 'abgeschlossen'

const styleMap: Record<Status, { pill: string; dot: string }> = {
  offen:          { pill: 'bg-slate-100 text-slate-600',       dot: 'bg-slate-400' },
  in_bearbeitung: { pill: 'bg-blue-50 text-blue-700',          dot: 'bg-blue-500' },
  abgeschlossen:  { pill: 'bg-emerald-50 text-emerald-700',    dot: 'bg-emerald-500' },
}

export default function StatusBadge({ status }: { status: Status }) {
  const t = useTranslations('lop.status')
  const s = styleMap[status] ?? styleMap.offen
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {t(status)}
    </span>
  )
}
