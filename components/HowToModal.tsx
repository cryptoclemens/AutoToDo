'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

const STEPS = [
  {
    title: 'Willkommen bei AutoToDo',
    subtitle: 'Aus Meeting-Protokollen werden automatisch Aufgaben.',
    visual: <WelcomeVisual />,
    description:
      'AutoToDo liest deine Meeting-Transkripte und extrahiert mit KI automatisch alle Aufgaben, Verantwortlichkeiten und Fristen – direkt als strukturierte Liste (LOP).',
  },
  {
    title: 'Schritt 1 – Projekt anlegen',
    subtitle: 'Ein Projekt pro Kunde oder Team.',
    visual: <ProjectVisual />,
    description:
      'Klicke auf dem Dashboard auf „Neues Projekt". Gib einen Namen und eine optionale Beschreibung ein. Alle Transkripte und LOP-Punkte werden dem Projekt zugeordnet.',
  },
  {
    title: 'Schritt 2 – Transkript hochladen',
    subtitle: 'Copy & Paste oder Datei-Upload.',
    visual: <UploadVisual />,
    description:
      'Öffne ein Projekt und klicke auf „↑ Transkript hochladen". Du kannst den Text direkt einfügen oder eine .txt- bzw. .rtf-Datei hochladen. Danach startet die KI-Verarbeitung.',
  },
  {
    title: 'Schritt 3 – KI extrahiert Aufgaben',
    subtitle: 'Vollautomatisch – in Sekunden.',
    visual: <ProcessVisual />,
    description:
      'Die KI (Anthropic, OpenAI oder Azure) analysiert das Transkript und erstellt LOP-Punkte mit Titel, Verantwortlichem, Fälligkeitsdatum, Priorität und Status. Unsichere Punkte werden zur Überprüfung markiert.',
  },
  {
    title: 'Schritt 4 – LOP-Tabelle bearbeiten',
    subtitle: 'Filtern, editieren, Status setzen.',
    visual: <LopVisual />,
    description:
      'In der LOP-Tabelle kannst du nach Status, Priorität und Verantwortlichem filtern. Klicke auf einen Titel, um alle Details in einem Dialog zu bearbeiten. Statusänderungen sind direkt in der Zeile möglich.',
  },
  {
    title: 'Schritt 5 – Punkte manuell hinzufügen',
    subtitle: 'Ergänze Aufgaben unabhängig vom Transkript.',
    visual: <ManualAddVisual />,
    description:
      'Klicke oben auf der Projektseite auf „+ LOP-Punkt manuell hinzufügen". Ein Formular öffnet sich, in dem du Titel, Verantwortlichen, Fälligkeitsdatum und Priorität angeben kannst. So lässt sich die Liste jederzeit manuell ergänzen – ohne Transkript.',
  },
  {
    title: 'Schritt 6 – Exportieren & teilen',
    subtitle: 'XLSX-Export mit Workspace-Branding.',
    visual: <ExportVisual />,
    description:
      'Mit „↓ XLSX" exportierst du die LOP als Excel-Datei mit Workspace-Farbe und Metadaten. Über „+ Mitglied einladen" kannst du Kolleginnen und Kollegen zum Projekt hinzufügen.',
  },
]

