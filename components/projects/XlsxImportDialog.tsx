'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ImportChange } from '@/lib/import'
import { Button } from '@/components/ui/button'

interface Props {
  projectId: string
}

type Step = 'idle' | 'uploading' | 'preview' | 'applying' | 'done'

const FIELD_LABELS: Record<string, string> = {
  'Titel': 'Titel',
  'Beschreibung': 'Beschreibung',
  'Verantwortlich': 'Verantwortlich',
  'Fälligkeitsdatum': 'Fälligkeit',
  'Priorität': 'Priorität',
  'Status': 'Status',
  'Ergebnis': 'Ergebnis',
}

export default function XlsxImportDialog({ projectId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportChange[] | null>(null)
  const [stats, setStats] = useState<{ updates: number; additions: number; unchanged: number } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<{ updated: number; created: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep('idle')
    setError(null)
    setPreview(null)
    setStats(null)
    setSelected(new Set())
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function close() {
    setOpen(false)
    reset()
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Bitte wähle eine .xlsx-Datei aus.'); return }
    setError(null)
    setStep('uploading')

    const form = new FormData()
    form.append('file', file)

    const res = await fetch(`/api/projects/${projectId}/import`, { method: 'POST', body: form })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Verarbeiten der Datei.')
      setStep('idle')
      return
    }

    const changes = data.preview as ImportChange[]
    setPreview(changes)
    setStats({ updates: data.updates, additions: data.additions, unchanged: data.unchanged })

    // Pre-select all updates and additions
    const autoSelected = new Set<string>(
      changes
        .filter(c => c.type === 'update' || c.type === 'add')
        .map((c, i) => c.existingId ?? `add:${i}`)
    )
    setSelected(autoSelected)
    setStep('preview')
  }

  function toggleItem(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleApply() {
    if (!preview) return
    setStep('applying')
    setError(null)

    const updates: Array<{ id: string; fields: Record<string, unknown> }> = []
    const creates: Array<Record<string, unknown>> = []

    preview.forEach((change, i) => {
      const key = change.existingId ?? `add:${i}`
      if (!selected.has(key)) return

      if (change.type === 'update' && change.existingId) {
        const row = change.importRow
        const fields: Record<string, unknown> = {}
        if (change.changedFields?.includes('Titel')) fields.title = row.title
        if (change.changedFields?.includes('Beschreibung')) fields.description = row.description
        if (change.changedFields?.includes('Verantwortlich')) fields.responsible = row.responsible
        if (change.changedFields?.includes('Fälligkeitsdatum')) fields.due_date = row.dueDate
        if (change.changedFields?.includes('Priorität')) fields.priority = row.priority
        if (change.changedFields?.includes('Status')) fields.status = row.status
        if (change.changedFields?.includes('Ergebnis')) fields.result = row.result
        updates.push({ id: change.existingId, fields })
      }

      if (change.type === 'add') {
        const row = change.importRow
        creates.push({
          title: row.title,
          description: row.description || undefined,
          responsible: row.responsible || undefined,
          due_date: row.dueDate,
          priority: row.priority,
          status: row.status,
          result: row.result || undefined,
        })
      }
    })

    const res = await fetch(`/api/projects/${projectId}/import/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates, creates }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Anwenden der Änderungen.')
      setStep('preview')
      return
    }

    setResult(data)
    setStep('done')
    router.refresh()
  }

  const actionable = preview?.filter(c => c.type === 'update' || c.type === 'add') ?? []
  const selectedCount = actionable.filter((c, i) => selected.has(c.existingId ?? `add:${i}`)).length

  return (
    <>
      <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setOpen(true)}>
        ↑ XLSX importieren
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">XLSX importieren</h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

              {/* Step: idle / uploading */}
              {(step === 'idle' || step === 'uploading') && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Lade eine zuvor exportierte AutoToDo-XLSX-Datei hoch. Die Punkte werden
                    mit der aktuellen LOP abgeglichen und geänderte Felder zur Übernahme vorgeschlagen.
                  </p>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx"
                      className="hidden"
                      id="xlsx-import-input"
                      onChange={() => setError(null)}
                    />
                    <label htmlFor="xlsx-import-input" className="cursor-pointer">
                      <div className="text-3xl mb-2">📂</div>
                      <p className="text-sm text-gray-600 font-medium">XLSX-Datei auswählen</p>
                      <p className="text-xs text-gray-400 mt-1">Nur .xlsx-Dateien (AutoToDo-Export)</p>
                    </label>
                    {fileRef.current?.files?.[0] && (
                      <p className="mt-2 text-xs text-green-600 font-medium">
                        {fileRef.current.files[0].name}
                      </p>
                    )}
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
              )}

              {/* Step: preview */}
              {step === 'preview' && preview && stats && (
                <div className="space-y-3">
                  <div className="flex gap-3 text-xs">
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full font-medium">
                      {stats.updates} Änderungen
                    </span>
                    <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full font-medium">
                      {stats.additions} Neue Punkte
                    </span>
                    <span className="bg-gray-50 text-gray-500 border border-gray-200 px-2 py-1 rounded-full">
                      {stats.unchanged} Unverändert
                    </span>
                  </div>

                  {actionable.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">
                      Keine Änderungen gefunden. Die importierte Datei stimmt mit der aktuellen LOP überein.
                    </p>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {actionable.map((change, i) => {
                        const key = change.existingId ?? `add:${i}`
                        const isSelected = selected.has(key)
                        return (
                          <div
                            key={key}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 ${isSelected ? '' : 'opacity-50'}`}
                            onClick={() => toggleItem(key)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItem(key)}
                              onClick={e => e.stopPropagation()}
                              className="mt-0.5 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                {change.type === 'add' ? (
                                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">NEU</span>
                                ) : (
                                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">ÄNDERUNG</span>
                                )}
                                {change.nr !== null && (
                                  <span className="text-xs text-gray-400">Nr. {change.nr}</span>
                                )}
                                <span className="text-sm font-medium text-gray-800 truncate">{change.importRow.title}</span>
                              </div>
                              {change.type === 'update' && change.changedFields && (
                                <p className="text-xs text-gray-500">
                                  Geändert: {change.changedFields.map(f => FIELD_LABELS[f] ?? f).join(', ')}
                                </p>
                              )}
                              {change.type === 'add' && (
                                <p className="text-xs text-gray-500">
                                  {[
                                    change.importRow.responsible && `Verantwortlich: ${change.importRow.responsible}`,
                                    change.importRow.status && `Status: ${change.importRow.status}`,
                                    change.importRow.dueDate && `Fällig: ${change.importRow.dueDate}`,
                                  ].filter(Boolean).join(' · ')}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
              )}

              {/* Step: applying */}
              {step === 'applying' && (
                <div className="py-8 text-center">
                  <div className="text-2xl mb-3 animate-spin">⚙</div>
                  <p className="text-sm text-gray-500">Änderungen werden übernommen…</p>
                </div>
              )}

              {/* Step: done */}
              {step === 'done' && result && (
                <div className="py-8 text-center space-y-2">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="font-semibold text-gray-900">Import abgeschlossen</p>
                  <p className="text-sm text-gray-500">
                    {result.updated > 0 && <><span className="font-medium text-amber-600">{result.updated}</span> Punkte aktualisiert</>}
                    {result.updated > 0 && result.created > 0 && ' · '}
                    {result.created > 0 && <><span className="font-medium text-green-600">{result.created}</span> neue Punkte erstellt</>}
                    {result.updated === 0 && result.created === 0 && 'Keine Änderungen vorgenommen.'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              {step === 'done' ? (
                <button onClick={close} className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700">
                  Schließen
                </button>
              ) : step === 'preview' ? (
                <>
                  <button onClick={reset} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                    Zurück
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={selectedCount === 0}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {selectedCount === 0 ? 'Nichts ausgewählt' : `${selectedCount} Änderung${selectedCount !== 1 ? 'en' : ''} übernehmen`}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={close} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                    Abbrechen
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={step === 'uploading'}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {step === 'uploading' ? 'Wird verarbeitet…' : 'Datei analysieren'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
