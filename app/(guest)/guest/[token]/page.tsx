import { notFound } from 'next/navigation'
import { createClient as createServiceClient } from '@supabase/supabase-js'

interface Props {
  params: { token: string }
}

export default async function GuestPage({ params }: Props) {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Validate guest token
  const { data: guest } = await supabase
    .from('project_guests')
    .select('id, email, project_id, expires_at, accepted_at')
    .eq('token', params.token)
    .gt('expires_at', new Date().toISOString())
    .single() as {
      data: { id: string; email: string; project_id: string; expires_at: string; accepted_at: string | null } | null
    }

  if (!guest) notFound()

  // Mark as accepted if first visit
  if (!guest.accepted_at) {
    await supabase
      .from('project_guests')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', guest.id)
  }

  // Load project
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, description')
    .eq('id', guest.project_id)
    .single() as {
      data: { id: string; name: string; description: string | null } | null
    }

  if (!project) notFound()

  // Load LOP items
  const { data: lopItems } = await supabase
    .from('lop_items')
    .select('id, title, description, responsible, due_date, priority, status, result')
    .eq('project_id', project.id)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false }) as {
      data: Array<{
        id: string; title: string; description: string | null
        responsible: string | null; due_date: string | null
        priority: 'hoch' | 'mittel' | 'niedrig'
        status: 'offen' | 'in_bearbeitung' | 'abgeschlossen'
        result: string | null
      }> | null
    }

  const items = lopItems ?? []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const priorityColor: Record<string, string> = {
    hoch: 'bg-red-100 text-red-700',
    mittel: 'bg-yellow-100 text-yellow-700',
    niedrig: 'bg-gray-100 text-gray-600',
  }
  const statusLabel: Record<string, string> = {
    offen: 'Offen',
    in_bearbeitung: 'In Bearbeitung',
    abgeschlossen: 'Abgeschlossen',
  }
  const statusColor: Record<string, string> = {
    offen: 'text-orange-600',
    in_bearbeitung: 'text-blue-600',
    abgeschlossen: 'text-green-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-900">AutoToDo</span>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-600">{project.name}</span>
          </div>
          <span className="text-xs text-gray-400">Gast-Ansicht · {guest.email}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Project header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span><strong className="text-orange-600">{items.filter(i => i.status === 'offen').length}</strong> offen</span>
            <span><strong className="text-blue-600">{items.filter(i => i.status === 'in_bearbeitung').length}</strong> in Bearbeitung</span>
            <span><strong className="text-green-600">{items.filter(i => i.status === 'abgeschlossen').length}</strong> abgeschlossen</span>
          </div>
        </div>

        {/* LOP Table */}
        {items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Keine Einträge vorhanden.</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Titel</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Zuständig</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Fälligkeit</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Priorität</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => {
                  const isDone = item.status === 'abgeschlossen'
                  const isOverdue = !isDone && item.due_date ? new Date(item.due_date) < today : false
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className={`font-medium ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</div>
                        )}
                        {item.result && (
                          <div className="text-xs text-green-700 mt-0.5 line-clamp-1">→ {item.result}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {item.responsible ?? <span className="text-gray-300">–</span>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {item.due_date ? (
                          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
                            {isOverdue && '⚠ '}
                            {new Date(item.due_date).toLocaleDateString('de-DE')}
                          </span>
                        ) : (
                          <span className="text-gray-300">–</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${statusColor[item.status] ?? 'text-gray-500'}`}>
                          {statusLabel[item.status] ?? item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[item.priority] ?? ''}`}>
                          {item.priority}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Viral CTA Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-blue-900">Erstellt mit AutoToDo</p>
            <p className="text-sm text-blue-700 mt-0.5">
              KI-gestützte Protokollauswertung und automatische Aufgabenverfolgung für dein Team.
            </p>
          </div>
          <a
            href={process.env.NEXT_PUBLIC_APP_URL ?? 'https://autotodo.app'}
            className="shrink-0 bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kostenlos starten →
          </a>
        </div>
      </main>
    </div>
  )
}
