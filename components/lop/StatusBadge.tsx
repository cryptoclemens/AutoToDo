import { Badge } from '@/components/ui/badge'

type Status = 'offen' | 'in_bearbeitung' | 'abgeschlossen'

const config: Record<Status, { label: string; className: string }> = {
  offen:          { label: 'Offen',          className: 'bg-gray-100 text-gray-700 border-gray-200' },
  in_bearbeitung: { label: 'In Bearbeitung', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  abgeschlossen:  { label: 'Abgeschlossen',  className: 'bg-green-50 text-green-700 border-green-200' },
}

export default function StatusBadge({ status }: { status: Status }) {
  const { label, className } = config[status] ?? config.offen
  return (
    <Badge variant="outline" className={`text-xs font-medium ${className}`}>
      {label}
    </Badge>
  )
}
