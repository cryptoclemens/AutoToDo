# AutoToDo

**KI-gestütztes LOP-Management für Teams** | Multi-Tenant SaaS | BYOK-Edition | v0.1.198

AutoToDo automatisiert die Pflege von Listen offener Punkte (LOPs) aus Meeting-Transkripten. Meeting hochladen → KI extrahiert Aufgaben, Statusänderungen & Ideen → KI-Vorschläge prüfen, bearbeiten, annehmen → LOP aktuell → Export als XLSX.

---

## Tech Stack

| Layer | Technologie |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Supabase (PostgreSQL + Auth + Storage) |
| KI (Extraktion) | Anthropic Claude / OpenAI GPT / Azure OpenAI / Perplexity AI / DeepSeek (BYOK) |
| KI (Transkription) | OpenAI Whisper / Groq Whisper (whisper-large-v3-turbo, 120 Min/Tag kostenlos) |
| Deployment | Docker (Hetzner CX32, standalone) · Self-hosted Supabase |
| E-Mail | Resend (optional, via `RESEND_API_KEY`) |
| Billing | Mollie (aktiv; aktiviert sobald `MOLLIE_API_KEY` gesetzt) |
| Font | System-Schriftart (kein Google Fonts) |
| Desktop-App | Tauri 2 (macOS ARM/Intel, Windows) — separates Repo `AutoToDo-Desktop` |

---

## Schnellstart (lokal)

### Voraussetzungen

- Node.js 20+
- Supabase-Konto
- (Optional) Anthropic oder OpenAI API-Key

### 1. Repository klonen

```bash
git clone https://github.com/cryptoclemens/autotodo.git
cd autotodo
npm install
```

### 2. Umgebungsvariablen setzen

```bash
cp .env.local.example .env.local
# .env.local mit deinen Werten befüllen
```

