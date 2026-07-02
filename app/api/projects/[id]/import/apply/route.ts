import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveProjectAccess } from '@/lib/projectAccess'
import { z } from 'zod'

export const runtime = 'nodejs'

const FieldsSchema = z.object({
  title:       z.string().optional(),
  description: z.string().optional(),
  responsible: z.string().optional(),
  due_date:    z.string().nullable().optional(),
  priority:    z.enum(['hoch', 'mittel', 'niedrig']).optional(),
  status:      z.enum(['offen', 'in_bearbeitung', 'abgeschlossen']).optional(),
  result:      z.string().optional(),
})

const ApplySchema = z.object({
  updates: z.array(z.object({
    id:     z.string().uuid(),
    fields: FieldsSchema,
  })),
  creates: z.array(z.object({
    title:       z.string().min(1),
    description: z.string().optional(),
    responsible: z.string().optional(),
    due_date:    z.string().nullable().optional(),
    priority:    z.enum(['hoch', 'mittel', 'niedrig']).optional(),
    status:      z.enum(['offen', 'in_bearbeitung', 'abgeschlossen']).optional(),
    result:      z.string().optional(),
  })),
})

/**
 * POST /api/projects/[id]/import/apply
 *
 * Applies a previously previewed XLSX import diff to the database.
 * Body: { updates: [{id, fields}], creates: [{fields}] }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  // Zugriff über den Workspace DES PROJEKTS (nicht Heimat-Workspace)
  const access = await resolveProjectAccess(supabase, user.id, params.id)
  if (!access) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })
  if (!access.canEdit) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  const workspace = { id: access.workspaceId }

  const body = await req.json()
  const parsed = ApplySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Anfrage.', details: parsed.error.flatten() }, { status: 400 })
  }

  const { updates, creates } = parsed.data
  const now = new Date().toISOString()
  let updatedCount = 0
  let createdCount = 0

  // Apply updates
  for (const u of updates) {
    const { error } = await supabase
      .from('lop_items')
      .update({ ...u.fields, updated_at: now })
      .eq('id', u.id)
      .eq('project_id', params.id) // safety check

    if (!error) {
      updatedCount++
      await supabase.from('lop_item_history').insert({
        lop_item_id: u.id,
        changed_by: user.id,
        change_type: 'xlsx_import',
        changes: u.fields,
      }).throwOnError().then(() => {}, () => {}) // non-fatal
    }
  }

  // Apply creates
  for (const c of creates) {
    const { error } = await supabase.from('lop_items').insert({
      project_id: params.id,
      workspace_id: workspace.id,
      title: c.title,
      description: c.description ?? null,
      responsible: c.responsible ?? null,
      due_date: c.due_date ?? null,
      priority: c.priority ?? 'mittel',
      status: c.status ?? 'offen',
      result: c.result ?? null,
      requires_review: false,
      created_at: now,
      updated_at: now,
    })
    if (!error) createdCount++
  }

  return NextResponse.json({ updated: updatedCount, created: createdCount })
}
