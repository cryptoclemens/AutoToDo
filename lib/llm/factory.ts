import type { LlmConfig, ProcessTranscriptResult } from './types'
import { processWithAnthropic } from './anthropic'
import { processWithOpenAI } from './openai'
import { processWithAzureOpenAI } from './azure'

export async function processTranscriptWithLlm(
  config: LlmConfig,
  transcriptText: string,
  existingItems: Array<{ id: string; title: string; status: string }>
): Promise<ProcessTranscriptResult> {
  switch (config.provider) {
    case 'anthropic':
      return processWithAnthropic(config, transcriptText, existingItems)
    case 'openai':
      return processWithOpenAI(config, transcriptText, existingItems)
    case 'azure_openai':
      return processWithAzureOpenAI(config, transcriptText, existingItems)
    default:
      throw new Error(`Unsupported LLM provider: ${(config as LlmConfig).provider}`)
  }
}
