'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export default function HowToModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const t = useTranslations('howTo')

  const STEPS = [
    { title: t('s0.title'), subtitle: t('s0.subtitle'), visual: <WelcomeVisual />, description: t('s0.desc') },
    { title: t('s1.title'), subtitle: t('s1.subtitle'), visual: <ProjectVisual />, description: t('s1.desc') },
    { title: t('s2.title'), subtitle: t('s2.subtitle'), visual: <UploadVisual />, description: t('s2.desc') },
    { title: t('s3.title'), subtitle: t('s3.subtitle'), visual: <ProcessVisual />, description: t('s3.desc') },
    { title: t('s4.title'), subtitle: t('s4.subtitle'), visual: <LopVisual />, description: t('s4.desc') },
    { title: t('s5.title'), subtitle: t('s5.subtitle'), visual: <TagesplanungVisual />, description: t('s5.desc') },
    { title: t('s6.title'), subtitle: t('s6.subtitle'), visual: <TaetigkeitsnachweisVisual />, description: t('s6.desc') },
    { title: t('s7.title'), subtitle: t('s7.subtitle'), visual: <ExportVisual />, description: t('s7.desc') },
  ]

  function close() { setOpen(false); setStep(0) }
  const current = STEPS[step]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <span>{t('trigger')}</span>
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[9999] bg-black/40" onClick={close} />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex gap-1">
                  {STEPS.map((_, i) => (
                    <button key={i} onClick={() => setStep(i)}
                      className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-200 hover:bg-gray-300'}`}
                      style={i === step ? { backgroundColor: 'var(--brand, #2563EB)' } : {}}
                    />
                  ))}
                </div>
                <button onClick={close} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4">✕</button>
              </div>

              <div className="bg-gray-50 h-52 flex items-center justify-center px-6 overflow-hidden">
                {current.visual}
              </div>

              <div className="px-6 py-5 space-y-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{step + 1} / {STEPS.length}</p>
                <h2 className="text-lg font-bold text-gray-900">{current.title}</h2>
                <p className="text-sm font-medium text-gray-500">{current.subtitle}</p>
                <p className="text-sm text-gray-600 leading-relaxed pt-1">{current.description}</p>
              </div>

              <div className="flex items-center justify-between px-6 pb-5">
                <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="text-gray-500">
                  ← {t('back')}
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button size="sm" onClick={() => setStep(s => s + 1)} style={{ backgroundColor: 'var(--brand, #2563EB)' }} className="text-white">
                    {t('next')} →
                  </Button>
                ) : (
                  <Button size="sm" onClick={close} style={{ backgroundColor: 'var(--brand, #2563EB)' }} className="text-white">
                    {t('done')} ✓
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>,
        document.body
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
          <div className="text-xs text-gray-500">Meeting → Tasks · automatic</div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {['📄 Transcript', '🤖 AI', '✅ LOP', '📋 Tätigkeitsnachweis'].map((s, i) => (
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
          <div className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--brand, #2563EB)' }}>+ New project</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {['PMO Auto Supplier', 'Q2 Strategy 2026'].map((n, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded p-2">
              <div className="text-xs font-medium text-gray-700 truncate">{n}</div>
              <div className="text-xs text-gray-400 mt-0.5">3 open · 7 total</div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded px-2 py-1">
          <span>📍</span>
          <span>Bundesland: Bayern</span>
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
          <div className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full font-medium" style={{ borderColor: 'var(--brand,#2563EB)', color: 'var(--brand,#2563EB)' }}>✎ Paste text</div>
          <div className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded-full">↑ Upload file</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded text-xs text-gray-400 p-2 h-16 font-mono">
          [Paste meeting transcript here…]
        </div>
        <div className="text-xs text-right text-gray-400">0 / 100,000 characters</div>
      </div>
    </div>
  )
}

function ProcessVisual() {
  return (
    <div className="w-full space-y-2">
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm shrink-0">🤖</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-700">AI analysing transcript…</div>
          <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-3/4 rounded-full" style={{ backgroundColor: 'var(--brand,#2563EB)' }} />
          </div>
        </div>
      </div>
      {[
        { title: 'Finish proposal by Apr 15', user: 'J. Smith', prio: 'High' },
        { title: 'Prepare client presentation', user: 'T. Weber', prio: 'Medium' },
      ].map((item, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs shadow-sm">
          <span className="text-green-500">✓</span>
          <span className="flex-1 text-gray-700 truncate">{item.title}</span>
          <span className="text-gray-400">{item.user}</span>
          <span className={`px-1.5 py-0.5 rounded text-white text-xs ${item.prio === 'High' ? 'bg-red-400' : 'bg-yellow-400'}`}>{item.prio}</span>
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
          {['Status: All', 'Priority: All', 'Owner: All'].map((f, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-500">{f}</div>
          ))}
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Title', 'Who', 'Due', 'Status'].map(h => (
                <th key={h} className="text-left px-3 py-1.5 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { title: 'Create proposal', user: 'Smith', date: 'Apr 15', status: 'open', color: 'bg-orange-100 text-orange-700' },
              { title: 'Presentation', user: 'Weber + K.', date: 'Apr 20', status: 'in progress', color: 'bg-blue-100 text-blue-700' },
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

function TagesplanungVisual() {
  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <button className="p-1 text-gray-400">‹</button>
          <div className="text-sm font-semibold text-gray-800">Heute</div>
          <button className="p-1 text-gray-300 cursor-not-allowed">›</button>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Was machst du heute?</div>
          <div className="bg-gray-50 border border-blue-300 rounded-xl px-3 py-2 text-xs text-gray-700 min-h-[56px]">
            Reviews auswerten, Präsentation vorbereiten…
          </div>
        </div>
        <div className="flex justify-end">
          <div className="text-xs text-white rounded-lg px-3 py-1.5" style={{ backgroundColor: 'var(--brand,#2563EB)' }}>
            Speichern & schließen
          </div>
        </div>
      </div>
    </div>
  )
}

function TaetigkeitsnachweisVisual() {
  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden text-xs">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
          <span className="text-gray-400">‹</span>
          <span className="text-xs font-semibold text-gray-700">Mai 2026</span>
          <span className="text-gray-400">›</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-3 py-1.5 text-xs font-medium text-gray-500 w-20">Tag</th>
              <th className="text-left px-3 py-1.5 text-xs font-medium text-gray-500">Tätigkeit</th>
            </tr>
          </thead>
          <tbody>
            {[
              { day: 'Mo., 5.5.', text: 'LOP-Auswertung, Kundengespräch' },
              { day: 'Di., 6.5.', text: 'Präsentation vorbereiten' },
              { day: 'Mi., 7.5.', text: '–' },
            ].map((r, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="px-3 py-1.5 text-gray-400">{r.day}</td>
                <td className="px-3 py-1.5 text-gray-600">{r.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
            <div className="text-xs font-medium text-gray-700">LOP_PMO_2026-05-01.xlsx</div>
            <div className="text-xs text-gray-400">With workspace branding & metadata</div>
          </div>
        </div>
        <div className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600">↓ XLSX</div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">👥</span>
          <div>
            <div className="text-xs font-medium text-gray-700">Invite team</div>
            <div className="text-xs text-gray-400">Editor · Viewer · Project Admin</div>
          </div>
        </div>
        <div className="text-xs text-white rounded px-2 py-1" style={{ backgroundColor: 'var(--brand,#2563EB)' }}>+ Invite</div>
      </div>
    </div>
  )
}
