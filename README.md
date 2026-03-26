# AutoToDo

**KI-gestütztes LOP-Management für Teams** | Multi-Tenant SaaS | BYOK-Edition

AutoToDo automatisiert die Pflege von Listen offener Punkte (LOPs) aus Meeting-Transkripten. Meeting hochladen → KI extrahiert Aufgaben & Statusänderungen → LOP aktuell → Export als XLSX.

---

## Tech Stack

| Layer | Technologie |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Supabase (PostgreSQL + Auth + Storage) |
| KI | Anthropic Claude / OpenAI GPT / Azure OpenAI (BYOK – Bring Your Own Key) |
| Deployment | Vercel |
| E-Mail | Resend (geplant) |
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
│   ├── (auth)/             # Login, Register, Passwort-Reset
│   ├── (onboarding)/       # Onboarding-Wizard
│   ├── (app)/              # Workspace-App (auth-geschützt)
│   ├── auth/callback/      # Supabase E-Mail-Bestätigung
│   └── api/                # API Routes
├── components/
│   ├── lop/                # LOP-Tabelle, Badges, ReviewBanner
│   ├── transcripts/        # TranscriptUploadForm
│   ├── workspace/          # Nav, BrandProvider
│   └── ui/                 # shadcn/ui Komponenten
├── lib/
│   ├── supabase/           # Client, Server, Middleware Helper
│   ├── llm/                # LLM-Abstraktionsschicht (BYOK)
│   ├── workspace.ts        # resolveWorkspace() Helper
│   ├── encryption.ts       # AES-256-GCM
│   └── export.ts           # XLSX-Export (SheetJS)
├── supabase/migrations/    # SQL Migrations (5 Dateien)
├── scripts/                # bump-version.sh, install-hooks.sh
├── middleware.ts            # Auth-Schutz + Workspace-Header
├── CLAUDE.md               # Entwicklungsregeln & Fallstricke
└── Tasks.md                # Meilenstein-Tracking
```

---

## Multi-Tenancy & Sicherheit

- **Workspace-Auflösung:** `resolveWorkspace()` löst den Workspace via Slug (Subdomain) oder Membership-Fallback auf – funktioniert auf Single-Domain und Subdomain-Deployments
- **Row-Level Security:** Vollständige Datenisolation zwischen Workspaces auf DB-Ebene
- **BYOK:** API-Keys für Anthropic, OpenAI und Azure OpenAI werden AES-256-GCM verschlüsselt gespeichert
- **Azure OpenAI:** Endpoint-URL + Deployment-Name konfigurierbar (Microsoft Copilot Enterprise)
- **Transkripte:** Copy & Paste oder Datei (.txt/.rtf), verschlüsselt in Supabase Storage
- **Service-Role-Client:** Verwendet serverseitig, um RLS-Rekursionsprobleme zu umgehen

---

## Deployment (Vercel)

Erforderliche Umgebungsvariablen in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ENCRYPTION_SECRET          # openssl rand -hex 32
INTERNAL_API_SECRET        # beliebiger Secret-String
```

Supabase Auth → URL Configuration:
- Site URL: `https://deine-app.vercel.app`
- Redirect URLs: `https://deine-app.vercel.app/auth/callback`

---

## Entwicklungsstand

Siehe [Tasks.md](./Tasks.md) für den aktuellen Bearbeitungsstand nach Meilensteinen.
Siehe [Brief.md](./Brief.md) für die vollständige Produktspezifikation.
Siehe [CLAUDE.md](./CLAUDE.md) für Entwicklungsregeln und bekannte Fallstricke.

---

## Lizenz

Proprietär – alle Rechte vorbehalten.
