import Anthropic from '@anthropic-ai/sdk'
import type { LlmConfig, ProcessTranscriptResult, ExistingLopItem, WorkspaceMemberContext } from './types'
import { buildSystemPrompt, buildUserPrompt } from './prompt'

export async function processWithAnthropic(
  config: LlmConfig,
  transcriptText: string,
  existingItems: ExistingLopItem[],
  members: WorkspaceMemberContext[] = [],
): Promise<ProcessTranscriptResult> {
  const client = new Anthropic({ apiKey: config.apiKey })

  const makeRequest = async (): Promise<string> => {
    const message = await client.messages.create({
      model: config.model,
      max_tokens: 4096,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: buildUserPrompt(transcriptText, existingItems, members) }],
    })
    const block = message.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type')
    return block.text
  }

  let raw: string
  try {
    raw = await makeRequest()
  } catch (err: unknown) {
    // Single retry on parse/network errors
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('529') || msg.includes('overloaded')) {
      await new Promise(r => setTimeout(r, 2000))
      raw = await makeRequest()
    } else {
      throw err
    }
  }

  return parseResponse(raw)
}

function parseResponse(raw: string): ProcessTranscriptResult {
  // Strip potential markdown code blocks
  const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return {
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      context_notes: Array.isArray(parsed.context_notes) ? parsed.context_notes : [],
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    }
  } catch {
    throw new Error(`LLM returned invalid JSON: ${cleaned.slice(0, 200)}`)
  }
}