export default function HowToModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  function close() {
    setOpen(false)
    setStep(0)
  }

  const current = STEPS[step]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <span>How to</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={close} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-200 hover:bg-gray-300'
                    }`}
                    style={i === step ? { backgroundColor: 'var(--brand, #2563EB)' } : {}}
                  />
                ))}
              </div>
              <button onClick={close} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4">
                ✕
              </button>
            </div>

            {/* Visual */}
            <div className="bg-gray-50 h-52 flex items-center justify-center px-6 overflow-hidden">
              {current.visual}
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {step + 1} / {STEPS.length}
              </p>
              <h2 className="text-lg font-bold text-gray-900">{current.title}</h2>
              <p className="text-sm font-medium text-gray-500">{current.subtitle}</p>
              <p className="text-sm text-gray-600 leading-relaxed pt-1">{current.description}</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 pb-5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                className="text-gray-500"
              >
                ← Zurück
              </Button>

              {step < STEPS.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setStep(s => s + 1)}
                  style={{ backgroundColor: 'var(--brand, #2563EB)' }}
                  className="text-white"
                >
                  Weiter →
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={close}
                  style={{ backgroundColor: 'var(--brand, #2563EB)' }}
                  className="text-white"
                >
                  Los geht&apos;s ✓
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Visual Mockups ────────────────────────────────────────────────────────────

function WelcomeVisual() {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 text-white rounded-xl px-4 py-3 text-2xl font-bold shadow" style={{ backgroundColor: 'var(--brand, #2563EB)' }}>AT</div>
        <div>
          <div className="text-base font-bold text-gray-800">AutoToDo</div>
          <div className="text-xs text-gray-500">Meeting → Aufgaben · automatisch</div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {['📄 Transkript', '🤖 KI', '✅ LOP'].map((s, i) => (
          <span key={i} className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">{s}</span>
        ))}
      </div>
    </div>
  )
}

function ProjectVisual() {
  return (
    <div className="w-full space-y-2">
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-gray-700">Dashboard</div>
          <div className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand, #2563EB)' }}>+ Neues Projekt</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {['PMO Automobilzulieferer', 'Q2-Strategie 2026'].map((n, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded p-2">
              <div className="text-xs font-medium text-gray-700 truncate">{n}</div>
              <div className="text-xs text-gray-400 mt-0.5">3 offen · 7 gesamt</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function UploadVisual() {
  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex gap-2">
          <div className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full font-medium" style={{ borderColor: 'var(--brand,#2563EB)', color: 'var(--brand,#2563EB)' }}>✎ Text einfügen</div>
          <div className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded-full">↑ Datei hochladen</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded text-xs text-gray-400 p-2 h-16 font-mono">
          [Meeting-Protokoll hier einfügen…]
        </div>
        <div className="text-xs text-right text-gray-400">0 / 100.000 Zeichen</div>
      </div>
    </div>
  )
}

function ProcessVisual() {
  return (
    <div className="w-full space-y-2">
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--brand,#2563EB) 15%, white)' }}>🤖</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-700">KI analysiert Transkript…</div>
          <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-3/4 rounded-full" style={{ backgroundColor: 'var(--brand,#2563EB)' }} />
          </div>
        </div>
      </div>
      {[
        { title: 'Angebot bis 15.04. fertigstellen', user: 'M. Müller', prio: 'Hoch' },
        { title: 'Kundenpräsentation vorbereiten', user: 'T. Weber', prio: 'Mittel' },
      ].map((item, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs shadow-sm">
          <span className="text-green-500">✓</span>
          <span className="flex-1 text-gray-700 truncate">{item.title}</span>
          <span className="text-gray-400">{item.user}</span>
          <span className={`px-1.5 py-0.5 rounded text-white text-xs ${item.prio === 'Hoch' ? 'bg-red-400' : 'bg-yellow-400'}`}>{item.prio}</span>
        </div>
      ))}
    </div>
  )
}

function LopVisual() {
  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden text-xs">
        <div className="flex gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
          {['Status: Alle', 'Priorität: Alle', 'Verantwortlich: Alle'].map((f, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-500">{f}</div>
          ))}
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Titel', 'Wer', 'Bis', 'Status'].map(h => (
                <th key={h} className="text-left px-3 py-1.5 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { title: 'Angebot erstellen', user: 'Müller', date: '15.04.', status: 'offen', color: 'bg-orange-100 text-orange-700' },
              { title: 'Präsentation', user: 'Weber', date: '20.04.', status: 'in Arbeit', color: 'bg-blue-100 text-blue-700' },
            ].map((r, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-3 py-1.5 text-gray-800 underline cursor-pointer">{r.title}</td>
                <td className="px-3 py-1.5 text-gray-500">{r.user}</td>
                <td className="px-3 py-1.5 text-gray-500">{r.date}</td>
                <td className="px-3 py-1.5"><span className={`px-1.5 py-0.5 rounded text-xs font-medium ${r.color}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ManualAddVisual() {
  return (
    <div className="w-full space-y-2">
      <div className="flex gap-2 mb-1">
        <div className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600">+ Mitglied einladen</div>
        <div className="text-xs text-white rounded px-2 py-1" style={{ backgroundColor: 'var(--brand,#2563EB)' }}>+ LOP-Punkt manuell hinzufügen</div>
      </div>
      <div className="bg-white border border-blue-200 rounded-lg p-3 shadow-sm space-y-2 text-xs">
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-400">Titel des LOP-Punktes *</div>
          <div className="w-20 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-400">Priorität</div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-400">Verantwortlich</div>
          <div className="w-24 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-400">Fälligkeitsdatum</div>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <div className="border border-gray-200 rounded px-2 py-1 text-gray-500">Abbrechen</div>
          <div className="text-white rounded px-2 py-1" style={{ backgroundColor: 'var(--brand,#2563EB)' }}>Hinzufügen</div>
        </div>
      </div>
    </div>
  )
}

function ExportVisual() {
  return (
    <div className="w-full space-y-3">
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <div>
            <div className="text-xs font-medium text-gray-700">LOP_PMO_2026-04-01.xlsx</div>
            <div className="text-xs text-gray-400">Mit Workspace-Branding & Metadaten</div>
          </div>
        </div>
        <div className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600">↓ XLSX</div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">👥</span>
          <div>
            <div className="text-xs font-medium text-gray-700">Team einladen</div>
            <div className="text-xs text-gray-400">Editor · Betrachter · Projekt-Admin</div>
          </div>
        </div>
        <div className="text-xs text-white rounded px-2 py-1" style={{ backgroundColor: 'var(--brand,#2563EB)' }}>+ Einladen</div>
      </div>
    </div>
  )
}
