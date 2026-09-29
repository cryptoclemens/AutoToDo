# Voiceprints Slice A (Server-Fundament) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serverseitiges Voiceprint-Fundament: pgvector-Speicherung, Cosine-Matching (Auto-Vorschlag), Rückspeisung beim Bestätigen und „Stimmprofil vergessen" — ohne Einwilligungs-Gate.

**Architecture:** Migration 048 aktiviert pgvector und legt `member_voiceprints` (dimensionsfrei, Brute-Force-Cosine) + `transcripts.cluster_embeddings` an. Reine Helfer in `lib/voiceprints.ts`; das Matching läuft über eine SECURITY-DEFINER-SQL-Funktion. `/diarize` nimmt optional Cluster-Embeddings an und matcht (Kaskade Stufe 1); `/speakers` POST speist bestätigte Zuordnungen als gleitenden Mittelwert zurück; ein DELETE-Endpoint + Settings-Button löscht den eigenen Voiceprint. Alles additiv — ohne Embeddings identisch zum Phase-2-Verhalten.

**Tech Stack:** Next.js 14 / TypeScript, self-hosted Supabase/Postgres + pgvector, Docker (`supabase-db`).

**Spec:** `docs/superpowers/specs/2026-09-29-voiceprints-slice-a-design.md`

## Global Constraints

- Repo `autotodo` unter `/root/autotodo`, Branch `main`.
- `member_voiceprints`: PK `(workspace_id, user_id)`, Spalte `embedding vector` (OHNE feste Dimension), `sample_count INT`, RLS an ohne Policy (nur Service-Role).
- `transcripts.cluster_embeddings JSONB DEFAULT NULL` — `{ "SPEAKER_00": [float,…] }`.
- `VOICEPRINT_THRESHOLD = 0.65` (Cosine-Similarity).
- Auto-Match nur wenn `speaker_map` leer ist (bestehende Bestätigungen nie überschreiben). Rückspeisung nur aus `source:'manual'`-Zuordnungen.
- Alles additiv/degradiert still: fehlende Embeddings/pgvector-Fehler → kein Match/keine Rückspeisung, Route funktioniert weiter (try/catch).
- `npx tsc --noEmit` + `npx eslint` sauber vor Push (Build scheitert lokal an Google Fonts — kein Fehler).
- Migration anwenden: `docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < datei.sql`.
- Commit-Message endet mit `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`; `git add` nur die genannten Dateien (nie `git add -A`).

---

### Task 1: Migration 048 — pgvector, member_voiceprints, match-Funktion, cluster_embeddings

**Files:**
- Create: `supabase/migrations/048_voiceprints.sql`

**Interfaces:**
- Produces: Extension `vector`; Tabelle `member_voiceprints`; Spalte `transcripts.cluster_embeddings`; SQL-Funktion `match_voiceprint(p_workspace uuid, p_embedding text) RETURNS TABLE(user_id uuid, similarity double precision)`.

- [ ] **Step 1: Migration schreiben**

`supabase/migrations/048_voiceprints.sql`:
```sql
-- Migration 048: Voiceprints (Phase 3, Slice A)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS member_voiceprints (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL,
  embedding    vector NOT NULL,
  sample_count INT NOT NULL DEFAULT 1,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
ALTER TABLE member_voiceprints ENABLE ROW LEVEL SECURITY;  -- nur Service-Role

ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS cluster_embeddings JSONB DEFAULT NULL;

-- Bestes Match je Workspace (Brute-Force-Cosine). p_embedding als text -> ::vector
-- (robust ueber supabase-js rpc). similarity = 1 - Cosine-Distanz.
CREATE OR REPLACE FUNCTION match_voiceprint(p_workspace UUID, p_embedding TEXT)
RETURNS TABLE(user_id UUID, similarity DOUBLE PRECISION)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT mv.user_id, 1 - (mv.embedding <=> p_embedding::vector) AS similarity
  FROM member_voiceprints mv
  WHERE mv.workspace_id = p_workspace
  ORDER BY mv.embedding <=> p_embedding::vector
  LIMIT 1;
$$;
```

