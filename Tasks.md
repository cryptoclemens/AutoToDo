# AutoToDo – Aufgaben & Meilensteine

Letzte Aktualisierung: 19.05.2026 · Version 0.1.198 · M1–M18 erledigt

---

## Phase 1 – SaaS-Kern

### Meilenstein 1: Projektinfrastruktur

| # | Aufgabe | Status |
|---|---|---|
| 1.1 | Brief.md erstellen (Projektscope) | ✅ Erledigt |
| 1.2 | Tasks.md erstellen (Meilenstein-Tracking) | ✅ Erledigt |
| 1.3 | Next.js 14 Projekt initialisieren (TypeScript, Tailwind, shadcn/ui) | ✅ Erledigt |
| 1.4 | Supabase SSR einrichten (client.ts, server.ts, middleware-helper) | ✅ Erledigt |
| 1.5 | Datenbankschema deployen (Migration 001) | ✅ Erledigt |
| 1.6 | RLS-Policies deployen (Migration 002) | ✅ Erledigt |
| 1.7 | Indexes deployen (Migration 003) | ✅ Erledigt |
| 1.8 | Subdomain-Routing Middleware implementieren | ✅ Erledigt |
| 1.9 | README.md erstellen | ✅ Erledigt |
| 1.10 | Initialer Git-Commit & Push | ✅ Erledigt |

### Meilenstein 2: Authentifizierung & Workspace-Erstellung

| # | Aufgabe | Status |
|---|---|---|
| 2.1 | Supabase Auth: Registrierung-Page + Workspace-Erstellung | ✅ Erledigt |
| 2.2 | Supabase Auth: Login-Page | ✅ Erledigt |
| 2.3 | Supabase Auth: Passwort-Reset + Update-Password-Page | ✅ Erledigt |
| 2.4 | Auth-Callback Route (`/auth/callback`) | ✅ Erledigt |
| 2.5 | Encryption-Modul (AES-256-GCM) | ✅ Erledigt |

### Meilenstein 3: Onboarding

| # | Aufgabe | Status |
|---|---|---|
| 3.1 | Onboarding-Wizard Schritt 1: Workspace einrichten | ✅ Erledigt |
| 3.2 | Onboarding-Wizard Schritt 2: Erstes Projekt anlegen | ✅ Erledigt |
| 3.3 | Onboarding-Wizard Schritt 3: Team einladen | ✅ Erledigt |
| 3.4 | Einladungs-Flow: Token-Generierung + E-Mail (Resend) | ✅ Erledigt |
| 3.5 | Einladungs-Flow: `/invite/[token]` Seite | ✅ Erledigt |

### Meilenstein 4: Kern-App

| # | Aufgabe | Status |
|---|---|---|
| 4.1 | Dashboard: Projekt-Übersicht | ✅ Erledigt |
| 4.2 | Projekt-CRUD (anlegen, archivieren) | ✅ Erledigt |
| 4.3 | LOP-Tabelle (Inline-Edit, Status-Toggle) | ✅ Erledigt |
| 4.4 | LOP-Filter (Status, Priorität, Suche) | ✅ Erledigt |
| 4.5 | LOP-Punkt manuell anlegen | ✅ Erledigt |
| 4.6 | StatusBadge & PriorityBadge Komponenten | ✅ Erledigt |

### Meilenstein 4b: Versions-Management

| # | Aufgabe | Status |
|---|---|---|
| 4b.1 | Versions-Badge (fixed, unten rechts) auf Landing Page | ✅ Erledigt |
| 4b.2 | `scripts/bump-version.sh` – automatischer Patch-Bump | ✅ Erledigt |
| 4b.3 | `scripts/install-hooks.sh` – pre-push Hook Installation | ✅ Erledigt |
| 4b.4 | `resolveJsonModule: true` in tsconfig (Import von package.json) | ✅ Erledigt |

### Meilenstein 5: Transkript-Verarbeitung

| # | Aufgabe | Status |
|---|---|---|
| 5.1 | Transkript-Upload UI (.txt) | ✅ Erledigt |
| 5.2 | Supabase Storage: verschlüsselter Upload | ✅ Erledigt |
| 5.3 | LLM-Abstraktionsschicht (types, factory) | ✅ Erledigt |
| 5.4 | Anthropic-Integration | ✅ Erledigt |
| 5.5 | OpenAI-Integration | ✅ Erledigt |
| 5.13 | Perplexity AI Integration (Sonar, Sonar Pro, Sonar Reasoning Pro) | ✅ Erledigt |
| 5.6 | BYOK: LLM-Key speichern/abrufen (verschlüsselt) | ✅ Erledigt |
| 5.7 | Verarbeitungs-Pipeline (processTranscript) | ✅ Erledigt |
| 5.8 | Konfidenz-Schwellwert-System | ✅ Erledigt |
| 5.9 | KI-Vorschläge Review-Flow (ReviewBanner + AiReviewPanel) | ✅ Erledigt |
| 5.10 | Fehlerbehandlung & Retry-Logik | ✅ Erledigt |
| 5.11 | Inline-Verarbeitung (kein fire-and-forget, Vercel-kompatibel) | ✅ Erledigt |
| 5.12 | Retry-Button für hängende Transkripte in der UI | ✅ Erledigt |

### Meilenstein 6: Export & Basis-Branding

| # | Aufgabe | Status |
|---|---|---|
| 6.1 | XLSX-Export (SheetJS) | ✅ Erledigt |
| 6.2 | Akzentfarbe CSS Custom Property (`--brand`) | ✅ Erledigt |
| 6.3 | BrandProvider Komponente | ✅ Erledigt |
| 6.4 | LLM-Einstellungen UI (`/settings/llm`) | ✅ Erledigt |

### Meilenstein 6b: Vercel-Deployment & Auth-Fixes

| # | Aufgabe | Status |
|---|---|---|
| 6b.1 | Vercel-Deployment einrichten | ✅ Erledigt |
| 6b.2 | Middleware auf Single-Domain umgestellt (resolveWorkspace-Fallback) | ✅ Erledigt |
| 6b.3 | `resolveWorkspace()`-Helper (slug → membership-Fallback) | ✅ Erledigt |
| 6b.4 | RLS-Rekursion in `workspace_members` behoben (Migration 005) | ✅ Erledigt |
| 6b.5 | E-Mail-Bestätigung: `/auth/callback` Route | ✅ Erledigt |
| 6b.6 | Passwort-Reset: `/update-password` Page | ✅ Erledigt |
| 6b.7 | Alle API-Routes auf `resolveWorkspace()` migriert | ✅ Erledigt |
| 6b.8 | `TranscriptUploadForm`: Server→Client-Prop-Bug behoben (`router.refresh()`) | ✅ Erledigt |
| 6b.9 | `/settings/members` Team-Übersicht angelegt | ✅ Erledigt |
| 6b.10 | Button "Transkript hochladen" mit Brand-Farbe | ✅ Erledigt |
| 6b.11 | CLAUDE.md mit Projektregeln & Fallstricken angelegt | ✅ Erledigt |

