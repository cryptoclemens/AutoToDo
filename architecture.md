# AutoToDo – Systemarchitektur

> Stand: 30.06.2026 · Version 0.1.198

---

## Überblick

AutoToDo ist eine Multi-Tenant SaaS-Anwendung, die Meeting-Transkripte per KI in strukturierte Listen offener Punkte (LOPs) überführt. Die Anwendung läuft als Docker-Container auf Hetzner CX32 mit Self-hosted Supabase.

```
Browser / Desktop-App
        │
        ▼
┌────────────────────────────┐
│   Next.js 14 (App Router)  │  ← Hetzner CX32 (Docker, standalone)
│   TypeScript · Tailwind    │
│                            │
│  ┌──────────────────────┐  │
│  │   Route Groups       │  │
│  │  (app) (auth)        │  │
│  │  (onboarding)(guest) │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │   API Routes         │  │
│  │  /api/*  /api/v1/*   │  │
│  └──────────────────────┘  │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│  Self-hosted Supabase      │  ← Hetzner CX32 (Docker)
│  PostgreSQL + Auth         │
│  + Storage (logos/         │
│    transcripts)            │
└────────────────────────────┘
             │
             ▼
   Externe Dienste
   ├── LLM-APIs (BYOK): Anthropic / OpenAI / Azure / Perplexity / DeepSeek / Groq
   ├── Resend (E-Mail: Einladungen + täglicher Digest)
   ├── Mollie (Billing/Checkout)
   └── Slack/Teams (Webhook-Benachrichtigungen)
```

---

## Multi-Tenancy

Jeder Nutzer gehört zu einem oder mehreren **Workspaces**. Die Datentrennung erfolgt auf zwei Ebenen:

| Ebene | Mechanismus |
|---|---|
| Anwendung | `resolveWorkspace()` in allen API-Routes löst den aktiven Workspace via Slug oder Membership-Fallback auf |
| Datenbank | Row-Level Security (RLS) auf allen Tabellen — jede Row enthält `workspace_id` |

```
middleware.ts
  └── liest Workspace-Slug aus Subdomain / Cookie
  └── setzt x-workspace-slug Header

API Route
  └── createClient() → Auth-Prüfung (wer bin ich?)
  └── createServiceClient() → Service-Role (bypass RLS für Admin-Ops)
  └── resolveWorkspace(supabase, user.id, slug) → Workspace-Objekt
```

---

## Authentifizierung & Autorisierung

```
Nutzer → /login → Supabase Auth (E-Mail + Passwort)
                       │
                       ▼
              auth.users (Supabase intern)
                       │
                       ▼
              workspace_members
              ┌─────────────────────────────────┐
              │ user_id · workspace_id · role   │
              │ roles: workspace_owner          │
              │        workspace_admin          │
              │        project_admin            │
              │        editor                   │
              │        viewer                   │
              └─────────────────────────────────┘
                       │
                       ▼
              project_members (optional, projektspezifisch)
```

**API v1 (öffentlich):** Bearer-Token via `api_keys`-Tabelle (SHA-256-gehashte Tokens, Scope `read`/`write`).

---

## Datenbank-Schema (Kern-Tabellen)

```
workspaces
├── id, name, slug, plan, brand_color, logo_url
├── digest_enabled, plan_expires_at
└── created_at

workspace_members
├── workspace_id → workspaces
├── user_id → auth.users
└── role

projects
├── id, workspace_id, name, description
├── brand_color, logo_url, branding_inherited
├── bundesland, call_language ('de'|'en'|'fr'|...)
├── needs_activity_report (boolean)
├── context_reviewed_at (Aktualitätsprüfung Kontext-Bereich, F-23)
└── archived_at

lop_items
├── id, project_id, workspace_id
├── title, description
├── status ('offen'|'in_bearbeitung'|'abgeschlossen'|'geparkt'|'backlog'|'merged')
├── responsible (text), responsible_user_id → auth.users
├── co_responsibles (JSONB: [{user_id, name}])
├── due_date, priority ('hoch'|'mittel'|'niedrig')
├── links (JSONB: [{url, label}])
├── parent_id → lop_items      (Teilaufgaben-Hierarchie, F-21 Aufteilen)
├── merged_into_id → lop_items (Ziel beim Verschmelzen, F-29; Quelle bekommt status='merged')
├── source ('manual'|'ai'), ai_confidence, requires_review
├── transcript_id → transcripts
└── created_at, updated_at, completed_at

lop_item_relations              (verwandte Punkte, F-21 Verknüpfen)
├── id, workspace_id, created_by
├── item_a → lop_items, item_b → lop_items
└── CHECK (item_a < item_b) + UNIQUE (item_a, item_b)  -- symmetrisch, kanonisch geordnet

feedback                        (Nutzerfeedback; Status-Spiegel von feedback.md)
├── id, workspace_id, user_id
├── message, category ('general'|'bug'|'feature'|'other'), category_seq
└── status ('new'|'in_review'|'done'|'rejected')
    ↑ /api/admin/feedback synct beim Laden aus feedback.md (Status: bearbeitet/gestrichen)

idea_items
├── id, project_id, workspace_id
├── title, note (max. 3 Sätze)
├── created_by → auth.users, created_by_name (denormalisiert)
└── created_at

transcripts
├── id, project_id, workspace_id
├── original_filename, meeting_date
├── storage_path (privater Bucket), encrypted_content
├── processing_status ('pending'|'processing'|'done'|'error')
├── uploaded_by → auth.users
├── items_created, items_updated, llm_summary
└── processed_at

project_context_notes
├── id, project_id, workspace_id, transcript_id
├── text, category ('availability'|'decision'|'risk'|'info')
├── relevant_from, relevant_until
└── archived_at

workspace_llm_config
├── workspace_id, role ('extraction'|'transcription')
├── provider ('anthropic'|'openai'|'azure_openai'|'perplexity'|'groq'|'deepseek')
├── model, encrypted_api_key, endpoint
└── (UNIQUE workspace_id + role)

friends_codes
├── id, code, label, created_by
├── max_uses, use_count
└── redeemed_at (gesetzt wenn vollständig eingelöst)

friends_code_redemptions
├── id, code_id → friends_codes
├── redeemed_by_user_id, redeemed_workspace_id
└── redeemed_at

daily_plans
├── id, user_id, project_id
├── date, plan_text (kommagetrennte Vorhaben)
└── transcript_id (Quelle)
```

