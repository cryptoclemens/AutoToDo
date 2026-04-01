import { createClient as createServiceClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/encryption'

const supabaseAdmin = () => createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Returns the decrypted Notion integration token for a workspace, or null if not configured. */
export async function getNotionToken(workspaceId: string): Promise<string | null> {
  const supabase = supabaseAdmin()
  const { data } = await supabase
    .from('workspace_notion_configs')
    .select('encrypted_token')
    .eq('workspace_id', workspaceId)
    .maybeSingle() as { data: { encrypted_token: string } | null }

  if (!data) return null
  return decrypt(data.encrypted_token)
}
