import type { SpeakerMapEntry } from '@/lib/llm/types'

export interface DiarSeg {
  start: number
  end: number
  speaker_cluster: string
  text: string
}

/**
 * Leitet aus den Diarisierungs-Segmenten initiale speaker_map-Stubs ab:
 * je eindeutigem Cluster ein unbestätigter Eintrag (in Auftrittsreihenfolge).
 */
export function deriveSpeakerStubs(diar: DiarSeg[]): SpeakerMapEntry[] {
  const seen = new Set<string>()
  const out: SpeakerMapEntry[] = []
  for (const s of diar) {
    if (!s.speaker_cluster || seen.has(s.speaker_cluster)) continue
    seen.add(s.speaker_cluster)
    out.push({
      speaker_label: s.speaker_cluster,
      matched_member: null,
      matched_user_id: null,
      confidence: 'low',
      source: 'diarization',
    })
  }
  return out
}
