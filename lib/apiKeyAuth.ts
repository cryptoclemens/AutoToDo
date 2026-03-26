import { createHash, randomBytes } from 'crypto'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/** Generates a new API key: prefix + secret */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const secret = randomBytes(32).toString('hex')
  const key = `ak_live_${secret}`
  const prefix = key.slice(0, 14) // "ak_live_" + 6 chars
  const hash = hashApiKey(key)
  return { key, prefix, hash }
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/** Validates an API key from the Authorization header.
 *  Returns the workspace_id if valid, null otherwise.
 */
export async function validateApiKey(authHeader: string | null): Promise<{
  workspaceId: string
  scope: string[]
} | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  const key = authHeader.slice(7).trim()
  if (!key.startsWith('ak_live_')) return null

  const hash = hashApiKey(key)

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('api_keys')
    .select('id, workspace_id, scope, expires_at, revoked_at')
    .eq('key_hash', hash)
    .single() as {
      data: {
        id: string
        workspace_id: string
        scope: string[]
        expires_at: string | null
        revoked_at: string | null
      } | null
    }

  if (!data) return null
  if (data.revoked_at) return null
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  return { workspaceId: data.workspace_id, scope: data.scope ?? ['read'] }
}