### Meilenstein 6c: UX-Features & Provider-Erweiterung

| # | Aufgabe | Status |
|---|---|---|
| 6c.1 | LOP-Filter nach Verantwortlichem | ✅ Erledigt |
| 6c.2 | LOP-Detail-Dialog (Titelklick → Popup mit allen Feldern, editierbar) | ✅ Erledigt |
| 6c.3 | Transkript-Upload: Textarea (Copy & Paste) als primäre Eingabe | ✅ Erledigt |
| 6c.4 | Transkript-Upload: optionaler Datei-Upload (.txt + .rtf) | ✅ Erledigt |
| 6c.5 | Azure OpenAI (Microsoft Copilot) als LLM-Provider | ✅ Erledigt |
| 6c.6 | LLM-Settings: Endpoint-URL-Feld für Azure | ✅ Erledigt |
| 6c.7 | LLM-Settings: Custom Deployment-Name für Azure | ✅ Erledigt |
| 6c.8 | Migration 006: `endpoint`-Spalte in `workspace_llm_config` | ✅ Erledigt |
| 6c.9 | Projekttitel inline editierbar (Stift-Icon bei Hover) | ✅ Erledigt |
| 6c.10 | PATCH `/api/projects/[id]` – Name & Beschreibung ändern | ✅ Erledigt |
| 6c.11 | Placeholder im Neues-Projekt-Formular angepasst | ✅ Erledigt |
| 6c.12 | `/projects`-Seite: redirect auf Dashboard (404 behoben) | ✅ Erledigt |

### Meilenstein 6d: Einladungssystem

| # | Aufgabe | Status |
|---|---|---|
| 6d.1 | Einladungs-UI auf Projektseite (`ProjectInviteButton`) | ✅ Erledigt |
| 6d.2 | Einladungs-UI auf Team-Seite (`WorkspaceInviteForm`) | ✅ Erledigt |
| 6d.3 | API gibt Einladungslinks zurück (zum manuellen Kopieren) | ✅ Erledigt |
| 6d.4 | Mehrere E-Mails per Komma/Leerzeichen trennbar | ✅ Erledigt |
| 6d.5 | Rollenwahl bei Einladung (Editor, Betrachter, Projekt-Admin, Admin) | ✅ Erledigt |
| 6d.6 | Projektspezifische Mitgliedschaft (`project_members`-Tabelle) | ✅ Erledigt (M7.9) |
| 6d.7 | E-Mail-Versand über Resend | ✅ Erledigt (M7.10, bedingt via `RESEND_API_KEY`) |

---

## Phase 2 – SaaS-Features

### Meilenstein 7: Custom Branding & API

| # | Aufgabe | Status |
|---|---|---|
| 7.1 | Logo-Upload (Supabase Storage) | ✅ Erledigt |
| 7.2 | XLSX-Export mit Workspace-Branding | ✅ Erledigt |
| 7.3 | API-Key-Verwaltung UI | ✅ Erledigt |
| 7.4 | API-Key-Validierung (`lib/apiKeyAuth.ts`, SHA-256) | ✅ Erledigt |
| 7.5 | Öffentliche REST API: `/api/v1/projects` | ✅ Erledigt |
| 7.6 | Öffentliche REST API: `/api/v1/lop` | ✅ Erledigt |
| 7.7 | Öffentliche REST API: `/api/v1/transcripts` | ✅ Erledigt |
| 7.8 | Feedback-Button (unten links, mit Kategorie-Auswahl) | ✅ Erledigt |
| 7.9 | Projektspezifische Mitgliedschaft (`project_members`-Tabelle) | ✅ Erledigt |
| 7.10 | E-Mail-Versand für Einladungen (Resend, bedingt via `RESEND_API_KEY`) | ✅ Erledigt |
| 7.11 | „How to"-Popup in Navigation (6-Schritte-Tour mit UI-Mockups) | ✅ Erledigt |
| 7.12 | Projekt-KPIs: offen/in Bearbeitung/abgeschlossen, % fertig, Ø Bearbeitungszeit | ✅ Erledigt |
| 7.13 | Feedback-Route resilient (DB-Fallback) + GitHub-Speicherung in `feedback.md` | ✅ Erledigt |

### Meilenstein 7b: Rechtliches & Compliance

| # | Aufgabe | Status |
|---|---|---|
| 7b.1 | Datensicherheits-Popup in Navigation + Landing Page | ✅ Erledigt |
| 7b.2 | AGB-Text (rechtssicher, DSGVO-konform, im Popup lesbar) | ✅ Erledigt |
| 7b.3 | Datenschutzerklärung (DSGVO Art. 13/14, TDDDG, im Popup lesbar) | ✅ Erledigt |
| 7b.4 | AGB + Datenschutz in Footer der Landing Page | ✅ Erledigt |
| 7b.5 | Pflichtakzeptanz AGB + Datenschutz bei Registrierung (Checkbox + Popup-Links) | ✅ Erledigt |
| 7b.6 | Akzeptanz-Zeitstempel in DB speichern (`legal_accepted_at`, `legal_version`) | ✅ Erledigt |
| 7b.7 | Auftragsverarbeitungsvertrag (AVV) als Download/PDF | ✅ Erledigt |
| 7b.8 | Cookie-Hinweis / Consent-Banner (§ 25 TDDDG, nur bei Bedarf) | ✅ Erledigt |
| 7b.9 | Impressum-Seite (`/impressum`) | ✅ Erledigt |

### Meilenstein 7c: KI-Review-Panel & Sicherheits-Härtung

