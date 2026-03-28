'use client'

import { Plan, PLAN_NAMES } from '@/lib/plans'

interface Props {
  reason: string
  upgradeHint: Plan
  onDismiss?: () => void
}

export function UpgradeNudge({ reason, upgradeHint, onDismiss }: Props) {
  const planName = PLAN_NAMES[upgradeHint] ?? upgradeHint

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
      <span className="text-amber-500 text-lg shrink-0">⚡</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900">{reason}</p>
        <p className="text-xs text-amber-700 mt-0.5">
          Upgrade auf {planName}, um mehr freizuschalten.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="/settings?tab=billing"
          className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-amber-700 transition-colors"
        >
          Upgrade
        </a>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-amber-400 hover:text-amber-600 text-sm"
            aria-label="Schließen"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
