# AutoToDo – Aufgaben & Meilensteine

Letzte Aktualisierung: April 2026 · Version 0.1.78 · M1–M11, M9.1, M9.5 komplett abgeschlossen

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
| 9.4 | Slack/Teams-Integration via Webhook | 🔲 Offen |
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
| 12.1 | Visuelles Redesign: Navbar (Glasmorphismus, backdrop-blur, bessere Schatten) | 🔲 Offen |
| 12.2 | Visuelles Redesign: Dashboard-Cards (größere Radien, Tiefen-Schatten, moderne Typografie) | 🔲 Offen |
| 12.3 | Visuelles Redesign: Buttons & Badges (Lucide Icons statt Emojis, sattere Farben, Pill-Stil) | 🔲 Offen |
| 12.4 | Visuelles Redesign: LOP-Tabellenzeilen (mehr Whitespace, subtile Trennlinien, bessere Hover-States) | 🔲 Offen |
| 12.5 | Daily Stand-up Modus: Toggle-Button auf LOP-Seite (filtert erledigte Items, sortiert überfällig zuerst) | 🔲 Offen |
| 12.6 | Daily Stand-up Modus: Sektionen „Überfällig / Heute fällig / Offen / In Bearbeitung" | 🔲 Offen |
| 12.7 | Daily Stand-up Modus: One-click Status-Toggle direkt in Zeile (ohne Dialog-Öffnen) | 🔲 Offen |
| 12.8 | Ähnliche LOP-Punkte zusammenführen: Fuzzy-Similarity-Check nach Transkript-Verarbeitung | 🔲 Offen |
| 12.9 | Ähnliche LOP-Punkte zusammenführen: Dialog „Punkte zusammenführen?" mit Vorschau | 🔲 Offen |

### Meilenstein 13: Projekt-Level-Branding (Sanfte Evolution)

> Workspace-Branding bleibt der Default. Projekte können optional eigenes Logo + Primärfarbe setzen.
> Abwärtskompatibel: `branding_inherited = true` bis explizit überschrieben.

| # | Aufgabe | Status |
|---|---|---|
| 13.1 | Migration `016_project_branding.sql`: `brand_color`, `logo_url`, `branding_inherited BOOLEAN DEFAULT true` auf `projects` | 🔲 Offen |
| 13.2 | `lib/branding.ts`: Helper `getProjectBranding(project, workspace)` mit Fallback-Kette | 🔲 Offen |
| 13.3 | Dashboard-Cards: Projekt-Logo anzeigen (Fallback auf Workspace-Logo) | 🔲 Offen |
| 13.4 | Projekt-Page: Buttons/Akzentfarbe aus `project.brand_color` (CSS-Variable) | 🔲 Offen |
| 13.5 | Neue Settings-Route `/settings/projects/[id]/branding` (Logo-Upload + Farbwähler) | 🔲 Offen |
| 13.6 | API-Endpoint `POST /api/settings/projects/[id]/branding/logo` (Storage-Upload) | 🔲 Offen |
| 13.7 | WorkspaceNav: Projekt-Logo anzeigen wenn auf Projekt-Seite | 🔲 Offen |
| 13.8 | `app/(app)/layout.tsx`: CSS-Variable `--brand` priorisiert `project.brand_color` über `workspace.brand_color` | 🔲 Offen |
| 13.9 | (Backlog) Subdomain-Routing entfernen als separater Meilenstein | 🔲 Offen |

### Bugfixes (außerhalb Meilensteine)

| # | Aufgabe | Status |
|---|---|---|
| BF.1 | Bearbeitungszeit-KPI: 0-Tage-Items inkl., Anzeige „< 1 Tag" | ✅ Erledigt |
| BF.2 | AiReviewPanel: Rohwerte `in_bearbeitung` → StatusBadge/PriorityBadge | ✅ Erledigt |
| BF.3 | Logo-Upload: Cache-Busting per Timestamp-Dateiname, alte Logos werden gelöscht | ✅ Erledigt |
| BF.4 | Logo-Upload: `logos`-Bucket wird beim ersten Upload automatisch angelegt | ✅ Erledigt |
| BF.5 | Logo-Anzeige: Supabase-Storage-Domain in `next/image` remotePatterns freigeschaltet | ✅ Erledigt |
| BF.6 | LOP-Punkte: erledigte Items sinken nach unten + opacity-60 ausgegraut | ✅ Erledigt |
| BF.7 | E-Mail-Digest: Absender-Domain auf `@vencly.com` geändert | ✅ Erledigt |
| BF.8 | E-Mail-Digest: `?dry_run=true`-Modus für Diagnose ohne E-Mail-Versand | ✅ Erledigt |
| BF.9 | Landing Page UX: Plus Jakarta Sans, Lucide-Icons, reduzierte Hover-Effekte | ✅ Erledigt |
| BF.10 | Deployment: `output: standalone` + `sharp` für Coolify/Docker | ✅ Erledigt |
| BF.11 | App-URL Default auf `autotodo.vencly.com` gesetzt (alle API-Routes) | ✅ Erledigt |

---

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

## Legende

| Symbol | Bedeutung |
|---|---|
| ✅ Erledigt | Abgeschlossen und getestet |
| 🔄 In Bearbeitung | Aktuell in Entwicklung |
| 🔲 Offen | Noch nicht begonnen |
| ❌ Blockiert | Wartet auf Abhängigkeit |
