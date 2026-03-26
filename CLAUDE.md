# CLAUDE.md – Projektregeln für AutoToDo

## Pflichtworkflow vor jedem Push

**Immer zuerst lokal builden:**
```bash
npm run build
```
Erst wenn der Build grün ist, pushen. Das fängt alle TypeScript-, ESLint- und Prerendering-Fehler ab, die sonst erst bei Vercel sichtbar werden.

---

## Projektstruktur

- **Next.js 14** App Router, TypeScript, Tailwind CSS v3
- **Supabase** (Auth + Postgres + Storage) — Projekt: `lgnlviezjdvxgmknmfog.supabase.co`
- **Route Groups:**
  - `app/(auth)/` — Login, Register
  - `app/(app)/` — Dashboard, Projekte (auth-geschützt via Middleware)
  - `app/(onboarding)/` — Onboarding-Wizard
  - `app/page.tsx` — Landing Page (direkt in app/, KEIN Route-Group)
- **Migrations:** `supabase/migrations/` (4 Dateien, alle deployed)
- **Storage Bucket:** `logos` (öffentlich, für Workspace-Logos)

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

### 3. `@base-ui/react` Komponenten brauchen `'use client'`
Alle UI-Komponenten, die `@base-ui/react` oder shadcn-Primitives nutzen, müssen `'use client'` ganz oben haben.

### 4. globals.css — Reihenfolge und Imports
```css
/* Richtig: */
@tailwind base;
@tailwind components;
@tailwind utilities;
/* NICHT importieren: tw-animate-css, shadcn/tailwind.css */
```
`tw-animate-css` und `shadcn/tailwind.css` per `@import` verursachen Build-Fehler.

### 5. ESLint — Ungenutzte Variablen
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

### 6. `next/image` statt `<img>`
Immer `<Image>` aus `next/image` verwenden, nie natives `<img>`.

### 7. Re-Exporte in App Router
`export { default } from './andere/page'` in App-Router-Pages führt zu clientModules-Crashes.
Stattdessen Inhalt direkt in die Zieldatei schreiben.

---

## Git-Workflow

- **Branch für Claude:** `claude/github-automated-access-WVPL6`
- **Pre-Push Hook:** `scripts/bump-version.sh` erhöht automatisch die Patch-Version
  - Bumpt `package.json` und `app/page.tsx` (`APP_VERSION`)
  - Erstellt einen Commit `chore: bump version to X.Y.Z`
  - Hook erkennt bereits gebumpte Commits und überspringt (kein Loop)
- **Push-Befehl:** `git push -u origin <branch>`

---

## Supabase

- **Migrations anwenden:** `supabase db push` (lokal: `supabase migration up`)
- **Neue Migration:** Datei in `supabase/migrations/` anlegen, Nummerierung fortführen
- **Auth Redirect URLs** müssen im Supabase Dashboard unter Authentication → URL Configuration eingetragen werden (bei neuer Vercel-URL)

---

## LLM-Integration (BYOK)

- Nutzer hinterlegen eigene API-Keys (Anthropic oder OpenAI) in Workspace-Einstellungen
- Keys werden verschlüsselt in der DB gespeichert (`workspaces.llm_api_key`)
- Verarbeitung in `app/api/transcripts/[id]/process/route.ts`
