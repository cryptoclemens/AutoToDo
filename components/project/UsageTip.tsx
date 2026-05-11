'use client'

import { useState, useEffect } from 'react'

const TIPS = [
  'Wenn alle Teilnehmer eines Calls in den letzten fünf Minuten kurz mit Nennung des eigenen Namens sagen, was sie heute vorhaben, optimiert ihr die Auswertung der Tagesplanung!',
  'Je klarer ihr Verantwortlichkeiten im Meeting benennt ("Das übernimmt Markus bis Freitag"), desto präziser extrahiert die KI eure LOP-Punkte.',
  'Ihr könnt den Tätigkeitsnachweis genauer machen, indem ihr unter Einstellungen → Projekt das Bundesland hinterlegt — dann werden Feiertage automatisch ausgeblendet.',
  'Nutzt den Tagesplan-Button vor jedem Meeting: Wenn jeder kurz sagt, was er heute macht, befüllt sich der Tätigkeitsnachweis am Monatsende fast von selbst.',
  'Externe Links direkt im LOP-Punkt speichern? Im Bearbeitungs-Dialog gibt es einen eigenen Bereich für Dokumente und Links.',
  'Aufnahmen gelingen am besten in einer ruhigen Umgebung und wenn Sprecher ihren Namen sagen, bevor sie einen neuen Punkt einbringen.',
  'Co-Verantwortliche lassen sich pro LOP-Punkt hinterlegen — hilfreich wenn mehrere Personen an einer Aufgabe arbeiten.',
  'Im Dashboard seht ihr unter "Auswertungen" wie viele Punkte jede Person offen hat und wie sich die Abschlussquote entwickelt.',
]

export default function UsageTip() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * TIPS.length))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % TIPS.length)
        setVisible(true)
      }, 400)
    }, 10_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex justify-center my-4">
      <div
        className="max-w-xl text-center transition-opacity duration-400"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="font-medium text-gray-500">💡 Tipp:</span>{' '}
          {TIPS[idx]}
        </p>
      </div>
    </div>
  )
}