| # | Aufgabe | Status |
|---|---|---|
| 7c.1 | KI-Vorschläge: expandierbares Review-Panel (statt nur Filter) | ✅ Erledigt |
| 7c.2 | Review-Panel: Inline-Editierung aller Felder pro Vorschlag | ✅ Erledigt |
| 7c.3 | Review-Panel: Annehmen (speichert + löscht requires_review) | ✅ Erledigt |
| 7c.4 | Review-Panel: Ablehnen (löscht Vorschlag mit Bestätigung) | ✅ Erledigt |
| 7c.5 | Review-Panel: Konfidenz-Badge (grün/gelb/rot) + Quellentext | ✅ Erledigt |
| 7c.6 | Statisches Pentesting / Security-Audit (Subagent) | ✅ Erledigt |
| 7c.7 | `decrypt()` Error-Handling (Stack-Trace-Exposure verhindert) | ✅ Erledigt |
| 7c.8 | Security Headers: HSTS, X-Frame-Options DENY, nosniff, XSS-Protection, Referrer-Policy, Permissions-Policy | ✅ Erledigt |
| 7c.9 | API v1 GET-Endpunkte: explizite `read`-Scope-Prüfung | ✅ Erledigt |
| 7c.10 | UUID-Format-Validierung auf Query-Parameter (`projectId`) | ✅ Erledigt |
| 7c.11 | Einladungs-Token: `randomBytes(32)` statt `randomUUID()` (256 Bit) | ✅ Erledigt |
| 7c.12 | Datensicherheits-Popup + Landing Page mit aktuellen TOMs aktualisiert | ✅ Erledigt |

### Meilenstein 7d: Vencly-Branding & Einstellungen-Hub

| # | Aufgabe | Status |
|---|---|---|
| 7d.1 | Vencly-Logo SVG (`public/vencly-logo.svg`) – Gradient-V + Text | ✅ Erledigt |
| 7d.2 | Favicon als Gradient-V (`app/icon.svg`) | ✅ Erledigt |
| 7d.3 | Vencly-Logo oben links in Landing-Page-Nav (Link → www.vencly.com) | ✅ Erledigt |
| 7d.4 | Vencly-Logo unten rechts im Dashboard-Layout (Link → www.vencly.com) | ✅ Erledigt |
| 7d.5 | LegalModal: Impressum-Tab (vencly GmbH, § 5 TMG, HRB 290524) | ✅ Erledigt |
| 7d.6 | AGB & Datenschutzerklärung: Betreiber auf vencly GmbH aktualisiert | ✅ Erledigt |
| 7d.7 | Footer Landing Page: Impressum-Link + Copyright vencly GmbH | ✅ Erledigt |
| 7d.8 | Einstellungen-Hub `/settings`: Tabbed UI (Konto, Workspace, Team, KI, API-Keys) | ✅ Erledigt |
| 7d.9 | AccountSettings: E-Mail-Adresse ändern (Supabase auth.updateUser) | ✅ Erledigt |
| 7d.10 | AccountSettings: Passwort ändern (Supabase auth.updateUser) | ✅ Erledigt |
| 7d.11 | WorkspaceNav: Dropdown auf einzelnen „Einstellungen"-Link konsolidiert | ✅ Erledigt |
| 7d.12 | Registrierung Schritt 3 (optional): KI-Anbieter + API-Key beim Onboarding | ✅ Erledigt |
| 7d.13 | Registrierung: Fortschrittsbalken (1/3, 2/3, 3/3) | ✅ Erledigt |

### Meilenstein 7e: E-Mail-Digest & Verantwortlichen-Verknüpfung

| # | Aufgabe | Status |
|---|---|---|
| 7e.1 | Migration 008: `lop_items.responsible_user_id` + `workspaces.digest_enabled` + RPC `get_workspace_members_with_email` | ✅ Erledigt |
| 7e.2 | API `GET /api/members`: Workspace-Mitglieder mit E-Mail via RPC | ✅ Erledigt |
| 7e.3 | `ResponsibleSelect`-Komponente + LOP-Tabelle, Detail-Dialog, Inline-Edit, Hinzufügen-Formular | ✅ Erledigt |
| 7e.4 | Freitext-Fallback: Legacy-Einträge ohne `responsible_user_id` → Freitext-Input mit ↩-Button | ✅ Erledigt |
| 7e.5 | Täglicher Digest-Cron Job (`/api/cron/daily-digest`, Vercel Cron Mo–Fr 17 Uhr) | ✅ Erledigt |
| 7e.6 | Digest-Logik: offene & in_bearbeitung-Punkte je Verantwortlichem, über alle Workspaces aggregiert | ✅ Erledigt |
| 7e.7 | Digest-E-Mail via Resend Fetch-API: offene Punkte + Fälligkeitsdatum (überfällig rot markiert) | ✅ Erledigt |
| 7e.8 | Digest-E-Mail: Direktlink „Zur Liste →" je Projekt | ✅ Erledigt |
| 7e.9 | Responsives HTML-E-Mail-Template (AutoToDo-Header, Tabelle, Footer mit Einstellungslink) | ✅ Erledigt |
| 7e.10 | Digest-Toggle in Settings → Workspace-Tab (On/Off-Switch, sofortige Speicherung) | ✅ Erledigt |
| 7e.11 | Projektitel: Zeilenumbrüche via `Shift+Enter` (Textarea statt Input, `whitespace-pre-line`) | ✅ Erledigt |
| 7e.12 | LOP-Button „+ LOP-Punkt manuell hinzufügen" neben „+ Mitglied einladen" im Header | ✅ Erledigt |

### Meilenstein 7f: Nutzer-Feedback (aus feedback.md)

| # | Aufgabe | Quelle | Status |
|---|---|---|---|
| 7f.1 | XLSX-Reimport: offline bearbeitete LOP-Datei hochladen & mit bestehender LOP abgleichen (Spalten-Mapping, Konflikterkennung) | Feature-Wunsch 2026-03-27 | ✅ Erledigt |
| 7f.2 | Statusanzeige: Rohwerte (`in_bearbeitung`) prüfen & überall durch lesbare Labels ersetzen – v. a. in Tooltips, XLSX-Spaltenköpfen, API-Responses | Bug 2026-03-27 | ✅ Erledigt |

### Meilenstein 8: Webhooks & Audit

| # | Aufgabe | Status |
|---|---|---|
| 8.1 | Webhook-Endpoints UI (Registrierung) | ✅ Erledigt |
| 8.2 | Webhook-Dispatcher (HMAC-SHA256) | ✅ Erledigt |
| 8.3 | Retry-Logik (exponential backoff, 3 Versuche) | ✅ Erledigt |
| 8.4 | Audit-Log UI | ✅ Erledigt |
| 8.5 | Rollenverwaltung UI (granulare Berechtigungen) | ✅ Erledigt |

---

## Phase 3 – Wachstum (optional)

