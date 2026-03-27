'use client'

import { useState } from 'react'

type Tab = 'agb' | 'datenschutz' | 'impressum' | 'avv'

interface Props {
  initialTab?: Tab
  trigger: React.ReactNode
}

export default function LegalModal({ initialTab = 'agb', trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>(initialTab)

  return (
    <>
      <span onClick={() => { setTab(initialTab); setOpen(true) }} className="cursor-pointer">
        {trigger}
      </span>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTab('agb')}
                  className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${tab === 'agb' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  AGB
                </button>
                <button
                  onClick={() => setTab('datenschutz')}
                  className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${tab === 'datenschutz' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Datenschutzerklärung
                </button>
                <button
                  onClick={() => setTab('impressum')}
                  className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${tab === 'impressum' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Impressum
                </button>
                <button
                  onClick={() => setTab('avv')}
                  className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${tab === 'avv' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  AVV
                </button>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4">✕</button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1">
              {tab === 'agb' ? <AgbContent /> : tab === 'datenschutz' ? <DatenschutzContent /> : tab === 'impressum' ? <ImpressumContent /> : <AvvContent />}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── AGB ──────────────────────────────────────────────────────────────────────

function AgbContent() {
  return (
    <div className="px-6 py-5 prose prose-sm max-w-none text-gray-700">
      <h2 className="text-base font-bold text-gray-900 mb-1">Allgemeine Geschäftsbedingungen (AGB)</h2>
      <p className="text-xs text-gray-400 mb-6">Stand: März 2026 · AutoToDo SaaS-Plattform · Betreiber: vencly GmbH</p>

      <Section title="§ 1 Geltungsbereich">
        <p>Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der SaaS-Plattform AutoToDo
          (nachfolgend &bdquo;Dienst&ldquo;), betrieben von der vencly GmbH, Leopoldstraße 31,
          80802 München. Der Dienst richtet sich ausschließlich an Unternehmen und gewerbliche Nutzer (B2B).
          Verbraucher im Sinne von § 13 BGB sind von der Nutzung ausgeschlossen.</p>
      </Section>

      <Section title="§ 2 Vertragsschluss & Registrierung">
        <p>Durch Anlegen eines Workspace-Kontos (Registrierung) und Bestätigung dieser AGB kommt ein
          Nutzungsvertrag zwischen dem Nutzer und der vencly GmbH zustande. Der Nutzer ist verpflichtet,
          bei der Registrierung wahrheitsgemäße Angaben zu machen und diese aktuell zu halten.
          Jeder Workspace-Inhaber übernimmt die volle Verantwortung für alle unter seinem Account
          durchgeführten Aktivitäten.</p>
      </Section>

      <Section title="§ 3 Leistungsumfang">
        <p>AutoToDo stellt eine cloudbasierte Plattform zur automatisierten Extraktion von Aufgaben
          aus Meeting-Transkripten bereit. Der Dienst umfasst:</p>
        <ul>
          <li>Upload und Verarbeitung von Meeting-Transkripten</li>
          <li>KI-gestützte Erstellung von Listen offener Punkte (LOP)</li>
          <li>Multi-Tenant-Workspace-Verwaltung mit Rollen und Berechtigungen</li>
          <li>XLSX-Export der LOP-Daten</li>
          <li>Programmatischen Zugang via REST-API</li>
        </ul>
        <p>Die vencly GmbH behält sich vor, den Funktionsumfang des Dienstes jederzeit zu erweitern,
          anzupassen oder einzelne Features einzustellen, sofern dies dem Nutzer zumutbar ist und
          mit einer Ankündigungsfrist von mindestens 30 Tagen erfolgt.</p>
      </Section>

      <Section title="§ 4 Bring Your Own Key (BYOK) – KI-Verarbeitung">
        <p>Die KI-Verarbeitung von Transkripten erfolgt über externe Drittanbieter (z. B. Anthropic,
          OpenAI, Microsoft Azure OpenAI). Der Nutzer hinterlegt seinen eigenen API-Key des gewählten
          Anbieters. Für die Verarbeitung der Daten durch den Drittanbieter gelten ausschließlich
          dessen Nutzungsbedingungen und Datenschutzrichtlinien.</p>
        <p>Die vencly GmbH übernimmt keine Haftung für:</p>
        <ul>
          <li>die Verfügbarkeit, Qualität oder Richtigkeit der KI-Ausgaben</li>
          <li>Datenschutzverletzungen beim Drittanbieter</li>
          <li>Kosten, die beim Drittanbieter für den API-Einsatz entstehen</li>
          <li>Ausfälle oder Fehler der Drittanbieter-APIs</li>
        </ul>
        <p>Der Nutzer ist selbst verantwortlich für die Einhaltung der Nutzungsbedingungen des
          jeweils gewählten KI-Anbieters sowie für datenschutzrechtliche Anforderungen beim
          Übermitteln personenbezogener Daten an diesen Anbieter.</p>
      </Section>

      <Section title="§ 5 Nutzerpflichten">
        <p>Der Nutzer verpflichtet sich:</p>
        <ul>
          <li>Den Dienst ausschließlich für rechtmäßige Zwecke zu nutzen</li>
          <li>Keine personenbezogenen Daten Dritter ohne deren ausdrückliche Einwilligung zu verarbeiten</li>
          <li>Zugangsdaten vertraulich zu behandeln und unbefugten Dritten keinen Zugang zu gewähren</li>
          <li>Den Dienst nicht zu missbrauchen (z. B. durch automatisierte Massenanfragen, Reverse Engineering)</li>
          <li>Sicherheitsvorfälle unverzüglich an die vencly GmbH zu melden</li>
        </ul>
      </Section>

      <Section title="§ 6 Preise & Zahlungsbedingungen">
        <p>Die aktuellen Preise sind auf der Website einsehbar. Alle Preise verstehen
          sich zzgl. der gesetzlichen Mehrwertsteuer. Das kostenpflichtige Abonnement wird monatlich
          oder jährlich im Voraus berechnet. Die Abrechnung erfolgt über den jeweils angegebenen
          Zahlungsdienstleister. Bei Zahlungsverzug ist die vencly GmbH berechtigt, den Zugang
          vorübergehend zu sperren.</p>
      </Section>

      <Section title="§ 7 Kündigung & Datenlöschung">
        <p>Der Nutzungsvertrag ist monatlich kündbar (bei monatlicher Laufzeit) oder zum Ende der
          jeweiligen Vertragslaufzeit (bei jährlicher Laufzeit). Nach Vertragsende werden
          Workspace-Daten 30 Tage in einem nicht-zugänglichen Archiv vorgehalten und anschließend
          unwiderruflich gelöscht. Der Nutzer kann die sofortige Datenlöschung jederzeit schriftlich
          per E-Mail an <strong>info@vencly.com</strong> beantragen.</p>
      </Section>

      <Section title="§ 8 Verfügbarkeit & Wartung">
        <p>Die vencly GmbH strebt eine Dienstverfügbarkeit von 99,5 % pro Monat an (exkl. geplanter
          Wartungsfenster). Ein Rechtsanspruch auf eine bestimmte Verfügbarkeit besteht nicht.
          Geplante Wartungsarbeiten werden mit angemessenem Vorlauf angekündigt.</p>
      </Section>

      <Section title="§ 9 Haftungsbeschränkung">
        <p>Die Haftung der vencly GmbH ist auf Vorsatz und grobe Fahrlässigkeit beschränkt.
          Bei leichter Fahrlässigkeit haftet die vencly GmbH nur für die Verletzung wesentlicher
          Vertragspflichten (Kardinalpflichten), begrenzt auf den typischerweise vorhersehbaren Schaden.
          Für mittelbare Schäden, entgangenen Gewinn oder Datenverlust wird keine Haftung übernommen,
          soweit gesetzlich zulässig. Diese Haftungsbeschränkung gilt nicht für Schäden aus der
          Verletzung von Leben, Körper oder Gesundheit.</p>
      </Section>

      <Section title="§ 10 Geistiges Eigentum">
        <p>Alle Rechte an der AutoToDo-Plattform, deren Code, Logos und Inhalten verbleiben bei der
          vencly GmbH. Der Nutzer erhält lediglich ein nicht-übertragbares, nicht-exklusives Nutzungsrecht
          für die Dauer des Vertrags. Transkripte und durch den Nutzer erstellte Inhalte bleiben
          geistiges Eigentum des Nutzers.</p>
      </Section>

      <Section title="§ 11 Änderungen der AGB">
        <p>Die vencly GmbH behält sich vor, diese AGB mit einer Ankündigungsfrist von 30 Tagen zu ändern.
          Änderungen werden per E-Mail und/oder In-App-Benachrichtigung mitgeteilt. Widerspricht der
          Nutzer den geänderten AGB nicht innerhalb von 30 Tagen nach Bekanntgabe, gelten die
          Änderungen als akzeptiert.</p>
      </Section>

      <Section title="§ 12 Anwendbares Recht & Gerichtsstand">
        <p>Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG).
          Gerichtsstand für Streitigkeiten mit Kaufleuten, juristischen Personen des öffentlichen
          Rechts oder öffentlich-rechtlichen Sondervermögen ist München.</p>
      </Section>

      <Section title="§ 13 Salvatorische Klausel">
        <p>Sollten einzelne Bestimmungen dieser AGB unwirksam oder undurchführbar sein oder werden,
          bleibt die Wirksamkeit der übrigen Bestimmungen davon unberührt.</p>
      </Section>

      <p className="text-xs text-gray-400 mt-6 pt-4 border-t border-gray-100">
        Diese AGB wurden nach bestem Wissen erstellt. Für eine rechtsverbindliche Prüfung
        wird die Konsultation eines Rechtsanwalts empfohlen.
      </p>
    </div>
  )
}

// ─── Datenschutzerklärung ──────────────────────────────────────────────────────

function DatenschutzContent() {
  return (
    <div className="px-6 py-5 prose prose-sm max-w-none text-gray-700">
      <h2 className="text-base font-bold text-gray-900 mb-1">Datenschutzerklärung</h2>
      <p className="text-xs text-gray-400 mb-6">
        Stand: März 2026 · Gemäß DSGVO, TDDDG und anwendbarem deutschen Datenschutzrecht
      </p>

      <Section title="1. Verantwortlicher">
        <p>Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:</p>
        <p>
          <strong>vencly GmbH</strong><br />
          Leopoldstraße 31<br />
          80802 München<br />
          E-Mail: <strong>datenschutz@vencly.com</strong>
        </p>
      </Section>

      <Section title="2. Erhobene Daten & Zwecke der Verarbeitung">
        <p><strong>a) Registrierungsdaten:</strong> E-Mail-Adresse, Passwort (bcrypt-gehashed),
          Workspace-Name. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</p>
        <p><strong>b) Nutzungsdaten:</strong> Projekte, LOP-Punkte, Transkripte (verschlüsselt),
          Einladungen, Aktivitätszeitpunkte. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>
        <p><strong>c) LLM-API-Keys:</strong> Werden AES-256-GCM-verschlüsselt gespeichert.
          Nur der jeweilige Workspace-Inhaber hat Zugang. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>
        <p><strong>d) Technische Logs:</strong> Server-Logs (IP-Adresse, Zeitstempel) durch Vercel.
          Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an IT-Sicherheit).</p>
        <p><strong>e) Feedback:</strong> Freiwillig eingereichte Nachrichten über den Feedback-Button.
          Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch Absenden).</p>
      </Section>

      <Section title="3. Weitergabe an Dritte">
        <p><strong>Supabase Inc.</strong> (Datenbankhosting, Auth, Storage): Verarbeitung
          gemäß Auftragsverarbeitungsvertrag (AVV). Serverstandort wählbar in EU (Frankfurt).
          Datenschutzrichtlinie: supabase.com/privacy</p>
        <p><strong>Vercel Inc.</strong> (Hosting, CDN): Verarbeitung gemäß Vercel-AVV.
          Datenschutzrichtlinie: vercel.com/legal/privacy-policy</p>
        <p><strong>KI-Anbieter (Anthropic, OpenAI, Microsoft Azure):</strong> Transkriptinhalte
          werden zur KI-Verarbeitung an den vom Workspace-Betreiber gewählten Anbieter übertragen.
          Die vencly GmbH ist in diesem Verhältnis kein Verantwortlicher für die Verarbeitung durch den
          KI-Anbieter. Der Workspace-Betreiber agiert als eigener Verantwortlicher gegenüber dem
          KI-Anbieter. Der Abschluss einer eigenen Datenverarbeitungsvereinbarung mit dem KI-Anbieter
          liegt in der Verantwortung des Workspace-Betreibers.</p>
      </Section>

      <Section title="4. Speicherdauer">
        <p>Workspace-Daten werden für die Dauer der Vertragsbeziehung gespeichert. Nach Kündigung
          werden Daten 30 Tage archiviert und dann unwiderruflich gelöscht. Server-Logs werden
          maximal 30 Tage aufbewahrt. Feedback-Daten werden anonymisiert nach 12 Monaten.</p>
      </Section>

      <Section title="5. Betroffenenrechte (Art. 15–22 DSGVO)">
        <p>Sie haben das Recht auf:</p>
        <ul>
          <li><strong>Auskunft</strong> (Art. 15) über gespeicherte Daten</li>
          <li><strong>Berichtigung</strong> (Art. 16) unrichtiger Daten</li>
          <li><strong>Löschung</strong> (Art. 17) &ndash; &bdquo;Recht auf Vergessenwerden&ldquo;</li>
          <li><strong>Einschränkung</strong> (Art. 18) der Verarbeitung</li>
          <li><strong>Datenportabilität</strong> (Art. 20) – Export als XLSX oder JSON auf Anfrage</li>
          <li><strong>Widerspruch</strong> (Art. 21) gegen Verarbeitungen auf Basis berechtigter Interessen</li>
          <li><strong>Widerruf</strong> einer Einwilligung jederzeit mit Wirkung für die Zukunft</li>
        </ul>
        <p>Zur Ausübung dieser Rechte: <strong>datenschutz@vencly.com</strong></p>
      </Section>

      <Section title="6. Datensicherheit (Art. 32 DSGVO)">
        <p>AutoToDo setzt folgende technische und organisatorische Maßnahmen (TOM) um:</p>
        <ul>
          <li>TLS 1.3 für alle Datenübertragungen</li>
          <li>AES-256-GCM-Verschlüsselung für Transkripte und API-Keys</li>
          <li>PostgreSQL Row-Level Security (Mandantentrennung)</li>
          <li>SHA-256-Hash für API-Keys</li>
          <li>Zod-Eingabevalidierung auf allen API-Routen</li>
          <li>Security Headers (HSTS, X-Frame-Options, nosniff)</li>
          <li>Minimalprinzip: Nur notwendige Daten werden erhoben und verarbeitet</li>
        </ul>
      </Section>

      <Section title="7. Auftragsverarbeitungsvertrag (AVV)">
        <p>Für den Einsatz von AutoToDo als Auftragsverarbeiter (sofern der Nutzer Verantwortlicher
          für personenbezogene Daten Dritter ist) ist ein gesonderter Auftragsverarbeitungsvertrag
          (AVV) gemäß Art. 28 DSGVO erforderlich. Anfragen hierzu: <strong>datenschutz@vencly.com</strong></p>
      </Section>

      <Section title="8. Cookies & Tracking">
        <p>AutoToDo verwendet ausschließlich funktional notwendige Cookies für die Sitzungsverwaltung
          (Supabase Auth). Es werden keine Analyse-, Werbe- oder Tracking-Cookies eingesetzt.
          Eine Einwilligung für Cookies ist daher nicht erforderlich (§ 25 Abs. 2 TDDDG).</p>
      </Section>

      <Section title="9. Beschwerderecht">
        <p>Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
          Zuständige Aufsichtsbehörde ist der Bayerische Landesbeauftragte für den Datenschutz (BayLfD),
          Wagmüllerstraße 18, 80538 München.</p>
      </Section>

      <Section title="10. Änderungen dieser Datenschutzerklärung">
        <p>Diese Datenschutzerklärung wird bei wesentlichen Änderungen der Datenverarbeitung aktualisiert.
          Nutzer werden über wesentliche Änderungen per E-Mail informiert.</p>
      </Section>

      <p className="text-xs text-gray-400 mt-6 pt-4 border-t border-gray-100">
        Diese Datenschutzerklärung wurde nach bestem Wissen gemäß DSGVO erstellt.
        Für eine rechtsverbindliche Prüfung wird die Konsultation eines Datenschutzbeauftragten empfohlen.
      </p>
    </div>
  )
}

