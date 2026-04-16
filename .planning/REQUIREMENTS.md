# Requirements: AutoToDo

**Defined:** 2026-04-16 (rekonstruiert aus Tasks.md + Brief.md + feedback.md)
**Core Value:** Meeting-Nachfolge ohne manuelle Arbeit — Transkript hochladen → LOP sofort strukturiert

## Meilensteine 1–17 — ABGESCHLOSSEN ✓

Vollständige Historie in `Tasks.md`. Highlights:

- ✓ Auth, Workspaces, Rollen, Onboarding-Wizard, Einladungs-Flow
- ✓ LOP-Tabelle: Inline-Edit, Filter, Daily-Standup-Modus, Ähnliche-Punkte-Merge
- ✓ KI-Pipeline BYOK: Anthropic, OpenAI, Azure, Perplexity, Groq, Ollama (extraction + transcription Rollen)
- ✓ KI-Review-Panel (Konfidenz-Badges, Annehmen/Ablehnen), Whisper-Halluzinations-Erkennung
- ✓ LOP-Übersetzung on-the-fly (Browser-State, Globe-Button, locale=EN)
- ✓ ContextNotes: kollabiert, Truncation, Inline-Edit, Wichtigkeits-Sortierung
- ✓ Externe Links pro LOP-Punkt (JSONB, migration 021)
- ✓ Projekt-KPIs: % fertig, Ø Bearbeitungszeit, Offen pro Verantwortlichem
- ✓ XLSX-Export + XLSX-Import (Abgleich mit bestehender LOP)
- ✓ Workspace- und Projekt-Branding (Logo, --brand Farbe, branding_inherited)
- ✓ Mehrsprachigkeit DE/EN (next-intl, cookie-basiert)
- ✓ E-Mail-Digest Mo–Fr (Resend, Vercel Cron), Digest-Toggle
- ✓ REST API v1 + API-Key-Verwaltung + Webhooks (HMAC-SHA256)
- ✓ Freemium-Pläne (beta/free/solo/team/business) + Plan-Gates
- ✓ Friends-Codes für Beta-Zugang
- ✓ Notion-Integration: Token-Auth + Import als Transkript
- ✓ AGB, Datenschutz, Impressum, AVV, Cookie-Banner (DSGVO)
- ✓ Super-Admin Dashboard: KPIs, Workspace-Liste, Aktivitäts-Feed, Code-Nutzung
- ✓ Tauri Desktop App (M17, separates Repo): Recorder, Whisper, Update-Checker, macOS/Windows
- ✓ PWA-Manifest, `/record`-Seite, Groq Whisper-Provider

## Meilenstein 18 — AKTIV

### Infrastruktur-Migration

- [ ] **INFRA-01**: Hetzner CX32 einrichten + Coolify installieren
- [ ] **INFRA-02**: Self-hosted Supabase auf Hetzner deployen
- [ ] **INFRA-03**: Datenmigration Supabase Cloud → Self-hosted
- [ ] **INFRA-04**: AutoToDo in Coolify deployen + DNS umstellen
- [ ] **INFRA-05**: Stündlichen pg_dump-Sync zu Supabase Cloud einrichten

*(Details in `docs/hetzner-migration-plan.md`)*

### UX-Verbesserungen (offen aus Tasks.md)

- [ ] **UX-01**: Landing Page Hero-Illustration + Feature-Screenshots
- [ ] **UX-02**: Dark Mode
- [ ] **UX-03**: PWA Offline-Fallback-Seite
- [ ] **UX-04**: WorkspaceNav: Projekt-Logo anzeigen auf Projekt-Seite (M13.7 offen)

### LOP-Erweiterungen (Ideen)

- [ ] **LOP-05**: Aufgaben-Abhängigkeiten ("wartet auf" zwischen LOP-Punkten)

## Backlog (M19+)

- SSO (SAML für Enterprise-Plan)
- Custom Domain Subdomain-Routing (`[slug].autotodo.vencly.com`)
- Projektvorlagen / wiederkehrende Meetings
- Slack/Teams Benachrichtigungen (Infrastruktur in M8 bereits vorbereitet)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Eigenes LLM-Hosting | BYOK-Strategie gesetzt |
| Stripe / PayPal | Mollie (EU/DSGVO) gesetzt |
| Native iOS/Android App | Tauri Desktop + PWA deckt Bedarf |
| Eigene E-Mail-Infrastruktur | Resend gesetzt |

---
*Last updated: 2026-04-16 — aus Tasks.md M1–M17 rekonstruiert*
