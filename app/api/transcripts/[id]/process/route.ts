import { NextRequest, NextResponse } from 'next/server'
import { runTranscriptProcessing } from '@/lib/processTranscript'

// Allow up to 60s for LLM processing on Vercel
export const maxDuration = 60

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Internal-only endpoint (called for retries)
  const secret = req.headers.get('x-internal-secret') ?? ''
  if (secret !== (process.env.INTERNAL_API_SECRET ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runTranscriptProcessing(params.id)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, itemsCreated: result.itemsCreated, itemsUpdated: result.itemsUpdated })
}
