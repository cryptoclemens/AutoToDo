# AutoToDo

**KI-gestütztes LOP-Management für Teams** | Multi-Tenant SaaS | BYOK-Edition | v0.1.41

AutoToDo automatisiert die Pflege von Listen offener Punkte (LOPs) aus Meeting-Transkripten. Meeting hochladen → KI extrahiert Aufgaben & Statusänderungen → KI-Vorschläge prüfen, bearbeiten, annehmen → LOP aktuell → Export als XLSX.

---

## Tech Stack

| Layer | Technologie |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Supabase (PostgreSQL + Auth + Storage) |
| KI | Anthropic Claude / OpenAI GPT / Azure OpenAI (BYOK – Bring Your Own Key) |
| Deployment | Vercel (maxDuration 60s für LLM-Verarbeitung) |
| E-Mail | Resend (optional, via `RESEND_API_KEY`) |
| Billing | Stripe (geplant) |

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
supabase/migrations/004_lop_extensions.sql
supabase/migrations/005_fix_rls_recursion.sql
supabase/migrations/006_llm_endpoint.sql
supabase/migrations/007_m7.sql
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
│   │   ├── projects/[id]/  # Projektseite, Transkripte
│   │   └── settings/       # Branding, LLM, API-Keys, Members
│   ├── auth/callback/      # Supabase E-Mail-Bestätigung
│   └── api/                # API Routes
│       ├── lop/            # LOP CRUD
│       ├── transcripts/    # Upload + Inline-Verarbeitung + Retry
│       ├── v1/             # Öffentliche REST API (Bearer-Token)
│       ├── api-keys/       # API-Key-Verwaltung
│       ├── feedback/       # Feedback-Speicherung (DB + GitHub)
│       ├── invitations/    # Einladungs-Generierung + Resend-E-Mail
│       └── settings/       # Branding, Logo-Upload
├── components/
│   ├── lop/                # LopTable, LopTableRow, LopItemDialog,
│   │                       # ReviewBanner, AiReviewPanel, StatusBadge, PriorityBadge
│   ├── transcripts/        # TranscriptUploadForm, RetryButton
│   ├── workspace/          # WorkspaceNav
│   ├── projects/           # ProjectTitleEditor, ProjectInviteButton, ProjectPageClient
│   ├── landing/            # LandingSecuritySection, LandingLegalFooter
│   ├── legal/              # LegalModal (AGB + Datenschutzerklärung)
│   ├── FeedbackButton.tsx  # Feedback-Popup (fixed bottom-left)
│   ├── HowToModal.tsx      # How-to-Tour (6 Schritte)
│   ├── SecurityModal.tsx   # Datensicherheits-Popup (9 TOMs)
│   └── ui/                 # shadcn/ui Komponenten
├── lib/
│   ├── supabase/           # Client, Server, Middleware Helper
│   ├── llm/                # LLM-Abstraktionsschicht (BYOK): Anthropic, OpenAI, Azure
│   ├── workspace.ts        # resolveWorkspace() Helper
│   ├── encryption.ts       # AES-256-GCM (mit Error-Handling)
│   ├── apiKeyAuth.ts       # SHA-256 API-Key-Validierung + Scope-Prüfung
│   ├── processTranscript.ts # Shared LLM-Verarbeitungslogik (inline + retry)
│   └── export.ts           # XLSX-Export (SheetJS)
├── supabase/migrations/    # SQL Migrations (7 Dateien)
├── scripts/                # bump-version.sh, install-hooks.sh
├── middleware.ts            # Auth-Schutz + Workspace-Header
├── next.config.mjs         # Security Headers (HSTS, X-Frame-Options, nosniff, …)
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
- **Transkript-Verarbeitung:** Synchron inline im Upload-Request (Vercel-kompatibel, kein fire-and-forget)

---

## Deployment (Vercel)

Erforderliche Umgebungsvariablen in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ENCRYPTION_SECRET           # openssl rand -hex 32  (64 Hex-Zeichen)
INTERNAL_API_SECRET         # beliebiger Secret-String
# Optional:
RESEND_API_KEY              # aktiviert E-Mail-Versand (Einladungen + täglicher Digest)
RESEND_FROM                 # z.B. "AutoToDo <noreply@autotodo.app>"
NEXT_PUBLIC_APP_URL         # Basis-URL für Links in E-Mails (z.B. https://autotodo.app)
GITHUB_FEEDBACK_TOKEN       # GitHub-Token mit repo-write-Zugriff → schreibt Feedback in feedback.md
GITHUB_FEEDBACK_BRANCH      # Branch für feedback.md (default: main)
CRON_SECRET                 # Secret für Vercel Cron Job Authorization (täglicher Digest)
```

Supabase Auth → URL Configuration:
- Site URL: `https://deine-app.vercel.app`
- Redirect URLs: `https://deine-app.vercel.app/auth/callback`

Supabase Storage:
- `logos`-Bucket: public (Workspace-Logos)
- `transcripts`-Bucket: **privat** (verschlüsselte Transkript-Inhalte)

---

## Roadmap (nächste Meilensteine)

| Meilenstein | Inhalt |
|---|---|
| **M7e** | E-Mail-Digest: tägliche Zusammenfassung offener Punkte je Verantwortlichem; Verantwortliche aus eingeladenen Mitgliedern auswählen (Dropdown mit E-Mail) |
| **M8** | Webhooks (HMAC-SHA256, Retry) + Audit-Log UI |
| **Phase 3** | Stripe-Billing, Subdomain-Routing, Slack/Teams-Integration |

## Entwicklungsstand

Siehe [Tasks.md](./Tasks.md) für den aktuellen Bearbeitungsstand nach Meilensteinen.
Siehe [Brief.md](./Brief.md) für die vollständige Produktspezifikation.
Siehe [CLAUDE.md](./CLAUDE.md) für Entwicklungsregeln und bekannte Fallstricke.

---

## Lizenz

Proprietär – alle Rechte vorbehalten.
