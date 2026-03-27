import LegalPageShell from '@/components/landing/LegalPageShell'

export const metadata = {
  title: 'Datensicherheit – AutoToDo',
  description: 'Technische und organisatorische Maßnahmen (TOMs) gemäß Art. 32 DSGVO bei AutoToDo.',
}

function TomCard({ icon, title, items }: { icon: string; title: string; items: string[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item} className="text-xs text-gray-600 flex items-start gap-2">
            <span className="text-green-500 mt-0.5 shrink-0">✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function DatensicherheitPage() {
  return (
    <LegalPageShell title="Datensicherheit">
      <p className="text-sm text-gray-500 mb-8">
        Technische und organisatorische Maßnahmen (TOMs) gemäß Art. 32 DSGVO
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <TomCard
          icon="🔐"
          title="Übertragungssicherheit"
          items={[
            'TLS 1.3 für alle Datenübertragungen',
            'HSTS (max-age 1 Jahr, includeSubDomains)',
            'HTTPS erzwungen, HTTP-Redirect aktiv',
          ]}
        />
        <TomCard
          icon="🔒"
          title="Speichersicherheit"
          items={[
            'AES-256-GCM-Verschlüsselung für Transkripte und API-Keys',
            'Authentifizierungs-Tag (AEAD) verhindert unbemerkte Manipulation',
            'Randomisierter IV pro Verschlüsselungsvorgang',
          ]}
        />
        <TomCard
          icon="🏛️"
          title="Zugriffskontrolle & Mandantentrennung"
          items={[
            'PostgreSQL Row-Level Security (RLS) auf allen Tabellen',
            'Vollständige Mandantentrennung auf Datenbankebene',
            'Service-Role-Client nur serverseitig, nie im Browser',
          ]}
        />
        <TomCard
          icon="🗝️"
          title="API-Keys & Token"
          items={[
            'API-Keys SHA-256-gehashed (kein Klartext in DB)',
            'Einladungs-Token: 256-Bit Entropie (randomBytes)',
            'Scope-Prüfung (read/write) auf allen API-Endpunkten',
          ]}
        />
        <TomCard
          icon="🛡️"
          title="HTTP-Sicherheitsheader"
          items={[
            'X-Frame-Options: DENY (kein Clickjacking)',
            'X-Content-Type-Options: nosniff',
            'X-XSS-Protection: 1; mode=block',
            'Referrer-Policy: strict-origin-when-cross-origin',
            'Permissions-Policy: camera=(), microphone=()',
          ]}
        />
        <TomCard
          icon="✅"
          title="Eingabevalidierung"
          items={[
            'Zod-Schema-Validierung auf allen API-Routen',
            'UUID-Format-Prüfung auf Query-Parametern',
            'Fehlerbehandlung ohne Stack-Trace-Exposure',
          ]}
        />
        <TomCard
          icon="🇪🇺"
          title="Serverstandort & Compliance"
          items={[
            'Datenbankserver: Frankfurt am Main, Deutschland (EU)',
            'DSGVO-konformer Betrieb',
            'Kein Tracking, keine Analyse-Cookies',
          ]}
        />
        <TomCard
          icon="🔍"
          title="Sicherheitsüberprüfung"
          items={[
            'Statisches Code-Audit durchgeführt (März 2026)',
            'Alle identifizierten Schwachstellen behoben',
            'Audit-Log für alle LOP-Änderungen',
          ]}
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <p className="text-sm font-semibold text-amber-800 mb-2">
          Hinweis zur BYOK-Architektur
        </p>
        <p className="text-sm text-amber-700 leading-relaxed">
          Bei Nutzung des BYOK-Modells (Bring Your Own Key) verlassen Transkriptinhalte
          die AutoToDo-Plattform ausschließlich in Richtung des vom Nutzer gewählten
          KI-Anbieters (Anthropic, OpenAI, Azure OpenAI). AutoToDo speichert diese Inhalte
          nicht dauerhaft auf eigenen Servern. Für die Sicherheit der Verarbeitung beim
          Drittanbieter gelten dessen eigene Sicherheitsrichtlinien.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <p className="text-sm font-semibold text-blue-800 mb-2">Auftragsverarbeitungsvertrag (AVV)</p>
        <p className="text-sm text-blue-700">
          B2B-Kunden, die personenbezogene Daten über AutoToDo verarbeiten, können einen AVV
          nach Art. 28 DSGVO anfordern:{' '}
          <a href="mailto:datenschutz@vencly.com" className="text-blue-600 hover:underline font-medium">
            datenschutz@vencly.com
          </a>
        </p>
      </div>
    </LegalPageShell>
  )
}
