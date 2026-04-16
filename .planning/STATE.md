# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-16)

**Core value:** Transkript hochladen → LOP sofort strukturiert und zugewiesen
**Current focus:** Milestone 7 — Phase 7.1 (Aufgaben-Abhängigkeiten) als nächstes

## Current Position

Phase: Milestone 7 — bereit für Phase 7.1
Plan: 0 von 3 Phasen in Milestone 7
Status: Ready to plan
Last activity: 2026-04-16 — GSD-Setup, Milestone 6 vollständig abgeschlossen

Progress: [██████░░░░] ~60% (Milestone 6/10 geschätzt)

## Tech Context (für neue Sessions)

**Stack:**
- Next.js 14 App Router · TypeScript · Tailwind CSS v3
- Supabase (lgnlviezjdvxgmknmfog) · Service-Role für workspace_members
- Vercel · Branch: `claude/github-automated-access-WVPL6`
- 21 Migrationen deployed

**Kritische Patterns:**
- `resolveWorkspace()` IMMER statt direktem `eq('slug', slug)`
- Service-Role-Client für workspace_members (RLS-Rekursion-Schutz)
- Fallback-SELECT für neue DB-Spalten (probiere neue Spalte, fange Fehler, retry ohne)
- ESLint: prefer-const, no-unused-expressions, no-unused-vars (^_) — Errors, kein --no-verify
- Build lokal: nur `npx tsc --noEmit` (kein npm run build — Google Fonts)
- Pre-Push Hook bumpt Version automatisch (package.json + app/page.tsx APP_VERSION)

**Letzte Änderungen (Milestone 6):**
- `app/(app)/admin/` — Admin-Bereich komplett (layout, AdminNav, page, workspaces/)
- `app/api/admin/` — overview, workspaces-list, activity, friends-codes (mit Nutzungsdaten)
- `components/project/ContextNotes.tsx` — neu geschrieben (kollabiert, inline-edit, sort)
- `components/lop/LopTable.tsx` — Translation-Feature, displayFiltered Overlay
- `components/lop/LopItemDialog.tsx` — Externe Links (LopLink), isValidUrl()
- `app/(app)/projects/[id]/page.tsx` — Fallback-SELECT für links, KPI verantwortliche

## Decisions

- 2026-04: LOP-Übersetzung nur Browser-State — kein DB-Overhead
- 2026-04: Fallback-SELECT statt Migration als Blocker — Zero-downtime
- 2026-04: GSD als Dev-Workflow ab Milestone 7 — dieses Dokument

## Pending Todos

- [ ] Phase 7.1 planen: depends_on Spalte für LOP-Abhängigkeiten
- [ ] Nutzerfeedback einholen ob Abhängigkeiten tatsächlich gebraucht werden
- [ ] Notion-Integration evaluieren (MCP bereits installiert)
