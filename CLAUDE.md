# CLAUDE.md – Projektregeln für AutoToDo

## Pflichtworkflow vor jedem Push

**Immer zuerst lokal builden:**
```bash
npm run build
```
Erst wenn der Build grün ist, pushen. Das fängt alle TypeScript-, ESLint- und Prerendering-Fehler ab, die sonst erst bei Vercel sichtbar werden.

**Hinweis:** `npm run build` schlägt lokal fehl wegen fehlendem Internetzugang (Google Fonts). TypeScript-Fehler trotzdem vorab prüfen mit:
```bash
npx tsc --noEmit
```

---

## Projektstruktur

- **Next.js 14** App Router, TypeScript, Tailwind CSS v3
- **Supabase** (Auth + Postgres + Storage) — Projekt: `lgnlviezjdvxgmknmfog.supabase.co`
- **Route Groups:**
  - `app/(auth)/` — Login, Register, Update-Password
  - `app/(app)/` — Dashboard, Projekte (auth-geschützt via Middleware)
  - `app/(onboarding)/` — Onboarding-Wizard
  - `app/page.tsx` — Landing Page (direkt in app/, KEIN Route-Group)
  - `app/auth/callback/` — Supabase E-Mail-Bestätigungs-Handler
- **Migrations:** `supabase/migrations/` (011 Dateien, alle deployed)
- **Zahlungsdienstleister:** Mollie (EU, SEPA, DSGVO-konform) — Infrastruktur in `lib/mollie.ts`, `/api/mollie/`
- **Mehrsprachigkeit:** `next-intl` (cookie-basiert), Messages in `messages/de.json` + `messages/en.json`
- **Gast-System:** `app/(guest)/guest/[token]/page.tsx` (öffentlich, kein Login)
- **Storage Bucket:** `logos` (öffentlich, für Workspace-Logos), `transcripts` (privat)

---

## Workspace-Auflösung

**Niemals** direkt per Slug suchen (`eq('slug', slug)`) — schlägt fehl auf Single-Domain-Deployments.

**Immer** `resolveWorkspace()` aus `@/lib/workspace` verwenden:
```ts
import { resolveWorkspace } from '@/lib/workspace'

const slug = headers().get('x-workspace-slug') ?? ''
const workspace = await resolveWorkspace(supabase, user.id, slug)
if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })
const workspaceId = workspace.id
```

`resolveWorkspace()` versucht erst den Slug-Lookup, fällt dann auf Membership-Fallback zurück.

---

## Bekannte Fallstricke

### 1. Route Groups und clientModules-Crash
Next.js 14 hat einen Bug mit `clientReferenceManifest` bei Route Groups.
**Nie** die Landing Page in einem Route Group wie `(marketing)` ablegen.
Die Landing Page gehört direkt in `app/page.tsx`.

### 2. `useSearchParams()` braucht Suspense
Jede Komponente mit `useSearchParams()` muss in einer `<Suspense>`-Boundary liegen.
Pattern: Server Component wrапpt Client Component:
```tsx
// page.tsx (Server Component)
export default function Page() {
  return <Suspense fallback={<div>Laden…</div>}><ClientForm /></Suspense>
}
// ClientForm.tsx ('use client' + useSearchParams)
```

### 3. Keine Funktionen von Server → Client Component übergeben
Next.js App Router verbietet das Übergeben von Funktionen als Props von Server Components an Client Components:
```tsx
// FALSCH – wirft "Event handlers cannot be passed to Client Component props"
<ClientComponent onDone={() => {}} />

// RICHTIG – Callback intern ersetzen, z.B. mit router.refresh()
```
Client Components sollen `router.refresh()` selbst aufrufen statt einen Callback zu erwarten.

### 4. `@base-ui/react` Komponenten brauchen `'use client'`
Alle UI-Komponenten, die `@base-ui/react` oder shadcn-Primitives nutzen, müssen `'use client'` ganz oben haben.

### 5. globals.css — Reihenfolge und Imports
```css
/* Richtig: */
@tailwind base;
@tailwind components;
@tailwind utilities;
/* NICHT importieren: tw-animate-css, shadcn/tailwind.css */
```
`tw-animate-css` und `shadcn/tailwind.css` per `@import` verursachen Build-Fehler.

### 6. ESLint — Ungenutzte Variablen
Ungenutzte Variablen mit `_`-Prefix kennzeichnen (z.B. `_userId`).
Konfiguration in `.eslintrc.json`:
```json
{
  "@typescript-eslint/no-unused-vars": ["error", {
    "argsIgnorePattern": "^_",
    "varsIgnorePattern": "^_",
    "caughtErrorsIgnorePattern": "^_"
  }]
}
```
Alternativ: bare `catch {}` statt `catch (_err)`.

