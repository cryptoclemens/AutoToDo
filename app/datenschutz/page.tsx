import LegalPageShell from '@/components/landing/LegalPageShell'

export const metadata = {
  title: 'Datenschutzerklärung – AutoToDo',
  description: 'Datenschutzerklärung der vencly GmbH gemäß DSGVO, TTDSG und deutschem Datenschutzrecht.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-2 text-sm text-gray-600 leading-relaxed">{children}</div>
    </section>
  )
}

export default function DatenschutzPage() {
  return (
    <LegalPageShell title="Datenschutzerklärung" updatedAt="März 2026">
      <p className="text-sm text-gray-500 mb-8">
        Gemäß Art. 13/14 DSGVO, TTDSG und anwendbarem deutschen Datenschutzrecht
      </p>

      <Section title="1. Verantwortlicher">
        <p>
          <strong>vencly GmbH</strong><br />
          Leopoldstraße 31<br />
          80802 München<br />
          E-Mail: <a href="mailto:datenschutz@vencly.com" className="text-blue-600 hover:underline">datenschutz@vencly.com</a><br />
          Tel.: <strong>[TODO – Telefonnummer ergänzen]</strong><br />
          Geschäftsführer: Clemens Eugen Theodor Pompeÿ<br />
          HRB 290524, Amtsgericht München
        </p>
      </Section>

      <Section title="2. Verarbeitete Datenkategorien & Zwecke">
        <p>
          <strong>a) Account-Daten</strong> (Name, E-Mail-Adresse, Passwort-Hash)<br />
          Zweck: Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)
        </p>
        <p>
          <strong>b) Meeting-Transkripte</strong><br />
          Zweck: Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)<br />
          Hinweis: Bei BYOK werden Inhalte direkt an den gewählten KI-Anbieter übermittelt
          (keine dauerhafte Speicherung auf AutoToDo-Servern).
        </p>
        <p>
          <strong>c) Nutzungs- und Logdaten</strong> (IP-Adresse, Zugriffszeiten, Fehlermeldungen)<br />
          Zweck: Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) – IT-Sicherheit, Missbrauchsprävention
        </p>
        <p>
          <strong>d) LLM-API-Keys</strong><br />
          Zweck: Vertragserfüllung (lit. b). Keys werden AES-256-GCM-verschlüsselt gespeichert.
          Nur der jeweilige Workspace-Inhaber hat Zugang.
        </p>
        <p>
          <strong>e) Zahlungsdaten</strong><br />
          Zweck: Vertragserfüllung (lit. b); Verarbeitung durch externen Zahlungsdienstleister.
        </p>
        <p>
          <strong>f) Feedback</strong><br />
          Zweck: Freiwillig eingereichte Nachrichten. Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO
          (Einwilligung durch Absenden).
        </p>
      </Section>

      <Section title="3. BYOK – KI-Drittanbieter">
        <p>
          Bei Nutzung des BYOK-Modells werden Transkriptinhalte direkt an den vom Nutzer
          gewählten Anbieter übermittelt. AutoToDo ist in diesem Verhältnis kein Verantwortlicher
          für die Verarbeitung durch den KI-Anbieter. Der Workspace-Betreiber agiert als eigener
          Verantwortlicher gegenüber dem KI-Anbieter.
        </p>
        <p>Es gelten jeweils die Datenschutzrichtlinien des gewählten Anbieters:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Anthropic: <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">anthropic.com/privacy</a></li>
          <li>OpenAI: <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">openai.com/privacy</a></li>
          <li>Microsoft Azure OpenAI: <a href="https://privacy.microsoft.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">privacy.microsoft.com</a></li>
        </ul>
        <p>
          Beide US-amerikanischen Anbieter (Anthropic, OpenAI) haben Standardvertragsklauseln
          mit der EU abgeschlossen. Die Datenübermittlung erfolgt auf Grundlage von
          Art. 46 Abs. 2 lit. c DSGVO.
        </p>
      </Section>

      <Section title="4. Auftragsverarbeiter">
        <p>
          <strong>Vercel Inc.</strong>, 340 Pine Street, Suite 701, San Francisco, CA 94104, USA<br />
          Zweck: Hosting, CDN. Grundlage: Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO)<br />
          Datenschutzrichtlinie: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">vercel.com/legal/privacy-policy</a>
        </p>
        <p>
          <strong>Supabase Inc.</strong><br />
          Zweck: Datenbank, Authentifizierung, Storage. Serverstandort: EU (Frankfurt am Main).<br />
          Datenschutzrichtlinie: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com/privacy</a>
        </p>
        <p>
          <strong>Zahlungsanbieter:</strong> <span className="text-amber-600">[TODO – ergänzen, z. B. Stripe Inc.]</span>
        </p>
      </Section>

      <Section title="5. Speicherdauer">
        <ul className="list-disc pl-5 space-y-1">
          <li>Account-Daten: bis zur Kündigung + 30 Tage Kulanzfrist</li>
          <li>Transkripte: bis zur manuellen Löschung, spätestens 90 Tage nach Vertragsende</li>
          <li>Logdaten (Server-Logs): maximal 30 Tage rollierend</li>
          <li>Feedback-Daten: anonymisiert nach 12 Monaten</li>
          <li>Steuerrelevante Daten: 10 Jahre (§ 147 AO)</li>
        </ul>
      </Section>

      <Section title="6. Betroffenenrechte (Art. 15–22 DSGVO)">
        <p>Sie haben das Recht auf:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Auskunft</strong> (Art. 15) über gespeicherte Daten</li>
          <li><strong>Berichtigung</strong> (Art. 16) unrichtiger Daten</li>
          <li><strong>Löschung</strong> (Art. 17) &ndash; &bdquo;Recht auf Vergessenwerden&ldquo;</li>
          <li><strong>Einschränkung</strong> (Art. 18) der Verarbeitung</li>
          <li><strong>Datenübertragbarkeit</strong> (Art. 20) – Export als XLSX oder JSON auf Anfrage</li>
          <li><strong>Widerspruch</strong> (Art. 21) gegen Verarbeitungen auf Basis berechtigter Interessen</li>
          <li><strong>Widerruf</strong> einer Einwilligung jederzeit mit Wirkung für die Zukunft</li>
        </ul>
        <p>
          Zur Ausübung dieser Rechte:{' '}
          <a href="mailto:datenschutz@vencly.com" className="text-blue-600 hover:underline">datenschutz@vencly.com</a>
        </p>
      </Section>

      <Section title="7. Beschwerderecht">
        <p>
          Sie haben das Recht, sich bei der zuständigen Aufsichtsbehörde zu beschweren:
        </p>
        <p>
          <strong>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</strong><br />
          Promenade 18, 91522 Ansbach<br />
          <a href="https://www.lda.bayern.de" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.lda.bayern.de</a>
        </p>
      </Section>

      <Section title="8. Cookies & Tracking">
        <p>
          AutoToDo verwendet ausschließlich funktional notwendige Cookies für die
          Sitzungsverwaltung (Supabase Auth). Es werden keine Analyse-, Werbe- oder
          Tracking-Cookies eingesetzt. Technisch notwendige Session-Cookies werden ohne
          Einwilligung gesetzt (§ 25 Abs. 2 Nr. 2 TTDSG). Eine Cookie-Einwilligung ist
          daher nicht erforderlich.
        </p>
      </Section>

      <Section title="9. Datensicherheit (Art. 32 DSGVO)">
        <p>
          AutoToDo setzt folgende technische und organisatorische Maßnahmen (TOMs) um:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>TLS 1.3 + HSTS für alle Datenübertragungen</li>
          <li>AES-256-GCM-Verschlüsselung für Transkripte und API-Keys</li>
          <li>PostgreSQL Row-Level Security (Mandantentrennung)</li>
          <li>SHA-256-Hash für API-Keys</li>
          <li>Security Headers (HSTS, X-Frame-Options DENY, nosniff)</li>
          <li>Eingabevalidierung auf allen API-Routen</li>
        </ul>
        <p>
          Detaillierte Informationen unter{' '}
          <a href="/datensicherheit" className="text-blue-600 hover:underline">autotodo / Datensicherheit</a>.
        </p>
      </Section>

      <Section title="10. Auftragsverarbeitungsvertrag (AVV)">
        <p>
          B2B-Kunden, die personenbezogene Daten über AutoToDo verarbeiten, können einen AVV
          nach Art. 28 DSGVO anfordern:{' '}
          <a href="mailto:datenschutz@vencly.com" className="text-blue-600 hover:underline">datenschutz@vencly.com</a>
        </p>
      </Section>

      <Section title="11. Änderungen dieser Datenschutzerklärung">
        <p>
          Diese Datenschutzerklärung wird bei wesentlichen Änderungen der Datenverarbeitung
          aktualisiert. Nutzer werden über wesentliche Änderungen per E-Mail informiert.
        </p>
      </Section>

      <p className="text-xs text-gray-400 mt-8 pt-6 border-t border-gray-100">
        Diese Datenschutzerklärung wurde nach bestem Wissen gemäß DSGVO erstellt.
        Für eine rechtsverbindliche Prüfung wird die Konsultation eines Datenschutzbeauftragten empfohlen.
      </p>
    </LegalPageShell>
  )
}
