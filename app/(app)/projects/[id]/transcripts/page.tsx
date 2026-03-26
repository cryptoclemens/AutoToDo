import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TranscriptUploadForm } from '@/components/transcripts/TranscriptUploadForm'
import TranscriptsRefresher from './TranscriptsRefresher'

interface Props {
  params: { id: string }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ausstehend',
  processing: 'Wird verarbeitet…',
  done: 'Fertig',
  error: 'Fehler',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-50 text-blue-700',
  done: 'bg-green-50 text-green-700',
  error: 'bg-red-50 text-red-700',
}

export default async function TranscriptsPage({ params }: Props) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const headersList = headers()
  const slug = headersList.get('x-workspace-slug') ?? ''

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: workspace } = await supabase
    .from('workspaces').select('id').eq('slug', slug).single() as {
      data: { id: string } | null
    }
  if (!workspace) redirect('/login')

  const { data: project } = await supabase
    .from('projects').select('id, name').eq('id', params.id).eq('workspace_id', workspace.id).single() as {
      data: { id: string; name: string } | null
    }
  if (!project) notFound()

  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).single() as {
      data: { role: string } | null
    }
  const canUpload = member?.role !== 'viewer'

  const { data: transcripts } = await supabase
    .from('transcripts')
    .select('id, original_filename, meeting_date, processing_status, items_created, items_updated, llm_summary, processing_error, error_message, created_at')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false }) as {
      data: Array<{
        id: string; original_filename: string | null; meeting_date: string | null
        processing_status: string; items_created: number; items_updated: number
        llm_summary: string | null; processing_error: string | null; error_message: string | null; created_at: string
      }> | null
    }

  const hasPending = transcripts?.some(t => t.processing_status === 'pending' || t.processing_status === 'processing')

  return (
    <div>
      <div className="flex items-center gap-2 mb-1 text-sm text-gray-400">
        <Link href="/dashboard" className="hover:text-gray-600">Dashboard</Link>
        <span>/</span>
        <Link href={`/projects/${project.id}`} className="hover:text-gray-600">{project.name}</Link>
        <span>/</span>
        <span className="text-gray-600">Transkripte</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transkripte</h1>
        {canUpload && (
          <TranscriptUploadForm projectId={project.id} onUploaded={() => {}} />
        )}
      </div>

      {/* Auto-refresh when processing */}
      {hasPending && <TranscriptsRefresher />}

      {!transcripts || transcripts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-400 text-sm mb-2">Noch keine Transkripte hochgeladen.</p>
            {canUpload && (
              <p className="text-xs text-gray-300">Klicken Sie oben auf &quot;Transkript hochladen&quot;, um zu starten.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transcripts.map(t => (
            <Card key={t.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {t.original_filename ?? 'Unbenannte Datei'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.meeting_date
                        ? new Date(t.meeting_date).toLocaleDateString('de-DE')
                        : new Date(t.created_at).toLocaleDateString('de-DE')}
                      {t.processing_status === 'done' && (
                        <span className="ml-2 text-green-600">
                          · {t.items_created} neu · {t.items_updated} aktualisiert
                        </span>
                      )}
                    </p>
                    {t.llm_summary && (
                      <p className="text-xs text-gray-500 mt-1 italic">{t.llm_summary}</p>
                    )}
                    {(t.processing_error || t.error_message) && (
                      <p className="text-xs text-red-500 mt-1">{t.processing_error ?? t.error_message}</p>
                    )}
                  </div>
                  <Badge className={`text-xs shrink-0 ${STATUS_COLORS[t.processing_status] ?? ''}`}>
                    {STATUS_LABELS[t.processing_status] ?? t.processing_status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
