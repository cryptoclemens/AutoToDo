'use client'

import { Plan, PLAN_NAMES, PLAN_LIMITS } from '@/lib/plans'

interface Props {
  plan: Plan
  planExpiresAt: string | null
  seatCount: number
  projectCount: number
  transcriptsThisMonth: number
}

const PLAN_PRICES: Record<Plan, string> = {
  beta: 'Beta-Zugang',
  free: 'Kostenlos',
  solo: '€12 / Monat',
  team: 'ab €29 / Monat',
  business: 'ab €99 / Monat',
}

const UPGRADE_PLANS: Array<{ plan: Plan; price: string; highlight?: boolean; features: string[] }> = [
  {
    plan: 'free',
    price: '€0',
    features: ['1 Nutzer', '2 Projekte', '10 Transkripte/Monat', 'KI-Auswertung'],
  },
  {
    plan: 'solo',
    price: '€12/Mo',
    highlight: true,
    features: ['1 Nutzer', 'Unbegrenzte Projekte', 'Unbegrenzte Transkripte', '2 Gäste/Projekt', 'API-Zugang'],
  },
  {
    plan: 'team',
    price: '€29/Mo + €8/Seat',
    features: ['Bis 20 Nutzer', 'Alles aus Solo', 'Custom Branding', 'Webhooks'],
  },
  {
    plan: 'business',
    price: '€99/Mo + €6/Seat',
    features: ['Unbegrenzte Nutzer', 'Alles aus Team', 'SSO (SAML)', 'Priority Support'],
  },
]

function UsageBar({ label, current, max }: { label: string; current: number; max: number | null }) {
  const pct = max === null ? 0 : Math.min(100, Math.round((current / max) * 100))
  const isWarning = max !== null && pct >= 80
  const isFull = max !== null && pct >= 100

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className={isFull ? 'text-red-600 font-medium' : isWarning ? 'text-amber-600 font-medium' : 'text-gray-500'}>
          {current}{max !== null ? ` / ${max}` : ' / ∞'}
        </span>
      </div>
      {max !== null && (
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default function BillingTab({ plan, planExpiresAt, seatCount, projectCount, transcriptsThisMonth }: Props) {
  const limits = PLAN_LIMITS[plan]
  const isGrandfathered = planExpiresAt && new Date(planExpiresAt) > new Date()
  const planName = PLAN_NAMES[plan]

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Aktueller Plan</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{planName}</span>
              {plan === 'beta' && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Beta</span>
              )}
              {isGrandfathered && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  Grandfathered bis {new Date(planExpiresAt!).toLocaleDateString('de-DE')}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{PLAN_PRICES[plan]}</p>
          </div>
          {plan !== 'beta' && (
            <button
              disabled
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium opacity-50 cursor-not-allowed"
              title="Stripe-Integration kommt bald"
            >
              Plan ändern
            </button>
          )}
        </div>
      </div>

      {/* Usage */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Nutzung</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 space-y-4">
          <UsageBar label="Projekte" current={projectCount} max={limits.maxProjects} />
          <UsageBar label="Mitglieder" current={seatCount} max={limits.maxSeats} />
          <UsageBar label="Transkripte diesen Monat" current={transcriptsThisMonth} max={limits.maxTranscriptsPerMonth} />
        </div>
      </div>

      {/* Upgrade Cards */}
      {plan !== 'business' && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Verfügbare Pläne</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {UPGRADE_PLANS.filter(u => u.plan !== 'free' || plan === 'free').map(u => (
              <div
                key={u.plan}
                className={`border rounded-xl px-4 py-4 relative ${
                  u.plan === plan
                    ? 'border-blue-400 bg-blue-50'
                    : u.highlight
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {u.highlight && u.plan !== plan && (
                  <span className="absolute -top-2.5 left-4 text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium">
                    Empfohlen
                  </span>
                )}
                {u.plan === plan && (
                  <span className="absolute -top-2.5 left-4 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                    Aktuell
                  </span>
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{PLAN_NAMES[u.plan]}</span>
                  <span className="text-sm font-medium text-gray-600">{u.price}</span>
                </div>
                <ul className="space-y-1">
                  {u.features.map(f => (
                    <li key={f} className="text-xs text-gray-600 flex items-center gap-1.5">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                {u.plan !== plan && (
                  <button
                    disabled
                    className="mt-3 w-full text-xs bg-gray-800 text-white py-1.5 rounded-lg font-medium opacity-40 cursor-not-allowed"
                    title="Stripe-Integration kommt bald"
                  >
                    Zu {PLAN_NAMES[u.plan]} upgraden
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Stripe-Zahlungsintegration in Kürze verfügbar.
          </p>
        </div>
      )}
    </div>
  )
}