| # | Aufgabe | Status |
|---|---|---|
| 9.1 | Mollie-Billing (Free/Solo/Team/Business) | ✅ Erledigt (Code vollständig; aktiviert sobald MOLLIE_API_KEY gesetzt) |
| 9.2 | Custom Domain `autotodo.vencly.com` | ✅ DNS konfiguriert (Cloudflare CNAME → Vercel, Supabase Redirect URLs gesetzt) |
| 9.3 | E-Mail-Benachrichtigungen (Resend) | ✅ Erledigt (Invite + Digest) |
| 9.4 | Slack/Teams-Integration via Webhook | ✅ Erledigt (Webhook-URL + Test-Button, Teams/Power-Automate-URLs unterstützt) |
| 9.6 | SSO (SAML für Enterprise) | 🔲 Offen (Business-Plan vorgesehen) |

---

## Phase 5 – Freemium-Monetarisierung

### Meilenstein 11: Freemium-Modell

| # | Aufgabe | Status |
|---|---|---|
| 11.1 | Migration 011: `plan`-Spalte auf `workspaces`, `project_guests`, `workspace_usage` | ✅ Erledigt |
| 11.2 | `lib/plans.ts`: Tier-Limits als zentrale Konfiguration (Beta/Free/Solo/Team/Business) | ✅ Erledigt |
| 11.3 | `lib/plan-gate.ts`: Serverseitige Gate-Funktionen für Projekte, Transkripte, Seats, Gäste | ✅ Erledigt |
| 11.4 | API Routes mit Plan-Gates absichern (POST /api/projects, POST /api/transcripts, POST /api/settings/members) | ✅ Erledigt |
| 11.5 | Gast-System: `POST /api/projects/[id]/guests`, Gast-Einladungsseite `/guest/[token]` | ✅ Erledigt |
| 11.6 | Billing-Seite `/settings/billing`: Plan-Badge, Nutzungsbalken, Upgrade-Karten | ✅ Erledigt |
| 11.7 | `UpgradeNudge`-Komponente für alle Gate-Punkte in der UI | ✅ Erledigt |
| 11.8 | Landing Page Pricing: neue Tiers (Free/Solo/Team/Business), Beta-Banner, FAQ | ✅ Erledigt |
| 11.9 | Stripe-Infrastruktur: Platzhalter `lib/stripe.ts`, Webhook- und Checkout-Routes | ✅ Erledigt |
| 11.10 | `scripts/migrate-beta-to-free.ts`: Grandfathering-Skript (90 Tage) | ✅ Erledigt |

### Meilenstein 9.5: Mehrsprachigkeit (DE / EN)

| # | Aufgabe | Status |
|---|---|---|
| 9.5.1 | i18n-Bibliothek einrichten (`next-intl` oder `next-i18next`) | ✅ Erledigt |
| 9.5.2 | Sprachumschalter in Nav (DE / EN, persistiert in Cookie) | ✅ Erledigt |
| 9.5.3 | Landing Page vollständig auf Englisch (Hero, Features, Pricing, Footer) | ✅ Erledigt |
| 9.5.4 | App-UI auf Englisch (Dashboard, LOP-Tabelle Filter/Header, StatusBadge, PriorityBadge, WorkspaceNav) | ✅ Erledigt |
| 9.5.5 | Rechtliche Seiten auf Englisch (LegalPageShell Nav/Footer übersetzt, Inhalt bleibt DE da deutsches Recht) | ✅ Erledigt |
| 9.5.6 | Onboarding & Registrierung auf Englisch (Login-Titel/Subtitle via getTranslations) | ✅ Erledigt |
| 9.5.7 | Einstellungsseiten vollständig übersetzt (Account, Branding, Invite, LLM, API-Keys, Rollen) | ✅ Erledigt |
| 9.5.8 | „How to"-Popup auf Englisch | ✅ Erledigt |
| 9.5.9 | Fehlermeldungen & Toast-Nachrichten lokalisiert (alle Komponenten auf useTranslations) | ✅ Erledigt |
| 9.5.10 | JSON-Translations: deutsche Anführungszeichen `„text"` mit `»text«` ersetzen (JSON-Parse-Fehler) | ✅ Erledigt |

---

## Phase 4 – UX-Polish & Legal

### Meilenstein 10: Layout-Optimierung & Impressum

| # | Aufgabe | Status |
|---|---|---|
| 10.1 | Landing Page: Hero-Sektion mit Illustration/Animation | 🔄 Teilweise (CSS-Animationen + Gradient-Blobs live; Illustration offen) |
| 10.2 | Landing Page: Feature-Sektion (Screenshots, Icons, Beschreibungen) | 🔲 Offen |
| 10.3 | Landing Page: Pricing-Tabelle (Free / Starter / Pro / Enterprise) | 🔲 Offen |
| 10.4 | App-Layout: Navigation verfeinern (Icons, aktiver Zustand) | ✅ Erledigt |
| 10.5 | App-Layout: Responsive Mobile-Ansicht (Hamburger-Menu, Drawer) | ✅ Erledigt |
| 10.6 | Dashboard: Statistik-Karten (offene Punkte, überfällig, erledigt, gesamt) | ✅ Erledigt |
| 10.7 | LOP-Tabelle: überfällige Fälligkeitsdaten rot + Warnsymbol | ✅ Erledigt |
| 10.8 | Loading-States & Skeleton-Screens (dashboard/loading.tsx, projects/[id]/loading.tsx) | ✅ Erledigt |
| 10.9 | Dark-Mode-Unterstützung (optional) | 🔲 Offen |
| 10.10 | Impressum-Seite (`/impressum`) | ✅ Erledigt (M7b.9) |
| 10.11 | Datenschutzerklärung (`/datenschutz`) | ✅ Erledigt (M7b.3) |
| 10.12 | Footer auf Landing Page (Links: Impressum, Datenschutz, Kontakt) | ✅ Erledigt (M7b.4) |
| 10.13 | Cookie-Hinweis / Consent-Banner (DSGVO) | ✅ Erledigt (M7b.8) |

### Meilenstein 12: UI/UX-Modernisierung & Daily Stand-up

