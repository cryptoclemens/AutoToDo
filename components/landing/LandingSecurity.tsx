'use client'

import SecurityModal from '@/components/SecurityModal'
import LegalModal from '@/components/legal/LegalModal'

const TRUST_ITEMS = [
  { icon: '🔐', label: 'TLS 1.3', desc: 'Verschlüsselte Übertragung' },
  { icon: '🔒', label: 'AES-256-GCM', desc: 'Verschlüsselte Speicherung' },
  { icon: '🏛️', label: 'RLS', desc: 'Mandantentrennung auf DB-Ebene' },
  { icon: '🇪🇺', label: 'DSGVO', desc: 'EU-konformer Betrieb' },
  { icon: '✅', label: 'BYOK', desc: 'Ihre KI-Keys, Ihre Kontrolle' },
  { icon: '🚫', label: 'Kein Tracking', desc: 'Keine Analyse-Cookies' },
]

export function LandingSecuritySection() {
  return (
    <section className="py-20 border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Datenschutz & Sicherheit</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            AutoToDo wurde von Grund auf mit Blick auf Datensicherheit entwickelt.
            Ihre Meeting-Inhalte bleiben vertraulich – verschlüsselt gespeichert,
            isoliert nach Workspace, geschützt auf mehreren Ebenen.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {TRUST_ITEMS.map(item => (
            <div key={item.label} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl shrink-0">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* LLM Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
          <p className="text-sm font-semibold text-amber-800 mb-1">
            ⚠ Hinweis zur KI-Verarbeitung (Bring Your Own Key)
          </p>
          <p className="text-sm text-amber-700 leading-relaxed">
            Die aufgeführten Sicherheitsmaßnahmen beziehen sich ausschließlich auf die AutoToDo-Plattform.
            Für die Verarbeitung von Transkriptinhalten durch externe KI-Anbieter
            (Anthropic, OpenAI, Microsoft Azure OpenAI) gelten die jeweiligen Datenschutzrichtlinien
            dieser Drittanbieter. AutoToDo übernimmt <strong>keine Haftung</strong> für die
            Datenverarbeitung durch externe LLM-Anbieter. Der Workspace-Betreiber ist für die
            datenschutzrechtliche Zulässigkeit des gewählten KI-Anbieters selbst verantwortlich.
          </p>
        </div>

        <div className="text-center">
          <SecurityModal trigger={
            <span className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm">
              🛡️ Alle Sicherheitsmaßnahmen im Detail
            </span>
          } />
        </div>
      </div>
    </section>
  )
}

export function LandingLegalFooter() {
  return (
    <footer className="border-t border-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-400">© 2026 AutoToDo · Alle Rechte vorbehalten</p>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <LegalModal initialTab="agb" trigger={
            <span className="hover:text-gray-600 transition-colors cursor-pointer">AGB</span>
          } />
          <LegalModal initialTab="datenschutz" trigger={
            <span className="hover:text-gray-600 transition-colors cursor-pointer">Datenschutzerklärung</span>
          } />
          <SecurityModal trigger={
            <span className="hover:text-gray-600 transition-colors cursor-pointer">Datensicherheit</span>
          } />
        </div>
      </div>
    </footer>
  )
}
