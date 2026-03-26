# AutoToDo – Aufgaben & Meilensteine

Letzte Aktualisierung: März 2026

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
| 2.1 | Supabase Auth: Registrierung-Page + Workspace-Erstellung | 🔲 Offen |
| 2.2 | Supabase Auth: Login-Page | 🔲 Offen |
| 2.3 | Supabase Auth: Passwort-Reset | 🔲 Offen |
| 2.4 | Auth-Callback Route (`/auth/callback`) | 🔲 Offen |
| 2.5 | Encryption-Modul (AES-256-GCM) | 🔲 Offen |

### Meilenstein 3: Onboarding

| # | Aufgabe | Status |
|---|---|---|
| 3.1 | Onboarding-Wizard Schritt 1: Workspace einrichten | 🔲 Offen |
| 3.2 | Onboarding-Wizard Schritt 2: Erstes Projekt anlegen | 🔲 Offen |
| 3.3 | Onboarding-Wizard Schritt 3: Team einladen | 🔲 Offen |
| 3.4 | Einladungs-Flow: Token-Generierung + E-Mail (Resend) | 🔲 Offen |
| 3.5 | Einladungs-Flow: `/invite/[token]` Seite | 🔲 Offen |

### Meilenstein 4: Kern-App

| # | Aufgabe | Status |
|---|---|---|
| 4.1 | Dashboard: Projekt-Übersicht | 🔲 Offen |
| 4.2 | Projekt-CRUD (anlegen, archivieren) | 🔲 Offen |
| 4.3 | LOP-Tabelle (Inline-Edit, Status-Toggle) | 🔲 Offen |
| 4.4 | LOP-Filter (Status, Priorität, Verantwortlicher) | 🔲 Offen |
| 4.5 | LOP-Punkt manuell anlegen | 🔲 Offen |
| 4.6 | StatusBadge & PriorityBadge Komponenten | 🔲 Offen |

### Meilenstein 5: Transkript-Verarbeitung

| # | Aufgabe | Status |
|---|---|---|
| 5.1 | Transkript-Upload UI (.txt) | 🔲 Offen |
| 5.2 | Supabase Storage: verschlüsselter Upload | 🔲 Offen |
| 5.3 | LLM-Abstraktionsschicht (types, factory) | 🔲 Offen |
| 5.4 | Anthropic-Integration | 🔲 Offen |
| 5.5 | OpenAI-Integration | 🔲 Offen |
| 5.6 | BYOK: LLM-Key speichern/abrufen (verschlüsselt) | 🔲 Offen |
| 5.7 | Verarbeitungs-Pipeline (processTranscript) | 🔲 Offen |
| 5.8 | Konfidenz-Schwellwert-System | 🔲 Offen |
| 5.9 | KI-Vorschläge Review-Flow (ReviewBanner) | 🔲 Offen |
| 5.10 | Fehlerbehandlung & Retry-Logik | 🔲 Offen |

### Meilenstein 6: Export & Basis-Branding

| # | Aufgabe | Status |
|---|---|---|
| 6.1 | XLSX-Export (SheetJS) | 🔲 Offen |
| 6.2 | Akzentfarbe CSS Custom Property (`--brand`) | 🔲 Offen |
| 6.3 | BrandProvider Komponente | 🔲 Offen |
| 6.4 | LLM-Einstellungen UI (`/settings/llm`) | 🔲 Offen |

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
| 8.5 | Rollenverwaltung (granulare Berechtigungen) | 🔲 Offen |

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

## Legende

| Symbol | Bedeutung |
|---|---|
| ✅ Erledigt | Abgeschlossen und getestet |
| 🔄 In Bearbeitung | Aktuell in Entwicklung |
| 🔲 Offen | Noch nicht begonnen |
| ❌ Blockiert | Wartet auf Abhängigkeit |
