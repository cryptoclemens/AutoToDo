import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'
import { z } from 'zod'

const schema = z.object({
  message: z.string().min(1).max(2000),
  category: z.enum(['general', 'bug', 'feature', 'other']).default('general'),
})

export async function POST(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)

  const { error } = await supabase.from('feedback').insert({
    workspace_id: workspace?.id ?? null,
    user_id: user.id,
    message: parsed.data.message,
    category: parsed.data.category,
  })

  if (error) {
    return NextResponse.json({ error: 'Feedback konnte nicht gespeichert werden.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
