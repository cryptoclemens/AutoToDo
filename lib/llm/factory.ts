import type { LlmConfig, ProcessTranscriptResult, ExistingLopItem, WorkspaceMemberContext } from './types'
import { processWithAnthropic } from './anthropic'
import { processWithOpenAI } from './openai'
import { processWithAzureOpenAI } from './azure'
import { processWithPerplexity } from './perplexity'

export async function processTranscriptWithLlm(
  config: LlmConfig,
  transcriptText: string,
  existingItems: ExistingLopItem[],
  members: WorkspaceMemberContext[] = [],
): Promise<ProcessTranscriptResult> {
  switch (config.provider) {
    case 'anthropic':
      return processWithAnthropic(config, transcriptText, existingItems, members)
    case 'openai':
      return processWithOpenAI(config, transcriptText, existingItems, members)
    case 'azure_openai':
      return processWithAzureOpenAI(config, transcriptText, existingItems, members)
    case 'perplexity':
      return processWithPerplexity(config, transcriptText, existingItems, members)
    default:
      throw new Error(`Unsupported LLM provider: ${(config as LlmConfig).provider}`)
  }
}
