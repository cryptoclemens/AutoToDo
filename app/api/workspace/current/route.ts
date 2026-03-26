import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// Gibt die workspace_id des aktuellen Nutzers zurück (basierend auf Subdomain-Header)
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const headersList = headers()
  const slug = headersList.get('x-workspace-slug') ?? ''

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  return NextResponse.json({ workspaceId: (workspace as { id: string }).id })
}
