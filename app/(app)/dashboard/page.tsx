import type React from 'react'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveWorkspace } from '@/lib/workspace'
import { getTranslations, getLocale } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { getEffectiveBranding } from '@/lib/branding'

export default async function DashboardPage() {
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

  // Check if workspace member
  const { data: wsMember } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .maybeSingle()

  type ProjectRow = { id: string; name: string; description: string | null; created_at: string; archived_at: string | null; brand_color: string | null; logo_url: string | null; branding_inherited: boolean }
  let projects: ProjectRow[] | null

  if (wsMember) {
    // Full access: show all workspace projects
    const { data } = await supabase
      .from('projects')
      .select('id, name, description, created_at, archived_at, brand_color, logo_url, branding_inherited')
      .eq('workspace_id', workspace.id)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
    projects = data as typeof projects
  } else {
    // Project-scoped: show only assigned projects
    const { data: pmRows } = await supabase
      .from('project_members')
      .select('projects(id, name, description, created_at, archived_at, brand_color, logo_url, branding_inherited)')
      .eq('user_id', user.id)
    projects = (pmRows ?? [])
      .map(r => r.projects as unknown as ProjectRow | null)
      .filter((p): p is NonNullable<typeof p> => p !== null && p.archived_at === null)
  }

  // Workspace-weite LOP-Statistiken
  const projectIds = (projects ?? []).map(p => p.id)
  const { data: allItems } = projectIds.length > 0
    ? await supabase
        .from('lop_items')
        .select('status, due_date')
        .in('project_id', projectIds)
    : { data: [] }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const openCount = (allItems ?? []).filter(i => i.status !== 'abgeschlossen').length
  const overdueCount = (allItems ?? []).filter(i =>
    i.status !== 'abgeschlossen' &&
    i.due_date &&
    new Date(i.due_date) < today
  ).length
  const doneCount = (allItems ?? []).filter(i => i.status === 'abgeschlossen').length
  const totalCount = (allItems ?? []).length

  const t = await getTranslations('dashboard')
  const locale = await getLocale()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{wsMember ? workspace.name : 'Projektmitglied'}</p>
        </div>
        {wsMember && (
          <Link href="/projects/new">
            <Button style={{ backgroundColor: 'var(--brand)' }}>
              + {t('newProject')}
            </Button>
          </Link>
        )}
      </div>

      {/* Statistik-Karten */}
      {totalCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard
            label={t('statOpen')}
            value={openCount}
            colorClass="text-blue-700"
            bg="bg-gradient-to-br from-blue-50 to-blue-100/60"
            iconBg="bg-blue-600"
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5" />
              </svg>
            }
          />
          <StatCard
            label={t('statOverdue')}
            value={overdueCount}
            colorClass={overdueCount > 0 ? 'text-red-700' : 'text-gray-400'}
            bg={overdueCount > 0 ? 'bg-gradient-to-br from-red-50 to-red-100/60' : 'bg-gradient-to-br from-gray-50 to-gray-100/60'}
            iconBg={overdueCount > 0 ? 'bg-red-600' : 'bg-gray-400'}
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5L13 12H1L7 1.5Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M7 5.5v3M7 10v.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
          />
          <StatCard
            label={t('statDone')}
            value={doneCount}
            colorClass="text-emerald-700"
            bg="bg-gradient-to-br from-emerald-50 to-emerald-100/60"
            iconBg="bg-emerald-600"
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7.5l3 3 6-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <StatCard
            label={t('statTotal')}
            value={totalCount}
            colorClass="text-slate-700"
            bg="bg-gradient-to-br from-slate-50 to-slate-100/60"
            iconBg="bg-slate-500"
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M2 7h10M2 10h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
          />
        </div>
      )}

      {!projects || projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 mx-auto mb-4 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
              <path d="M4 4h12v12H4V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M10 8v4M8 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-gray-400 mb-4 text-sm">{t('noProjects')}</p>
          <Link href="/projects/new">
            <Button style={{ backgroundColor: 'var(--brand)' }} className="text-white rounded-lg">
              {t('newProject')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => {
            const branding = getEffectiveBranding(project, workspace)
            return (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer h-full p-5 flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  {branding.logo_url ? (
                    <Image
                      src={branding.logo_url}
                      alt={project.name}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-xl object-contain border border-gray-100 shrink-0"
                    />
                  ) : (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: branding.brand_color }}
                  >
                    {project.name.slice(0, 2).toUpperCase()}
                  </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    {new Date(project.created_at).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {t('active')}
                  </span>
                </div>
              </div>
            </Link>
          )})}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, colorClass, bg, iconBg, icon }: {
  label: string
  value: number
  colorClass: string
  bg: string
  iconBg: string
  icon: React.ReactNode
}) {
  return (
    <div className={`${bg} rounded-2xl px-4 py-4 flex items-center gap-3 border border-white/60 shadow-sm`}>
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
        {icon}
      </div>
      <div>
        <div className={`text-2xl font-bold leading-none tracking-tight ${colorClass}`}>{value}</div>
        <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
      </div>
    </div>
  )
}