| # | Aufgabe | Status |
|---|---|---|
| 12.1 | Visuelles Redesign: Navbar (Glasmorphismus, backdrop-blur, bessere Schatten) | ✅ Erledigt |
| 12.2 | Visuelles Redesign: Dashboard-Cards (größere Radien, Tiefen-Schatten, moderne Typografie) | ✅ Erledigt |
| 12.3 | Visuelles Redesign: Buttons & Badges (SVG-Icons, Pill-Stil, sattere Farben) | ✅ Erledigt |
| 12.4 | Visuelles Redesign: LOP-Tabellenzeilen (mehr Whitespace, subtile Trennlinien, bessere Hover-States) | ✅ Erledigt |
| 12.5 | Daily Stand-up Modus: Toggle-Button auf LOP-Seite (filtert erledigte Items, sortiert überfällig zuerst) | ✅ Erledigt |
| 12.6 | Daily Stand-up Modus: Sektionen „Überfällig / Heute fällig / Offen / In Bearbeitung" | ✅ Erledigt |
| 12.7 | Daily Stand-up Modus: One-click Status-Toggle direkt in Zeile (ohne Dialog-Öffnen) | ✅ Erledigt |
| 12.8 | Ähnliche LOP-Punkte zusammenführen: Jaccard-Similarity-Check (lib/similarity.ts) | ✅ Erledigt |
| 12.9 | Ähnliche LOP-Punkte zusammenführen: Dialog „Punkte zusammenführen?" mit Vorschau | ✅ Erledigt |

### Meilenstein 13: Projekt-Level-Branding (Sanfte Evolution)

> Workspace-Branding bleibt der Default. Projekte können optional eigenes Logo + Primärfarbe setzen.
> Abwärtskompatibel: `branding_inherited = true` bis explizit überschrieben.

| # | Aufgabe | Status |
|---|---|---|
| 13.1 | Migration `016_project_branding.sql`: `brand_color`, `logo_url`, `branding_inherited BOOLEAN DEFAULT true` auf `projects` | ✅ Erledigt |
| 13.2 | `lib/branding.ts`: Helper `getEffectiveBranding(project, workspace)` mit Fallback-Kette | ✅ Erledigt |
| 13.3 | Dashboard-Cards: Projekt-Logo anzeigen (Fallback auf Workspace-Logo) | ✅ Erledigt |
| 13.4 | Projekt-Page: CSS-Variable `--brand` aus `project.brand_color` | ✅ Erledigt |
| 13.5 | Neue Settings-Route `/settings/projects/[id]/branding` (Logo-Upload + Farbwähler) | ✅ Erledigt |
| 13.6 | API-Endpoint `POST /api/settings/projects/[id]/branding/logo` (Storage-Upload) | ✅ Erledigt |
| 13.7 | WorkspaceNav: Projekt-Logo anzeigen wenn auf Projekt-Seite | 🔲 Offen |
| 13.8 | `app/(app)/layout.tsx`: CSS-Variable `--brand` — Projekt überschreibt via CSS-Kaskade auf Projekt-Page | ✅ Erledigt |
| 13.9 | (Backlog) Subdomain-Routing entfernen als separater Meilenstein | 🔲 Offen |

### Meilenstein 14: Notion-Integration & E-Mail-Digest-Infrastruktur

| # | Aufgabe | Status |
|---|---|---|
| 14.1 | Migration 018: `workspace_notion_configs`-Tabelle + RLS | ✅ Erledigt |
| 14.2 | `lib/notion.ts`: `getNotionToken()` (verschlüsselt aus DB) | ✅ Erledigt |
| 14.3 | `POST /api/settings/integrations/notion`: Token validieren, verschlüsseln, speichern | ✅ Erledigt |
| 14.4 | `POST /api/transcripts/notion-import`: Notion-Seite → Text → Transkript-Pipeline | ✅ Erledigt |
| 14.5 | `NotionIntegrationForm`: 5-Schritt-Anleitung + Token-Eingabe + Status-Banner | ✅ Erledigt |
| 14.6 | Einstellungen: Integrations-Tab (Notion) in `SettingsPageClient` | ✅ Erledigt |
| 14.7 | Transkript-Upload: dritter Tab „Notion" mit URL-Eingabe | ✅ Erledigt |
| 14.8 | Landing Page: Notion-Feature-Karte + „Kompatibel mit"-Liste aktualisiert | ✅ Erledigt |
| 14.9 | How-to-Popup: Schritt 7 für Notion-Import ergänzt | ✅ Erledigt |
| 14.10 | Digest-Diagnose: Dry-Run-Button auf Steuerung-Seite (Super-Admin) | ✅ Erledigt |
| 14.11 | Digest-Test: „Test-E-Mail senden"-Button in Workspace-Einstellungen | ✅ Erledigt |
| 14.12 | Registrierung Schritt 2: Subdomain-Feld entfernt (Slug weiterhin auto-generiert) | ✅ Erledigt |
| 14.13 | Registrierung Schritt 3: Provider-spezifische API-Key-Hinweise mit Direktlinks | ✅ Erledigt |

### Meilenstein 15: AutoToDo Recorder & PWA Audio-Transkription

> Phase 1: Web-App-Infrastruktur (dieses Repo). Phase 2: Tauri Desktop-App (separates Repo).

| # | Aufgabe | Status |
|---|---|---|
| 15.1 | `/api/v1/transcripts`: `storage_path` ergänzt + `runTranscriptProcessing` triggern | ✅ Erledigt |
| 15.2 | `/api/transcripts/audio`: Multipart-Audio → Whisper API (OpenAI/Groq) → Pipeline | ✅ Erledigt |
| 15.3 | `/record` Seite: MediaRecorder UI, Projekt-Auswahl, Meeting-Name, Status-Flow | ✅ Erledigt |
| 15.4 | PWA-Manifest (`app/manifest.ts`): installierbar auf iOS/Android | ✅ Erledigt |
| 15.5 | i18n: `record`-Namespace in de.json + en.json | ✅ Erledigt |
| 15.6 | Navigation: „Aufnahme"-Link in WorkspaceNav (sichtbar für Super-Admins) | ✅ Erledigt |
| 15.7 | PWA: Offline-Fallback-Seite | 🔲 Offen |
| 15.8 | Phase 2: Tauri Desktop-App (separates Repo) – System-Audio + whisper.cpp lokal | 🔲 Offen |
| 15.9 | Groq als Whisper-Provider (whisper-large-v3-turbo, 120 Min/Tag kostenlos) | ✅ Erledigt |
| 15.10 | Multi-Role LLM Config: `extraction` + `transcription` getrennt konfigurierbar (Migration 019) | ✅ Erledigt |
| 15.11 | Mic-Fehler: DOMException-Unterscheidung (permission_denied / no_device / in_use) mit Reload-Hint | ✅ Erledigt |

### Meilenstein 16: Nutzer-Feedback 02.04.2026

