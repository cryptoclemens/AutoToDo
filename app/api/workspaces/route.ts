import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  userId: z.string().uuid(),
})

// Service-Role-Client (umgeht RLS)
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const { name, slug, userId } = parsed.data
  const supabase = createServiceClient()

  // Slug-Verfügbarkeit prüfen
  const { data: existing } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Diese Subdomain ist bereits vergeben.' }, { status: 409 })
  }

  // Workspace anlegen
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({ name, slug })
    .select('id')
    .single()

  if (wsError || !workspace) {
    return NextResponse.json({ error: 'Workspace konnte nicht erstellt werden.' }, { status: 500 })
  }

  // Nutzer als workspace_owner hinzufügen
  const { error: memberError } = await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: 'workspace_owner',
  })

  if (memberError) {
    // Workspace wieder löschen (Rollback)
    await supabase.from('workspaces').delete().eq('id', workspace.id)
    return NextResponse.json({ error: 'Mitgliedschaft konnte nicht erstellt werden.' }, { status: 500 })
  }

  return NextResponse.json({ workspaceId: workspace.id, slug }, { status: 201 })
}
