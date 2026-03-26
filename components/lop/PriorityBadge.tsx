import { Badge } from '@/components/ui/badge'

type Priority = 'hoch' | 'mittel' | 'niedrig'

const config: Record<Priority, { label: string; className: string }> = {
  hoch:    { label: '↑ Hoch',    className: 'bg-red-50 text-red-700 border-red-200' },
  mittel:  { label: '→ Mittel',  className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  niedrig: { label: '↓ Niedrig', className: 'bg-gray-50 text-gray-500 border-gray-200' },
}

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, className } = config[priority] ?? config.mittel
  return (
    <Badge variant="outline" className={`text-xs font-medium ${className}`}>
      {label}
    </Badge>
  )
}
