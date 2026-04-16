# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-16)

**Core value:** Transkript hochladen → LOP sofort strukturiert und zugewiesen
**Current focus:** Meilenstein 18 — Phase 18.1 (Hetzner-Migration) oder 19.1 (LOP-Abhängigkeiten)

## Current Position

Milestone: 18 (bereit zu planen)
Status: Ready to plan
Last activity: 2026-04-16 — GSD-Setup, M17 + Admin-Dashboard abgeschlossen

Progress: [████████░░] M1–M17 abgeschlossen, M18 offen

## Tech Context (für neue Sessions)

**Stack:**
- Next.js 14 App Router · TypeScript · Tailwind CSS v3 · shadcn/ui
- Supabase: `lgnlviezjdvxgmknmfog.supabase.co` (21 Migrationen deployed)
- Vercel · Branch: `claude/github-automated-access-WVPL6`
- Mollie (Payments), Resend (E-Mail), next-intl (i18n cookie-basiert)

**Kritische Patterns — nie vergessen:**
- `resolveWorkspace()` IMMER statt `eq('slug', slug)` — schlägt fehl auf Single-Domain
- Service-Role-Client für `workspace_members` — RLS-Rekursion-Schutz (Migration 005)
- Fallback-SELECT für neue DB-Spalten: erst mit neuer Spalte, bei Error retry ohne
- ESLint: prefer-const, no-unused-expressions, no-unused-vars (`_`-Prefix) — alle Errors
- Build lokal: `npx tsc --noEmit` (kein `npm run build` — Google Fonts blockiert lokal)
- Pre-Push Hook bumpt Version auto: `package.json` + `app/page.tsx APP_VERSION`
- Kein `--no-verify` — Hook-Fehler immer fixen

**LLM-Provider (BYOK, alle implementiert):**
Anthropic · OpenAI · Azure OpenAI · Perplexity · Groq · Ollama
Multi-Role: `extraction` + `transcription` getrennt konfigurierbar (migration 019)

**Letzte Änderungen (M17+, aktueller Branch):**
- `app/(app)/admin/` — vollständiger Admin-Bereich (layout, AdminNav, page, workspaces/)
- `app/api/admin/` — overview, workspaces-list, activity, friends-codes (Nutzungsdaten)
- `components/project/ContextNotes.tsx` — neu: kollabiert, inline-edit, Wichtigkeits-Sort
- `components/lop/LopTable.tsx` — Translation-Feature, displayFiltered Overlay
- `components/lop/LopItemDialog.tsx` — Externe Links (LopLink, isValidUrl)
- `app/(app)/projects/[id]/page.tsx` — Fallback-SELECT, KPI Verantwortliche
- `.planning/` — GSD-Setup (dieses Dokument)

**Repo-Dokumente die gelesen werden sollten:**
- `Tasks.md` — vollständige Meilenstein-Historie M1–M17
- `Brief.md` — Produktvision, Architektur, LLM-Konfiguration, Sicherheit
- `feedback.md` — Nutzer-Feedback (automatisch über Feedback-Button befüllt)
- `learning.md` — Technische Lessons Learned (Next.js/Supabase-Fallstricke)
- `docs/hetzner-migration-plan.md` — Self-hosted Migrations-Plan

## Decisions

- 2026-04: LOP-Übersetzung nur Browser-State — kein DB-Overhead, kein versehentliches Überschreiben
- 2026-04: Fallback-SELECT Pattern — Zero-downtime vor Migration
- 2026-04: GSD als Dev-Workflow ab M18 — diese .planning/-Struktur
- 2026-03: Tauri statt Electron für Desktop — kleinere Binary, Rust-Sicherheit
- 2026-03: Synchrone LLM-Verarbeitung — Vercel-kompatibel, kein Background-Worker

## Pending Todos

- [ ] Entscheiden: M18.1 Hetzner-Migration zuerst oder M19.1 LOP-Abhängigkeiten?
- [ ] Nutzerfeedback einholen: Sind LOP-Abhängigkeiten tatsächlich ein Pain-Point?
- [ ] Transcript-Fehler von heute untersuchen (processing_error in Supabase prüfen)
