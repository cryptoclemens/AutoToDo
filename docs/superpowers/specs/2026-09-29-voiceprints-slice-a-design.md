# Design-Spec: Voiceprints (Phase 3) — Slice A: Consent-freies Server-Fundament

> Stand: 2026-09-29 · Repo: `autotodo` (Server/Web) · Nachfolge von Phase 2 (Diarisierung)
> Zuschnitt vom Nutzer freigegeben: **schlank, ohne Einwilligungs-Gate, mit Löschfunktion.**

## 1. Ziel & Scope

Selbstlernende Stimm-Profile: Ein pro Sprecher-Cluster gelieferter Embedding-Vektor wird
gegen gespeicherte Mitglieds-Voiceprints gematcht (Cosine-Similarity). Über der Schwelle
wird der Cluster automatisch einem Mitglied vorgeschlagen/zugeordnet; eine **manuelle
Bestätigung speist den Voiceprint zurück** (gleitender Mittelwert), sodass die Erkennung
über die Zeit besser wird.

**In Scope (Slice A, alles serverseitig, hier baubar/testbar):**
- Migration 048: `CREATE EXTENSION vector` + Tabelle `member_voiceprints` + Spalte
  `transcripts.cluster_embeddings`.
- Matching-Kaskade Stufe 1 (Voiceprint) im `/diarize`-Fluss; Stufen 2/3 (LLM/manuell)
  bleiben wie in Phase 1/2.
- Rückspeisung beim Bestätigen (`/speakers` POST) — gleitender Mittelwert.
- „Stimmprofil vergessen" — Lösch-Endpoint + kleiner Settings-Button.

**Bewusst NICHT in Scope:**
- Einwilligungs-Flow / Admin-Gate (Nutzer-Entscheidung: Betreiber ist Verantwortlicher).
- **Slice B (separat):** Desktop liefert die Cluster-Embeddings. Bis dahin bleibt die
  Auto-Match-/Rückspeisungs-Logik **inert** (keine Embeddings → kein Match), degradiert
  sauber auf den Phase-2-Zustand. Slice A ist mit synthetischen Embeddings hier testbar.

## 2. Ist-Zustand (verifiziert)

- pgvector ist in `supabase-db` **verfügbar, aber nicht aktiviert**. Höchste Migration: 047.
- `/api/transcripts/[id]/diarize` speichert `transcripts.diarization` und leitet
  `speaker_map`-Cluster-Stubs ab (nur wenn `speaker_map` leer) via `deriveSpeakerStubs`.
- `/api/transcripts/[id]/speakers` POST speichert die (bestätigte) `speaker_map`
  (`source:'manual'`) und propagiert Verantwortliche.
- `SpeakerMapEntry.source` kennt `'llm'|'manual'|'calendar'|'diarization'`.

