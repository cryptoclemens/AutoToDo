# Umsetzungsplan: Echte Diarisierung + Kalender-Namensmatching

> Status: Konzept / geplant · Stand: 2026-09-21
> Inspiriert von [Biscotti](https://github.com/scosman/Biscotti) (on-device Diarisierung via SpeakerKit/Pyannote + Kalender-Namensmatching).

## 1. Ziel & Motivation

Verlässliche „wer hat was gesagt / zugesagt"-Zuordnung in Meeting-Transkripten — als Grundlage für korrekte Verantwortliche (`lop_items.responsible_user_id`), Tätigkeitsnachweis (F-025) und die Post-Meeting-Mail (F-030).

Wir ersetzen das reine LLM-Raten durch:
1. **Echte Stimm-Diarisierung** (Segmente je Sprecher-Cluster aus dem Audio),
2. **Kalender-basiertes Namensmatching** (Cluster → echte Workspace-Accounts über die Teilnehmerliste),
3. **Selbstlernende Stimm-Profile** (Voiceprints, pgvector) für automatisches Benennen über die Zeit.

## 2. Ist-Zustand (F-024, Migration 042)

- `transcripts.speaker_map JSONB` existiert. Befüllt wird es heute **rein textbasiert**: Der LLM-System-Prompt (SPRECHER-ZUORDNUNG) analysiert Text-Labels („Sprecher 1:", „Speaker A:") und rät die Zuordnung zu Workspace-Mitgliedern.
- Verarbeitung: `lib/processTranscript.ts` + `app/api/transcripts/[id]/process/route.ts`.
- Audio-Upload: `app/api/transcripts/audio/route.ts`. Desktop (Tauri, Repo `autotodo-desktop`) nimmt System-Audio via CoreAudio auf.
- **Problem:** Ohne echte Audio-Analyse ist die Zuordnung brittle und halluziniert Namen; es gibt keine Segment-Zeitstempel je Sprecher.

## 3. Ziel-Pipeline

```
Audio ─▶ ASR (Whisper, Wort-Zeitstempel)
     └▶ Diarisierung (Segmente je Sprecher-Cluster: SPEAKER_00 …)
        └▶ Merge → sprecher-attribuiertes Transkript
           └▶ Identity-Matching gegen Kalender-Kandidaten (Kaskade):
              ├─ 1. Voiceprint-Match (auto)   → pgvector-Cosine-Similarity
              ├─ 2. LLM-Match (Cluster→Name)  → NUR aus Kandidatenliste
              └─ 3. Manuelle Bestätigung (UI) → speist Voiceprint zurück
                 └▶ transcripts.speaker_map + lop_items.responsible_user_id
```

## 4. Architektur-Entscheidungen

### 4.1 Wo läuft die Diarisierung?

| Variante | Vorteil | Nachteil | Einsatz |
|---|---|---|---|
| **Desktop (on-device)** — Sidecar-Binary | bester Datenschutz (Audio bleibt lokal), nutzt vorhandenes CoreAudio-Audio, offline | Sidecar-Bau + Distribution je Plattform | **Primär** |
| **Server-Worker** (Web-Uploads) | keine Client-Anforderung | pompey-server ist **CPU-only** → langsam bei langen Meetings; Audio verlässt Gerät | **Fallback** |

**Empfehlung:** Desktop-Sidecar als Primärpfad, Server-Worker als Fallback für reine Web-Uploads.

### 4.2 Diarisierungs-/Embedding-Stack

- **Desktop-Sidecar (bevorzugt):** [`sherpa-onnx`](https://github.com/k2-fsa/sherpa-onnx) — ONNX, offline, Rust/C-Bindings (passt zum Tauri/Rust-Stack, kein Python). Diarisierung = pyannote-Segmentierung + Speaker-Embedding (3D-Speaker / NeMo TitaNet) + Clustering.
  - Alternative (max. Apple-Silicon-Perf, aber Swift-Fremdkörper wie Biscotti): **SpeakerKit/Pyannote** (Argmax) als Swift-Sidecar.
- **Server-Worker (Fallback):** `whisperX` oder `pyannote.audio` im Python-Container.
- **Voiceprint-Embedding:** dasselbe Speaker-Embedding-Modell (z.B. 3D-Speaker ERes2Net, ~192-dim) → in pgvector.

> Wichtig: Ein einheitliches Embedding-Modell für Diarisierung **und** Voiceprints, sonst sind die Vektoren nicht vergleichbar.

### 4.3 Kalenderquelle

- **Desktop:** EventKit (Apple Calendar) — aktuelles/nächstes Event + Teilnehmer, lokal (wie Biscotti). Tauri-Plugin/Sidecar.
- **Web:** Read-only-OAuth zu Google Calendar / Microsoft 365 (Token in Workspace-Settings, analog zur bestehenden Notion-Integration unter `app/api/settings/integrations/`). Pragmatischer Zwischenschritt: Meeting aus Liste wählen oder `.ics`-Upload.
- **Verknüpfung:** Teilnehmer-**E-Mail** → `workspace_members.email` (RPC `get_workspace_members_with_email`) → `user_id`. Der Kalender liefert die Kandidatenmenge; das E-Mail-Matching bindet sie an echte Accounts.

## 5. Datenmodell (neue Migrationen)

Aktueller Stand: höchste Migration = **044**. pgvector ist im `supabase-db` verfügbar, aber noch nicht aktiviert.

### 045_meeting_calendar_links.sql
```sql
CREATE TABLE meeting_calendar_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE,
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL CHECK (provider IN ('apple','google','microsoft','ics','manual')),
  event_id      TEXT,
  title         TEXT,
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  attendees     JSONB NOT NULL DEFAULT '[]',   -- [{name,email,user_id?}]
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_mcl_transcript ON meeting_calendar_links(transcript_id);
-- RLS analog zu transcripts: Zugriff über Workspace-/Projektmitgliedschaft
```

### 046_transcript_diarization.sql
```sql
ALTER TABLE transcripts
  ADD COLUMN IF NOT EXISTS diarization JSONB DEFAULT NULL;
-- diarization: [{ start:float, end:float, speaker_cluster:'SPEAKER_00', text?:string }]

COMMENT ON COLUMN transcripts.diarization IS
  'Sprecher-Segmente aus Audio-Diarisierung (Cluster + Zeitstempel).';
```
`transcripts.speaker_map` wird semantisch erweitert (kein Schema-Change, JSONB):
```jsonc
// alt: { "Sprecher 1": "Clemens" }
// neu: { "SPEAKER_00": { "user_id": "...", "name": "Clemens",
//                        "confidence": 0.94, "source": "voiceprint" } }
//        source ∈ voiceprint | llm | manual | calendar
```

### 047_member_voiceprints.sql
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE member_voiceprints (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL,          -- auth.users
  embedding    vector(192) NOT NULL,   -- Dimension = Embedding-Modell
  sample_count INT DEFAULT 1,
  consent_at   TIMESTAMPTZ,            -- DSGVO Art. 9 Einwilligung (Pflicht!)
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);
CREATE INDEX idx_voiceprint_ws ON member_voiceprints(workspace_id);
-- RLS: nur Workspace-Mitglieder; nur mit consent_at IS NOT NULL matchen
```
Matching-Query (Kaskade Stufe 1):
```sql
SELECT user_id, 1 - (embedding <=> $1) AS similarity
FROM member_voiceprints
WHERE workspace_id = $2 AND consent_at IS NOT NULL
ORDER BY embedding <=> $1 LIMIT 1;
-- Auto-Match ab similarity > Schwellwert (z.B. 0.75), sonst nächste Stufe
```

`lop_items.responsible_user_id` / `co_responsibles` werden aus dem **bestätigten** Sprecher + Kalender-Teilnehmern belegt (nicht mehr geraten).

## 6. API & Code

| Endpunkt / Datei | Zweck |
|---|---|
| `POST /api/transcripts/[id]/diarize` | Diarisierungs-Ergebnis annehmen (Desktop) bzw. Server-Worker triggern |
| `GET  /api/transcripts/[id]/speakers` | Cluster + aktuelle Zuordnung + Kandidaten liefern (für UI) |
| `POST /api/transcripts/[id]/speakers` | manuelle Bestätigung/Korrektur → `speaker_map` + optional Voiceprint speichern |
| `POST /api/transcripts/[id]/calendar-link` | Meeting/Teilnehmer verknüpfen (.ics/OAuth/manuell) |
| `app/api/settings/integrations/calendar/` | OAuth Google/MS (analog Notion) |
| `lib/diarization.ts` | Kaskaden-Matching (Voiceprint → LLM → manuell), pgvector-Query |
| `lib/processTranscript.ts` | Pipeline: nach ASR Diarisierung + Matching einhängen; LLM-Prompt auf Kandidatenliste einschränken |
| `components/lop/SpeakerAssignPanel.tsx` (neu) | UI zum Zuordnen |

## 7. Frontend / Desktop

- **UI „Sprecher zuordnen":** je Cluster ein Audio-Snippet + Wellenform, Dropdown mit Kalender-Teilnehmern, Confidence-Badge. „Bestätigen" propagiert auf alle Segmente + LOP-Verantwortliche und speichert (bei Einwilligung) den Voiceprint.
- **Transkript-Ansicht** nach Sprecher farbcodiert; Meeting-Header zeigt gematchte Teilnehmer.
- **Desktop:** EventKit-Zugriff + Diarisierungs-Sidecar; liefert diarisiertes Transkript + (bei Zustimmung) Embeddings.

## 8. Datenschutz (DSGVO — nicht optional)

Stimm-Profile sind **biometrische Daten, Art. 9 DSGVO (besondere Kategorie)**:
- **Opt-in pro Workspace**, ausdrückliche Einwilligung (`member_voiceprints.consent_at`), Zweckbindung.
- Embeddings verschlüsselt at-rest, **löschbar** („Stimmprofil vergessen").
- On-device-Diarisierung als Argument: Audio bleibt lokal; nur Transkript + (bestätigte) Embeddings gehen ggf. zum Server.
- Ergänzung in `/datenschutz` + Consent-Flow **vor** Aktivierung. Ohne Consent kein Voiceprint-Matching.

## 9. Phasierung

### Phase 1 — Quick Win (ohne Audio-ML) — ✅ deployed 2026-09-21 (F-031)
Kalender-Teilnehmerliste als Kandidaten + **F-024-LLM-Zuordnung darauf einschränken** + Bestätigungs-UI.
- [x] Migration 045 (`meeting_calendar_links`)
- [x] `.ics`-Upload + `POST/DELETE …/calendar-link`; E-Mail→`user_id`-Matching (`lib/ics.ts`, `lib/speakerCandidates.ts`)
- [x] LLM-Zuordnung in `lib/processTranscript.ts` hart auf Kandidaten eingeschränkt (`resolveCandidate` verwirft halluzinierte Namen); `matched_user_id` aufgelöst, `source` markiert
- [x] `SpeakerMapEntry` um `matched_user_id` + `source` erweitert (rückwärtskompatibel; Array-Format beibehalten statt Objekt-Keyed)
- [x] `SpeakerAssignModal` (Kandidaten-Dropdown, `.ics`-Upload, manuelle Bestätigung) + `GET/POST …/speakers`
- [x] `responsible_user_id` aus bestätigtem Sprecher belegen — der bestätigte `speaker_map` dient als **autoritative Namen→user_id-Tabelle**; `resolveResponsibleFromConfirmed` überträgt sie auf `lop_items.responsible_user_id` desselben Transkripts (nur eindeutige Voll-/Vornamens-Treffer, kein Raten). Kein 1:1 Sprecher→Punkt angenommen. POST `…/speakers` liefert `responsibleUpdated`, Modal zeigt Rückmeldung.
- [ ] Kalender-**OAuth** (Google/MS) — Phase 1 liefert `.ics`/manuell; OAuth ist ein **eigener Track** (braucht Google-Cloud-/Azure-App-Registrierung + Client-Secrets, Token-Tabelle, Callback-Flow) und wird separat aufgesetzt, sobald die Credentials vorliegen. Siehe §10.3.
- [x] Ergebnis: weniger Halluzination, nutzt vorhandene Pipeline

### Phase 2 — Echte Diarisierung
- [ ] Desktop: `sherpa-onnx`-Sidecar (Segmentierung + Embedding + Clustering)
- [ ] Migration 046 (`transcripts.diarization`)
- [ ] `POST …/diarize`; Merge Diarisierung × ASR-Wort-Zeitstempel
- [ ] Server-Worker-Fallback (`whisperX`/`pyannote.audio`) für Web-Uploads
- [ ] Farbcodierte Transkript-Ansicht

### Phase 3 — Voiceprints (Selbstlernen)
- [ ] Migration 047 (`CREATE EXTENSION vector` + `member_voiceprints`)
- [ ] Consent-Flow + `/datenschutz`-Text (Art. 9)
- [ ] pgvector-Kaskade Stufe 1 in `lib/diarization.ts`
- [ ] Bestätigung speist Voiceprint (running average über `sample_count`)
- [ ] „Stimmprofil vergessen" (Löschung)

## 10. Offene Entscheidungen

1. Embedding-Modell + Dimension fixieren (bestimmt `vector(N)`). Vorschlag: 3D-Speaker ERes2Net (192-dim).
2. Sidecar-Sprache: `sherpa-onnx` (Rust/ONNX) vs. Swift `SpeakerKit` (Apple-Silicon-Perf, aber nativ).
3. Kalender-Web: OAuth (Google/MS) sofort oder erst `.ics`/manuell in Phase 1.
4. Transkribiert AutoToDo Audio aktuell server- oder desktopseitig? (Bestimmt, wo Diarisierung andockt.) → vor Phase 2 verifizieren.
5. Similarity-Schwellwert für Auto-Match (Start: 0.75, kalibrieren).

## 11. Bezug zu bestehenden Features

- **F-024 speaker_map:** wird von „raten" auf „echte Diarisierung + Kalender" gehoben.
- **F-025 Tätigkeitsnachweis:** endlich belastbar („wer hat was zugesagt").
- **F-030 Post-Meeting-Mail:** trifft die richtige Person.
