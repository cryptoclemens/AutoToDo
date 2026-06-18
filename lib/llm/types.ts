// LLM abstraction layer – types and interfaces

export type LlmProvider = 'anthropic' | 'openai' | 'azure_openai' | 'perplexity' | 'deepseek'

export interface ExistingLopItem {
  id: string
  title: string
  description: string | null
  status: string
}

export interface WorkspaceMemberContext {
  display_name: string
  email: string
}

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

export interface ContextNote {
  text: string
  category: 'availability' | 'decision' | 'risk' | 'info'
  relevant_from?: string | null
  relevant_until?: string | null
}

export interface SpeakerMapEntry {
  speaker_label: string          // e.g. "Sprecher 1", "Speaker A", "Max"
  matched_member: string | null  // matched display_name from workspace members, or null
  confidence: 'high' | 'medium' | 'low'
}

export interface ProcessTranscriptResult {
  actions: LopAction[]
  context_notes: ContextNote[]
  summary: string
  daily_plan_text?: string | null
  ideas?: { title: string; note?: string | null }[]
  speaker_map?: SpeakerMapEntry[]
}