| # | Aufgabe | Status |
|---|---|---|
| 16.1 | Bug: Escape-Taste + Klick außerhalb schließt Inline-Edit-Modus ohne Speichern | ✅ Erledigt |
| 16.2 | Bug: Status-Toggle → Dropdown statt Cycling (kein versehentlicher Status-Wechsel mehr) | ✅ Erledigt |
| 16.3 | Feature: Duplikat-Vermeidung – KI prüft vor `create` auf semantisch ähnliche LOP-Punkte | ✅ Erledigt |
| 16.4 | Feature: Umbenennung bestehender Punkte via Transkript (`update` + `title`-Feld) | ✅ Erledigt |
| 16.5 | Feature: Namens-Matching – Workspace-Mitglieder als Kontext an LLM übergeben | ✅ Erledigt |
| 16.6 | Feature: Tooltips (`title`-Attribut) auf abgeschnittenen Zellinhalten (Titel, Beschreibung, Ergebnis) | ✅ Erledigt |
| 16.7 | Feature: Projekt wiederherstellen – `POST /api/projects/[id]/unarchive` + „Wiederherstellen"-Button | ✅ Erledigt |

### Bugfixes (außerhalb Meilensteine)

| # | Aufgabe | Status |
|---|---|---|
| BF.1 | Bearbeitungszeit-KPI: 0-Tage-Items inkl., Anzeige „< 1 Tag" | ✅ Erledigt |
| BF.2 | AiReviewPanel: Rohwerte `in_bearbeitung` → StatusBadge/PriorityBadge | ✅ Erledigt |
| BF.3 | Logo-Upload: Cache-Busting per Timestamp-Dateiname, alte Logos werden gelöscht | ✅ Erledigt |
| BF.4 | Logo-Upload: `logos`-Bucket wird beim ersten Upload automatisch angelegt | ✅ Erledigt |
| BF.5 | Logo-Anzeige: Supabase-Storage-Domain in `next/image` remotePatterns freigeschaltet | ✅ Erledigt |
| BF.6 | LOP-Punkte: erledigte Items sinken nach unten + opacity-60 ausgegraut | ✅ Erledigt |
| BF.7 | E-Mail-Digest: Absender-Domain auf `@vencly.app` korrigiert (war fälschlich `vencly.com`) | ✅ Erledigt |
| BF.8 | E-Mail-Digest: `?dry_run=true`-Modus für Diagnose ohne E-Mail-Versand | ✅ Erledigt |
| BF.9 | Landing Page UX: Plus Jakarta Sans, Lucide-Icons, reduzierte Hover-Effekte | ✅ Erledigt |
| BF.10 | Deployment: `output: standalone` + `sharp` für Coolify/Docker | ✅ Erledigt |
| BF.11 | App-URL Default auf `autotodo.vencly.com` gesetzt (alle API-Routes) | ✅ Erledigt |
| BF.12 | UUID-Anzeige im Verantwortlich-Feld: `@base-ui/react` SelectValue lazy-resolution-Bug umgangen | ✅ Erledigt |
| BF.13 | Landing Page Mobile: Login-Button war mit `hidden sm:block` ausgeblendet | ✅ Erledigt |
| BF.14 | Registrierung: eingeloggter User mit Workspace-Mitgliedschaft wird zu Dashboard weitergeleitet statt Schritt 1 zu überspringen | ✅ Erledigt |
| BF.15 | Button-Konsistenz: alle Sekundär-Buttons auf `variant="outline" size="sm" rounded-lg` vereinheitlicht | ✅ Erledigt |
| BF.16 | `<a><Button>`-Verschachtelung im Export-Button behoben (invalid HTML) | ✅ Erledigt |
| BF.17 | Webhook-Test-Button: URL aus Request-Body statt DB lesen (funktioniert auch vor dem Speichern) | ✅ Erledigt |
| BF.18 | Settings `?tab=ki`: `window.location.search` statt `useSearchParams()` (SSR-Hydration-Bug) | ✅ Erledigt |
| BF.19 | Recorder Mic-Fehler: DOMException-Typen unterscheiden (NotAllowedError/NotFoundError/NotReadableError) | ✅ Erledigt |
| BF.20 | Google Fonts entfernt (`Plus Jakarta Sans`) – Build schlug lokal fehl (kein Internet); System-Font-Stack stattdessen | ✅ Erledigt |
| BF.21 | `next.config.mjs` gelöscht (hatte Priorität über `.js` und übersprang `withNextIntl` → next-intl kaputt) | ✅ Erledigt |
| BF.22 | Desktop-App: `ureq::into_json()` → `into_string()` + `serde_json::from_str()` (json-Feature fehlte) | ✅ Erledigt |
| BF.23 | Desktop-App: `alert()` in bridge.js durch `showNotice()` ersetzt (`dialog.message` auf Remote-URLs blockiert) | ✅ Erledigt |
| BF.24 | Desktop-App: `tauri_plugin_notification` entfernt (injezieret JS in alle WebViews → Konsolen-Fehler) | ✅ Erledigt |
| BF.25 | Desktop Login-Redirect: `NextResponse.redirect()` vor `createServerClient` erstellen, damit Cookies auf der Response landen | ✅ Erledigt |
| BF.26 | LLM: `max_tokens` 4096 → 8192 (Anthropic + OpenAI); `stop_reason === 'max_tokens'` / `finish_reason === 'length'` löst verständliche Fehlermeldung aus statt JSON-Parse-Fehler | ✅ Erledigt |
| BF.27 | Transkript-Verarbeitungs-Pipeline: Timeout-Schutz, Status-Leak nach Fehler behoben, stille Retry-Fehler sichtbar gemacht | ✅ Erledigt |

---

### Meilenstein 17: AutoToDo Desktop-App (Tauri 2)

> Separates Repo `cryptoclemens/AutoToDo-Desktop`. Web-App-Änderungen in diesem Repo.

