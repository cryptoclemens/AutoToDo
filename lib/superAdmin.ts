import { createClient as createServiceClient } from '@supabase/supabase-js'

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = db()
  const { data } = await supabase
    .from('super_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data !== null
}

/** Generates a random friends code like FRIEND-A3X7K */
export function generateFriendsCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `FRIEND-${code}`
}
