import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { resolveWorkspace } from '@/lib/workspace'
import { getTranslations, getLocale } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) redirect('/onboarding')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, description, created_at, archived_at')
    .eq('workspace_id', workspace.id)
    .is('archived_at', null)
    .order('created_at', { ascending: false }) as {
      data: Array<{ id: string; name: string; description: string | null; created_at: string; archived_at: string | null }> | null
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
          <p className="text-sm text-gray-500 mt-0.5">{workspace.name}</p>
        </div>
        <Link href="/projects/new">
          <Button style={{ backgroundColor: 'var(--brand)' }}>
            + {t('newProject')}
          </Button>
        </Link>
      </div>

      {/* Statistik-Karten */}
      {totalCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label={t('statOpen')}
            value={openCount}
            color="text-blue-600"
            bg="bg-blue-50"
            icon="◯"
          />
          <StatCard
            label={t('statOverdue')}
            value={overdueCount}
            color={overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}
            bg={overdueCount > 0 ? 'bg-red-50' : 'bg-gray-50'}
            icon="⚠"
          />
          <StatCard
            label={t('statDone')}
            value={doneCount}
            color="text-green-600"
            bg="bg-green-50"
            icon="✓"
          />
          <StatCard
            label={t('statTotal')}
            value={totalCount}
            color="text-gray-600"
            bg="bg-gray-50"
            icon="≡"
          />
        </div>
      )}

      {!projects || projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-400 mb-4">{t('noProjects')}</p>
            <Link href="/projects/new">
              <Button>{t('newProject')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription className="text-sm line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {new Date(project.created_at).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE')}
                    </span>
                    <Badge variant="outline" className="text-xs">{t('active')}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, bg, icon }: {
  label: string
  value: number
  color: string
  bg: string
  icon: string
}) {
  return (
    <div className={`${bg} rounded-lg px-4 py-3 flex items-center gap-3`}>
      <span className={`text-xl ${color}`}>{icon}</span>
      <div>
        <div className={`text-2xl font-bold leading-none ${color}`}>{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  )
}
