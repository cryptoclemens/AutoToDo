'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Member {
  user_id: string
  role: string
  joined_at: string
  email: string | null
  display_name: string | null
}

const ROLE_LABELS: Record<string, string> = {
  project_admin: 'Admin',
  editor: 'Bearbeiter',
  viewer: 'Betrachter',
}

interface Props {
  projectId: string
}

export default function ProjectMembersDialog({ projectId }: Props) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/members`)
      if (!res.ok) { toast.error('Fehler beim Laden der Mitglieder.'); return }
      setMembers(await res.json())
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  async function handleRemove(userId: string) {
    if (!confirm('Mitglied wirklich aus dieser LOP-Liste entfernen?')) return
    setRemoving(userId)
    try {
      const res = await fetch(`/api/projects/${projectId}/members?userId=${userId}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Fehler beim Entfernen.'); return }
      setMembers(prev => prev.filter(m => m.user_id !== userId))
      toast.success('Mitglied entfernt.')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setOpen(true)}>
        Mitglieder verwalten
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          {/* Dialog */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Mitglieder dieser LOP-Liste</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                aria-label="Schließen"
              >
                ×
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-gray-400">Lädt…</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400">Keine direkten Projektmitglieder.</p>
            ) : (
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.user_id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {m.display_name ?? m.email ?? m.user_id.slice(0, 8) + '…'}
                      </p>
                      {m.email && m.display_name && (
                        <p className="text-xs text-gray-400 truncate">{m.email}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">{ROLE_LABELS[m.role] ?? m.role}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(m.user_id)}
                      disabled={removing === m.user_id}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 shrink-0 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      {removing === m.user_id ? '…' : 'Entfernen'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400">
              Hier werden nur direkt eingeladene Projektmitglieder angezeigt, keine Workspace-Mitglieder.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
