import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

export async function POST(request: NextRequest) {
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

  // Nur Admins
  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).single()

  if (!member || !['workspace_owner', 'workspace_admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('logo') as File | null
  if (!file) return NextResponse.json({ error: 'Keine Datei übermittelt.' }, { status: 400 })

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Datei zu groß (max. 2 MB).' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Ungültiges Dateiformat. Erlaubt: PNG, JPG, WebP, SVG.' }, { status: 400 })
  }

  // Bucket anlegen falls er nicht existiert (idempotent)
  await supabase.storage.createBucket('logos', {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  })
  // Fehler ignorieren – tritt auf wenn Bucket bereits existiert

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  // Unique filename per upload → busts browser/CDN/next-image cache
  const path = `${workspace.id}/logo_${Date.now()}.${ext}`

  // Delete all previous logos for this workspace first
  const { data: existing } = await supabase.storage.from('logos').list(workspace.id)
  if (existing && existing.length > 0) {
    const oldPaths = existing.map(f => `${workspace.id}/${f.name}`)
    await supabase.storage.from('logos').remove(oldPaths)
  }

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Logo upload error:', uploadError)
    return NextResponse.json({ error: `Upload fehlgeschlagen: ${uploadError.message}` }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)
  const logoUrl = urlData.publicUrl

  // Workspace aktualisieren
  await supabase.from('workspaces').update({ logo_url: logoUrl }).eq('id', workspace.id)

  return NextResponse.json({ logo_url: logoUrl })
}

export async function DELETE(_request: NextRequest) {
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

  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).single()

  if (!member || !['workspace_owner', 'workspace_admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  // Alle Logo-Dateien dieses Workspace entfernen
  const { data: existing } = await supabase.storage.from('logos').list(workspace.id)
  if (existing && existing.length > 0) {
    const paths = existing.map(f => `${workspace.id}/${f.name}`)
    await supabase.storage.from('logos').remove(paths)
  }

  await supabase.from('workspaces').update({ logo_url: null }).eq('id', workspace.id)

  return NextResponse.json({ ok: true })
}
