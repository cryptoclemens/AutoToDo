# AutoToDo

## What This Is

AutoToDo ist eine KI-gestützte Web-App (+ Desktop-App) zur automatischen Extraktion und Verwaltung von Maßnahmen-Protokollen (LOP) aus Meeting-Transkripten. Teams laden Transkripte hoch, die KI extrahiert Action Items mit Verantwortlichem, Fälligkeitsdatum und Priorität — fertig strukturiert für direkte Bearbeitung. Betrieben von der **vencly GmbH**, München (HRB 290524). Zielgruppe: Teams in DACH, insbesondere Unternehmensberatungen, Projektsteuerer, Engineering-Teams.

## Core Value

**Meeting-Nachfolge ohne manuelle Arbeit:** Transkript hochladen → LOP-Punkte sind sofort strukturiert und zugewiesen. Alles andere ist sekundär.

## Requirements

### Validated (Meilensteine 1–17 abgeschlossen)

**Kern-App (M1–M6):**
- ✓ Auth: E-Mail/Passwort, Supabase Session, E-Mail-Bestätigung
- ✓ Workspaces mit Multi-Tenancy und Rollen (owner/admin/project_admin/editor/viewer)
- ✓ Projekte (CRUD, Archivierung, Wiederherstellung)
- ✓ LOP-Tabelle: Status, Priorität, Verantwortlicher, Fälligkeit, Inline-Edit, Filter
- ✓ LOP-Detail-Dialog: alle Felder editierbar, externe Links (JSONB, migration 021)
- ✓ Daily Standup-Modus: Filter erledigte, sektioniert nach Fälligkeit
- ✓ Ähnliche Punkte zusammenführen (Jaccard-Similarity, lib/similarity.ts)
- ✓ XLSX-Export mit Branding + XLSX-Import (Abgleich mit bestehender LOP)

**KI-Verarbeitung (M5, M15, M16):**
- ✓ BYOK-LLM: Anthropic, OpenAI, Azure OpenAI, Perplexity, Groq, Ollama
- ✓ Multi-Role LLM Config: extraction + transcription getrennt (migration 019)
- ✓ Konfidenz-Schwellwerte (auto ≥0.85, review <0.70)
- ✓ KI-Vorschläge Review-Panel (Inline-Edit, Annehmen, Ablehnen)
- ✓ Whisper-Halluzinations-Erkennung (>60% ein Wort → Fehler)
- ✓ LOP-Inhaltsübersetzung on-the-fly via BYOK (Browser-State only, Globe-Button)
- ✓ ContextNotes aus Transkripten (kollabiert by default, inline-edit, sortiert nach Wichtigkeit)

**Branding & UX (M6, M7d, M12, M13):**
- ✓ Workspace-Branding: Logo-Upload, Akzentfarbe (`--brand` CSS Custom Property)
- ✓ Projekt-Branding Override (brand_color, logo_url, branding_inherited, migration 016)
- ✓ Vencly-Logo + Favicon (Gradient-V), Impressum § 5 TMG
- ✓ Mehrsprachigkeit DE/EN via next-intl (cookie-basiert)
- ✓ Glasmorphismus-Navbar, moderne UI-Komponenten, Mobile Hamburger-Menu
- ✓ Projekt-KPIs: offen/in-Bearbeitung/abgeschlossen, % fertig, Ø Bearbeitungszeit, Offen pro Person

**SaaS-Infrastruktur (M7, M8, M9, M11):**
- ✓ Öffentliche REST API v1 (`/api/v1/projects`, `/lop`, `/transcripts`) + API-Key-Verwaltung
- ✓ Webhooks (HMAC-SHA256, 3 Retries exponential backoff)
- ✓ Audit-Log UI
- ✓ E-Mail-Digest Mo–Fr (Resend, Vercel Cron), Digest-Toggle in Settings
- ✓ Einladungs-Flow (256-Bit-Token, Resend optional), projektspezifische Mitglieder
- ✓ Freemium-Pläne (beta/free/solo/team/business) mit Plan-Gates (lib/plan-gate.ts)
- ✓ Gast-Ansicht `/guest/[token]` (kein Login, read-only)
- ✓ Mollie-Billing Infrastruktur vorbereitet (aktiviert sobald MOLLIE_API_KEY gesetzt)
- ✓ Friends-Code-System für Beta-Zugang (migration 017)
- ✓ Notion-Integration: Token-Auth, Import von Notion-Seiten als Transkript (migration 018)

**Compliance & Security (M7b, M7c):**
- ✓ AGB, Datenschutzerklärung, Impressum, AVV-PDF, Cookie-Banner (DSGVO, TDDDG)
- ✓ AES-256-GCM für Transkripte + LLM-Keys, Security Headers, Zod-Validierung
- ✓ RLS auf allen Tabellen, Sicherheits-Audit März 2026