- [ ] **Step 2: Anwenden + verifizieren**

Run:
```bash
cd /root/autotodo && docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/migrations/048_voiceprints.sql
docker exec -i supabase-db psql -U postgres -d postgres -c "\dx vector" -c "\d member_voiceprints" -c "\df match_voiceprint"
```
Expected: `CREATE EXTENSION`/`CREATE TABLE`/`ALTER TABLE`/`CREATE FUNCTION`; Tabelle + Funktion existieren.

- [ ] **Step 3: match-Funktion mit synthetischen Daten prüfen**

Run:
```bash
docker exec -i supabase-db psql -U postgres -d postgres <<'SQL'
-- Wegwerf-Zeile mit einer echten workspace_id
INSERT INTO member_voiceprints (workspace_id, user_id, embedding)
SELECT id, gen_random_uuid(), '[1,0,0]' FROM workspaces LIMIT 1
ON CONFLICT DO NOTHING;
SELECT (SELECT count(*) FROM member_voiceprints) AS rows;
SELECT similarity > 0.99 AS near_one
FROM match_voiceprint((SELECT id FROM workspaces LIMIT 1), '[1,0,0]');
DELETE FROM member_voiceprints;  -- Aufräumen
SQL
```
Expected: `near_one = t` (identischer Vektor → Similarity ~1); danach Tabelle leer.

- [ ] **Step 4: Commit**

```bash
cd /root/autotodo && git add supabase/migrations/048_voiceprints.sql
git commit -m "feat(voiceprints): Migration 048 – pgvector, member_voiceprints, match_voiceprint

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `lib/voiceprints.ts` — reine Helfer + matchVoiceprint-Wrapper

**Files:**
- Create: `lib/voiceprints.ts`
- Test: `.superpowers/sdd/2026-09-29-voiceprints-slice-a/vp_test.ts` (Scratch, tsx)

**Interfaces:**
- Consumes: `SupabaseClient` (`@supabase/supabase-js`).
- Produces:
  - `const VOICEPRINT_THRESHOLD = 0.65`
  - `function toVectorLiteral(v: number[]): string`
  - `function l2normalize(v: number[]): number[]`
  - `function runningAverage(oldVec: number[], oldCount: number, newVec: number[]): number[]`
  - `async function matchVoiceprint(supabase, workspaceId: string, embedding: number[]): Promise<{ user_id: string; similarity: number } | null>`

- [ ] **Step 1: Failing test schreiben**

`vp_test.ts`:
```ts
import { toVectorLiteral, l2normalize, runningAverage } from '/root/autotodo/lib/voiceprints'
let p=0,f=0
const near=(a:number[],b:number[])=>a.length===b.length&&a.every((x,i)=>Math.abs(x-b[i])<1e-6)
const ok=(c:boolean,m:string)=>c?p++:(f++,console.error('FAIL '+m))
ok(toVectorLiteral([1,2,3])==='[1,2,3]','literal')
ok(near(l2normalize([3,4]),[0.6,0.8]),'l2 normalize')
ok(near(l2normalize([0,0]),[0,0]),'l2 zero-safe')
// avg([1,0],count1,[0,1]) = [0.5,0.5] -> normalized [0.7071,0.7071]
ok(near(runningAverage([1,0],1,[0,1]),[Math.SQRT1_2,Math.SQRT1_2]),'running average normalized')
console.log(`${p} passed, ${f} failed`); process.exit(f?1:0)
```

- [ ] **Step 2: Test läuft rot**

Run: `cd /root/autotodo && npx tsx <pfad>/vp_test.ts`
Expected: FAIL (Modul fehlt).

- [ ] **Step 3: Implementieren**

`lib/voiceprints.ts`:
```ts
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
```

- [ ] **Step 4: Test läuft grün**

Run: `cd /root/autotodo && npx tsx <pfad>/vp_test.ts`
Expected: `4 passed, 0 failed`.

- [ ] **Step 5: Lint + Commit**

```bash
cd /root/autotodo && npx eslint lib/voiceprints.ts
git add lib/voiceprints.ts
git commit -m "feat(voiceprints): lib/voiceprints.ts – Helfer + matchVoiceprint

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `/diarize` — Cluster-Embeddings annehmen + Auto-Match (Kaskade Stufe 1)

