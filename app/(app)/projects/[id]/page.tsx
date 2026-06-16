import type React from 'react'
import { redirect, notFound } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveWorkspace } from '@/lib/workspace'
import { getEffectiveBranding } from '@/lib/branding'
import ProjectTitleEditor from '@/components/projects/ProjectTitleEditor'
import ProjectPageClient from '@/components/projects/ProjectPageClient'
import ContextNotes from '@/components/project/ContextNotes'
import UsageTip from '@/components/project/UsageTip'
import XlsxImportDialog from '@/components/projects/XlsxImportDialog'
import { Button } from '@/components/ui/button'
import TaetigkeitsnachweisButton from '@/components/dashboard/TaetigkeitsnachweisButton'
import TagesplanungButton from '@/components/workspace/TagesplanungButton'
import ArchiveExportButton from '@/components/lop/ArchiveExportButton'
import LopSummaryButton from '@/components/lop/LopSummaryButton'
import ApplyTemplateButton from '@/components/lop/ApplyTemplateButton'

interface Props {
  params: { id: string }
}

export default async function ProjectPage({ params }: Props) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) redirect('/onboarding')

  // Projekt laden — brand_color/logo_url/branding_inherited benötigen Migration 016
  type ProjectData = {
    id: string; name: string; description: string | null
    archived_at: string | null; workspace_id: string
    brand_color?: string | null; logo_url?: string | null; branding_inherited?: boolean
  }
  let project: ProjectData | null = null
  {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, archived_at, workspace_id, brand_color, logo_url, branding_inherited')
      .eq('id', params.id)
      .eq('workspace_id', workspace.id)
      .single() as { data: ProjectData | null; error: unknown }

    if (error) {
      const { data: fallback } = await supabase
        .from('projects')
        .select('id, name, description, archived_at, workspace_id')
        .eq('id', params.id)
        .eq('workspace_id', workspace.id)
        .single() as { data: ProjectData | null }
      project = fallback
    } else {
      project = data
    }
  }

  if (!project) notFound()

  // Check workspace membership first
  const { data: wsMember } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).maybeSingle() as {
      data: { role: string } | null
    }

  let canEdit = false
  let canAdmin = false

  if (wsMember) {
    canEdit = ['workspace_owner', 'workspace_admin', 'project_admin', 'editor'].includes(wsMember.role)
    canAdmin = ['workspace_owner', 'workspace_admin', 'project_admin'].includes(wsMember.role)
  } else {
    // Check project-specific membership
    const { data: pmMember } = await supabase
      .from('project_members').select('role')
      .eq('project_id', project.id).eq('user_id', user.id).maybeSingle() as {
        data: { role: string } | null
      }
    if (!pmMember) notFound() // No access at all
    canEdit = ['project_admin', 'editor'].includes(pmMember.role)
    canAdmin = pmMember.role === 'project_admin'
  }

  // LOP-Punkte laden (mit Fallback falls links-Spalte noch nicht migriert ist)
  type LopRow = {
    id: string; title: string; description: string | null
    responsible: string | null; responsible_user_id: string | null
    due_date: string | null
    priority: 'hoch' | 'mittel' | 'niedrig'
    status: 'offen' | 'in_bearbeitung' | 'abgeschlossen'
    result: string | null; requires_review: boolean
    ai_confidence: number | null; source_quote: string | null
    links?: { url: string; label?: string }[]
    created_at: string; updated_at: string; completed_at: string | null
  }

  const { data: lopItemsInit, error: lopError } = await supabase
    .from('lop_items')
    .select('id, title, description, responsible, responsible_user_id, due_date, priority, status, result, requires_review, ai_confidence, source_quote, links, created_at, updated_at, completed_at')
    .eq('project_id', project.id)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false }) as { data: LopRow[] | null; error: unknown }

  let lopItems = lopItemsInit
  if (lopError) {
    // Fallback: links column not yet migrated
    const { data: fallback } = await supabase
      .from('lop_items')
      .select('id, title, description, responsible, responsible_user_id, due_date, priority, status, result, requires_review, ai_confidence, source_quote, created_at, updated_at')
      .eq('project_id', project.id)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false }) as { data: LopRow[] | null }
    lopItems = fallback
  }

  const strictOpenCount = lopItems?.filter(i => i.status === 'offen').length ?? 0
  const inProgressCount = lopItems?.filter(i => i.status === 'in_bearbeitung').length ?? 0
  const doneCount = lopItems?.filter(i => i.status === 'abgeschlossen').length ?? 0
  const totalCount = lopItems?.length ?? 0

  // Durchschnittliche Bearbeitungszeit: completed_at - created_at
  const doneTimes = (lopItems ?? [])
    .filter(i => i.status === 'abgeschlossen' && i.completed_at)
    .map(i => (new Date(i.completed_at!).getTime() - new Date(i.created_at).getTime()) / 86_400_000)
    .filter(d => d >= 0)
  const avgDaysRaw = doneTimes.length > 0
    ? doneTimes.reduce((a, b) => a + b, 0) / doneTimes.length
    : null
  const avgDays = avgDaysRaw !== null ? Math.round(avgDaysRaw) : null
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  // Tasks pro Verantwortlichem (offen + in Bearbeitung)
  const responsibleCountMap = new Map<string, number>()
  for (const item of (lopItems ?? []).filter(i => i.status !== 'abgeschlossen')) {
    const key = item.responsible ?? '–'
    responsibleCountMap.set(key, (responsibleCountMap.get(key) ?? 0) + 1)
  }
  const responsibleKpis = Array.from(responsibleCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const branding = getEffectiveBranding(project, workspace)
  const currentLocale = cookies().get('locale')?.value ?? 'de'

  return (
    <div style={{ '--brand': branding.brand_color } as React.CSSProperties}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-1 text-sm text-gray-500">
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
                ⏱ Ø {avgDays === 0 ? '< 1 Tag' : `${avgDays} ${avgDays === 1 ? 'Tag' : 'Tage'}`} Bearbeitungszeit
              </span>
            )}
          </div>
          {/* Tasks pro Verantwortlichem */}
          {responsibleKpis.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs text-gray-400">Offen pro Person:</span>
              {responsibleKpis.map(([name, count]) => (
                <span key={name} className="text-xs text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">
                  {name} <span className="font-semibold">{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <TagesplanungButton projectId={project.id} size="sm" />
          <TaetigkeitsnachweisButton projectId={project.id} projectName={project.name} size="sm" />
          <Link href={`/projects/${project.id}/transcripts`}>
            <Button size="sm" style={{ backgroundColor: 'var(--brand)' }} className="text-white rounded-lg">
              ↑ Transkript hochladen
            </Button>
          </Link>
          <a
            href={`/api/lop/export?projectId=${project.id}`}
            className="inline-flex items-center h-7 gap-1 px-2.5 text-[0.8rem] font-medium border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
          >
            ↓ XLSX exportieren
          </a>
          <ArchiveExportButton projectId={project.id} />
          <LopSummaryButton projectId={project.id} />
          {canEdit && !project.archived_at && <ApplyTemplateButton projectId={project.id} />}
          {canEdit && !project.archived_at && (
            <XlsxImportDialog projectId={project.id} />
          )}
          {canAdmin && !project.archived_at && (
            <Link href={`/settings/projects/${project.id}/branding`}>
              <Button variant="outline" size="sm" className="rounded-lg">
                Branding
              </Button>
            </Link>
          )}
          {canAdmin && !project.archived_at && (
            <ArchiveButton projectId={project.id} />
          )}
        </div>
      </div>

      {project.archived_at && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4 text-sm text-yellow-800 flex items-center justify-between gap-4">
          <span>⚠ Dieses Projekt ist archiviert.</span>
          {canAdmin && <UnarchiveButton projectId={project.id} />}
        </div>
      )}

      {/* Context notes extracted from transcripts */}
      <ContextNotes projectId={project.id} />

      <UsageTip />

      {/* Mitglied einladen + LOP-Punkt hinzufügen + LOP-Tabelle */}
      <ProjectPageClient
        initialItems={lopItems ?? []}
        projectId={project.id}
        projectName={project.name}
        workspaceId={workspace.id}
        canEdit={canEdit && !project.archived_at}
        canAdmin={canAdmin && !project.archived_at}
        currentLocale={currentLocale}
      />
    </div>
  )
}

// ─── Archivieren-Button (Client) ──────────────────────────────────────────────
function ArchiveButton({ projectId }: { projectId: string }) {
  return (
    <form action={`/api/projects/${projectId}/archive`} method="POST">
      <Button type="submit" variant="outline" size="sm" className="rounded-lg">
        Archivieren
      </Button>
    </form>
  )
}

// ─── Wiederherstellen-Button (Client) ─────────────────────────────────────────
function UnarchiveButton({ projectId }: { projectId: string }) {
  return (
    <form action={`/api/projects/${projectId}/unarchive`} method="POST">
      <Button type="submit" variant="outline" size="sm" className="rounded-lg border-yellow-400 text-yellow-800 hover:bg-yellow-100">
        Wiederherstellen
      </Button>
    </form>
  )
}
