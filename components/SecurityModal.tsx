'use client'

import { useState } from 'react'

const SECTIONS = [
  {
    icon: '🔐',
    title: 'Transportverschlüsselung',
    text: 'Alle Daten werden ausschließlich über TLS 1.3 übertragen. Die Plattform läuft auf Vercel mit automatischem HTTPS-Enforcement.',
  },
  {
    icon: '🔑',
    title: 'Authentifizierung',
    text: 'Nutzer-Authentifizierung über Supabase Auth mit JWT-Token. Passwörter werden bcrypt-gehashed und niemals im Klartext gespeichert.',
  },
  {
    icon: '🏛️',
    title: 'Datenisolation (Multi-Tenancy)',
    text: 'Jeder Workspace ist durch PostgreSQL Row-Level Security (RLS) vollständig von anderen Workspaces isoliert. Kein Datenzugriff zwischen Mandanten auf Datenbankebene möglich.',
  },
  {
    icon: '🔒',
    title: 'Ende-zu-Ende-Verschlüsselung',
    text: 'Meeting-Transkripte und LLM-API-Keys werden mit AES-256-GCM verschlüsselt gespeichert. Der Encryption-Key liegt ausschließlich in der Server-Umgebung (nie im Client oder der Datenbank).',
  },
  {
    icon: '🗝️',
    title: 'API-Key-Sicherheit',
    text: 'Workspace-API-Keys werden SHA-256-gehashed gespeichert. Der Klartext-Key wird nur einmalig beim Erstellen angezeigt und danach nicht mehr zugänglich.',
  },
  {
    icon: '✅',
    title: 'Input-Validierung',
    text: 'Alle API-Routen validieren Eingaben mit Zod. SQL-Injection wird durch Parameterisierung in Supabase verhindert. Keine Rohdaten-Concatenation.',
  },
  {
    icon: '🇪🇺',
    title: 'Datenspeicherort',
    text: 'Daten werden in der Supabase-Datenbank und im Supabase Storage gespeichert. Supabase betreibt Datenbanken wahlweise in EU-Rechenzentren (Frankfurt). Vercel CDN-Endpunkte sind weltweit verteilt.',
  },
  {
    icon: '🤖',
    title: 'BYOK – Bring Your Own Key',
    text: 'Transkripte werden für die KI-Verarbeitung direkt von unseren Servern an den gewählten LLM-Anbieter (Anthropic, OpenAI oder Azure) übertragen. AutoToDo speichert keine Prompts oder LLM-Antworten dauerhaft.',
  },
]

export default function SecurityModal({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</span>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <span>🛡️</span>
          <span>Datensicherheit</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900">Datensicherheit & Datenschutz</h2>
                <p className="text-xs text-gray-400 mt-0.5">Technische und organisatorische Maßnahmen</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4">✕</button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
              {SECTIONS.map(s => (
                <div key={s.title} className="flex gap-3">
                  <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.text}</p>
                  </div>
                </div>
              ))}

              {/* LLM Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
                <p className="text-xs font-semibold text-amber-800 mb-1">⚠ Haftungshinweis – Externe KI-Anbieter</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Diese Sicherheitsmaßnahmen gelten ausschließlich für die AutoToDo-Plattform selbst.
                  Für die Verarbeitung von Daten durch externe KI-Anbieter (Anthropic, OpenAI, Microsoft Azure OpenAI)
                  gelten deren jeweilige Datenschutz- und Sicherheitsrichtlinien. AutoToDo übernimmt
                  keine Haftung für die Datenverarbeitung durch diese Drittanbieter.
                  Der Workspace-Betreiber ist für die Einhaltung der datenschutzrechtlichen Anforderungen
                  beim Einsatz des gewählten LLM-Anbieters selbst verantwortlich.
                </p>
              </div>

              <p className="text-xs text-gray-400 text-center pb-2">
                AutoToDo · Stand März 2026 · Technische Maßnahmen gemäß Art. 32 DSGVO
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
