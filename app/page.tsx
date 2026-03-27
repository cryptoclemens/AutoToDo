import Link from 'next/link'
import Image from 'next/image'
import { LandingSecuritySection, LandingLegalFooter } from '@/components/landing/LandingSecurity'

// AUTO-UPDATED by scripts/bump-version.sh
const APP_VERSION = '0.1.42'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-gray-900 text-lg">AutoToDo</span>
          <a href="https://www.vencly.com" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
            <Image src="/vencly-logo.svg" alt="vencly" width={80} height={20} />
          </a>
        </div>
        <div className="flex gap-3">
          <Link href="/login"
            className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
            Anmelden
          </Link>
          <Link href="/register"
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
            Kostenlos starten
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Ihre Meetings.<br />
          <span className="text-blue-600">Automatisch dokumentiert.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          AutoToDo analysiert Ihre Meeting-Transkripte und aktualisiert Ihre
          Liste offener Punkte – vollautomatisch per KI. Exportierbar als XLSX.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register"
            className="px-8 py-3 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
            Jetzt kostenlos testen
          </Link>
          <Link href="#features"
            className="px-8 py-3 text-base border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md font-medium transition-colors">
            Mehr erfahren
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Der Workflow, der Zeit spart
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '📄', title: 'Transkript hochladen', desc: 'Meeting-Protokoll oder Transkript (.txt) hochladen – fertig.' },
              { icon: '🤖', title: 'KI extrahiert Aufgaben', desc: 'Neue LOP-Punkte, Statusänderungen und Ergebnisse werden automatisch erkannt.' },
              { icon: '📊', title: 'LOP immer aktuell', desc: 'Tabellarische Übersicht, editierbar, filterbar. Export als XLSX mit Ihrem Branding.' },
            ].map(f => (
              <div key={f.title} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BYOK */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Bring Your Own Key</h2>
          <p className="text-gray-500 mb-6">
            Keine Blackbox. Hinterlegen Sie Ihren eigenen Anthropic- oder OpenAI-API-Key.
            Ihre Daten gehen direkt zu Ihrem gewählten Anbieter – nicht über unsere Infrastruktur.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {['Anthropic Claude', 'OpenAI GPT-4o', 'Datenschutz by Design', 'DSGVO-konform'].map(tag => (
              <span key={tag} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full border border-blue-200">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Preise</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Free', price: '$0', sub: null, features: ['1 Projekt', '10 Transkripte/Monat', '1 Nutzer'], highlight: false },
              { name: 'Starter', price: '$19/Monat', sub: 'zzgl. gesetzlicher MwSt.', features: ['5 Projekte', 'Unbegrenzte Transkripte', '5 Nutzer', 'API-Zugang'], highlight: true },
              { name: 'Pro', price: '$49/Monat', sub: 'zzgl. gesetzlicher MwSt.', features: ['Unbegrenzte Projekte', '20 Nutzer', 'Custom Branding', 'Webhooks'], highlight: false },
            ].map(plan => (
              <div key={plan.name} className={`bg-white rounded-xl border p-6 ${plan.highlight ? 'border-blue-500 shadow-md' : 'border-gray-200'}`}>
                {plan.highlight && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full mb-3 inline-block">Beliebt</span>
                )}
                <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{plan.price}</p>
                {plan.sub && <p className="text-xs text-gray-400 mt-0.5 mb-4">{plan.sub}</p>}
                {!plan.sub && <div className="mb-4" />}
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className={`block w-full text-center py-2 rounded-md text-sm font-medium transition-colors ${plan.highlight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
                  Starten
                </Link>
              </div>
            ))}
          </div>
          <p className="text-xs text-center text-gray-400 mt-4">
            Preise werden in USD angezeigt. Der EUR-Betrag wird beim Checkout berechnet.
          </p>
        </div>
      </section>

      {/* Datensicherheit */}
      <LandingSecuritySection />

      {/* Footer */}
      <LandingLegalFooter />

      {/* Versions-Badge */}
      <div className="fixed bottom-4 right-4 z-50">
        <span className="bg-gray-900 text-gray-300 text-xs font-mono px-3 py-1.5 rounded-full shadow-lg border border-gray-700 select-none">
          v{APP_VERSION}
        </span>
      </div>
    </div>
  )
}
