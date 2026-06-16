import type { LlmConfig } from './types'

interface LopItemForSummary {
  title: string
  responsible: string | null
  due_date: string | null
  status: string
  priority: string
}

function buildSummaryPrompt(projectName: string, items: LopItemForSummary[]): string {
  const itemList = items
    .map((i, idx) => {
      const parts = [`${idx + 1}. ${i.title}`]
      if (i.responsible) parts.push(`(Verantwortlich: ${i.responsible})`)
      if (i.due_date) parts.push(`(Fällig: ${new Date(i.due_date).toLocaleDateString('de-DE')})`)
      if (i.status === 'in_bearbeitung') parts.push('(In Bearbeitung)')
      if (i.priority === 'hoch') parts.push('[HOCH]')
      return parts.join(' ')
    })
    .join('\n')

  return `Du bist ein Assistent für Projektmanagement. Fasse die offenen LOP-Punkte des Projekts "${projectName}" in 3-5 prägnanten deutschen Sätzen zusammen. Hebe kritische Punkte (hohe Priorität, überfällig) hervor. Keine Aufzählung, fließender Text.\n\nOffene LOP-Punkte:\n${itemList}`
}

async function callAnthropicRaw(config: LlmConfig, prompt: string): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: config.apiKey })
  const msg = await client.messages.create({
    model: config.model,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return block.text
}

async function callOpenAICompatibleRaw(config: LlmConfig, prompt: string): Promise<string> {
  const OpenAI = (await import('openai')).default
  const opts: ConstructorParameters<typeof OpenAI>[0] = { apiKey: config.apiKey }
  if (config.provider === 'azure_openai' && config.endpoint) {
    opts.baseURL = config.endpoint
  } else if (config.provider === 'deepseek') {
    opts.baseURL = 'https://api.deepseek.com/v1'
  } else if (config.provider === 'perplexity') {
    opts.baseURL = 'https://api.perplexity.ai'
  }
  const client = new OpenAI(opts)
  const resp = await client.chat.completions.create({
    model: config.model,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })
  return resp.choices[0]?.message?.content ?? ''
}

export async function summarizeLopItems(
  config: LlmConfig,
  projectName: string,
  items: LopItemForSummary[],
): Promise<string> {
  const prompt = buildSummaryPrompt(projectName, items)
  if (config.provider === 'anthropic') {
    return callAnthropicRaw(config, prompt)
  }
  return callOpenAICompatibleRaw(config, prompt)
}