**Files:**
- Modify: `app/api/transcripts/[id]/diarize/route.ts`

**Interfaces:**
- Consumes: `matchVoiceprint`, `VOICEPRINT_THRESHOLD` (`@/lib/voiceprints`); `loadMemberRows` (`@/lib/memberRows`) für den Anzeigenamen; `deriveSpeakerStubs`, `DiarSeg` (`@/lib/diarization`); `SpeakerMapEntry` (`@/lib/llm/types`).
- Produces: `/diarize` speichert zusätzlich `transcripts.cluster_embeddings` und setzt (bei leerer `speaker_map`) Stubs mit Voiceprint-Auto-Match.

- [ ] **Step 1: Schema + Speicherung erweitern**

In `app/api/transcripts/[id]/diarize/route.ts` das zod-Schema um Cluster-Embeddings erweitern:
```ts
const schema = z.object({
  diarization: z.array(z.object({
    start: z.number(),
    end: z.number(),
    speaker_cluster: z.string().min(1).max(64),
    text: z.string().max(20_000).optional().default(''),
  })).max(5000),
  cluster_embeddings: z.record(z.array(z.number()).max(2048)).optional(),
})
```
Beim Laden des Transkripts zusätzlich `workspace_id` selektieren (für den Match-Scope):
```ts
    .from('transcripts').select('id, project_id, workspace_id, speaker_map')
```
(Typ entsprechend um `workspace_id: string` erweitern.)

- [ ] **Step 2: Auto-Match beim Stub-Ableiten**

Den Block `if (existing.length === 0) update.speaker_map = deriveSpeakerStubs(diar)` ersetzen durch eine Voiceprint-gestützte Variante; `cluster_embeddings` immer mitspeichern:
```ts
  const update: Record<string, unknown> = { diarization: diar }
  const embeddings = parsed.data.cluster_embeddings ?? null
  if (embeddings) update.cluster_embeddings = embeddings

  const existing = transcript.speaker_map ?? []
  if (existing.length === 0) {
    const stubs = deriveSpeakerStubs(diar)
    if (embeddings) {
      // Anzeigenamen der Mitglieder für aufgelöste user_id
      const members = await loadMemberRows(supabase, transcript.workspace_id, transcript.project_id)
      const nameByUid = new Map(members.map(m => [m.user_id, m.display_name]))
      for (const stub of stubs) {
        const emb = embeddings[stub.speaker_label]
        if (!emb) continue
        const match = await matchVoiceprint(supabase, transcript.workspace_id, emb)
        if (match && match.similarity >= VOICEPRINT_THRESHOLD) {
          stub.matched_user_id = match.user_id
          stub.matched_member = nameByUid.get(match.user_id) ?? stub.matched_member
          stub.source = 'voiceprint'
          stub.confidence = 'high'
        }
      }
    }
    update.speaker_map = stubs
  }
```
Import ergänzen: `import { matchVoiceprint, VOICEPRINT_THRESHOLD } from '@/lib/voiceprints'` und `import { loadMemberRows } from '@/lib/memberRows'`.

Zusätzlich in `lib/llm/types.ts` die `source`-Union von `SpeakerMapEntry` **definitiv** um `'voiceprint'` erweitern (rückwärtskompatibel, optionales Feld):
```ts
  source?: 'llm' | 'manual' | 'calendar' | 'diarization' | 'voiceprint'
```

