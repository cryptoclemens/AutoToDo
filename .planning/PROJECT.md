# AutoToDo

## What This Is

AutoToDo ist eine KI-gestützte Web-App zur automatischen Extraktion und Verwaltung von Maßnahmen-Protokollen (LOP) aus Meeting-Transkripten. Teams laden Transkripte hoch, die KI extrahiert Action Items mit Verantwortlichem, Fälligkeitsdatum und Priorität — fertig strukturiert für direkte Bearbeitung. Zielgruppe: Teams in Deutschland/DACH, die Meeting-Nachverfolgung automatisieren wollen.

## Core Value

**Meeting-Nachfolge ohne manuelle Arbeit:** Transkript hochladen → LOP-Punkte sind sofort strukturiert und zugewiesen. Alles andere ist sekundär.

## Requirements

### Validated

- ✓ Auth: E-Mail/Passwort, Supabase Session — Milestone 1
- ✓ Workspaces mit Multi-Tenancy und Rollen (owner/admin/editor/viewer) — Milestone 1
- ✓ Projekte (mehrere pro Workspace), Archivierung — Milestone 1
- ✓ LOP-Punkte: Status (offen/in_bearbeitung/abgeschlossen), Priorität, Verantwortlicher, Fälligkeitsdatum, Ergebnis — Milestone 1
- ✓ KI-Transkript-Verarbeitung: BYOK (Anthropic, OpenAI, Azure, Ollama) — Milestone 2
- ✓ Freemium-Pläne (free/beta/pro) mit Plan-Gates — Milestone 3
- ✓ Friends-Code-System für Beta-Zugang — Milestone 3
- ✓ Mollie-Zahlung (SEPA, DSGVO-konform) — Milestone 3
- ✓ E-Mail-Digest (Mo–Fr 16:00 UTC via Resend) — Milestone 4
- ✓ Gast-Ansicht (öffentlicher Link ohne Login) — Milestone 4
- ✓ Workspace-Branding (Logo, Farbe, Projekt-Override) — Milestone 5
- ✓ XLSX-Export und -Import für LOP-Listen — Milestone 5
- ✓ Mehrsprachigkeit: DE/EN via next-intl (cookie-basiert) — Milestone 5
- ✓ Externe Links pro LOP-Punkt (migration 021) — Milestone 6
- ✓ ContextNotes aus Transkripten (kollabierbar, inline-edit, sortiert) — Milestone 6
- ✓ LOP-Inhaltsübersetzung on-the-fly via BYOK (nur Browser-State) — Milestone 6
- ✓ KPI: Verantwortliche-Übersicht, Ø Bearbeitungszeit auf Projektseite — Milestone 6
- ✓ Super-Admin Dashboard: globale KPIs, Workspace-Liste, Aktivitäts-Feed — Milestone 6
- ✓ Steuerung: Friends-Code Nutzungsverifikation (Aktiv/Nicht genutzt) — Milestone 6

### Active

- [ ] Aufgaben-Abhängigkeiten / Wave-Execution im LOP (inspiriert durch GSD)
- [ ] Desktop App (Electron) für lokale Audio-Aufnahme — in Vorbereitung
- [ ] Notion-Integration (bidirektionaler Sync) — MCP vorhanden

### Out of Scope

- Eigenes LLM-Hosting — Bewusst BYOK: kein Datenschutzrisiko, keine Infrastrukturkosten
- Native Mobile App — Web-first; Desktop über Electron
- Eigene E-Mail-Zustellung ohne Resend — Resend ist gesetzt
- Vollständige Offline-Fähigkeit — Supabase Realtime ist zentral

## Context

**Tech Stack:**
- Next.js 14 App Router, TypeScript, Tailwind CSS v3
- Supabase (Auth + Postgres + Storage): `lgnlviezjdvxgmknmfog.supabase.co`
- Vercel Deployment, Branch: `claude/github-automated-access-WVPL6`
- Mollie (Zahlungen), Resend (E-Mail), next-intl (i18n)

**Datenbankstand:**
- 21 Migrationen deployed (001–021)
- Tabellen: workspaces, workspace_members, projects, project_members, lop_items, transcripts, project_context_notes, workspace_llm_config, friends_codes, super_admins, invoices, slack_webhooks, notion_integrations

**Architektur-Entscheidungen:**
- Service-Role-Client für alle Workspace-Operationen (RLS-Rekursion vermieden)
- `resolveWorkspace()` immer statt direktem Slug-Lookup
- Fallback-SELECT-Pattern für neue Spalten vor Migration

**Nutzer-Feedback (letztes Milestone):**
- ContextNotes zu viel Platz → eingeklappt by default ✓
- LOP-Liste bei DE/EN-Wechsel übersetzen → BYOK-Translation ✓
- Admin-Bereich für Nutzungsanalyse → aufgebaut ✓
- Friends-Codes: unklar ob genutzt → Aktiv-Badge ✓

## Constraints

- **Security**: Service-Role-Key nur server-side; ENCRYPTION_SECRET für API-Keys
- **Compliance**: DSGVO; Mollie für EU-Zahlungen; keine US-Zahlungsanbieter
- **Build**: `npm run build` schlägt lokal fehl (Google Fonts kein Internet); nur `npx tsc --noEmit` lokal
- **ESLint**: prefer-const, no-unused-expressions, no-unused-vars (^_-Prefix) — alle Errors, kein Bypass
- **Git**: Pre-Push Hook bumpt Version automatisch; Branch `claude/github-automated-access-WVPL6`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| BYOK statt eigene LLM-Keys | Kein Datenschutzrisiko, keine Kosten | ✓ Gut |
| Supabase Service-Role für workspace_members | RLS-Policy kann sich nicht selbst referenzieren | ✓ Gut |
| Fallback-SELECT für neue Spalten | Zero-downtime vor Migration | ✓ Gut |
| Mollie statt Stripe | EU/SEPA, DSGVO-konform | ✓ Gut |
| next-intl cookie-basiert statt URL-Prefix | Einfachere Routing-Logik | ✓ Gut |
| LOP-Übersetzung nur Browser-State | Kein DB-Overhead, keine versehentlichen Überschreibungen | ✓ Gut |
| GSD als Dev-Workflow ab Milestone 7 | Besseres Kontext-Management über Sessions | — Pending |

---
*Last updated: 2026-04-16 — GSD Setup, nach Milestone 6 Abschluss*
