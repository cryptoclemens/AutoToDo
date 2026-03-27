import LegalPageShell from '@/components/landing/LegalPageShell'

export const metadata = {
  title: 'Impressum – AutoToDo',
  description: 'Impressum der vencly GmbH gemäß § 5 TMG.',
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-6 py-3 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide sm:w-48 shrink-0 pt-0.5">{label}</span>
      <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  )
}

export default function ImpressumPage() {
  return (
    <LegalPageShell title="Impressum" updatedAt="März 2026">
      <p className="text-sm text-gray-500 mb-8">Angaben gemäß § 5 TMG</p>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <Row label="Firma">
          <strong>vencly GmbH</strong>
        </Row>
        <Row label="Anschrift">
          Leopoldstraße 31<br />
          80802 München<br />
          Deutschland
        </Row>
        <Row label="Geschäftsführer">
          Clemens Eugen Theodor Pompeÿ
        </Row>
        <Row label="Handelsregister">
          HRB 290524<br />
          Amtsgericht München
        </Row>
        <Row label="USt-IdNr.">
          <span className="text-amber-600 font-medium">DE [TODO – USt-IdNr. eintragen]</span><br />
          <span className="text-xs text-gray-400">gemäß § 27a UStG</span>
        </Row>
        <Row label="E-Mail">
          <a href="mailto:hello@vencly.com" className="text-blue-600 hover:underline">hello@vencly.com</a>
        </Row>
        <Row label="Telefon">
          <span className="text-amber-600 font-medium">[TODO – Telefonnummer eintragen]</span>
        </Row>
        <Row label="Website">
          <a href="https://www.vencly.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.vencly.com</a>
        </Row>
      </div>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h2>
        <p className="text-sm text-gray-600">
          Clemens Eugen Theodor Pompeÿ<br />
          Leopoldstraße 31, 80802 München
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Streitschlichtung</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              ec.europa.eu/consumers/odr
            </a>
          </p>
          <p>
            Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren
            vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Haftungsausschluss</h2>
        <p className="text-sm text-gray-600">
          Die Inhalte dieser Plattform wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
          Vollständigkeit und Aktualität der Inhalte kann die vencly GmbH jedoch keine Gewähr übernehmen.
          Als Diensteanbieter ist die vencly GmbH gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen
          Seiten nach den allgemeinen Gesetzen verantwortlich.
        </p>
      </section>
    </LegalPageShell>
  )
}
