'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Plan {
  name: string
  priceMonthly: number | null
  period: string | null
  periodAnnual: string | null
  sub: string | null
  badge: string | null
  claim: string
  features: string[]
  highlight: boolean
}

interface PricingSectionProps {
  isEn: boolean
}

export default function PricingSection({ isEn }: PricingSectionProps) {
  const [annual, setAnnual] = useState(false)

  const plans: Plan[] = isEn
    ? [
        {
          name: 'Free',
          priceMonthly: 0,
          period: null,
          periodAnnual: null,
          sub: null,
          badge: null,
          claim: 'Perfect for getting started with AI-powered meeting notes.',
          features: ['1 user', '2 projects', '10 transcripts/month', 'AI extraction', 'XLSX export'],
          highlight: false,
        },
        {
          name: 'Solo',
          priceMonthly: 12,
          period: '/mo',
          periodAnnual: '/mo, billed annually',
          sub: 'plus applicable VAT',
          badge: 'Most Popular',
          claim: 'Everything you need to run your meetings like a pro.',
          features: ['1 user', 'Unlimited projects', 'Unlimited transcripts', '2 guests/project', 'API access'],
          highlight: true,
        },
        {
          name: 'Team',
          priceMonthly: 29,
          period: '/mo + €8/seat',
          periodAnnual: '/mo + €6.40/seat, billed annually',
          sub: 'plus applicable VAT',
          badge: null,
          claim: 'Collaborate across your whole team with full control.',
          features: ['Up to 20 users', 'Everything in Solo', 'Custom branding', 'Webhooks', 'Audit log'],
          highlight: false,
        },
        {
          name: 'Business',
          priceMonthly: 99,
          period: '/mo + €6/seat',
          periodAnnual: '/mo + €4.80/seat, billed annually',
          sub: 'plus applicable VAT',
          badge: null,
          claim: 'Enterprise-grade security and support for large teams.',
          features: ['Unlimited users', 'Everything in Team', 'SSO / SAML', 'Priority support', 'SLA'],
          highlight: false,
        },
      ]
    : [
        {
          name: 'Free',
          priceMonthly: 0,
          period: null,
          periodAnnual: null,
          sub: null,
          badge: null,
          claim: 'Der perfekte Einstieg in KI-gestützte Meeting-Protokolle.',
          features: ['1 Nutzer', '2 Projekte', '10 Transkripte/Monat', 'KI-Extraktion', 'XLSX-Export'],
          highlight: false,
        },
        {
          name: 'Solo',
          priceMonthly: 12,
          period: '/Monat',
          periodAnnual: '/Monat, jährlich abgerechnet',
          sub: 'zzgl. gesetzl. MwSt.',
          badge: 'Beliebtester',
          claim: 'Alles, was Sie brauchen, um Meetings professionell zu führen.',
          features: ['1 Nutzer', 'Unbegrenzte Projekte', 'Unbegrenzte Transkripte', '2 Gäste/Projekt', 'API-Zugang'],
          highlight: true,
        },
        {
          name: 'Team',
          priceMonthly: 29,
          period: '/Monat + €8/Seat',
          periodAnnual: '/Monat + €6,40/Seat, jährlich',
          sub: 'zzgl. gesetzl. MwSt.',
          badge: null,
          claim: 'Teamübergreifende Zusammenarbeit mit voller Kontrolle.',
          features: ['Bis 20 Nutzer', 'Alles aus Solo', 'Custom Branding', 'Webhooks', 'Audit-Log'],
          highlight: false,
        },
        {
          name: 'Business',
          priceMonthly: 99,
          period: '/Monat + €6/Seat',
          periodAnnual: '/Monat + €4,80/Seat, jährlich',
          sub: 'zzgl. gesetzl. MwSt.',
          badge: null,
          claim: 'Enterprise-Sicherheit und Support für große Teams.',
          features: ['Unbegrenzte Nutzer', 'Alles aus Team', 'SSO / SAML', 'Priority-Support', 'SLA'],
          highlight: false,
        },
      ]

  function displayPrice(plan: Plan): string {
    if (plan.priceMonthly === null) return '€0'
    if (plan.priceMonthly === 0) return '€0'
    const price = annual ? Math.round(plan.priceMonthly * 0.8) : plan.priceMonthly
    return `€${price}`
  }

  function displayPeriod(plan: Plan): string | null {
    if (!plan.period) return null
    return annual ? (plan.periodAnnual ?? plan.period) : plan.period
  }

  return (
    <section id="pricing" className="bg-gray-50 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
          {isEn ? 'Simple pricing' : 'Transparente Preise'}
        </h2>
        <p className="text-center text-gray-500 mb-6">
          {isEn ? 'Start free. Scale as you grow.' : 'Kostenlos starten. Mit dem Team wachsen.'}
        </p>

        {/* Annual / Monthly toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className={`text-sm font-medium ${!annual ? 'text-gray-900' : 'text-gray-400'}`}>
            {isEn ? 'Monthly' : 'Monatlich'}
          </span>
          <button
            onClick={() => setAnnual(prev => !prev)}
            aria-pressed={annual}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${annual ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${annual ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
          <span className={`text-sm font-medium ${annual ? 'text-gray-900' : 'text-gray-400'}`}>
            {isEn ? 'Annual' : 'Jährlich'}
          </span>
          {annual && (
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-200">
              {isEn ? '20% off' : '20% Rabatt'}
            </span>
          )}
        </div>

        {/* Beta banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl px-5 py-3 mb-8 flex items-center gap-3 justify-center text-sm text-purple-800">
          <span className="text-purple-500">🎉</span>
          {isEn
            ? 'Beta users get unlimited access for free. Paid plans launching soon.'
            : 'Beta-Nutzer erhalten kostenlosen Vollzugang. Bezahlpläne starten bald.'}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`bg-white rounded-xl border p-6 flex flex-col relative ${plan.highlight ? 'border-blue-500 shadow-lg ring-1 ring-blue-500' : 'border-gray-200'}`}
            >
              {plan.badge && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full mb-3 inline-block self-start">
                  {plan.badge}
                </span>
              )}
              {!plan.badge && <div className="mb-[22px]" />}
              <h3 className="font-bold text-base text-gray-900">{plan.name}</h3>
              <div className="mt-2 mb-1">
                <span className="text-3xl font-bold text-gray-900">{displayPrice(plan)}</span>
                {displayPeriod(plan) && (
                  <span className="text-gray-400 text-xs ml-1 leading-tight">{displayPeriod(plan)}</span>
                )}
              </div>
              {plan.sub && <p className="text-xs text-gray-400 mb-2">{plan.sub}</p>}
              {!plan.sub && <div className="mb-2 h-4" />}
              <p className="text-xs text-gray-500 italic mb-4 leading-relaxed">{plan.claim}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block w-full text-center py-2 rounded-md text-sm font-medium transition-colors ${plan.highlight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}
              >
                {isEn ? 'Get started' : 'Starten'}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-xs text-center text-gray-400 mt-6">
          {isEn
            ? 'Prices in EUR, plus applicable VAT. Annual billing available (20% discount).'
            : 'Preise in EUR, zzgl. gesetzl. MwSt. Jahresabrechnung möglich (20% Rabatt).'}
        </p>
      </div>
    </section>
  )
}