## 3. Datenmodell — Migration 048

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Gelernte Stimm-Profile je Mitglied und Workspace.
CREATE TABLE IF NOT EXISTS member_voiceprints (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL,                 -- auth.users
  embedding    vector NOT NULL,               -- dimensionsfrei (Modell in Slice B fixiert)
  sample_count INT NOT NULL DEFAULT 1,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
-- Pro Workspace nur wenige Zeilen -> Brute-Force-Cosine, kein ivfflat/hnsw-Index nötig.
ALTER TABLE member_voiceprints ENABLE ROW LEVEL SECURITY;  -- Zugriff nur Service-Role

-- Cluster-Embeddings des Transkripts (aus /diarize), für Auto-Match + Rückspeisung
-- beim späteren Bestätigen. { "SPEAKER_00": [f, …], … }
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS cluster_embeddings JSONB DEFAULT NULL;
```

> `vector` ohne feste Dimension erlaubt jede Länge; `<=>` (Cosine-Distanz) funktioniert,
> solange beide Operanden gleiche Länge haben. Einfügen als pgvector-Literal `'[a,b,c]'`.

## 4. Kernlogik — `lib/voiceprints.ts` (rein, unit-testbar)

```ts
export const VOICEPRINT_THRESHOLD = 0.65   // Cosine-Similarity; in Slice B kalibrieren

/** pgvector-Literal aus Zahl-Array: [1,2,3] -> "[1,2,3]". */
export function toVectorLiteral(v: number[]): string

/** L2-normalisierter gleitender Mittelwert: (old*count + neu)/(count+1), dann normalisiert. */
export function runningAverage(oldVec: number[], oldCount: number, newVec: number[]): number[]

/** L2-Normalisierung (für stabile Cosine-Vergleiche). */
export function l2normalize(v: number[]): number[]
```

Das eigentliche Matching ist eine SQL-Abfrage (kein reiner Helfer):
```sql
SELECT user_id, 1 - (embedding <=> $1::vector) AS similarity
FROM member_voiceprints
WHERE workspace_id = $2
ORDER BY embedding <=> $1::vector
LIMIT 1;
```
Gekapselt in `matchVoiceprint(supabase, workspaceId, embedding): Promise<{ user_id, similarity } | null>`
(via `supabase.rpc` oder — da Service-Role — eine kleine SECURITY-DEFINER-Funktion; siehe §7).

## 5. Integration

### 5.1 `/diarize` — Embeddings annehmen + Auto-Match (Kaskade Stufe 1)
- zod-Schema um `cluster_embeddings: z.record(z.array(z.number()).max(2048)).optional()` erweitern
  (Schlüssel = `speaker_cluster`).
- `transcripts.cluster_embeddings` mitspeichern.
- Beim Ableiten der Stubs (nur wenn `speaker_map` leer): je Cluster mit Embedding
  `matchVoiceprint(...)`; bei `similarity >= VOICEPRINT_THRESHOLD` den Stub mit
  `matched_user_id` + Namen des Mitglieds + `source:'voiceprint'` + `confidence:'high'`
  füllen, sonst unveränderter Stub (`source:'diarization'`). Ohne Embeddings: exakt heutiges Verhalten.

### 5.2 `/speakers` POST — Rückspeisung
- Nach dem Speichern der bestätigten `speaker_map`: `transcripts.cluster_embeddings` laden;
  für jede Zuordnung mit `matched_user_id`, deren Cluster ein Embedding hat, den Voiceprint
  aktualisieren: vorhandenen laden → `runningAverage(old, count, neu)` → upsert
  (`sample_count = count+1`), sonst neu anlegen (`sample_count=1`). Nur Bestätigungen
  (`source:'manual'`) speisen zurück — kein Selbstverstärken von Auto-Matches.

### 5.3 „Stimmprofil vergessen"
- `DELETE /api/settings/voiceprints` — löscht den eigenen Voiceprint des eingeloggten
  Users in allen seinen Workspaces (oder pro aufgelöstem Workspace; §7 entscheidet).
- Kleiner Button in den Konto-Einstellungen (`SettingsPageClient`, Tab „konto"):
  „Stimmprofil löschen" → DELETE → Toast.

## 6. Fehler/Degradation
- Alles additiv: keine `cluster_embeddings` → kein Match, keine Rückspeisung, Verhalten =
  Phase 2. pgvector-Fehler/Dimension-Mismatch werden gefangen (try/catch), `/diarize` und
  `/speakers` funktionieren weiter (Match/Rückspeisung entfallen still).

## 7. Offene Detail-Entscheidungen (beim Bau fixieren)
1. Matching-Query als `supabase.rpc` auf einer SECURITY-DEFINER-SQL-Funktion vs. direkter
   Query über Service-Role. Vorschlag: SECURITY-DEFINER-Funktion `match_voiceprint(ws, vec)`
   in Migration 048 (kapselt das `::vector`-Cast sauber).
2. Löschen: nur eigener Workspace (aus `resolveWorkspace`) vs. alle Workspaces des Users.
   Vorschlag: der aktuell aufgelöste Workspace (kleinste Überraschung).
3. `VOICEPRINT_THRESHOLD`-Startwert (0.65) — in Slice B an echten Embeddings kalibrieren.

## 8. Testing
- Rein: `toVectorLiteral`, `l2normalize`, `runningAverage` (tsx-Unit-Test).
- Integration (hier, mit synthetischen Embeddings): Migration anwenden; `/diarize` mit
  `cluster_embeddings` → prüfen, dass ein über der Schwelle liegender bekannter Vektor
  auto-gematcht wird; `/speakers` POST → prüfen, dass `member_voiceprints` upsertet;
  `DELETE` → weg. Auth-Guards (401/403) wie bei bestehenden Routen.
- `tsc`+`eslint` sauber; Build+Deploy+Live-Verify.

## 9. Slice B (später, Desktop) — nur zur Einordnung
Desktop exportiert pro Cluster ein Embedding aus dem `sherpa-rs`-Diarizer (Feasibility offen:
ob die API es herausgibt, sonst separater Embedding-Pass) und sendet es als
`cluster_embeddings` an `/diarize`. Erst dann werden Auto-Match + Rückspeisung real aktiv.
