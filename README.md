# AutoToDo

**KI-gestütztes LOP-Management für Teams** | Multi-Tenant SaaS | BYOK-Edition | v0.1.148

AutoToDo automatisiert die Pflege von Listen offener Punkte (LOPs) aus Meeting-Transkripten. Meeting hochladen → KI extrahiert Aufgaben & Statusänderungen → KI-Vorschläge prüfen, bearbeiten, annehmen → LOP aktuell → Export als XLSX.

---

## Tech Stack

| Layer | Technologie |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Supabase (PostgreSQL + Auth + Storage) |
| KI (Extraktion) | Anthropic Claude / OpenAI GPT / Azure OpenAI / Perplexity AI Sonar (BYOK) |
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

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_indexes.sql
supabase/migrations/004_m5_columns.sql
supabase/migrations/005_fix_rls_recursion.sql
supabase/migrations/006_llm_endpoint.sql
supabase/migrations/007_m7.sql
supabase/migrations/008_m7e.sql
supabase/migrations/009_legal_consent.sql
supabase/migrations/010_storage_buckets.sql
supabase/migrations/011_freemium.sql
supabase/migrations/012_...sql     # (folgende Migrations wie deployed)
supabase/migrations/...
supabase/migrations/019_llm_multi_role.sql
```

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
│   ├── (onboarding)/       # Onboarding-Wizard
│   ├── (app)/              # Workspace-App (auth-geschützt)
│   │   ├── dashboard/      # Projekt-Übersicht
│   │   ├── projects/[id]/  # Projektseite, Transkripte, XLSX-Import
│   │   └── settings/       # Branding, LLM, API-Keys, Members, Billing
│   ├── (guest)/            # Gast-Ansicht (öffentlich, kein Login)
│   ├── desktop/            # Desktop-App Download-Seite (öffentlich, GitHub-Releases)
│   ├── auth/callback/      # Supabase E-Mail-Bestätigung
│   └── api/                # API Routes
│       ├── lop/            # LOP CRUD
│       ├── transcripts/    # Upload + Inline-Verarbeitung + Retry
│       ├── projects/[id]/  # Import (XLSX-Reimport), Guests
│       ├── v1/             # Öffentliche REST API (Bearer-Token)
│       ├── api-keys/       # API-Key-Verwaltung
│       ├── feedback/       # Feedback-Speicherung (DB + GitHub)
│       ├── invitations/    # Einladungs-Generierung + Resend-E-Mail
│       ├── mollie/         # Checkout + Webhook (Billing)
│       ├── cron/           # Täglicher E-Mail-Digest (Mo–Fr 17 Uhr)
│       └── settings/       # Branding, Logo-Upload
├── components/
│   ├── lop/                # LopTable, LopTableRow, LopItemDialog,
│   │                       # ReviewBanner, AiReviewPanel, StatusBadge, PriorityBadge
│   ├── transcripts/        # TranscriptUploadForm, RetryButton
│   ├── projects/           # ProjectTitleEditor, ProjectInviteButton,
│   │                       # ProjectPageClient, XlsxImportDialog
│   ├── desktop/            # DesktopRecordButton (Record per LOP-Liste)
│   ├── workspace/          # WorkspaceNav
│   ├── settings/           # BillingTab, SettingsPageClient, …
│   ├── landing/            # LandingSecuritySection, LandingLegalFooter
│   ├── legal/              # LegalModal (AGB + Datenschutzerklärung)
│   ├── FeedbackButton.tsx  # Feedback-Popup (fixed bottom-left)
│   ├── HowToModal.tsx      # How-to-Tour (6 Schritte)
│   ├── SecurityModal.tsx   # Datensicherheits-Popup (9 TOMs)
│   └── ui/                 # shadcn/ui Komponenten
├── lib/
│   ├── supabase/           # Client, Server, Middleware Helper
│   ├── llm/                # LLM-Abstraktionsschicht (BYOK): Anthropic, OpenAI, Azure, Perplexity, Groq
│   ├── workspace.ts        # resolveWorkspace() Helper
│   ├── encryption.ts       # AES-256-GCM (mit Error-Handling)
│   ├── apiKeyAuth.ts       # SHA-256 API-Key-Validierung + Scope-Prüfung
│   ├── processTranscript.ts # Shared LLM-Verarbeitungslogik (inline + retry)
│   ├── export.ts           # XLSX-Export (SheetJS)
│   ├── import.ts           # XLSX-Reimport: parseImportSheet + computeImportDiff
│   ├── mollie.ts           # getMollieClient() + isMollieConfigured()
│   ├── plan-gate.ts        # checkProjectLimit / checkTranscriptLimit / checkSeatLimit
│   └── plans.ts            # Tier-Limits (Beta/Free/Solo/Team/Business)
├── supabase/migrations/    # SQL Migrations (019 Dateien, alle deployed)
├── docs/                   # hetzner-migration-plan.md
├── scripts/                # bump-version.sh, install-hooks.sh
├── middleware.ts            # Auth-Schutz + Workspace-Header
├── next.config.js          # output: standalone, Security Headers, withNextIntl
├── CLAUDE.md               # Entwicklungsregeln & Fallstricke
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
GITHUB_FEEDBACK_BRANCH          # Branch für Feedback-Commits (default: claude/github-automated-access-WVPL6)
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
| **9.2** | Custom Domain `autotodo.vencly.com` | ✅ DNS konfiguriert |
| **9.4** | Slack/Teams-Integration via Webhook | ✅ Erledigt |
| **M15** | AutoToDo Recorder PWA (Mic → Whisper → LOP) | ✅ Phase 1 fertig |
| **M16** | Nutzer-Feedback: Status-Dropdown, Dedup, Namens-Matching, Unarchive | ✅ Erledigt |
| **9.6** | SSO (SAML für Enterprise) | Offen (Business-Plan) |
| **10.1** | Landing Page Hero-Illustration | Teilweise (Animationen live) |
| **10.9** | Dark Mode | Offen |
| **M15.7** | PWA Offline-Fallback-Seite | Offen |
| **M15.8** | Phase 2: Tauri Desktop-App (System-Audio, separates Repo) | ✅ Erledigt (v0.1.x, macOS ARM/Intel + Windows) |
| **Hetzner** | Migration auf CX32 + Self-hosted Supabase | ✅ Abgeschlossen |

## Entwicklungsstand

Siehe [Tasks.md](./Tasks.md) für den aktuellen Bearbeitungsstand nach Meilensteinen.
Siehe [Brief.md](./Brief.md) für die vollständige Produktspezifikation.
Siehe [CLAUDE.md](./CLAUDE.md) für Entwicklungsregeln und bekannte Fallstricke.
Siehe [Tasks.md](./Tasks.md) für den aktuellen Stand aller offenen Punkte.

---

## Lizenz

Proprietär – alle Rechte vorbehalten.
