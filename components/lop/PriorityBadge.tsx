'use client'

import { useTranslations } from 'next-intl'

type Priority = 'hoch' | 'mittel' | 'niedrig'

function IconArrowUp() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="inline-block">
      <path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconArrowRight() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="inline-block">
      <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconArrowDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="inline-block">
      <path d="M5 2v6M2 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const styleMap: Record<Priority, { pill: string; icon: React.ReactNode }> = {
  hoch:    { pill: 'bg-red-50 text-red-700',       icon: <IconArrowUp /> },
  mittel:  { pill: 'bg-amber-50 text-amber-700',   icon: <IconArrowRight /> },
  niedrig: { pill: 'bg-slate-50 text-slate-500',   icon: <IconArrowDown /> },
}

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const t = useTranslations('lop.priority')
  const s = styleMap[priority] ?? styleMap.mittel
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.pill}`}>
      {s.icon}
      {t(priority)}
    </span>
  )
}
