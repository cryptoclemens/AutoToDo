'use client'

import { useState } from 'react'

interface Update {
  id: string
  date: string
  title: string
  description: string
}

// Neueste Features zuerst – bei jedem neuen Feature hier ergänzen
const UPDATES: Update[] = [
  {
    id: 'F-028',
    date: '16.06.2026',
    title: 'Eigene Status-Bezeichnungen',
    description: 'In den Workspace-Einstellungen können die vier LOP-Status-Bezeichnungen (Offen, In Bearbeitung usw.) durch eigene Begriffe ersetzt werden – z.B. „Neu", „Läuft" oder „Fertig".',
  },
  {
    id: 'F-020',
    date: '16.06.2026',
    title: 'LOP-Vorlagen',
    description: 'Wiederkehrende Aufgabenpakete lassen sich als Vorlage speichern und mit einem Klick auf ein Projekt anwenden – inklusive Priorität und Fälligkeitsoffset.',
  },
  {
    id: 'F-029',
    date: '16.06.2026',
    title: 'Archiv-Export (XLSX)',
    description: 'Abgeschlossene LOP-Punkte lassen sich gefiltert nach Zeitraum als Excel-Datei herunterladen – ideal für Dokumentationszwecke.',
  },
  {
    id: 'F-027',
    date: '16.06.2026',
    title: 'Tätigkeitsnachweis als XLSX',
    description: 'Der monatliche Tätigkeitsnachweis kann jetzt auch als Excel-Datei exportiert werden – zusätzlich zum bisherigen PDF-Druck.',
  },
  {
    id: 'F-025',
    date: '16.06.2026',
    title: 'KI-Zusammenfassung',
    description: 'Auf Knopfdruck fasst die KI alle offenen LOP-Punkte eines Projekts zusammen – hilfreich zur Vorbereitung auf Meetings oder für schnellen Überblick.',
  },
  {
    id: 'F-021',
    date: '16.06.2026',
    title: 'Globale Suche (⌘K)',
    description: 'Mit ⌘K (Mac) oder Strg+K lässt sich blitzschnell über alle Projekte und LOP-Punkte hinweg suchen.',
  },
  {
    id: 'F-024',
    date: '08.06.2026',
    title: 'Desktop 0.3.0: System-Audio ohne BlackHole',
    description: 'Auf macOS Sonoma (14.4+) wird die Gegenseite des Calls jetzt automatisch mitaufgenommen – ohne BlackHole-Installation, ohne Setup-Schritt. Funktioniert auch wenn Parrot, Zoom oder Teams aktiv sind.',
  },
  {
    id: 'F-023',
    date: '19.05.2026',
    title: 'Digest-Häufigkeit wählbar',
    description: 'Der E-Mail-Digest lässt sich nun auf täglich, 2× pro Woche, wöchentlich oder aus einstellen.',
  },
  {
    id: 'F-022',
    date: '19.05.2026',
    title: 'Feiertage im Tätigkeitsnachweis',
    description: 'Wochenenden und Feiertage werden im Tätigkeitsnachweis ausgegraut – und der E-Mail-Digest pausiert automatisch an Feiertagen.',
  },
  {
    id: 'F-021',
    date: '19.05.2026',
    title: 'LOP ↔ Ideenspeicher',
    description: 'LOP-Punkte können in den Ideenspeicher geparkt und von dort wieder als Aufgaben reaktiviert werden – über das Hover-Menü, den Detail-Dialog oder den Inline-Edit-Modus.',
  },
  {
    id: 'F-020',
    date: '14.05.2026',
    title: 'Projekteinstellungen: Sprache & Tätigkeitsnachweis',
    description: 'Beim Anlegen eines Projekts kannst du jetzt die Sprache der Calls festlegen (Deutsch, Englisch u.a.) und angeben, ob ein Tätigkeitsnachweis benötigt wird.',
  },
  {
    id: 'F-019',
    date: '14.05.2026',
    title: 'Ideenspeicher je LOP-Liste',
    description: 'Unter jeder LOP-Liste gibt es jetzt einen ausklappbaren Ideenspeicher für lose Gedanken ohne Umsetzungsdruck. Im Standup-Modus erscheinen Ideen nach den offenen Punkten. Wer im Meeting sagt „das wäre für den Ideenspeicher", wird die Idee nach der Transkription automatisch dort finden.',
  },
  {
    id: 'F-016',
    date: '12.05.2026',
    title: 'Admin: Feedback-Verwaltung',
    description: 'Im Super-Admin-Bereich gibt es jetzt eine Feedback-Sektion: alle Nutzer-Rückmeldungen auf einen Blick, filterbar nach Status (Neu, In Prüfung, Erledigt, Abgelehnt) – direkt im Browser änderbar.',
  },
  {
    id: 'F-015',
    date: '11.05.2026',
    title: 'Eingeloggt bleiben',
    description: 'Du wirst nach dem Schließen des Browsers nicht mehr automatisch abgemeldet – die Sitzung bleibt ein Jahr lang aktiv.',
  },
  {
    id: 'F-014',
    date: '08.05.2026',
    title: 'Tagesplanung',
    description: 'Klemmbrett-Icon in der Navigation öffnet deine tägliche Planung. Beim Starten einer Aufnahme erscheint ein Stand-up-Hinweis. Der Tätigkeitsnachweis übernimmt den gespeicherten Tagesplan automatisch.',
  },
  {
    id: 'F-013',
    date: '08.05.2026',
    title: 'Tätigkeitsnachweis',
    description: 'Button auf jeder LOP-Liste zeigt eine monatstabellare Übersicht deiner Tätigkeiten – vorausgefüllt aus LOP-Punkten, editierbar, druckbar als PDF.',
  },
  {
    id: 'F-012',
    date: '07.05.2026',
    title: 'Dashboard-Auswertungen',
    description: 'Fortschritt pro Person und wöchentliche Burn-Rate – eingeklappt unter „Auswertungen" auf dem Dashboard.',
  },
  {
    id: 'F-009',
    date: '07.05.2026',
    title: 'Co-Verantwortliche',
    description: 'LOP-Punkte können mehrere Verantwortliche haben – im Bearbeiten-Dialog unter dem Hauptverantwortlichen.',
  },
  {
    id: 'F-008',
    date: '06.05.2026',
    title: 'Einladungslink',
    description: 'Neue Mitglieder per Link einladen – ohne E-Mail. Unter Einstellungen → Mitglieder, Gültigkeit 7 Tage.',
  },
  {
    id: 'F-007',
    date: '05.05.2026',
    title: 'DeepSeek als KI-Anbieter',
    description: 'DeepSeek (deepseek-chat, deepseek-reasoner) als BYOK-Option in den KI-Einstellungen verfügbar.',
  },
]

const INITIAL_VISIBLE = 3

export default function DashboardUpdates() {
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const visible = showAll ? UPDATES : UPDATES.slice(0, INITIAL_VISIBLE)

  return (
    <div className="mt-10 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Updates</span>
          <span className="text-xs text-white rounded-full px-2 py-0.5 font-medium" style={{ backgroundColor: 'var(--brand, #2563eb)' }}>
            Neu
          </span>
          {!open && (
            <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
              {UPDATES[0].title} · {UPDATES[0].date}
            </span>
          )}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={`text-gray-400 dark:text-gray-500 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
          {visible.map(u => (
            <div key={u.id} className="flex gap-4 px-5 py-3.5">
              <div className="shrink-0 pt-0.5">
                <span className="text-xs font-mono text-gray-300 dark:text-gray-600">{u.id}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{u.title}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{u.date}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{u.description}</p>
              </div>
            </div>
          ))}

          {UPDATES.length > INITIAL_VISIBLE && (
            <button
              onClick={() => setShowAll(s => !s)}
              className="w-full py-2.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {showAll ? 'Weniger anzeigen' : `${UPDATES.length - INITIAL_VISIBLE} ältere Updates anzeigen`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
