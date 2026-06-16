'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export const DEFAULT_STATUS_LABELS: Record<string, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
  abgeschlossen: 'Abgeschlossen',
  geparkt: 'Geparkt',
}

const StatusLabelsContext = createContext<Record<string, string>>(DEFAULT_STATUS_LABELS)

export function StatusLabelsProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>(DEFAULT_STATUS_LABELS)

  useEffect(() => {
    fetch('/api/settings/status-labels')
      .then(r => r.ok ? r.json() : null)
      .then((d: { labels: Record<string, string> } | null) => {
        if (!d?.labels) return
        setLabels(prev => ({ ...prev, ...d.labels }))
      })
      .catch(() => {})
  }, [])

  return (
    <StatusLabelsContext.Provider value={labels}>
      {children}
    </StatusLabelsContext.Provider>
  )
}

export function useStatusLabels() {
  return useContext(StatusLabelsContext)
}

export function useStatusLabel(status: string): string {
  const labels = useStatusLabels()
  return labels[status] ?? DEFAULT_STATUS_LABELS[status] ?? status
}