---

## Transkript-Verarbeitungs-Pipeline

```
Nutzer lädt Transkript hoch (Text / Datei / Audio / Notion)
        │
        ▼
POST /api/transcripts
  ├── Inhalt AES-256-GCM verschlüsseln
  ├── In Supabase Storage speichern (privater Bucket)
  └── runTranscriptProcessing(transcriptId) aufrufen (inline, kein fire-and-forget)

runTranscriptProcessing()  [lib/processTranscript.ts]
  ├── Transkript-Text entschlüsseln
  ├── Whisper-Halluzinations-Check (Wort-Frequenz > 60%)
  ├── project.call_language lesen → Sprach-Hinweis voranstellen
  ├── LLM-Config laden (workspace_llm_config, role='extraction')
  ├── Bestehende LOP-Punkte als Kontext laden (Dedup-Basis)
  ├── Bekannte Namen aus responsible-Feldern sammeln
  ├── Workspace-Mitglieder + Projekt-Mitglieder laden
  ├── processTranscriptWithLlm() aufrufen
  │     └── factory.ts → provider-spezifische Implementierung
  │           └── buildSystemPrompt() + buildUserPrompt() aus lib/llm/prompt.ts
  │
  ├── LLM-Response: { actions, context_notes, ideas, summary, daily_plan_text }
  │
  ├── actions verarbeiten:
  │     ├── create → lop_items INSERT (confidence ≥ 0.85: direkt; < 0.70: requires_review)
  │     └── update/close → lop_items UPDATE (auto-apply ab confidence ≥ 0.85)
  ├── context_notes → project_context_notes INSERT
  ├── ideas → idea_items INSERT (created_by_name: 'KI (Transkript)')
  ├── daily_plan_text → daily_plans UPSERT (per user_id + project_id + date)
  └── transcripts UPDATE: status='done', items_created, items_updated, llm_summary
```

**KI-Konfidenz-Schwellen:**

| Konfidenz | Verhalten |
|---|---|
| ≥ 0.85 | Direkt anwenden, kein Review erforderlich |
| 0.70–0.84 | Anwenden, aber `requires_review = true` |
| < 0.70 | Nur speichern mit `requires_review = true`, nicht anwenden |

---

## LLM-Abstraktionsschicht (BYOK)

```
lib/llm/
├── types.ts          LlmConfig, ProcessTranscriptResult, ExistingLopItem
├── prompt.ts         buildSystemPrompt()  — JSON-Schema + Extraktionsregeln
│                     buildUserPrompt()    — Transkript + Kontext + Mitglieder
├── factory.ts        processTranscriptWithLlm() → dispatcht nach provider
├── anthropic.ts      Claude 3.x / 4.x
├── openai.ts         GPT-4o / GPT-4-turbo / o3-mini
├── azure.ts          Azure OpenAI (Custom Deployment-Name + Endpoint)
├── perplexity.ts     Sonar / Sonar Pro / Sonar Reasoning Pro
├── groq.ts           Whisper-large-v3-turbo (Transkription)
└── deepseek.ts       deepseek-chat / deepseek-reasoner
```

Jeder Provider-Key wird AES-256-GCM verschlüsselt in `workspace_llm_config` gespeichert.
`ENCRYPTION_SECRET` (64 Hex-Zeichen) ist zwingend identisch in `.env.local` und Deployment.

