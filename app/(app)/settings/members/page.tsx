import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveWorkspace } from '@/lib/workspace'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const ROLE_LABELS: Record<string, string> = {
  workspace_owner: 'Inhaber',
  workspace_admin: 'Admin',
  project_admin: 'Projekt-Admin',
  editor: 'Editor',
  viewer: 'Betrachter',
}

export default async function MembersPage() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const slug = headers().get('x-workspace-slug') ?? ''
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) redirect('/onboarding')

  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id, role, joined_at')
    .eq('workspace_id', workspace.id)
    .order('joined_at', { ascending: true }) as {
      data: Array<{ user_id: string; role: string; joined_at: string }> | null
    }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Team</h1>
      <p className="text-sm text-gray-500 mb-6">{members?.length ?? 0} Mitglieder in diesem Workspace</p>

      <div className="space-y-2">
        {members?.map(m => (
          <Card key={m.user_id}>
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <span className="text-sm text-gray-700 font-mono">{m.user_id.slice(0, 8)}…</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {new Date(m.joined_at).toLocaleDateString('de-DE')}
                </span>
                <Badge variant="outline" className="text-xs">
                  {ROLE_LABELS[m.role] ?? m.role}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