Benötigte Variablen:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENCRYPTION_SECRET=your-64-char-hex-string   # openssl rand -hex 32
INTERNAL_API_SECRET=your-secret-string
```

### 3. Datenbank einrichten

Migrations in Supabase SQL Editor ausführen (in dieser Reihenfolge):

```bash
supabase db push   # wendet alle ausstehenden Migrations an
```

Oder manuell via Supabase SQL Editor in numerischer Reihenfolge (001 → 033).
Aktuelle Migrations: `001_initial_schema` bis `033_project_settings` (33 Dateien).

### 4. Entwicklungsserver starten

```bash
npm run dev
```

App läuft auf [http://localhost:3000](http://localhost:3000)

---

## Projektstruktur

```
autotodo/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Landing Page (direkt in app/, kein Route-Group)
│   ├── (auth)/             # Login, Register, Passwort-Reset, Invite-Accept
│   ├── (onboarding)/       # Onboarding-Wizard (3 Schritte)
│   ├── (app)/              # Workspace-App (auth-geschützt via Middleware)
│   │   ├── dashboard/      # Projekt-Übersicht, KPIs, Burn-Rate, Updates
│   │   ├── projects/[id]/  # Projektseite, Transkripte, XLSX-Import
│   │   ├── projects/new/   # Projekt anlegen (inkl. Sprache + Tätigkeitsnachweis)
│   │   ├── settings/       # Branding, LLM, API-Keys, Members, Billing, Integrations
│   │   └── admin/          # Super-Admin: Übersicht, Friends Codes, Steuerung
│   ├── (guest)/            # Gast-Ansicht (öffentlich, kein Login)
│   ├── desktop/            # Desktop-App Download-Seite (GitHub-Releases)
│   ├── auth/callback/      # Supabase E-Mail-Bestätigung
│   └── api/                # API Routes
│       ├── lop/            # LOP CRUD + Translate
│       ├── transcripts/    # Upload + Inline-Verarbeitung + Retry + Audio
│       ├── ideas/          # Ideenspeicher: GET/POST/DELETE/PATCH(promote)
│       ├── projects/[id]/  # Import (XLSX-Reimport), Guests, Unarchive
│       ├── taetigkeitsnachweise/ # Monatliche Tätigkeitsnachweise
│       ├── v1/             # Öffentliche REST API (Bearer-Token)
│       ├── api-keys/       # API-Key-Verwaltung
│       ├── feedback/       # Feedback-Speicherung (DB + GitHub)
│       ├── invitations/    # Einladungs-Generierung + Resend-E-Mail
│       ├── members/        # Workspace- + Projektmitglieder
│       ├── mollie/         # Checkout + Webhook (Billing)
│       ├── cron/           # Täglicher E-Mail-Digest (Mo–Fr 17 Uhr, host crontab)
│       └── settings/       # Branding, Logo-Upload, LLM, Members
├── components/
│   ├── lop/                # LopTable (inkl. Ideenspeicher + Standup-Modus),
│   │                       # LopTableRow, LopItemDialog, ReviewBanner,
│   │                       # AiReviewPanel, StatusBadge, PriorityBadge, ResponsibleSelect
│   ├── transcripts/        # TranscriptUploadForm, RetryButton
│   ├── projects/           # ProjectTitleEditor, ProjectInviteButton,
│   │                       # ProjectPageClient, XlsxImportDialog, ProjectMembersDialog
│   ├── dashboard/          # DashboardUpdates, TaetigkeitsnachweisModal
│   ├── desktop/            # DesktopRecordButton
│   ├── workspace/          # WorkspaceNav
│   ├── settings/           # BillingTab, SettingsPageClient, AccountSettings, …
│   ├── landing/            # LandingSecuritySection, LandingLegalFooter
│   ├── legal/              # LegalModal (AGB + Datenschutzerklärung)
│   ├── FeedbackButton.tsx  # Feedback-Popup (fixed bottom-left)
│   ├── HowToModal.tsx      # How-to-Tour
│   ├── SecurityModal.tsx   # Datensicherheits-Popup (TOMs)
│   └── ui/                 # shadcn/ui Komponenten
├── lib/
│   ├── supabase/           # Client, Server, Middleware Helper
│   ├── llm/                # BYOK: Anthropic, OpenAI, Azure, Perplexity, Groq, DeepSeek
│   │   ├── factory.ts      # processTranscriptWithLlm() Dispatcher
│   │   ├── prompt.ts       # buildSystemPrompt() + buildUserPrompt()
│   │   └── types.ts        # LlmConfig, ProcessTranscriptResult
│   ├── workspace.ts        # resolveWorkspace() (Slug + Membership-Fallback)
│   ├── encryption.ts       # AES-256-GCM
│   ├── apiKeyAuth.ts       # SHA-256 API-Key-Validierung + Scope-Prüfung
│   ├── processTranscript.ts # Shared LLM-Pipeline (Transkription → LOP + Ideen + Kontext)
│   ├── export.ts           # XLSX-Export (SheetJS)
│   ├── import.ts           # XLSX-Reimport
│   ├── similarity.ts       # Jaccard-Similarity (Duplikat-Erkennung)
│   ├── mollie.ts           # Billing
│   ├── plan-gate.ts        # checkProjectLimit / checkTranscriptLimit / checkSeatLimit
│   └── plans.ts            # Tier-Limits (Beta/Free/Solo/Team/Business)
├── supabase/migrations/    # SQL Migrations 001–033 (alle deployed)
├── docs/                   # hetzner-migration-plan.md
├── scripts/                # bump-version.sh, install-hooks.sh
├── middleware.ts            # Auth-Schutz + Workspace-Header
├── next.config.js          # output: standalone, Security Headers, withNextIntl
├── CLAUDE.md               # Entwicklungsregeln & Fallstricke
├── architecture.md         # Systemarchitektur (Komponenten, Datenfluss, DB-Schema)
├── Tasks.md                # Meilenstein-Tracking
└── Brief.md                # Vollständige Produktspezifikation
```

---

## Multi-Tenancy & Sicherheit

- **Workspace-Auflösung:** `resolveWorkspace()` löst den Workspace via Slug oder Membership-Fallback auf
- **Row-Level Security:** Vollständige Datenisolation zwischen Workspaces auf DB-Ebene
- **Security Headers:** HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- **BYOK:** API-Keys für Anthropic, OpenAI und Azure OpenAI werden AES-256-GCM verschlüsselt gespeichert
- **Transkripte:** verschlüsselt in privatem Supabase Storage Bucket (kein Public-URL-Zugriff)
- **Service-Role-Client:** Ausschließlich serverseitig, nie im Client
- **API v1:** `/api/v1/` via Bearer-Token (SHA-256-gehashte API-Keys), Scope-Prüfung (`read`/`write`) auf allen Endpunkten
- **Einladungs-Token:** `randomBytes(32)` – 256 Bit Entropie
- **Input-Validierung:** Zod auf allen API-Routes, UUID-Format-Prüfung auf Query-Parametern
- **Transkript-Verarbeitung:** Synchron inline im Upload-Request (kein fire-and-forget)

---

## Deployment

### Docker (Hetzner CX32 – produktiv)

Das Projekt läuft als Docker-Container (`autotodo-app`) auf einem Hetzner CX32 mit Self-hosted Supabase.
Deploy-Skript: `/root/deploy/autotodo/deploy.sh`

Das Projekt ist mit `output: 'standalone'` gebaut. `NEXT_PUBLIC_*`-Variablen müssen als **Build-Time**-Vars gesetzt sein (nicht nur Runtime).

Erforderliche Umgebungsvariablen:

```env
NEXT_PUBLIC_SUPABASE_URL        # https://supabase.autotodo.vencly.com
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ENCRYPTION_SECRET               # openssl rand -hex 32  (64 Hex-Zeichen)
INTERNAL_API_SECRET             # beliebiger Secret-String
NEXT_PUBLIC_APP_URL             # https://autotodo.vencly.com
NEXT_PUBLIC_APP_DOMAIN          # autotodo.vencly.com
# Optional:
RESEND_API_KEY                  # aktiviert E-Mail-Versand (Einladungen + täglicher Digest)
RESEND_FROM                     # z.B. "AutoToDo <noreply@vencly.app>"
MOLLIE_API_KEY                  # aktiviert Billing-Checkout
GITHUB_FEEDBACK_TOKEN           # GitHub-Token mit repo-write-Zugriff → schreibt Feedback in feedback.md
GITHUB_FEEDBACK_BRANCH          # Branch für Feedback-Commits (default: main)
CRON_SECRET                     # Secret für den täglichen Digest-Cron (/api/cron/daily-digest)
```

Supabase Auth → URL Configuration:
- Site URL: `https://autotodo.vencly.com`
- Redirect URLs: `https://autotodo.vencly.com/auth/callback`

