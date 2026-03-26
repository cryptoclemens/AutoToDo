import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { resolveWorkspace } from '@/lib/workspace'
import LopTable from '@/components/lop/LopTable'
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
    .select('id, title, description, responsible, due_date, priority, status, result, requires_review, ai_confidence, source_quote')
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
      }> | null
    }

  const openCount = lopItems?.filter(i => i.status !== 'abgeschlossen').length ?? 0
  const totalCount = lopItems?.length ?? 0

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
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {openCount} offen · {totalCount} gesamt
          </p>
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

      {/* LOP-Tabelle */}
      <LopTable
        initialItems={lopItems ?? []}
        projectId={project.id}
        canEdit={canEdit && !project.archived_at}
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
