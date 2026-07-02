import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { resolveProjectAccess } from '@/lib/projectAccess'
import { getNotionToken } from '@/lib/notion'

export const maxDuration = 60

// ─── Notion helpers ──────────────────────────────────────────────────────────

/** Extract page ID from a Notion URL or raw UUID/hex string */
function extractPageId(input: string): string | null {
  const clean = input.trim()
  // Already a UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) return clean
  // 32-char hex
  if (/^[0-9a-f]{32}$/i.test(clean)) {
    return `${clean.slice(0,8)}-${clean.slice(8,12)}-${clean.slice(12,16)}-${clean.slice(16,20)}-${clean.slice(20)}`
  }
  // URL: extract last path segment, strip dashes then re-format
  try {
    const url = new URL(clean.startsWith('http') ? clean : `https://notion.so/${clean}`)
    const segments = url.pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1] ?? ''
    // Segment may be "Page-Name-{32hex}" or "Page-Name-{uuid}"
    const uuidMatch = last.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i)
    if (uuidMatch) return uuidMatch[1]
    const hexMatch = last.match(/([0-9a-f]{32})$/i)
    if (hexMatch) {
      const h = hexMatch[1]
      return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`
    }
  } catch { /* not a URL */ }
  return null
}

interface RichTextItem { plain_text: string }
interface Block {
  type: string
  has_children: boolean
  paragraph?: { rich_text: RichTextItem[] }
  heading_1?: { rich_text: RichTextItem[] }
  heading_2?: { rich_text: RichTextItem[] }
  heading_3?: { rich_text: RichTextItem[] }
  bulleted_list_item?: { rich_text: RichTextItem[] }
  numbered_list_item?: { rich_text: RichTextItem[] }
  to_do?: { rich_text: RichTextItem[]; checked: boolean }
  toggle?: { rich_text: RichTextItem[] }
  quote?: { rich_text: RichTextItem[] }
  callout?: { rich_text: RichTextItem[] }
  id: string
}

function extractRichText(items: RichTextItem[]): string {
  return items.map(r => r.plain_text).join('')
}

function blockToText(block: Block): string {
  switch (block.type) {
    case 'paragraph': return extractRichText(block.paragraph?.rich_text ?? [])
    case 'heading_1': return `# ${extractRichText(block.heading_1?.rich_text ?? [])}`
    case 'heading_2': return `## ${extractRichText(block.heading_2?.rich_text ?? [])}`
    case 'heading_3': return `### ${extractRichText(block.heading_3?.rich_text ?? [])}`
    case 'bulleted_list_item': return `- ${extractRichText(block.bulleted_list_item?.rich_text ?? [])}`
    case 'numbered_list_item': return `${extractRichText(block.numbered_list_item?.rich_text ?? [])}`
    case 'to_do': return `[${block.to_do?.checked ? 'x' : ' '}] ${extractRichText(block.to_do?.rich_text ?? [])}`
    case 'toggle': return extractRichText(block.toggle?.rich_text ?? [])
    case 'quote': return `> ${extractRichText(block.quote?.rich_text ?? [])}`
    case 'callout': return extractRichText(block.callout?.rich_text ?? [])
    default: return ''
  }
}

async function fetchBlocks(pageId: string, token: string, depth = 0): Promise<string> {
  if (depth > 3) return '' // Safety limit on nesting
  const lines: string[] = []
  let cursor: string | undefined

  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${pageId}/children`)
    url.searchParams.set('page_size', '100')
    if (cursor) url.searchParams.set('start_cursor', cursor)

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
    })
    if (!res.ok) break

    const data = await res.json() as { results: Block[]; next_cursor: string | null; has_more: boolean }
    for (const block of data.results) {
      const text = blockToText(block)
      if (text.trim()) lines.push(text)
      if (block.has_children) {
        const childText = await fetchBlocks(block.id, token, depth + 1)
        if (childText.trim()) lines.push(childText)
      }
    }
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined
  } while (cursor)

  return lines.join('\n')
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { pageUrl, projectId, meetingDate } = await req.json() as {
    pageUrl?: string
    projectId?: string
    meetingDate?: string
  }
  if (!pageUrl?.trim()) return NextResponse.json({ error: 'Keine Notion-URL angegeben.' }, { status: 400 })
  if (!projectId) return NextResponse.json({ error: 'Kein Projekt angegeben.' }, { status: 400 })

  // Zugriff über den Workspace DES PROJEKTS (nicht Heimat-Workspace); Viewer dürfen nicht importieren
  const access = await resolveProjectAccess(supabase, user.id, projectId)
  if (!access) return NextResponse.json({ error: 'Projekt nicht gefunden.' }, { status: 404 })
  if (!access.canEdit) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  const workspace = { id: access.workspaceId }

  // Get Notion token
  const notionToken = await getNotionToken(workspace.id)
  if (!notionToken) {
    return NextResponse.json({
      error: 'Notion ist nicht verbunden. Bitte verbinde zuerst dein Notion-Konto unter Einstellungen → Integrationen.',
    }, { status: 400 })
  }

  // Extract page ID
  const pageId = extractPageId(pageUrl)
  if (!pageId) return NextResponse.json({ error: 'Ungültige Notion-URL oder Seiten-ID.' }, { status: 400 })

  // Fetch page title
  let pageTitle = 'Notion-Import'
  try {
    const pageRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: { Authorization: `Bearer ${notionToken}`, 'Notion-Version': '2022-06-28' },
    })
    if (pageRes.ok) {
      const pageData = await pageRes.json() as {
        properties?: { title?: { title?: RichTextItem[] }; Name?: { title?: RichTextItem[] } }
      }
      const titleProp = pageData.properties?.title ?? pageData.properties?.Name
      const titleText = titleProp?.title?.map((r: RichTextItem) => r.plain_text).join('') ?? ''
      if (titleText.trim()) pageTitle = titleText.trim()
    }
  } catch { /* use default title */ }

  // Fetch all block content
  let text: string
  try {
    text = await fetchBlocks(pageId, notionToken)
  } catch {
    return NextResponse.json({ error: 'Fehler beim Abrufen der Notion-Seite.' }, { status: 502 })
  }

  if (!text.trim()) {
    return NextResponse.json({ error: 'Die Notion-Seite enthält keinen lesbaren Text. Stelle sicher, dass die Seite mit der Integration geteilt wurde.' }, { status: 400 })
  }

  // Forward to the main transcript API as form data
  const fd = new FormData()
  fd.append('projectId', projectId)
  fd.append('text', `${pageTitle}\n\n${text}`)
  if (meetingDate) fd.append('meetingDate', meetingDate)

  const origin = req.nextUrl.origin
  const internalRes = await fetch(`${origin}/api/transcripts`, {
    method: 'POST',
    body: fd,
    headers: { cookie: req.headers.get('cookie') ?? '' },
  })

  const result = await internalRes.json()
  return NextResponse.json(result, { status: internalRes.status })
}
