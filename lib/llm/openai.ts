import OpenAI from 'openai'
import type { LlmConfig, ProcessTranscriptResult, ExistingLopItem, WorkspaceMemberContext } from './types'
import { buildSystemPrompt, buildUserPrompt } from './prompt'

export async function processWithOpenAI(
  config: LlmConfig,
  transcriptText: string,
  existingItems: ExistingLopItem[],
  members: WorkspaceMemberContext[] = [],
): Promise<ProcessTranscriptResult> {
  const client = new OpenAI({ apiKey: config.apiKey })

  const makeRequest = async (): Promise<string> => {
    const completion = await client.chat.completions.create({
      model: config.model,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(transcriptText, existingItems, members) },
      ],
    })
    if (completion.choices[0]?.finish_reason === 'length') {
      throw new Error('LLM-Antwort wurde abgeschnitten (Transkript zu lang). Bitte kürzen und erneut versuchen.')
    }
    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Empty response from OpenAI')
    return content
  }

  let raw: string
  try {
    raw = await makeRequest()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('rate_limit') || msg.includes('529')) {
      await new Promise(r => setTimeout(r, 2000))
      raw = await makeRequest()
    } else {
      throw err
    }
  }

  try {
    const parsed = JSON.parse(raw)
    return {
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      context_notes: Array.isArray(parsed.context_notes) ? parsed.context_notes : [],
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    }
  } catch {
    throw new Error(`LLM returned invalid JSON: ${raw.slice(0, 200)}`)
  }
}
