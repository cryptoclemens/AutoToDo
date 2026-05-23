import { NextRequest, NextResponse } from 'next/server'
import { runTranscriptProcessing } from '@/lib/processTranscript'

// Allow up to 60s for LLM processing
export const maxDuration = 60

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Internal-only endpoint (called for retries)
  // Fail-closed: wenn INTERNAL_API_SECRET nicht gesetzt, Endpoint blockiert
  const internalSecret = process.env.INTERNAL_API_SECRET
  const provided = req.headers.get('x-internal-secret')
  if (!internalSecret || provided !== internalSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runTranscriptProcessing(params.id)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, itemsCreated: result.itemsCreated, itemsUpdated: result.itemsUpdated })
}
