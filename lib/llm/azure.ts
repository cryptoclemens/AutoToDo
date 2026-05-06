import { AzureOpenAI } from 'openai'
import type { LlmConfig, ProcessTranscriptResult, ExistingLopItem, WorkspaceMemberContext } from './types'
import { buildSystemPrompt, buildUserPrompt } from './prompt'

export async function processWithAzureOpenAI(
  config: LlmConfig,
  transcriptText: string,
  existingItems: ExistingLopItem[],
  members: WorkspaceMemberContext[] = [],
  knownNames: string[] = [],
): Promise<ProcessTranscriptResult> {
  if (!config.endpoint) throw new Error('Azure Endpoint-URL ist erforderlich.')

  const client = new AzureOpenAI({
    apiKey: config.apiKey,
    endpoint: config.endpoint.replace(/\/$/, ''),
    apiVersion: '2024-12-01-preview',
    deployment: config.model,
  })

  const makeRequest = async (): Promise<string> => {
    const completion = await client.chat.completions.create({
      model: config.model,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(transcriptText, existingItems, members, knownNames) },
      ],
    })
    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Leere Antwort von Azure OpenAI')
    return content
  }

  let raw: string
  try {
    raw = await makeRequest()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('rate_limit') || msg.includes('429') || msg.includes('529')) {
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
