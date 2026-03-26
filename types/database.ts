export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          brand_color: string
          plan: 'free' | 'pro' | 'enterprise'
          stripe_customer_id: string | null
          created_at: string
          suspended_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          brand_color?: string
          plan?: 'free' | 'pro' | 'enterprise'
          stripe_customer_id?: string | null
          created_at?: string
          suspended_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['workspaces']['Insert']>
      }
      workspace_members: {
        Row: {
          workspace_id: string
          user_id: string
          role: 'workspace_owner' | 'workspace_admin' | 'project_admin' | 'editor' | 'viewer'
          invited_by: string | null
          joined_at: string
        }
        Insert: {
          workspace_id: string
          user_id: string
          role?: 'workspace_owner' | 'workspace_admin' | 'project_admin' | 'editor' | 'viewer'
          invited_by?: string | null
          joined_at?: string
        }
        Update: Partial<Database['public']['Tables']['workspace_members']['Insert']>
      }
      workspace_llm_config: {
        Row: {
          workspace_id: string
          provider: 'anthropic' | 'openai' | 'google' | 'mistral'
          model: string
          encrypted_api_key: string
          key_preview: string
          last_tested_at: string | null
          last_test_ok: boolean | null
          updated_at: string
        }
        Insert: {
          workspace_id: string
          provider: 'anthropic' | 'openai' | 'google' | 'mistral'
          model: string
          encrypted_api_key: string
          key_preview: string
          last_tested_at?: string | null
          last_test_ok?: boolean | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['workspace_llm_config']['Insert']>
      }
      api_keys: {
        Row: {
          id: string
          workspace_id: string
          name: string
          key_hash: string
          key_prefix: string
          scope: string[]
          expires_at: string | null
          last_used_at: string | null
          created_by: string | null
          created_at: string
          revoked_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          key_hash: string
          key_prefix: string
          scope?: string[]
          expires_at?: string | null
          last_used_at?: string | null
          created_by?: string | null
          created_at?: string
          revoked_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['api_keys']['Insert']>
      }
      webhook_endpoints: {
        Row: {
          id: string
          workspace_id: string
          url: string
          secret: string
          events: string[]
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          url: string
          secret: string
          events: string[]
          active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['webhook_endpoints']['Insert']>
      }
      projects: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          created_by: string | null
          created_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          created_by?: string | null
          created_at?: string
          archived_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      transcripts: {
        Row: {
          id: string
          workspace_id: string
          project_id: string
          uploaded_by: string | null
          file_path: string
          original_filename: string | null
          meeting_date: string | null
          processing_status: 'pending' | 'processing' | 'done' | 'error'
          processing_error: string | null
          items_created: number
          items_updated: number
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          project_id: string
          uploaded_by?: string | null
          file_path: string
          original_filename?: string | null
          meeting_date?: string | null
          processing_status?: 'pending' | 'processing' | 'done' | 'error'
          processing_error?: string | null
          items_created?: number
          items_updated?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['transcripts']['Insert']>
      }
      lop_items: {
        Row: {
          id: string
          workspace_id: string
          project_id: string
          transcript_id: string | null
          title: string
          description: string | null
          responsible: string | null
          due_date: string | null
          priority: 'hoch' | 'mittel' | 'niedrig'
          status: 'offen' | 'in_bearbeitung' | 'abgeschlossen'
          result: string | null
          source_quote: string | null
          ai_confidence: number | null
          requires_review: boolean
          sort_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          project_id: string
          transcript_id?: string | null
          title: string
          description?: string | null
          responsible?: string | null
          due_date?: string | null
          priority?: 'hoch' | 'mittel' | 'niedrig'
          status?: 'offen' | 'in_bearbeitung' | 'abgeschlossen'
          result?: string | null
          source_quote?: string | null
          ai_confidence?: number | null
          requires_review?: boolean
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['lop_items']['Insert']>
      }
      lop_item_history: {
        Row: {
          id: string
          workspace_id: string
          item_id: string
          changed_by: string | null
          change_type: string | null
          previous_values: Json | null
          new_values: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          item_id: string
          changed_by?: string | null
          change_type?: string | null
          previous_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['lop_item_history']['Insert']>
      }
      invitations: {
        Row: {
          id: string
          workspace_id: string
          email: string
          role: string
          token: string
          invited_by: string | null
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          email: string
          role?: string
          token: string
          invited_by?: string | null
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['invitations']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience-Typen
export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Transcript = Database['public']['Tables']['transcripts']['Row']
export type LopItem = Database['public']['Tables']['lop_items']['Row']
export type LopItemHistory = Database['public']['Tables']['lop_item_history']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type ApiKey = Database['public']['Tables']['api_keys']['Row']
export type WebhookEndpoint = Database['public']['Tables']['webhook_endpoints']['Row']
export type WorkspaceLlmConfig = Database['public']['Tables']['workspace_llm_config']['Row']
