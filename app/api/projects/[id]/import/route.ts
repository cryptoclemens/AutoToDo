import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveWorkspace } from '@/lib/workspace'
import { headers } from 'next/headers'
import { parseImportSheet, computeImportDiff } from '@/lib/import'

export const runtime = 'nodejs'

/**
 * POST /api/projects/[id]/import
 *
 * Accepts a multipart/form-data upload with field "file" (an .xlsx file).
 * Parses the "LOP" sheet, compares against existing items, and returns a diff preview.
 * Does NOT write to the database — call /import/apply to commit changes.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const slug = headers().get('x-workspace-slug') ?? ''
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  // Check project belongs to workspace and user has edit rights
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', params.id)
    .eq('workspace_id', workspace.id)
    .single()
  if (!project) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })

  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).single()
  const canEdit = member && ['workspace_owner', 'workspace_admin', 'project_admin', 'editor'].includes(member.role)
  if (!canEdit) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })

  // Parse multipart form data
  let fileBuffer: Buffer
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Keine Datei hochgeladen.' }, { status: 400 })
    if (!file.name.endsWith('.xlsx')) return NextResponse.json({ error: 'Nur .xlsx-Dateien werden unterstützt.' }, { status: 400 })
    const arrayBuffer = await file.arrayBuffer()
    fileBuffer = Buffer.from(arrayBuffer)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Lesen der Datei.' }, { status: 400 })
  }

  // Parse XLSX
  let importRows
  try {
    importRows = parseImportSheet(fileBuffer)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Fehler beim Parsen der XLSX-Datei.'
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  if (importRows.length === 0) {
    return NextResponse.json({ error: 'Keine Daten in der Datei gefunden.' }, { status: 422 })
  }

  // Load existing items for this project
  const { data: existing } = await supabase
    .from('lop_items')
    .select('id, title, description, responsible, due_date, priority, status, result')
    .eq('project_id', params.id)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  const diff = computeImportDiff(importRows, existing ?? [])

  return NextResponse.json({
    preview: diff,
    totalRows: importRows.length,
    updates: diff.filter(d => d.type === 'update').length,
    additions: diff.filter(d => d.type === 'add').length,
    unchanged: diff.filter(d => d.type === 'unchanged').length,
  })
}