- [ ] **Step 3: Typecheck + Lint**

Run: `cd /root/autotodo && npx tsc --noEmit && npx eslint "app/api/transcripts/[id]/diarize/route.ts" lib/llm/types.ts`
Expected: sauber.

- [ ] **Step 4: Commit**

```bash
cd /root/autotodo && git add "app/api/transcripts/[id]/diarize/route.ts" lib/llm/types.ts
git commit -m "feat(voiceprints): /diarize akzeptiert cluster_embeddings + Auto-Match (Kaskade Stufe 1)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: `/speakers` POST — Rückspeisung (gleitender Mittelwert)

**Files:**
- Modify: `app/api/transcripts/[id]/speakers/route.ts`

**Interfaces:**
- Consumes: `runningAverage`, `toVectorLiteral` (`@/lib/voiceprints`).
- Produces: nach dem Speichern der bestätigten `speaker_map` werden `member_voiceprints` für bestätigte Cluster mit Embedding aktualisiert/angelegt.

- [ ] **Step 1: cluster_embeddings mitladen**

Im `loadContext`/Transkript-Load von `speakers/route.ts` `cluster_embeddings` ergänzen. Die `TranscriptRow` lädt bereits `speaker_map`; erweitere die Selektion um `workspace_id, cluster_embeddings` (falls nicht vorhanden) — prüfe die bestehende `select(...)`-Zeile und ergänze fehlende Felder.

- [ ] **Step 2: Rückspeisung nach dem Speichern**

Nach dem erfolgreichen `update({ speaker_map })` und vor/neben der bestehenden `propagateResponsible`-Zeile eine Rückspeisung ergänzen:
```ts
  await feedbackVoiceprints(ctx.supabase, ctx.transcript.workspace_id, speakerMap, clusterEmbeddings)
```
mit Helfer in derselben Datei:
```ts
async function feedbackVoiceprints(
  supabase: ReturnType<typeof serviceDb>,
  workspaceId: string,
  speakerMap: SpeakerMapEntry[],
  clusterEmbeddings: Record<string, number[]> | null,
): Promise<void> {
  if (!clusterEmbeddings) return
  for (const e of speakerMap) {
    if (e.source !== 'manual' || !e.matched_user_id) continue
    const emb = clusterEmbeddings[e.speaker_label]
    if (!emb || emb.length === 0) continue
    try {
      const { data: existing } = await supabase
        .from('member_voiceprints')
        .select('embedding, sample_count')
        .eq('workspace_id', workspaceId).eq('user_id', e.matched_user_id)
        .maybeSingle() as { data: { embedding: string; sample_count: number } | null }
      let vec = emb
      let count = 1
      if (existing) {
        const old = JSON.parse(existing.embedding) as number[]  // pgvector liefert "[...]"
        vec = runningAverage(old, existing.sample_count, emb)
        count = existing.sample_count + 1
      } else {
        vec = l2normalize(emb)
      }
      await supabase.from('member_voiceprints').upsert({
        workspace_id: workspaceId,
        user_id: e.matched_user_id,
        embedding: toVectorLiteral(vec),
        sample_count: count,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'workspace_id,user_id' })
    } catch { /* Rückspeisung ist additiv – Fehler nicht fatal */ }
  }
}
```
Imports: `import { runningAverage, toVectorLiteral, l2normalize } from '@/lib/voiceprints'`.
`clusterEmbeddings` aus dem geladenen Transkript beziehen (Step 1). `serviceDb` existiert in der Datei bereits (sonst den vorhandenen Service-Client-Typ verwenden).

- [ ] **Step 3: Typecheck + Lint**

Run: `cd /root/autotodo && npx tsc --noEmit && npx eslint "app/api/transcripts/[id]/speakers/route.ts"`
Expected: sauber.

- [ ] **Step 4: Commit**

```bash
cd /root/autotodo && git add "app/api/transcripts/[id]/speakers/route.ts"
git commit -m "feat(voiceprints): Rückspeisung bestätigter Sprecher in member_voiceprints

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: „Stimmprofil vergessen" — DELETE-Endpoint + Settings-Button

