# AutoToDo – Aufgaben & Meilensteine

Letzte Aktualisierung: März 2026 · Version 0.1.41 · Meilensteine 1–7d abgeschlossen

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
| 7f.1 | XLSX-Reimport: offline bearbeitete LOP-Datei hochladen & mit bestehender LOP abgleichen (Spalten-Mapping, Konflikterkennung) | Feature-Wunsch 2026-03-27 | 🔲 Offen |
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
| 9.1 | Stripe-Billing (Free/Pro/Enterprise) | 🔲 Offen |
| 9.2 | Custom Domain (CNAME-Support) | 🔲 Offen |
| 9.3 | E-Mail-Benachrichtigungen (Resend) | 🔲 Offen |
| 9.4 | Slack/Teams-Integration via Webhook | 🔲 Offen |
| 9.6 | SSO (SAML für Enterprise) | 🔲 Offen |

### Meilenstein 9.5: Mehrsprachigkeit (DE / EN)

| # | Aufgabe | Status |
|---|---|---|
| 9.5.1 | i18n-Bibliothek einrichten (`next-intl` oder `next-i18next`) | 🔲 Offen |
| 9.5.2 | Sprachumschalter in Nav (DE / EN, persistiert in localStorage) | 🔲 Offen |
| 9.5.3 | Landing Page vollständig auf Englisch (Hero, Features, Pricing, Footer) | 🔲 Offen |
| 9.5.4 | App-UI auf Englisch (Dashboard, Projektseite, LOP-Tabelle, Filter) | 🔲 Offen |
| 9.5.5 | Rechtliche Seiten auf Englisch (AGB, Datenschutz, Impressum) | 🔲 Offen |
| 9.5.6 | Onboarding & Registrierung auf Englisch | 🔲 Offen |
| 9.5.7 | Einstellungsseiten & Einladungs-E-Mails auf Englisch | 🔲 Offen |
| 9.5.8 | „How to"-Popup auf Englisch | 🔲 Offen |
| 9.5.9 | Fehlermeldungen & Toast-Nachrichten lokalisiert | 🔲 Offen |

---

## Phase 4 – UX-Polish & Legal

### Meilenstein 10: Layout-Optimierung & Impressum

| # | Aufgabe | Status |
|---|---|---|
| 10.1 | Landing Page: Hero-Sektion mit Illustration/Animation | 🔲 Offen |
| 10.2 | Landing Page: Feature-Sektion (Screenshots, Icons, Beschreibungen) | 🔲 Offen |
| 10.3 | Landing Page: Pricing-Tabelle (Free / Starter / Pro / Enterprise) | 🔲 Offen |
| 10.4 | App-Layout: Sidebar-Navigation verfeinern (Icons, aktiver Zustand, Kollaps) | 🔲 Offen |
| 10.5 | App-Layout: Responsive Mobile-Ansicht (Hamburger-Menu, Drawer) | 🔲 Offen |
| 10.6 | Dashboard: Statistik-Karten (offene Punkte, fällige Aufgaben, Aktivität) | 🔲 Offen |
| 10.7 | LOP-Tabelle: visuelles Redesign (bessere Badges, Hover-States, Farbkodierung) | 🔲 Offen |
| 10.8 | Loading-States & Skeleton-Screens (Transition-Feedback) | 🔲 Offen |
| 10.9 | Dark-Mode-Unterstützung (optional) | 🔲 Offen |
| 10.10 | Impressum-Seite (`/impressum`) | 🔲 Offen |
| 10.11 | Datenschutzerklärung (`/datenschutz`) | 🔲 Offen |
| 10.12 | Footer auf Landing Page (Links: Impressum, Datenschutz, Kontakt) | 🔲 Offen |
| 10.13 | Cookie-Hinweis / Consent-Banner (DSGVO) | 🔲 Offen |

---

## Legende

| Symbol | Bedeutung |
|---|---|
| ✅ Erledigt | Abgeschlossen und getestet |
| 🔄 In Bearbeitung | Aktuell in Entwicklung |
| 🔲 Offen | Noch nicht begonnen |
| ❌ Blockiert | Wartet auf Abhängigkeit |
