# AutoToDo

**KI-gestütztes LOP-Management für Teams** | Multi-Tenant SaaS | BYOK-Edition

AutoToDo automatisiert die Pflege von Listen offener Punkte (LOPs) aus Meeting-Transkripten. Meeting hochladen → KI extrahiert Aufgaben & Statusänderungen → LOP aktuell → Export als XLSX.

---

## Tech Stack

| Layer | Technologie |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Supabase (PostgreSQL + Auth + Storage) |
| KI | Anthropic Claude / OpenAI GPT (BYOK – Bring Your Own Key) |
| Deployment | Vercel (Wildcard Domains `*.autotodo.app`) |
| Billing | Stripe |
| E-Mail | Resend |

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
│   ├── (marketing)/        # Landing Page
│   ├── (auth)/             # Login, Register, Invite
│   ├── (onboarding)/       # 3-Schritt-Wizard
│   ├── (app)/              # Workspace-App (auth-geschützt)
│   └── api/                # API Routes + öffentliche API /v1
├── components/
│   ├── lop/                # LOP-Tabelle, Badges, ReviewBanner
│   ├── workspace/          # Nav, BrandProvider, InviteModal
│   └── ui/                 # shadcn/ui Komponenten
├── lib/
│   ├── supabase/           # Client, Server, Middleware Helper
│   ├── llm/                # LLM-Abstraktionsschicht (BYOK)
│   ├── encryption.ts       # AES-256-GCM
│   └── export.ts           # XLSX-Export (SheetJS)
├── supabase/migrations/    # SQL Migrations (Schema, RLS, Indexes)
├── types/database.ts       # Generierte Supabase-Typen
├── middleware.ts            # Subdomain-Routing + Auth
└── .env.local.example      # Umgebungsvariablen-Vorlage
```

---

## Multi-Tenancy & Sicherheit

- **Subdomain-Routing:** Jeder Workspace erhält `[slug].autotodo.app`
- **Row-Level Security:** Vollständige Datenisolation zwischen Workspaces auf DB-Ebene
- **BYOK:** LLM-API-Keys werden AES-256-GCM verschlüsselt gespeichert
- **API-Keys:** bcrypt-gehashed, nur Präfix sichtbar
- **Webhooks:** HMAC-SHA256-Signatur

---

## Pricing

| Tier | Preis | LLM-Key |
|---|---|---|
| Free | $0 | Nicht erforderlich (Betreiber-Fallback, 10 Transkripte/Monat) |
| Starter | $19/Monat | BYOK erforderlich |
| Pro | $49/Monat | BYOK erforderlich |
| Enterprise | ab $199/Monat | BYOK oder Managed |

---

## Entwicklungsstand

Siehe [Tasks.md](./Tasks.md) für den aktuellen Bearbeitungsstand nach Meilensteinen.
Siehe [Brief.md](./Brief.md) für die vollständige Produktspezifikation.

---

## Lizenz

Proprietär – alle Rechte vorbehalten.
