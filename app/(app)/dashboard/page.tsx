import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { resolveWorkspace } from '@/lib/workspace'
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{workspace.name}</p>
        </div>
        <Link href="/projects/new">
          <Button style={{ backgroundColor: 'var(--brand)' }}>
            + Neues Projekt
          </Button>
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-400 mb-4">Noch keine Projekte vorhanden.</p>
            <Link href="/projects/new">
              <Button>Erstes Projekt anlegen</Button>
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
                      {new Date(project.created_at).toLocaleDateString('de-DE')}
                    </span>
                    <Badge variant="outline" className="text-xs">Aktiv</Badge>
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
