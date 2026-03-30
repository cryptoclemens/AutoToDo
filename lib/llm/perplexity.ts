import OpenAI from 'openai'
import type { LlmConfig, ProcessTranscriptResult } from './types'
import { buildSystemPrompt, buildUserPrompt } from './prompt'

export async function processWithPerplexity(
  config: LlmConfig,
  transcriptText: string,
  existingItems: Array<{ id: string; title: string; status: string }>
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
        { role: 'user', content: buildUserPrompt(transcriptText, existingItems) },
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
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    }
  } catch {
    throw new Error(`Perplexity returned invalid JSON: ${jsonStr.slice(0, 200)}`)
  }
}