| # | Aufgabe | Status |
|---|---|---|
| 17.1 | Tauri 2: Grundstruktur, Recorder (cpal), Whisper-Integration (whisper-rs) | ✅ Erledigt |
| 17.2 | Pause/Resume-Funktion: `stream.pause()` / `stream.play()` (Samples bleiben im Speicher) | ✅ Erledigt |
| 17.3 | `check_for_update`-Befehl: GitHub Releases API per `ureq`, semver-Vergleich | ✅ Erledigt |
| 17.4 | `open_url`-Befehl: OS-nativ (`open` / `cmd /c start` / `xdg-open`) | ✅ Erledigt |
| 17.5 | bridge.js: Overlay-Pill (Recording/Pausiert/Transkribiere), `setTranscriptHandler` API | ✅ Erledigt |
| 17.6 | bridge.js: Update-Banner bei neuerer Version, dismiss-Button | ✅ Erledigt |
| 17.7 | `DesktopRecordButton`-Komponente: Whisper-Check vor Start, Modal wenn nicht installiert, Download-Flow | ✅ Erledigt |
| 17.8 | Transcript-Handler: POST `/api/transcripts` nach Stop, `router.refresh()` | ✅ Erledigt |
| 17.9 | `ProjectPageClient`: DesktopRecordButton + Transkript-Historie-Link integriert | ✅ Erledigt |
| 17.10 | WorkspaceNav: „Aufnahme"-Link entfernt (Aufnahme jetzt per LOP-Liste) | ✅ Erledigt |
| 17.11 | Dashboard: Archivierte LOP-Listen-Sektion unterhalb aktiver Projekte | ✅ Erledigt |
| 17.12 | GitHub Actions: Build-Matrix macOS ARM + Intel + Windows (`.github/workflows/build.yml`) | ✅ Erledigt |
| 17.13 | `/desktop`-Seite: öffentlich, GitHub-Release-API, Download-Cards (DMG ARM/Intel, MSI) | ✅ Erledigt |
| 17.14 | WorkspaceNav: „Desktop-Version"-Link (nur in Web-App, ausgeblendet wenn `window.__autoToDo`) | ✅ Erledigt |
| 17.15 | Landing Page: Desktop-App-Sektion (dunkle Karte, Feature-Highlights, Download-CTA) | ✅ Erledigt |
| 17.16 | Audiopipeline: `whisper-rs` native Bindings, Rubato-Resampling direkt → 16 kHz, VAD nur Logging, Whisper-interne Stille-Filterung | ✅ Erledigt |
| 17.17 | Dual-Stream-Aufnahme: Mikrofon + System-Audio (BlackHole/Loopback) automatisch gemischt | ✅ Erledigt |
| 17.18 | Whisper FullParams: BeamSearch(5), `no_speech_thold=0.55`, `suppress_blank/non_speech_tokens`, `temperature=0.3` (Meetily-Standard) | ✅ Erledigt |
| 17.19 | `NSMicrophoneUsageDescription` in `tauri.conf.json`: macOS zeigt Permission-Dialog statt stillem Deny | ✅ Erledigt |
| 17.20 | Einstellungen: „Audio"-Tab mit Whisper-Modell-Verwaltung (Download, Modell-Wechsel, Fortschrittsbalken) | ✅ Erledigt |
| 17.21 | Einstellungen: Versionsnummer `vX.Y.Z` neben Überschrift; `lib/version.ts` zentral, von `bump-version.sh` gepflegt | ✅ Erledigt |
| BF.28 | Desktop-App: `NSMicrophoneUsageDescription` fehlte → macOS verwehrte Mikrofonzugriff ohne Dialog (Stille → Halluzination) | ✅ Erledigt |
| BF.29 | Security: `translate.ts` — System-Prompt-Isolation gegen Prompt-Injection in LLM-Übersetzung | ✅ Erledigt |

---

### Meilenstein 20: Security Hardening — Vibe-Coding-Audit (Mai 2026)

*Grundlage: Golem-Artikel + Tenzai-Studie (69 Schwachstellen in 15 vibe-codierten Apps); alle Findings live auf `autotodo.vencly.com`*

| # | Aufgabe | Status |
|---|---|---|
| 20.1 | `Content-Security-Policy` Header in `next.config.js` ergänzt (default-src, script-src, connect-src, frame-ancestors, object-src) | ✅ Erledigt |
| 20.2 | `CRON_SECRET` fail-closed: Endpoint blockiert wenn Env-Var nicht gesetzt (vorher: offen wenn nicht konfiguriert) | ✅ Erledigt |
| 20.3 | `INTERNAL_API_SECRET` fail-closed: leere Env-Var öffnete Endpoint bei leerem Header-Wert — behoben | ✅ Erledigt |

**DoD M20:** Alle drei Lücken behoben; CSP deployed; fail-closed-Pattern für beide Secret-gated Endpoints bestätigt.

---

## Phase 6 – Infrastruktur & Migration

| # | Aufgabe | Status |
|---|---|---|
| I.1 | Hetzner CX32 Migrationsplan erstellen (Self-hosted Supabase + Coolify + Warm Standby) | ✅ Erledigt (`docs/hetzner-migration-plan.md`) |
| I.2 | Next.js `output: standalone` + `sharp` für Docker-Deploy aktivieren | ✅ Erledigt |
| I.3 | Hetzner CX32 einrichten + Coolify installieren | 🔲 Offen |
| I.4 | Self-hosted Supabase auf Hetzner deployen | 🔲 Offen |
| I.5 | Datenmigration (Supabase Cloud → Self-hosted) | 🔲 Offen |
| I.6 | AutoToDo in Coolify deployen + DNS umstellen | 🔲 Offen |
| I.7 | Stündlichen pg_dump-Sync zu Supabase Cloud einrichten | 🔲 Offen |

---

### Meilenstein 18: Nutzer-Feedback Mai 2026 & neue Features

| # | Aufgabe | Quelle | Status |
|---|---|---|---|
| 18.1 | Friends Codes: Multi-Use-Codes (max_uses, use_count, friends_code_redemptions), Admin-Steuerung erweitert | F-008 | ✅ Erledigt |
| 18.2 | Co-Verantwortliche: Feld `co_responsibles` (JSONB) auf lop_items, Dropdown im LOP-Dialog | F-009 | ✅ Erledigt |
| 18.3 | Kontext-Notizen: automatische Archivierung abgelaufener/alter Einträge beim GET | F-010 | ✅ Erledigt |
| 18.4 | Anzeigename: `full_name` in user_metadata, Konto-Tab der Einstellungen | F-011 | ✅ Erledigt |
| 18.5 | Dashboard: „Fortschritt pro Person" (Fortschrittsbalken Top 8) + „Burn-Rate" (Balken pro KW) | F-012 | ✅ Erledigt |
| 18.6 | Tätigkeitsnachweis: monatliches Pop-up, tagesscharf, Daten aus LOP-Punkten + Fallback Transkripte | F-013 | ✅ Erledigt |
| 18.7 | Verantwortliche zusammenführen: DB-Backfill + Admin-Tool für Alias-Normalisierung | B-006 | ✅ Erledigt |
| 18.8 | Feedback-IDs: sequenziell (F-001, B-001, G-001) via `category_seq` DB-Spalte | intern | ✅ Erledigt |
| 18.9 | Ideenspeicher je LOP-Liste: idea_items-Tabelle, API, Standup-Sektion, KI-Extraktion aus Transkript | intern | ✅ Erledigt |
| 18.10 | Projekteinstellungen: Sprache der Calls (8 Sprachen) + Tätigkeitsnachweis-Flag beim Erstellen | intern | ✅ Erledigt |
| 18.11 | DeepSeek als BYOK-LLM-Provider (deepseek-chat, deepseek-reasoner) | F-007 | ✅ Erledigt |
| 18.12 | Einladungslink: wiederverwendbarer Link (7 Tage, wählbare Rolle), Widerruf möglich | F-008 | ✅ Erledigt |
| 18.13 | Täglicher Digest: Projektspezifische Zuweisung, `daily_plans`-Tabelle (Tagesplan je Nutzer) | intern | ✅ Erledigt |
| 18.14 | Backfill: `responsible_user_id` automatisch aus Anzeigenamen befüllen (Migration 031) | intern | ✅ Erledigt |

