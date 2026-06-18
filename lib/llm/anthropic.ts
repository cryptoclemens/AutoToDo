import Anthropic from '@anthropic-ai/sdk'
import type { LlmConfig, ProcessTranscriptResult, ExistingLopItem, WorkspaceMemberContext } from './types'
import { buildSystemPrompt, buildUserPrompt } from './prompt'

export async function processWithAnthropic(
  config: LlmConfig,
  transcriptText: string,
  existingItems: ExistingLopItem[],
  members: WorkspaceMemberContext[] = [],
  knownNames: string[] = [],
  submitterName?: string,
): Promise<ProcessTranscriptResult> {
  const client = new Anthropic({ apiKey: config.apiKey })

  const makeRequest = async (): Promise<string> => {
    const message = await client.messages.create({
      model: config.model,
      max_tokens: 8192,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: buildUserPrompt(transcriptText, existingItems, members, knownNames, submitterName) }],
    })
    if (message.stop_reason === 'max_tokens') {
      throw new Error('LLM-Antwort wurde abgeschnitten (Transkript zu lang). Bitte kürzen und erneut versuchen.')
    }
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
    } else if (msg.includes('credit balance is too low') || msg.includes('billing') || msg.includes('insufficient_quota')) {
      throw new Error('Ihr Anthropic API-Guthaben ist aufgebraucht. Bitte aktualisieren Sie Ihren API-Key oder laden Sie Credits nach unter Einstellungen → KI.')
    } else if (msg.includes('401') || msg.includes('authentication') || msg.includes('invalid x-api-key') || msg.includes('invalid_api_key')) {
      throw new Error('Der hinterlegte Anthropic API-Key ist ungültig. Bitte unter Einstellungen → KI aktualisieren.')
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
      daily_plan_text: typeof parsed.daily_plan_text === 'string' ? parsed.daily_plan_text : null,
      ideas: Array.isArray(parsed.ideas) ? parsed.ideas : [],
      speaker_map: Array.isArray(parsed.speaker_map) ? parsed.speaker_map : [],
    }
  } catch {
    throw new Error(`LLM returned invalid JSON: ${cleaned.slice(0, 200)}`)
  }
}
