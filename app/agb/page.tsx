import LegalPageShell from '@/components/landing/LegalPageShell'

export const metadata = {
  title: 'AGB – AutoToDo',
  description: 'Allgemeine Geschäftsbedingungen der vencly GmbH für die SaaS-Plattform AutoToDo.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-2 text-sm text-gray-600 leading-relaxed">{children}</div>
    </section>
  )
}

export default function AgbPage() {
  return (
    <LegalPageShell title="Allgemeine Geschäftsbedingungen" updatedAt="März 2026">
      <p className="text-sm text-gray-500 mb-8">
        vencly GmbH, Leopoldstraße 31, 80802 München
      </p>

      <Section title="§ 1 Geltungsbereich">
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) der vencly GmbH, Leopoldstraße 31,
          80802 München (nachfolgend „Anbieter"), gelten für alle Verträge über die Nutzung
          der SaaS-Plattform AutoToDo. Abweichende AGB des Nutzers finden keine Anwendung.
          Vertragssprache ist Deutsch.
        </p>
        <p>
          Der Dienst richtet sich ausschließlich an Unternehmen und gewerbliche Nutzer (B2B).
          Verbraucher im Sinne von § 13 BGB sind von der Nutzung ausgeschlossen.
        </p>
      </Section>

      <Section title="§ 2 Vertragsschluss">
        <p>
          Das Angebot auf der Website stellt keine verbindliche Offerte dar. Der Vertrag kommt
          durch Registrierung des Nutzers (Antrag) und Freischaltung des Accounts durch den
          Anbieter (Annahme) zustande. Bei kostenpflichtigen Tarifen erfolgt die Freischaltung
          nach Zahlungseingang.
        </p>
      </Section>

      <Section title="§ 3 Leistungsbeschreibung">
        <p>
          3.1 AutoToDo ist eine webbasierte SaaS-Plattform zur KI-gestützten Analyse von
          Meeting-Transkripten und Verwaltung von Listen offener Punkte (LOP).
        </p>
        <p>
          3.2 Der Anbieter stellt die Plattform mit einem Verfügbarkeitsziel von 99 % p.a.
          bereit (geplante Wartungsfenster ausgenommen). Ein Rechtsanspruch auf eine bestimmte
          Verfügbarkeit besteht nicht.
        </p>
        <p>
          3.3 Beim BYOK-Modell (Bring Your Own Key) verarbeitet der Anbieter Transkripte nicht
          auf eigener Infrastruktur; die Verarbeitung erfolgt direkt beim vom Nutzer gewählten
          KI-Anbieter (Anthropic, OpenAI o.ä.).
        </p>
        <p>
          3.4 Export der Ergebnisse als XLSX-Datei ist im Leistungsumfang enthalten.
        </p>
        <p>
          3.5 Der Anbieter behält sich vor, den Funktionsumfang mit einer Ankündigungsfrist
          von mindestens 30 Tagen zu ändern, sofern dies dem Nutzer zumutbar ist.
        </p>
      </Section>

      <Section title="§ 4 Preise & Zahlungsbedingungen">
        <p>
          4.1 Der Free-Tarif ist kostenlos.
        </p>
        <p>
          4.2 Der Starter-Tarif kostet <strong>[PREIS – TODO]</strong> EUR/Monat zzgl. gesetzlicher MwSt.
        </p>
        <p>
          4.3 Der Pro-Tarif kostet <strong>[PREIS – TODO]</strong> EUR/Monat zzgl. gesetzlicher MwSt.
        </p>
        <p>
          4.4 Preise können in USD angezeigt werden; maßgeblich ist der EUR-Betrag zum
          Zeitpunkt der Abrechnung.
        </p>
        <p>
          4.5 Zahlung erfolgt monatlich im Voraus. Bei Zahlungsverzug ist der Anbieter berechtigt,
          den Zugang vorübergehend zu sperren.
        </p>
      </Section>

      <Section title="§ 5 Laufzeit & Kündigung">
        <p>
          5.1 Der Free-Tarif läuft auf unbestimmte Zeit und kann jederzeit beendet werden.
        </p>
        <p>
          5.2 Kostenpflichtige Tarife laufen monatlich und können zum Ende des jeweiligen
          Abrechnungsmonats gekündigt werden.
        </p>
        <p>
          5.3 Kündigung per E-Mail an: <strong>hello@vencly.com</strong>
        </p>
        <p>
          5.4 Nach Vertragsende werden Workspace-Daten 30 Tage in einem nicht-zugänglichen
          Archiv vorgehalten und anschließend unwiderruflich gelöscht. Der Nutzer kann die
          sofortige Datenlöschung jederzeit schriftlich beantragen.
        </p>
        <p>
          5.5 Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
        </p>
      </Section>

      <Section title="§ 6 BYOK – Verantwortlichkeit für KI-Drittanbieter">
        <p>
          6.1 Nutzt der Nutzer das BYOK-Modell, ist er allein verantwortlich für die Wahl
          des KI-Anbieters sowie die datenschutzrechtliche Zulässigkeit des Einsatzes.
        </p>
        <p>
          6.2 Der Anbieter leitet Transkriptinhalte bei BYOK direkt an den gewählten
          Drittanbieter weiter und speichert diese Inhalte nicht dauerhaft auf eigenen Servern.
        </p>
        <p>
          6.3 Der Anbieter haftet nicht für Datenschutzverstöße, Datenverluste oder sonstige
          Schäden, die beim Drittanbieter entstehen, soweit den Anbieter kein eigenes Verschulden
          trifft.
        </p>
        <p>
          6.4 Von der Haftungsbeschränkung ausgenommen sind Schäden aus grober Fahrlässigkeit
          oder Vorsatz des Anbieters sowie Schäden aus der Verletzung von Leben, Körper oder
          Gesundheit (§ 309 Nr. 7 BGB).
        </p>
      </Section>

      <Section title="§ 7 Nutzerpflichten">
        <p>Der Nutzer verpflichtet sich:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Den Dienst ausschließlich für rechtmäßige Zwecke zu nutzen</li>
          <li>Keine personenbezogenen Daten Dritter ohne deren ausdrückliche Einwilligung zu verarbeiten</li>
          <li>Zugangsdaten vertraulich zu behandeln und unbefugten Dritten keinen Zugang zu gewähren</li>
          <li>Den Dienst nicht zu missbrauchen (z. B. durch automatisierte Massenanfragen, Reverse Engineering)</li>
          <li>Sicherheitsvorfälle unverzüglich an den Anbieter zu melden</li>
        </ul>
      </Section>

      <Section title="§ 8 Haftungsbeschränkung">
        <p>
          8.1 Bei einfacher Fahrlässigkeit haftet der Anbieter nur für die Verletzung wesentlicher
          Vertragspflichten (Kardinalpflichten), begrenzt auf den vorhersehbaren, vertragstypischen Schaden.
        </p>
        <p>
          8.2 Die Haftungsbeschränkung gilt nicht bei Vorsatz, grober Fahrlässigkeit,
          Körper-/Gesundheitsschäden, übernommenen Garantien oder Ansprüchen nach dem
          Produkthaftungsgesetz.
        </p>
      </Section>

      <Section title="§ 9 Datenschutz">
        <p>
          Die Verarbeitung personenbezogener Daten erfolgt gemäß der{' '}
          <a href="/datenschutz" className="text-blue-600 hover:underline">Datenschutzerklärung</a>.
          Auf Anfrage wird ein Auftragsverarbeitungsvertrag (AVV) nach Art. 28 DSGVO zur Verfügung
          gestellt (<a href="mailto:datenschutz@vencly.com" className="text-blue-600 hover:underline">datenschutz@vencly.com</a>).
        </p>
      </Section>

      <Section title="§ 10 Geistiges Eigentum">
        <p>
          Alle Rechte an der AutoToDo-Plattform, deren Code, Logos und Inhalten verbleiben beim
          Anbieter. Der Nutzer erhält lediglich ein nicht-übertragbares, nicht-exklusives
          Nutzungsrecht für die Dauer des Vertrags. Transkripte und durch den Nutzer erstellte
          Inhalte bleiben geistiges Eigentum des Nutzers.
        </p>
      </Section>

      <Section title="§ 11 Änderungen der AGB">
        <p>
          Änderungen werden dem Nutzer per E-Mail mindestens 4 Wochen vor Inkrafttreten
          angekündigt. Widerspricht der Nutzer nicht innerhalb dieser Frist, gelten die neuen
          AGB als akzeptiert. Auf dieses Widerspruchsrecht wird in der Ankündigungs-E-Mail
          gesondert hingewiesen.
        </p>
      </Section>

      <Section title="§ 12 Schlussbestimmungen">
        <p>
          12.1 Gerichtsstand für Kaufleute und juristische Personen des öffentlichen Rechts
          ist München.
        </p>
        <p>
          12.2 Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts (CISG).
        </p>
        <p>
          12.3 Sollten einzelne Bestimmungen unwirksam sein, bleibt der Vertrag im Übrigen
          wirksam (Salvatorische Klausel).
        </p>
      </Section>

      <p className="text-xs text-gray-400 mt-8 pt-6 border-t border-gray-100">
        Diese AGB wurden nach bestem Wissen erstellt. Für eine rechtsverbindliche Prüfung
        wird die Konsultation eines Rechtsanwalts empfohlen.
      </p>
    </LegalPageShell>
  )
}