---

### Meilenstein 19: Nutzer-Feedback Mai 2026 — Sprint 2

| # | Aufgabe | Quelle | Status |
|---|---|---|---|
| 19.1 | LOP ↔ Ideenspeicher: bidirektionaler Transfer (parken & reaktivieren), Migration 034, `geparkt`-Status, Hover-Menü in LopTableRow | F-021 | ✅ Erledigt |
| 19.2 | Feiertage im Tätigkeitsnachweis: alle Monatstage sichtbar, Wochenenden + Feiertage ausgegraut mit Feiertagsname (amber), `getHolidayLabels()`, Migration 035 `bundesland` auf `workspaces` | F-022 / F-018 | ✅ Erledigt |
| 19.3 | E-Mail-Digest: Feiertags-Check pro Workspace — Digest überspringt Feiertage gemäß konfiguriertem Bundesland | F-022 / F-018 | ✅ Erledigt |
| 19.4 | Workspace-Einstellungen: Bundesland-Selector (Bundesland für Feiertage) unter E-Mail-Digest | F-022 / F-018 | ✅ Erledigt |
| 19.5 | Digest-Häufigkeit: Toggle ersetzt durch Select (Täglich / 2× pro Woche Mo+Do / Wöchentlich Mo / Aus), Migration 036 `digest_frequency` auf `workspaces` | F-023 / F-019 | ✅ Erledigt |
| 19.6 | Cron respektiert `digest_frequency`: Frequenz-Filter (wöchentlich = nur Mo, 2×/Woche = Mo+Do) vor Feiertags-Filter | F-023 / F-019 | ✅ Erledigt |
| 19.7 | Account-Hinweis-Link unter Digest-Select: Verweis auf Konto-Tab für Name/E-Mail-Änderung | F-023 / F-019 | ✅ Erledigt |

---

### Meilenstein 21: Nutzer-Feedback Juni 2026 — Bugs & Polish

| # | Aufgabe | Quelle | Status |
|---|---|---|---|
| 21.1 | Einladungslink: `emailRedirectTo` in signUp, `confirmationPending`-State bei E-Mail-Verifikation | B-7 | ✅ Erledigt |
| 21.2 | Standup Ideenspeicher-Buttons immer sichtbar (nicht nur on hover) | B-8 | ✅ Erledigt |
| 21.3 | SecurityModal per `createPortal(document.body)` aus Stacking-Context befreit | B-11 | ✅ Erledigt |
| 21.4 | Download-Route: `redirect: 'manual'` → Browser direkt zu CDN-URL weiterleiten (kein Proxy-Timeout) | B-13 | ✅ Erledigt |
| 21.5 | Dark Mode deaktiviert (tailwind darkMode entfernt, `.dark{}`-CSS entfernt, ThemeToggle entfernt) | B-12 | ✅ Erledigt |
| 21.6 | Daily Digest: filtert nur Items mit `due_date ≤ heute` oder kein Datum (war: alle offenen) | B-9 | ✅ Erledigt |
| 21.7 | Doppelperson „Markus Wanzek I Plenum" → „Markus" normalisiert (SQL UPDATE, 12 Zeilen) | B-10 | ✅ Erledigt |

---

### Meilenstein 22: Feature-Backlog Juni 2026

Kategorisiert aus Nutzer-Feedback. Reihenfolge nach geschätztem Wert.

#### Kategorie A — Daten-Management
| # | Feature | ID | Status |
|---|---|---|---|
| 22.1 | Feiertage im Digest: Digest überspringt Feiertage (bundesland-spezifisch) | F-22 | ✅ Erledigt via M19 |
| 22.2 | Tätigkeitsnachweis-Export: PDF/XLSX-Download des monatlichen Nachweises | F-27 | 🔲 Offen |
| 22.3 | Archiv-Export: alle abgeschlossenen LOP-Punkte als XLSX mit Zeitraum-Filter | F-29 | 🔲 Offen |

#### Kategorie B — Nutzer-Autonomie
| # | Feature | ID | Status |
|---|---|---|---|
| 22.4 | Digest-Häufigkeit pro Nutzer einstellbar (override Workspace-Standard) | F-26 | 🔲 Offen |
| 22.5 | E-Mail-Präferenzen: Nutzer kann Digest-Zeiten selbst konfigurieren | F-23 | ✅ Erledigt via M19 |

#### Kategorie C — KI-Intelligenz
| # | Feature | ID | Status |
|---|---|---|---|
| 22.6 | Desktop v0.3.0: System-Audio ohne BlackHole (CoreAudio Process Tap, macOS 14.4+) | F-24 | ✅ Erledigt |
| 22.7 | KI-Zusammenfassung je LOP: Button „Zusammenfassung generieren" auf Projektebene | F-25 | 🔲 Offen |

#### Kategorie D — Struktur & Klarheit
| # | Feature | ID | Status |
|---|---|---|---|
| 22.8 | LOP-Vorlage: Standardpunkte vordefinieren (kopierbare Template-Listen) | F-20 | 🔲 Offen |
| 22.9 | Filter & Suche: globale Suche über alle LOP-Punkte eines Workspaces | F-21 | 🔲 Offen |
| 22.10 | Status-Workflow: benutzerdefinierte Status-Bezeichnungen je Workspace | F-28 | 🔲 Offen |

---

## Legende

| Symbol | Bedeutung |
|---|---|
| ✅ Erledigt | Abgeschlossen und getestet |
| 🔄 In Bearbeitung | Aktuell in Entwicklung |
| 🔲 Offen | Noch nicht begonnen |
| ❌ Blockiert | Wartet auf Abhängigkeit |