// ─── Impressum ─────────────────────────────────────────────────────────────────

function ImpressumContent() {
  return (
    <div className="px-6 py-5 prose prose-sm max-w-none text-gray-700">
      <h2 className="text-base font-bold text-gray-900 mb-1">Impressum</h2>
      <p className="text-xs text-gray-400 mb-6">Angaben gemäß § 5 TMG</p>

      <Section title="Betreiber">
        <p>
          <strong>vencly GmbH</strong><br />
          Leopoldstraße 31<br />
          80802 München<br />
          Deutschland
        </p>
      </Section>

      <Section title="Vertreten durch">
        <p>Geschäftsführer: Clemens Eugen Theodor Pompeÿ</p>
      </Section>

      <Section title="Registereintrag">
        <p>
          Registergericht: Amtsgericht München<br />
          Registernummer: HRB 290524
        </p>
      </Section>

      <Section title="Kontakt">
        <p>
          E-Mail: <strong>info@vencly.com</strong><br />
          Web: <a href="https://www.vencly.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.vencly.com</a>
        </p>
      </Section>

      <Section title="Datenschutz">
        <p>
          E-Mail: <strong>datenschutz@vencly.com</strong>
        </p>
      </Section>

      <Section title="Inhaltlich Verantwortlicher gemäß § 18 Abs. 2 MStV">
        <p>Clemens Eugen Theodor Pompeÿ, Leopoldstraße 31, 80802 München</p>
      </Section>

      <Section title="Haftungsausschluss">
        <p>Die Inhalte dieser Plattform wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
          Vollständigkeit und Aktualität der Inhalte kann die vencly GmbH jedoch keine Gewähr übernehmen.
          Als Diensteanbieter ist die vencly GmbH gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen
          Seiten nach den allgemeinen Gesetzen verantwortlich.</p>
      </Section>
    </div>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="text-xs text-gray-600 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

// ─── AVV ──────────────────────────────────────────────────────────────────────

function AvvContent() {
  return (
    <div className="px-6 py-5 prose prose-sm max-w-none text-gray-700">
      <h2 className="text-base font-bold text-gray-900 mb-1">Auftragsverarbeitungsvertrag (AVV)</h2>
      <p className="text-xs text-gray-400 mb-6">
        gemäß Art. 28 DSGVO · vencly GmbH · Stand: März 2026
      </p>

      <p className="text-sm text-gray-600 mb-6">
        Der Auftragsverarbeitungsvertrag regelt die datenschutzrechtlichen Pflichten zwischen Ihnen
        als Verantwortlichem und der vencly GmbH als Auftragsverarbeiter gemäß Art. 28 DSGVO.
        Bitte laden Sie das vollständige Dokument als PDF herunter, drucken Sie es aus und senden
        Sie uns ein unterzeichnetes Exemplar zu.
      </p>

      <div className="flex flex-col items-center gap-4 py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50">
        <div className="text-4xl">📄</div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">AVV – vencly GmbH</p>
          <p className="text-xs text-gray-500 mt-0.5">PDF · Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO</p>
        </div>
        <a
          href="/AVV_vencly_AutoToDo.pdf"
          download="AVV_vencly_AutoToDo.pdf"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors no-underline"
        >
          ↓ AVV herunterladen (PDF)
        </a>
      </div>

      <div className="mt-6 text-xs text-gray-500 space-y-1">
        <p><strong>Kontakt für Rücksendung:</strong></p>
        <p>vencly GmbH · Leopoldstraße 31 · 80802 München</p>
        <p>E-Mail: <a href="mailto:datenschutz@vencly.app" className="text-blue-600 hover:underline">datenschutz@vencly.app</a></p>
      </div>
    </div>
  )
}
