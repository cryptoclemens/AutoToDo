# AutoToDo Roadmap

## Meilensteine 1–17 — ABGESCHLOSSEN ✓

Vollständige Aufgaben-Historie in `Tasks.md`.

| Meilenstein | Inhalt |
|-------------|--------|
| M1–M6b | SaaS-Kern: Auth, Workspace, LOP, Transkript-Upload, Branding, Vercel |
| M7–M7e | API, Webhooks, Digest, Branding, Rechtliches, Einstellungen-Hub |
| M8 | Audit-Log, Rollenverwaltung |
| M9/M11 | Mollie-Infrastruktur, Freemium-Modell, Gast-System |
| M9.5 | Mehrsprachigkeit DE/EN (next-intl) |
| M10/M12 | UX-Polish, Daily-Standup-Modus, Glasmorphismus-Navbar |
| M13 | Projekt-Level-Branding (migration 016) |
| M14 | Notion-Integration, Digest-Diagnose |
| M15 | PWA, Audio-Aufnahme, Groq, Multi-Role LLM (migration 019) |
| M16 | Nutzer-Feedback 02.04: Escape-Bug, Status-Dropdown, Duplikat-KI, Tooltips |
| M17 | Tauri Desktop-App (separates Repo), `/desktop`-Seite |
| M17+ | Admin-Dashboard, ContextNotes, LOP-Links, KPI-Erweiterungen, GSD-Setup |

---

## Meilenstein 18 — AKTIV
*Infrastruktur-Migration · UX-Restarbeiten*

### Phase 18.1 — Hetzner-Migration
**Ziel:** Self-hosted Supabase + Coolify auf Hetzner CX32
**Basis:** `docs/hetzner-migration-plan.md` enthält den vollständigen Plan
**Wave:**
  - Wave A (parallel): Hetzner CX32 einrichten, Coolify installieren, Self-hosted Supabase deployen
  - Wave B (nach Wave A): Datenmigration, AutoToDo deployen, DNS umstellen
  - Wave C (nach Wave B): Stündlichen pg_dump-Sync einrichten, Monitoring

### Phase 18.2 — UX-Restarbeiten
**Ziel:** Offene Items aus M10/M13
**Wave:**
  - Wave A (parallel): Dark Mode, PWA Offline-Fallback, WorkspaceNav Projekt-Logo
  - Wave B: Landing Page Hero-Illustration + Feature-Screenshots

---

## Meilenstein 19 — BACKLOG
*LOP-Erweiterungen · Enterprise*

### Phase 19.1 — Aufgaben-Abhängigkeiten
**Ziel:** LOP-Punkte können voneinander abhängig sein ("wartet auf")
**Requires:** Migration 022 (depends_on UUID-Spalte)
**Wave:**
  - Wave A (parallel): Migration, PATCH-Route update, TypeScript-Typen
  - Wave B (nach A): UI — Dialog-Erweiterung, Tabellen-Badge, Warn-Logik

### Phase 19.2 — Subdomain-Routing
**Ziel:** `[slug].autotodo.vencly.com` via Vercel Wildcard Domain
**Note:** Infrastruktur für Slug-Routing in resolveWorkspace() bereits vorbereitet

### Phase 19.3 — SSO (SAML)
**Ziel:** Enterprise-Plan: SAML-SSO via Supabase Auth
**Depends on:** Business-Plan aktiv + zahlender Kunde

---

## Backlog (999.x)

- 999.1 Projektvorlagen / wiederkehrende Meetings
- 999.2 Slack/Teams Benachrichtigungen (Webhook-Infrastruktur M8 vorhanden)
- 999.3 Native Mobile App (nach PWA-Validation)
- 999.4 Öffentliche Docs-Seite für REST API v1
