import OpenAI from 'openai'
import type { LlmConfig, ProcessTranscriptResult, ExistingLopItem, WorkspaceMemberContext } from './types'
import { buildSystemPrompt, buildUserPrompt } from './prompt'

export async function processWithPerplexity(
  config: LlmConfig,
  transcriptText: string,
  existingItems: ExistingLopItem[],
  members: WorkspaceMemberContext[] = [],
  knownNames: string[] = [],
  submitterName?: string,
): Promise<ProcessTranscriptResult> {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: 'https://api.perplexity.ai',
  })

  const makeRequest = async (): Promise<string> => {
    const completion = await client.chat.completions.create({
      model: config.model,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(transcriptText, existingItems, members, knownNames, submitterName) },
      ],
    })
    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Empty response from Perplexity')
    return content
  }

  let raw: string
  try {
    raw = await makeRequest()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('rate_limit') || msg.includes('429')) {
      await new Promise(r => setTimeout(r, 2000))
      raw = await makeRequest()
    } else {
      throw err
    }
  }

  // Perplexity may wrap JSON in markdown code fences — strip them
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()

  try {
    const parsed = JSON.parse(jsonStr)
    return {
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      context_notes: Array.isArray(parsed.context_notes) ? parsed.context_notes : [],
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      daily_plan_text: typeof parsed.daily_plan_text === 'string' ? parsed.daily_plan_text : null,
    }
  } catch {
    throw new Error(`Perplexity returned invalid JSON: ${jsonStr.slice(0, 200)}`)
  }
}
