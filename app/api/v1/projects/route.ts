import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { validateApiKey } from '@/lib/apiKeyAuth'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
})

export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request.headers.get('authorization'))
  if (!auth) {
    return NextResponse.json({ error: 'Ungültiger oder fehlender API-Key.' }, { status: 401 })
  }
  if (!auth.scope.includes('read')) {
    return NextResponse.json({ error: 'Lesezugriff erforderlich.' }, { status: 403 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, description, created_at, archived_at')
    .eq('workspace_id', auth.workspaceId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Datenbankfehler.' }, { status: 500 })

  return NextResponse.json({ data, count: data?.length ?? 0 })
}

export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request.headers.get('authorization'))
  if (!auth) {
    return NextResponse.json({ error: 'Ungültiger oder fehlender API-Key.' }, { status: 401 })
  }

  if (!auth.scope.includes('write')) {
    return NextResponse.json({ error: 'Schreibzugriff erforderlich.' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('projects')
    .insert({
      workspace_id: auth.workspaceId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    .select('id, name, description, created_at')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Erstellung fehlgeschlagen.' }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
