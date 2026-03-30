// LLM abstraction layer – types and interfaces

export type LlmProvider = 'anthropic' | 'openai' | 'azure_openai' | 'perplexity'

export interface LlmConfig {
  provider: LlmProvider
  apiKey: string
  model: string
  endpoint?: string
}

export interface LopAction {
  action: 'create' | 'update' | 'close'
  // For create
  title?: string
  description?: string
  responsible?: string
  due_date?: string | null
  priority?: 'hoch' | 'mittel' | 'niedrig'
  // For update / close
  lop_item_id?: string
  status?: 'offen' | 'in_bearbeitung' | 'abgeschlossen'
  result?: string
  confidence: number
}

export interface ProcessTranscriptResult {
  actions: LopAction[]
  summary: string
}
