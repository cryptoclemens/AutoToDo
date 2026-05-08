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

const CATEGORY_LABELS: Record<string, string> = {
  general: '💬 Allgemein',
  bug: '🐛 Fehler',
  feature: '✨ Feature-Wunsch',
  other: '📝 Sonstiges',
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

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)

  // DB-Speicherung (resilient – schlägt fehl wenn Migration 007 noch nicht angewendet)
  let savedToDb = false
  let categorySeq = 0
  try {
    const { data: row, error } = await supabase.from('feedback').insert({
      workspace_id: workspace?.id ?? null,
      user_id: user.id,
      message: parsed.data.message,
      category: parsed.data.category,
    }).select('category_seq').single()
    if (!error) {
      savedToDb = true
      categorySeq = row?.category_seq ?? 0
    }
  } catch {
    // Tabelle existiert noch nicht – ignorieren, GitHub-Fallback greift
  }

  // GitHub-Speicherung (wenn GITHUB_FEEDBACK_TOKEN gesetzt)
  let savedToGitHub = false
  try {
    savedToGitHub = await appendFeedbackToGitHub({
      message: parsed.data.message,
      category: parsed.data.category,
      userEmail: user.email ?? 'unbekannt',
      workspaceName: workspace?.name ?? 'unbekannt',
      categorySeq,
    })
  } catch {
    // GitHub nicht erreichbar oder Token fehlt – ignorieren
  }

  if (!savedToDb && !savedToGitHub) {
    return NextResponse.json({
      error: 'Feedback konnte nicht gespeichert werden. Bitte versuche es später erneut.',
    }, { status: 500 })
  }

  const prefix = parsed.data.category === 'feature' ? 'F' : parsed.data.category === 'bug' ? 'B' : 'G'
  const feedbackId = categorySeq > 0 ? `${prefix}-${String(categorySeq).padStart(3, '0')}` : undefined

  return NextResponse.json({ ok: true, id: feedbackId })
}

async function appendFeedbackToGitHub(entry: {
  message: string
  category: string
  userEmail: string
  workspaceName: string
  categorySeq: number
}): Promise<boolean> {
  const token = process.env.GITHUB_FEEDBACK_TOKEN
  if (!token) return false

  const repo = 'cryptoclemens/AutoToDo'
  const path = 'feedback.md'
  const branch = process.env.GITHUB_FEEDBACK_BRANCH ?? 'main'
  const apiBase = `https://api.github.com/repos/${repo}/contents/${path}`
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }

  // Aktuelle Datei lesen (für SHA)
  let currentContent = ''
  let sha: string | undefined
  const getRes = await fetch(`${apiBase}?ref=${branch}`, { headers: authHeaders })
  if (getRes.ok) {
    const data = await getRes.json() as { sha: string; content: string }
    sha = data.sha
    currentContent = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8')
  } else {
    currentContent = '# AutoToDo – Feedback\n\n> Nutzerfeedback und Feature-Wünsche\n\n---\n\n'
  }

  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const label = CATEGORY_LABELS[entry.category] ?? entry.category
  const prefix = entry.category === 'feature' ? 'F' : entry.category === 'bug' ? 'B' : 'G'
  const idStr = entry.categorySeq > 0 ? `${prefix}-${String(entry.categorySeq).padStart(3, '0')} | ` : ''
  const newEntry = [
    `## ${idStr}${ts} | ${label}`,
    `**Workspace:** ${entry.workspaceName}`,
    `**Nutzer:** ${entry.userEmail}`,
    ``,
    entry.message,
    ``,
    `---`,
    ``,
  ].join('\n')

  const updatedContent = currentContent + newEntry
  const encodedContent = Buffer.from(updatedContent).toString('base64')

  const putBody: Record<string, unknown> = {
    message: `feedback: ${label} (${ts})`,
    content: encodedContent,
    branch,
  }
  if (sha) putBody.sha = sha

  const putRes = await fetch(apiBase, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify(putBody),
  })

  return putRes.ok || putRes.status === 201
}
