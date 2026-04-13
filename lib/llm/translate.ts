import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import type { LlmConfig } from './types'

export interface TranslateItem {
  id: string
  title: string
  description: string | null
}

async function callLlm(config: LlmConfig, prompt: string): Promise<string> {
  if (config.provider === 'anthropic') {
    const client = new Anthropic({ apiKey: config.apiKey })
    const msg = await client.messages.create({
      model: config.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type')
    return block.text
  }

  if (config.provider === 'openai' || config.provider === 'azure_openai' || config.provider === 'perplexity') {
    const baseURL =
      config.provider === 'azure_openai' ? config.endpoint :
      config.provider === 'perplexity' ? 'https://api.perplexity.ai' :
      undefined
    const client = new OpenAI({ apiKey: config.apiKey, baseURL })
    const res = await client.chat.completions.create({
      model: config.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    return res.choices[0].message.content ?? ''
  }

  throw new Error(`Unsupported provider: ${config.provider}`)
}

export async function translateItems(
  config: LlmConfig,
  items: TranslateItem[],
  targetLocale: string,
): Promise<TranslateItem[]> {
  const targetLang = targetLocale === 'en' ? 'English' : 'German'

  const prompt = `Translate these project action items to ${targetLang}. Keep names, dates, proper nouns, and technical abbreviations unchanged. Return ONLY a valid JSON array with the same ids, no explanation.

${JSON.stringify(items.map(i => ({ id: i.id, title: i.title, description: i.description })))}`

  const raw = await callLlm(config, prompt)
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON array in translation response')
  return JSON.parse(match[0]) as TranslateItem[]
}