**Files:**
- Create: `app/api/settings/voiceprints/route.ts`
- Create: `components/settings/ForgetVoiceprintButton.tsx`
- Modify: `components/settings/SettingsPageClient.tsx` (Tab „konto")

**Interfaces:**
- Consumes: `getSettingsAdminCtx`/`serviceDb` (`@/lib/settingsAdmin`).
- Produces: `DELETE /api/settings/voiceprints` löscht den Voiceprint des eingeloggten Users im aktuell aufgelösten Workspace.

- [ ] **Step 1: DELETE-Route**

`app/api/settings/voiceprints/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getSettingsAdminCtx } from '@/lib/settingsAdmin'

export async function DELETE() {
  const ctx = await getSettingsAdminCtx()
  if (!ctx) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  try {
    await ctx.supabase.from('member_voiceprints')
      .delete()
      .eq('workspace_id', ctx.workspaceId)
      .eq('user_id', ctx.userId)
  } catch { /* Tabelle evtl. noch nicht deployt */ }
  return NextResponse.json({ ok: true })
}
```
(`getSettingsAdminCtx` liefert `{ userId, workspaceId, isAdmin, supabase }` — jeder eingeloggte User darf seinen eigenen Voiceprint löschen, kein Admin nötig.)

- [ ] **Step 2: Button-Komponente**

`components/settings/ForgetVoiceprintButton.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ForgetVoiceprintButton() {
  const [busy, setBusy] = useState(false)
  async function forget() {
    setBusy(true)
    try {
      const res = await fetch('/api/settings/voiceprints', { method: 'DELETE' })
      if (res.ok) toast.success('Stimmprofil gelöscht.')
      else toast.error('Löschen fehlgeschlagen.')
    } finally { setBusy(false) }
  }
  return (
    <div className="pt-2">
      <p className="text-xs text-gray-500 mb-2">
        Für die automatische Sprecher-Erkennung kann ein Stimm-Merkmal gespeichert werden.
        Du kannst es jederzeit löschen.
      </p>
      <Button variant="outline" size="sm" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
        onClick={forget} disabled={busy}>
        {busy ? 'Lösche…' : 'Stimmprofil löschen'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: In den Konto-Tab einbinden**

In `components/settings/SettingsPageClient.tsx` den Import ergänzen (`import ForgetVoiceprintButton from './ForgetVoiceprintButton'`) und im `tab === 'konto'`-Block (am Ende des Kontobereichs) `<ForgetVoiceprintButton />` rendern. Die genaue Stelle des Konto-Tabs zuvor lesen.

- [ ] **Step 4: Typecheck + Lint**

Run: `cd /root/autotodo && npx tsc --noEmit && npx eslint "app/api/settings/voiceprints/route.ts" components/settings/ForgetVoiceprintButton.tsx components/settings/SettingsPageClient.tsx`
Expected: sauber.

- [ ] **Step 5: Commit + Push (alle Slice-A-Commits)**

```bash
cd /root/autotodo && git add "app/api/settings/voiceprints/route.ts" components/settings/ForgetVoiceprintButton.tsx components/settings/SettingsPageClient.tsx
git commit -m "feat(voiceprints): 'Stimmprofil vergessen' – DELETE-Endpoint + Settings-Button

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

---

## Abschluss (Controller, nach den Tasks)
- Zentraler Build + Deploy + Live-Verify (healthy, Landing 200, `DELETE /api/settings/voiceprints` unauth 401, `/diarize` unauth 401).
- Plan-Doc `docs/diarisierung-kalender-matching.md` Phase 3: Slice A als erledigt markieren; Slice B (Desktop-Embeddings) als offen/nächster Slice.
- Kein Dashboard-Eintrag (Feature erst mit Slice B + Desktop-Build nutzbar).
