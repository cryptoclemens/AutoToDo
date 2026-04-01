/**
 * Simple word-token Jaccard similarity for detecting duplicate LOP items.
 * Returns a value between 0 (no overlap) and 1 (identical tokens).
 */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-zäöüß0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
  )
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a)
  const setB = tokenize(b)
  if (setA.size === 0 && setB.size === 0) return 1
  if (setA.size === 0 || setB.size === 0) return 0
  let intersection = 0
  setA.forEach(token => {
    if (setB.has(token)) intersection++
  })
  return intersection / (setA.size + setB.size - intersection)
}

export interface SimilarPair {
  a: { id: string; title: string; description?: string | null }
  b: { id: string; title: string; description?: string | null }
  score: number
}

/** Find all pairs with similarity >= threshold (default 0.4) */
export function findSimilarPairs<T extends { id: string; title: string; description?: string | null }>(
  items: T[],
  threshold = 0.4
): SimilarPair[] {
  const pairs: SimilarPair[] = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const score = jaccardSimilarity(items[i].title, items[j].title)
      if (score >= threshold) {
        pairs.push({ a: items[i], b: items[j], score })
      }
    }
  }
  return pairs.sort((a, b) => b.score - a.score)
}