### 7. `next/image` statt `<img>`
Immer `<Image>` aus `next/image` verwenden, nie natives `<img>`.

### 8. Re-Exporte in App Router
`export { default } from './andere/page'` in App-Router-Pages führt zu clientModules-Crashes.
Stattdessen Inhalt direkt in die Zieldatei schreiben.

### 9. RLS-Rekursion in workspace_members
Die `workspace_members`-Tabelle darf sich nicht selbst in einer RLS-Policy referenzieren.
Korrekte Policy (Migration 005):
```sql
CREATE POLICY "workspace_members_read" ON workspace_members
  FOR SELECT USING (user_id = auth.uid());
```
Kein `EXISTS (SELECT 1 FROM workspace_members WHERE ...)` in dieser Policy.

### 10. Service-Role-Client für Operationen mit workspace_members
Seiten und API-Routes, die `workspace_members` lesen müssen, verwenden den Service-Role-Client:
```ts
import { createClient as createServiceClient } from '@supabase/supabase-js'
const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```
Auth-Prüfung (wer ist eingeloggt?) immer separat mit dem User-Client (`createClient()` aus `@/lib/supabase/server`).

### 11. ENCRYPTION_SECRET Pflicht
Für LLM-API-Key-Speicherung ist `ENCRYPTION_SECRET` (64-Hex-Zeichen) zwingend erforderlich – lokal in `.env.local`, auf Vercel in den Environment Variables.
```bash
openssl rand -hex 32
```

### 12. next-intl – Neue Übersetzungsschlüssel
Client Components: `useTranslations('namespace')` → `t('key')`
Server Components: `await getTranslations('namespace')` → `t('key')`
**Niemals** hardcodierte deutsche Strings in Komponenten — immer über `messages/de.json` + `messages/en.json`.
JSON validieren nach jeder Änderung: `python3 -c "import json; json.load(open('messages/de.json'))"`

### 13. Plan-Gates für Freemium
Beim Erstellen von Projekten / Transkripten / Einladungen **immer** `checkProjectLimit` / `checkTranscriptLimit` / `checkSeatLimit` aus `lib/plan-gate.ts` aufrufen → bei Limit HTTP 402 zurückgeben.
Workspace-Plan immer als `ws?.plan ?? 'beta'` mit `'beta'` als sicheren Default lesen.

### 14. Mollie-Webhook verifizieren
Mollie signiert Webhooks **nicht** mit einem Header. Verifizierung durch Fetch der Ressource direkt vom Mollie-API:
```ts
const payment = await mollie.payments.get(paymentId) // Mollie API
// Nur wenn payment.status === 'paid' → Workspace upgraden
```

---

## Git-Workflow

- **Branch für Claude:** `claude/github-automated-access-WVPL6`
- **Pre-Push Hook:** `scripts/bump-version.sh` erhöht automatisch die Patch-Version
  - Bumpt `package.json` und `app/page.tsx` (`APP_VERSION`)
  - Erstellt einen Commit `chore: bump version to X.Y.Z`
  - Hook erkennt bereits gebumpte Commits und überspringt (kein Loop)
- **Push-Befehl (normal):** `git push -u origin <branch>`
- **Push-Befehl (falls 403 – Proxy-Token abgelaufen):**
  ```bash
  git push https://cryptoclemens:${GITHUB_TOKEN}@github.com/cryptoclemens/AutoToDo.git claude/github-automated-access-WVPL6
  ```
  `GITHUB_TOKEN` aus Umgebungsvariable: `env | grep GITHUB_TOKEN`

---

## Supabase

- **Migrations anwenden:** `supabase db push` (lokal: `supabase migration up`)
- **Neue Migration:** Datei in `supabase/migrations/` anlegen, Nummerierung fortführen (012_, 013_, …)
- **Auth Redirect URLs** müssen im Supabase Dashboard unter Authentication → URL Configuration stehen:
  - Site URL: `https://deine-app.vercel.app`
  - Redirect URLs: `https://deine-app.vercel.app/auth/callback`

---

## LLM-Integration (BYOK)

- Nutzer hinterlegen eigene API-Keys (Anthropic oder OpenAI) in Workspace-Einstellungen (`/settings/llm`)
- Keys werden AES-256-GCM verschlüsselt in `workspace_llm_config` gespeichert
- Verarbeitung in `app/api/transcripts/[id]/process/route.ts`
- `ENCRYPTION_SECRET` muss identisch in lokalem `.env.local` und Vercel-Env gesetzt sein
