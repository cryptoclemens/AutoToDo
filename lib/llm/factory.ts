import type { LlmConfig, ProcessTranscriptResult, ExistingLopItem, WorkspaceMemberContext } from './types'
import { processWithAnthropic } from './anthropic'
import { processWithOpenAI } from './openai'
import { processWithAzureOpenAI } from './azure'
import { processWithPerplexity } from './perplexity'
import { processWithDeepseek } from './deepseek'

export async function processTranscriptWithLlm(
  config: LlmConfig,
  transcriptText: string,
  existingItems: ExistingLopItem[],
  members: WorkspaceMemberContext[] = [],
  knownNames: string[] = [],
  submitterName?: string,
): Promise<ProcessTranscriptResult> {
  switch (config.provider) {
    case 'anthropic':
      return processWithAnthropic(config, transcriptText, existingItems, members, knownNames, submitterName)
    case 'openai':
      return processWithOpenAI(config, transcriptText, existingItems, members, knownNames, submitterName)
    case 'azure_openai':
      return processWithAzureOpenAI(config, transcriptText, existingItems, members, knownNames, submitterName)
    case 'perplexity':
      return processWithPerplexity(config, transcriptText, existingItems, members, knownNames, submitterName)
    case 'deepseek':
      return processWithDeepseek(config, transcriptText, existingItems, members, knownNames, submitterName)
    default:
      throw new Error(`Unsupported LLM provider: ${(config as LlmConfig).provider}`)
  }
}
