import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { resolveWorkspace } from '@/lib/workspace'
import ProjectTitleEditor from '@/components/projects/ProjectTitleEditor'
import ProjectPageClient from '@/components/projects/ProjectPageClient'
import { Button } from '@/components/ui/button'

interface Props {
  params: { id: string }
}

export default async function ProjectPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) redirect('/onboarding')

  // Projekt laden
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, description, archived_at, workspace_id')
    .eq('id', params.id)
    .eq('workspace_id', workspace.id)
    .single() as {
      data: {
        id: string; name: string; description: string | null
        archived_at: string | null; workspace_id: string
      } | null
    }

  if (!project) notFound()

  // Mitglied-Rolle
  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).single() as {
      data: { role: string } | null
    }

  const canEdit = member
    ? ['workspace_owner', 'workspace_admin', 'project_admin', 'editor'].includes(member.role)
    : false

  const canAdmin = member
    ? ['workspace_owner', 'workspace_admin', 'project_admin'].includes(member.role)
    : false

  // LOP-Punkte laden
  const { data: lopItems } = await supabase
    .from('lop_items')
    .select('id, title, description, responsible, due_date, priority, status, result, requires_review, ai_confidence, source_quote, created_at, updated_at')
    .eq('project_id', project.id)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false }) as {
      data: Array<{
        id: string; title: string; description: string | null
        responsible: string | null; due_date: string | null
        priority: 'hoch' | 'mittel' | 'niedrig'
        status: 'offen' | 'in_bearbeitung' | 'abgeschlossen'
        result: string | null; requires_review: boolean
        ai_confidence: number | null; source_quote: string | null
        created_at: string; updated_at: string
      }> | null
    }

  const strictOpenCount = lopItems?.filter(i => i.status === 'offen').length ?? 0
  const inProgressCount = lopItems?.filter(i => i.status === 'in_bearbeitung').length ?? 0
  const doneCount = lopItems?.filter(i => i.status === 'abgeschlossen').length ?? 0
  const totalCount = lopItems?.length ?? 0

  // Durchschnittliche Bearbeitungszeit für abgeschlossene Punkte (updated_at - created_at)
  const doneTimes = (lopItems ?? [])
    .filter(i => i.status === 'abgeschlossen')
    .map(i => (new Date(i.updated_at).getTime() - new Date(i.created_at).getTime()) / 86_400_000)
    .filter(d => d > 0)
  const avgDays = doneTimes.length > 0
    ? Math.round(doneTimes.reduce((a, b) => a + b, 0) / doneTimes.length)
    : null
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-1 text-sm text-gray-400">
        <Link href="/dashboard" className="hover:text-gray-600">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-600">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <ProjectTitleEditor
            projectId={project.id}
            initialName={project.name}
            canEdit={canEdit}
          />
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
          {/* KPI-Zeile */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="text-xs text-gray-500">
              <span className="font-medium text-orange-600">{strictOpenCount}</span> offen
              {inProgressCount > 0 && (
                <> · <span className="font-medium text-blue-600">{inProgressCount}</span> in Bearbeitung</>
              )}
              {' '}· <span className="font-medium text-green-600">{doneCount}</span> abgeschlossen
              {' '}· <span className="text-gray-400">{totalCount} gesamt</span>
            </span>
            {totalCount > 0 && (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium">
                🎯 {completionPct} % fertig
              </span>
            )}
            {avgDays !== null && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
                ⏱ Ø {avgDays} {avgDays === 1 ? 'Tag' : 'Tage'} Bearbeitungszeit
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${project.id}/transcripts`}>
            <Button size="sm" style={{ backgroundColor: 'var(--brand)' }} className="text-white">
              ↑ Transkript hochladen
            </Button>
          </Link>
          <a href={`/api/lop/export?projectId=${project.id}`}>
            <Button variant="outline" size="sm">↓ XLSX</Button>
          </a>
          {canAdmin && !project.archived_at && (
            <ArchiveButton projectId={project.id} />
          )}
        </div>
      </div>

      {project.archived_at && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4 text-sm text-yellow-800">
          ⚠ Dieses Projekt ist archiviert.
        </div>
      )}

      {/* Mitglied einladen + LOP-Punkt hinzufügen + LOP-Tabelle */}
      <ProjectPageClient
        initialItems={lopItems ?? []}
        projectId={project.id}
        projectName={project.name}
        workspaceId={workspace.id}
        canEdit={canEdit && !project.archived_at}
        canAdmin={canAdmin && !project.archived_at}
      />
    </div>
  )
}

// ─── Archivieren-Button (Client) ──────────────────────────────────────────────
function ArchiveButton({ projectId }: { projectId: string }) {
  // Inline Server Action nicht möglich in dieser Konstellation – via API Route
  return (
    <form action={`/api/projects/${projectId}/archive`} method="POST">
      <Button type="submit" variant="outline" size="sm" className="text-orange-600 border-orange-200">
        Archivieren
      </Button>
    </form>
  )
}
