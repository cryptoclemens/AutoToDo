'use client'

import { useState } from 'react'

const PRESETS = [
  { label: 'Letzter Monat', days: 31 },
  { label: 'Letzte 3 Monate', days: 92 },
  { label: 'Letzte 6 Monate', days: 183 },
  { label: 'Gesamt', days: 0 },
] as const

export default function ArchiveExportButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)

  function download(days: number) {
    const to = new Date().toISOString().slice(0, 10)
    let url = `/api/lop/archive-export?projectId=${projectId}`
    if (days > 0) {
      const from = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10)
      url += `&from=${from}&to=${to}`
    }
    window.location.href = url
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center h-7 gap-1 px-2.5 text-[0.8rem] font-medium border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
      >
        ↓ Archiv exportieren
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 bg-white rounded-xl border border-gray-200 shadow-lg py-1 min-w-[180px]">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => download(p.days)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
