import type { SupabaseClient } from '@supabase/supabase-js'

export const VOICEPRINT_THRESHOLD = 0.65

export function toVectorLiteral(v: number[]): string {
  return `[${v.join(',')}]`
}

export function l2normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0))
  if (norm === 0) return v.map(() => 0)
  return v.map(x => x / norm)
}

/** Gleitender Mittelwert (old*count + neu)/(count+1), danach L2-normalisiert. */
export function runningAverage(oldVec: number[], oldCount: number, newVec: number[]): number[] {
  const n = Math.max(oldCount, 1)
  const avg = oldVec.map((x, i) => (x * n + (newVec[i] ?? 0)) / (n + 1))
  return l2normalize(avg)
}

/** Bestes Voiceprint-Match im Workspace via SECURITY-DEFINER-Funktion. null bei Fehler/keins. */
export async function matchVoiceprint(
  supabase: SupabaseClient,
  workspaceId: string,
  embedding: number[],
): Promise<{ user_id: string; similarity: number } | null> {
  try {
    const { data, error } = await supabase.rpc('match_voiceprint', {
      p_workspace: workspaceId,
      p_embedding: toVectorLiteral(embedding),
    })
    if (error || !data || (data as unknown[]).length === 0) return null
    const row = (data as Array<{ user_id: string; similarity: number }>)[0]
    return { user_id: row.user_id, similarity: row.similarity }
  } catch {
    return null
  }
}
