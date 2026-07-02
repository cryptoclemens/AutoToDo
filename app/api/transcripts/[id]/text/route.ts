import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveProjectAccess } from '@/lib/projectAccess'
import { decrypt } from '@/lib/encryption'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: transcript } = await supabase
    .from('transcripts')
    .select('id, project_id, storage_path, encrypted_content, original_filename')
    .eq('id', params.id)
    .maybeSingle() as {
      data: {
        id: string; project_id: string
        storage_path: string | null; encrypted_content: string | null
        original_filename: string | null
      } | null
    }

  if (!transcript) return NextResponse.json({ error: 'Transkript nicht gefunden.' }, { status: 404 })

  // Zugriff über den Workspace des Projekts prüfen (nicht Heimat-Workspace)
  const access = await resolveProjectAccess(supabase, user.id, transcript.project_id)
  if (!access) return NextResponse.json({ error: 'Transkript nicht gefunden.' }, { status: 404 })

  let encryptedContent = transcript.encrypted_content
  if (!encryptedContent && transcript.storage_path) {
    const { data: fileData } = await supabase.storage
      .from('transcripts')
      .download(transcript.storage_path)
    if (fileData) {
      encryptedContent = await fileData.text()
    }
  }

  if (!encryptedContent) return NextResponse.json({ error: 'Kein Transkript-Text gefunden.' }, { status: 404 })

  const text = decrypt(encryptedContent)
  return NextResponse.json({ text, filename: transcript.original_filename })
}