---

## Standup-Modus & Ideenspeicher

```
LopTable (components/lop/LopTable.tsx)
  │
  ├── Normalansicht
  │     ├── Filterbar (Status, Priorität, Verantwortlicher, Suche)
  │     ├── Tabelle mit Inline-Edit
  │     └── Ideenspeicher (ausklappbar, unten)
  │
  └── Standup-Modus
        ├── Sektion: Überfällig  (due_date < heute)
        ├── Sektion: Heute fällig
        ├── Sektion: In Bearbeitung
        ├── Sektion: Offen
        └── Sektion: Ideenspeicher (gedimmt, nach 'Offen')

Ideenspeicher API:
  GET  /api/ideas?projectId=X     → alle Ideen des Projekts
  POST /api/ideas                 → neue Idee anlegen
  DELETE /api/ideas/[id]          → Idee löschen
  PATCH /api/ideas/[id]           → Idee → LOP-Punkt umwandeln (promote)
```

---

## Tätigkeitsnachweis

```
GET /api/taetigkeitsnachweise?month=YYYY-MM&projectId=X
  ├── LOP-Items mit responsible_user_id = aktueller Nutzer
  │     (updated_at im Monat, Fallback: responsible-Text = Anzeigename)
  └── Transkripte des Monats (meeting_date im Monat)

TaetigkeitsnachweisModal (components/dashboard/TaetigkeitsnachweisModal.tsx)
  ├── Monatsnavigation (← Monat →)
  ├── Tabelle: Tag | Tätigkeit (editierbares Textarea, max. 200 Zeichen)
  │     LOP-Items = primäre Quelle; Transkripte = Fallback wenn kein LOP
  └── Drucken / PDF-Export via window.print()
```

---

## E-Mail-Digest

```
Host-Crontab (Hetzner, Mo–Fr 16:00 UTC)
  └── GET /api/cron/daily-digest (Bearer: CRON_SECRET)
        ├── Workspaces mit digest_enabled = true
        ├── Offene + in_bearbeitung LOP-Items mit responsible_user_id
        ├── Gruppieren nach Nutzer
        └── Resend API → HTML-E-Mail je Nutzer
```

---

## Freemium-Plan-Gates

```
lib/plans.ts         Tier-Grenzen (Beta/Free/Solo/Team/Business)
lib/plan-gate.ts
  ├── checkProjectLimit()     → HTTP 402 wenn Limit erreicht
  ├── checkTranscriptLimit()  → HTTP 402 wenn Limit erreicht
  └── checkSeatLimit()        → HTTP 402 wenn Limit erreicht

Workspaces.plan:  'beta' | 'free' | 'solo' | 'team' | 'business'
Default:          'beta' (sicherer Fallback: ws?.plan ?? 'beta')
```

---

## Sicherheitsmaßnahmen

| Bereich | Maßnahme |
|---|---|
| Transport | HTTPS (Cloudflare), HSTS, Reverse Proxy |
| Headers | X-Frame-Options: DENY, nosniff, XSS-Protection, Referrer-Policy, Permissions-Policy |
| Datenbankzugriff | RLS auf allen Tabellen, Service-Role-Client nur serverseitig |
| API-Keys | SHA-256-gehashte Tokens, Scope-Prüfung (`read`/`write`) |
| Verschlüsselung | AES-256-GCM für LLM-API-Keys + Transkript-Inhalte |
| Einladungs-Token | `randomBytes(32)` — 256 Bit Entropie |
| Input-Validierung | Zod auf allen POST/PATCH-Routes, UUID-Prüfung auf Query-Parametern |
| Whisper-Schutz | Halluzinations-Check (Wort-Frequenz > 60% → Fehlermeldung) |
| Deployment | GitHub Actions → SSH-Deploy nach Hetzner (kein direkter Push-Zugriff) |

---

## Deployment & CI/CD

```
git push → branch: claude/github-automated-access-WVPL6
        │
        ▼
GitHub Actions (.github/workflows/deploy.yml)
  └── SSH → Hetzner CX32
        └── /root/deploy/autotodo/deployatd.sh
              ├── git pull
              ├── docker build (Next.js standalone)
              └── docker restart autotodo-app

Pre-Push Hook (scripts/bump-version.sh)
  └── Erhöht Patch-Version in package.json + app/page.tsx
  └── Erstellt Commit "chore: bump version to X.Y.Z"
```

**Aktive Umgebung:**
- App: `https://autotodo.vencly.com` (Hetzner CX32 → Cloudflare DNS)
- Supabase: `https://supabase.autotodo.vencly.com` (Self-hosted, gleicher Server)
- Cron: Host-Crontab auf Hetzner (kein Vercel Cron mehr)
- Storage: Supabase Storage (logos: public · transcripts: privat)