Supabase Storage:
- `logos`-Bucket: public (Workspace-Logos)
- `transcripts`-Bucket: **privat** (verschlüsselte Transkript-Inhalte)

### Custom Domain (Cloudflare)

| Typ | Name | Inhalt | Proxy |
|-----|------|--------|-------|
| `A` | `autotodo` | `<SERVER_IP>` | DNS-only (grau) |

---

## Roadmap (nächste Meilensteine)

| Meilenstein | Inhalt | Status |
|---|---|---|
| **M18** | Nutzer-Feedback Mai 2026: Ideenspeicher, Tätigkeitsnachweis, Friends Codes Multi-Use, … | ✅ Erledigt |
| **M17** | Tauri Desktop-App (macOS ARM/Intel + Windows MSI) | ✅ Erledigt |
| **9.6** | SSO (SAML für Enterprise) | Offen (Business-Plan) |
| **10.1** | Landing Page Hero-Illustration | Teilweise (Animationen live) |
| **10.9** | Dark Mode | Teilweise (Grundstruktur vorhanden) |
| **M15.7** | PWA Offline-Fallback-Seite | Offen |
| **13.7** | WorkspaceNav: Projekt-Logo anzeigen wenn auf Projekt-Seite | Offen |

## Entwicklungsstand

Siehe [Tasks.md](./Tasks.md) für den aktuellen Bearbeitungsstand nach Meilensteinen.
Siehe [architecture.md](./architecture.md) für die Systemarchitektur (Komponenten, Datenfluss, DB-Schema).
Siehe [Brief.md](./Brief.md) für die vollständige Produktspezifikation.
Siehe [CLAUDE.md](./CLAUDE.md) für Entwicklungsregeln und bekannte Fallstricke.

---

## Lizenz

Proprietär – alle Rechte vorbehalten.
