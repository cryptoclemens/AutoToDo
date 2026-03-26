# AutoToDo – Aufgaben & Meilensteine

Letzte Aktualisierung: März 2026 (Meilensteine 1–6 + Deployment-Fixes abgeschlossen)

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
| 3.4 | Einladungs-Flow: Token-Generierung + E-Mail (Resend) | 🔄 Offen (Token-Generierung ✅, Resend-Versand in M5) |
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
| 5.9 | KI-Vorschläge Review-Flow (ReviewBanner) | ✅ Erledigt |
| 5.10 | Fehlerbehandlung & Retry-Logik | ✅ Erledigt |

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

---

## Phase 2 – SaaS-Features

### Meilenstein 7: Custom Branding & API

| # | Aufgabe | Status |
|---|---|---|
| 7.1 | Logo-Upload (Supabase Storage) | 🔲 Offen |
| 7.2 | XLSX-Export mit Workspace-Branding | 🔲 Offen |
| 7.3 | API-Key-Verwaltung UI | 🔲 Offen |
| 7.4 | API-Key-Validierung (Middleware) | 🔲 Offen |
| 7.5 | Öffentliche REST API: `/v1/projects` | 🔲 Offen |
| 7.6 | Öffentliche REST API: `/v1/lop` | 🔲 Offen |
| 7.7 | Öffentliche REST API: `/v1/transcripts` | 🔲 Offen |

### Meilenstein 8: Webhooks & Audit

| # | Aufgabe | Status |
|---|---|---|
| 8.1 | Webhook-Endpoints UI (Registrierung) | 🔲 Offen |
| 8.2 | Webhook-Dispatcher (HMAC-SHA256) | 🔲 Offen |
| 8.3 | Retry-Logik (exponential backoff, 3 Versuche) | 🔲 Offen |
| 8.4 | Audit-Log UI | 🔲 Offen |
| 8.5 | Rollenverwaltung UI (granulare Berechtigungen) | 🔲 Offen |

---

## Phase 3 – Wachstum (optional)

| # | Aufgabe | Status |
|---|---|---|
| 9.1 | Stripe-Billing (Free/Pro/Enterprise) | 🔲 Offen |
| 9.2 | Custom Domain (CNAME-Support) | 🔲 Offen |
| 9.3 | E-Mail-Benachrichtigungen (Resend) | 🔲 Offen |
| 9.4 | Slack/Teams-Integration via Webhook | 🔲 Offen |
| 9.5 | Mehrsprachigkeit (DE/EN) | 🔲 Offen |
| 9.6 | SSO (SAML für Enterprise) | 🔲 Offen |

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
