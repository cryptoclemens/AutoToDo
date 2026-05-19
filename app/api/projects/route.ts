import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'
import { z } from 'zod'
import { checkProjectLimit } from '@/lib/plan-gate'

const BUNDESLAENDER = ['BW','BY','BE','BB','HB','HH','HE','MV','NI','NW','RP','SL','SN','ST','SH','TH']

const CALL_LANGUAGES = ['de','en','fr','es','it','pt','nl','pl'] as const

const schema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).nullable().optional(),
  bundesland: z.string().refine(v => BUNDESLAENDER.includes(v)).nullable().optional(),
  call_language: z.enum(CALL_LANGUAGES).default('de'),
  needs_activity_report: z.boolean().default(false),
})

export async function GET() {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('workspace_id', workspace.id)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  return NextResponse.json({ projects: projects ?? [] })
}

export async function POST(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const { workspaceId, name, description, bundesland, call_language, needs_activity_report } = parsed.data

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Berechtigung prüfen
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  const allowedRoles = ['workspace_owner', 'workspace_admin', 'project_admin']
  if (!member || !allowedRoles.includes(member.role as string)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  // Plan-Gate: Projekt-Limit prüfen
  const { data: ws } = await supabase
    .from('workspaces').select('plan, plan_expires_at').eq('id', workspaceId).single() as {
      data: { plan: string; plan_expires_at: string | null } | null
    }
  const gate = await checkProjectLimit(supabase, workspaceId, (ws?.plan ?? 'beta') as import('@/lib/plans').Plan, ws?.plan_expires_at)
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason, upgradeHint: gate.upgradeHint }, { status: 402 })
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({ workspace_id: workspaceId, name, description, bundesland: bundesland ?? null, call_language, needs_activity_report, created_by: user.id })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Projekt konnte nicht erstellt werden.' }, { status: 500 })
  }

  return NextResponse.json({ id: (data as { id: string }).id }, { status: 201 })
}