**Desktop App (M17 — separates Repo `cryptoclemens/AutoToDo-Desktop`):**
- ✓ Tauri 2: Recorder (cpal), Whisper-Integration (whisper-rs)
- ✓ Pause/Resume, Update-Checker, bridge.js Overlay-Pill
- ✓ GitHub Actions Build-Matrix (macOS ARM/Intel, Windows)
- ✓ `/desktop`-Seite mit Download-Cards (DMG/MSI)

**Admin (aktuell):**
- ✓ Super-Admin Dashboard `/admin`: globale KPIs (Workspaces, Nutzer, Inhalte)
- ✓ Workspace-Liste `/admin/workspaces` mit Counts + Aktivitäts-Feed
- ✓ Friends-Code Nutzungsverifikation (Aktiv/Nicht genutzt + Counts)

### Active (Meilenstein 18)

- [ ] Hetzner CX32 Migration: Self-hosted Supabase + Coolify (Plan steht in `docs/hetzner-migration-plan.md`)
- [ ] Aufgaben-Abhängigkeiten / "wartet auf" zwischen LOP-Punkten
- [ ] PWA Offline-Fallback-Seite
- [ ] Landing Page: Hero-Illustration, Feature-Screenshots
- [ ] Dark Mode

### Out of Scope

- Eigenes LLM-Hosting — BYOK-Strategie gesetzt
- Native iOS/Android App — Tauri Desktop + PWA abdeckt den Bedarf
- Eigene E-Mail-Infrastruktur — Resend ist gesetzt
- Stripe/PayPal — Mollie (EU/DSGVO)

## Context

**Tech Stack:**
- Next.js 14 App Router, TypeScript, Tailwind CSS v3, shadcn/ui
- Supabase (Auth + Postgres + Storage): `lgnlviezjdvxgmknmfog.supabase.co`
- Vercel Deployment, Branch: `claude/github-automated-access-WVPL6`
- Mollie (Zahlungen), Resend (E-Mail), next-intl (i18n, cookie-basiert)
- 21 Migrations deployed (001–021)

**Datenbankstruktur (Kernabellen):**
workspaces, workspace_members, workspace_llm_config, projects, project_members, lop_items, transcripts, project_context_notes, friends_codes, super_admins, invitations, api_keys, webhook_endpoints, feedback, invoices, slack_webhooks, notion_integrations

**Architektur-Entscheidungen:**
- Service-Role-Client für workspace_members (RLS-Rekursion-Schutz, Migration 005)
- `resolveWorkspace()` immer statt direktem `eq('slug', slug)`
- Fallback-SELECT-Pattern für neue Spalten vor Migration
- Synchrone Inline-Verarbeitung (kein fire-and-forget), maxDuration=60

**Nutzerfeedback-Quellen:** `feedback.md` (automatisch über Feedback-Button befüllt) → `Tasks.md` (Meilenstein-Tracking)

## Constraints

- **Security**: Service-Role-Key nur server-side; ENCRYPTION_SECRET für API-Keys (64-Hex)
- **Compliance**: DSGVO; Mollie für EU-Zahlungen; Betreiber vencly GmbH
- **Build**: `npm run build` schlägt lokal fehl (Google Fonts); nur `npx tsc --noEmit` lokal
- **ESLint**: prefer-const, no-unused-expressions, no-unused-vars (^_ Prefix) — alles Errors
- **Git**: Pre-Push Hook bumpt Version automatisch; Branch `claude/github-automated-access-WVPL6`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| BYOK statt eigene LLM-Keys | Kein Datenschutzrisiko, keine variablen KI-Kosten | ✓ Gut |
| Service-Role für workspace_members | RLS-Policy kann sich nicht selbst referenzieren | ✓ Gut |
| Fallback-SELECT für neue DB-Spalten | Zero-downtime vor Migration | ✓ Gut |
| Mollie statt Stripe | EU/SEPA, DSGVO-konform | ✓ Gut |
| Tauri statt Electron für Desktop | Kleinere Binary, Rust-Sicherheit, System-Audio | ✓ Gut |
| next-intl cookie-basiert statt URL-Prefix | Einfachere Routing-Logik, kein i18n-Routing-Overhead | ✓ Gut |
| Synchrone LLM-Verarbeitung (kein fire-and-forget) | Vercel-kompatibel, kein Background-Worker nötig | ✓ Gut |
| LOP-Übersetzung nur Browser-State | Kein DB-Overhead, keine versehentlichen Überschreibungen | ✓ Gut |
| GSD als Dev-Workflow ab M18 | Besseres Kontext-Management, Wave-Execution für Parallelisierung | — Pending |

---
*Last updated: 2026-04-16 — GSD Setup nach M17 Abschluss, aus Brief.md + Tasks.md + feedback.md rekonstruiert*
