import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { resolveWorkspace } from '@/lib/workspace'

const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

async function getAuth(request: NextRequest, projectId: string) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return null

  // Verify project belongs to workspace
  const { data: project } = await supabase
    .from('projects').select('id').eq('id', projectId).eq('workspace_id', workspace.id).maybeSingle()
  if (!project) return null

  const { data: member } = await supabase
    .from('workspace_members').select('role')
    .eq('workspace_id', workspace.id).eq('user_id', user.id).maybeSingle()

  if (!member || !['workspace_owner', 'workspace_admin', 'project_admin'].includes(member.role)) {
    return null
  }

  return { supabase, workspace, projectId }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuth(request, params.id)
  if (!auth) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  const { supabase, workspace, projectId } = auth

  const formData = await request.formData()
  const file = formData.get('logo') as File | null
  if (!file) return NextResponse.json({ error: 'Keine Datei übermittelt.' }, { status: 400 })

  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Datei zu groß (max. 2 MB).' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Ungültiges Format.' }, { status: 400 })

  await supabase.storage.createBucket('logos', {
    public: true,
    fileSizeLimit: MAX_SIZE,
    allowedMimeTypes: ALLOWED_TYPES,
  })

  const folder = `projects/${projectId}`
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const path = `${folder}/logo_${Date.now()}.${ext}`

  // Remove old logos
  const { data: existing } = await supabase.storage.from('logos').list(folder)
  if (existing && existing.length > 0) {
    await supabase.storage.from('logos').remove(existing.map(f => `${folder}/${f.name}`))
  }

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('logos').upload(path, arrayBuffer, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: `Upload fehlgeschlagen: ${uploadError.message}` }, { status: 500 })

  const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)
  const logoUrl = urlData.publicUrl

  await supabase.from('projects').update({ logo_url: logoUrl, branding_inherited: false }).eq('id', projectId).eq('workspace_id', workspace.id)

  return NextResponse.json({ logo_url: logoUrl })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuth(request, params.id)
  if (!auth) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  const { supabase, workspace, projectId } = auth

  const folder = `projects/${projectId}`
  const { data: existing } = await supabase.storage.from('logos').list(folder)
  if (existing && existing.length > 0) {
    await supabase.storage.from('logos').remove(existing.map(f => `${folder}/${f.name}`))
  }

  await supabase.from('projects').update({ logo_url: null }).eq('id', projectId).eq('workspace_id', workspace.id)

  return NextResponse.json({ ok: true })
}
