'use client'

interface Props {
  count: number
  onShowReview: () => void
}

export default function ReviewBanner({ count, onShowReview }: Props) {
  if (count === 0) return null

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-yellow-600">⚠</span>
        <span className="text-sm text-yellow-800 font-medium">
          {count} KI-Vorschlag{count !== 1 ? 'e' : ''} warten auf Ihre Bestätigung
        </span>
      </div>
      <button
        onClick={onShowReview}
        className="text-sm text-yellow-700 underline hover:text-yellow-900"
      >
        Anzeigen
      </button>
    </div>
  )
}
