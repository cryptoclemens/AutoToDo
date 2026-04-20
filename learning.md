# Learning.md – Session-Erkenntnisse für zukünftige Projekte

Stand: März 2026 · AutoToDo / vencly

Diese Datei dokumentiert Fehler, Fallstricke und Best Practices aus der Entwicklung von AutoToDo.
Kann als Skill-Basis für ähnliche Next.js 14 + Supabase SaaS-Projekte genutzt werden.

---

## 1. Next.js – App Router

### 1.1 Route Groups & clientModules-Crash
**Problem:** Landing Page in `(marketing)/page.tsx` führt zu `clientReferenceManifest`-Crash beim Build.
**Fix:** Landing Page gehört direkt in `app/page.tsx` – niemals in eine Route Group.

### 1.2 `useSearchParams()` braucht Suspense
**Problem:** Komponente mit `useSearchParams()` crasht beim Build ohne Suspense-Boundary.
**Fix:** Server Component wrапpt Client Component in `<Suspense>`. Pattern immer anwenden.

### 1.3 Keine Funktionen als Props Server → Client
**Problem:** `<ClientComponent onDone={() => {}} />` wirft „Event handlers cannot be passed to Client Component props".
**Fix:** Callbacks intern durch `router.refresh()` ersetzen.

### 1.4 Re-Exporte in App Router
**Problem:** `export { default } from './andere/page'` in App-Router-Pages führt zu clientModules-Crash.
**Fix:** Inhalt direkt in die Zieldatei schreiben, keine Re-Exporte.

### 1.5 Nur erlaubte Named Exports in Route Files
**Problem:** `export const LEGAL_VERSION = '...'` in einer API Route (`route.ts`) schlägt beim Vercel-Build fehl.
**Fix:** Route-Dateien dürfen nur `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS` exportieren. Konstanten ohne `export` definieren.

### 1.6 `next/image` – externe Domains immer freischalten
**Problem:** Bilder von Supabase Storage erscheinen als broken image (alt-Text statt Bild).
**Fix:** In `next.config.js` unter `images.remotePatterns` eintragen:
```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }
  ]
}
```
**Gilt für:** Jedes externe Bild (Supabase Storage, S3, Cloudinary, etc.) – immer zuerst prüfen.

### 1.7 Loading States via `loading.tsx`
Next.js App Router zeigt `loading.tsx` automatisch während Server Components laden.
Skeleton-Screens in `app/(app)/dashboard/loading.tsx` und `app/(app)/projects/[id]/loading.tsx` anlegen.

---

## 2. Supabase

### 2.1 RLS-Rekursion in `workspace_members`
**Problem:** Policy, die `workspace_members` in eigenem `USING`-Ausdruck referenziert → Endlos-Rekursion.
**Fix:**
```sql
CREATE POLICY "workspace_members_read" ON workspace_members
  FOR SELECT USING (user_id = auth.uid());
```
Kein verschachteltes `EXISTS (SELECT 1 FROM workspace_members ...)` in dieser Policy.

### 2.2 Service-Role-Client für privilegierte DB-Operationen
**Problem:** User-Client kann durch RLS `workspace_members` nicht lesen (außer eigene Zeile).
**Fix:** Service-Role-Client für DB-Queries, Auth-Check separat mit User-Client:
```ts
const authClient = createClient() // User-Client → nur für auth.getUser()
const supabase = createServiceClient(url, serviceRoleKey) // Service-Client → für DB
```

### 2.3 `resolveWorkspace()` statt direktem Slug-Lookup
**Problem:** Direkte `.eq('slug', slug)` scheitert auf Single-Domain-Deployments (kein Subdomain-Header).
**Fix:** Immer `resolveWorkspace(supabase, userId, slug)` verwenden – tried Slug, fällt auf Membership-Fallback zurück.

### 2.4 Storage Buckets: Nicht vergessen anzulegen
**Problem:** Supabase Storage Bucket `logos` und `transcripts` müssen explizit erstellt werden. Fehlt der Bucket, gibt die API „bucket not found" zurück.
**Fix:** Migration anlegen oder Bucket beim ersten Upload automatisch erstellen:
```ts
await supabase.storage.createBucket('logos', { public: true, fileSizeLimit: 2_097_152 })
// Fehler ignorieren – tritt auf wenn Bucket bereits existiert
```

### 2.5 Storage Upload: Cache-Busting
**Problem:** Nach Re-Upload mit gleichem Dateinamen (`logo.png`) zeigt Browser/CDN/`next/image` die gecachte alte Version.
**Fix:** Timestamp im Dateinamen: `logo_${Date.now()}.${ext}`. Vorher alte Dateien via `storage.list()` + `remove()` löschen.

### 2.6 Storage Bucket Policies
Selbst mit Service-Role-Client muss der Bucket als `public: true` angelegt sein, damit öffentliche URLs funktionieren. Policies für Insert/Update/Delete mit `auth.role() = 'authenticated'` absichern.

---

## 3. JSON & Translations (next-intl)

### 3.1 Deutsche Anführungszeichen in JSON-Strings
**Problem:** `„text"` – das schließende `"` ist oft ein ASCII-Anführungszeichen (U+0022), das den JSON-String abbricht. Fehler: `Cannot parse JSON: Expected ',' or '}'`.
**Fix:** Immer `»text«` oder `"text"` (Unicode-Quotes) in JSON-Werten verwenden. Niemals ASCII-`"` als Anführungszeichen innerhalb eines JSON-Strings.
**Prüfung:** `python3 -c "import json; json.load(open('messages/de.json'))"` vor jedem Commit.

### 3.2 next-intl ohne URL-Routing (cookie-basiert)
Locale in Cookie speichern (`locale`-Cookie, 1 Jahr), kein Pathname-Routing:
```ts
// i18n/request.ts
const locale = cookies().get('locale')?.value ?? 'de'
```
`NextIntlClientProvider` im Root-Layout wrапpt alle Seiten. `getLocale()` in Server Components, `useLocale()` in Client Components.

### 3.3 `next-intl` Plugin in next.config.js
```js
import createNextIntlPlugin from 'next-intl/plugin'
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')
export default withNextIntl(nextConfig)
```
Muss ES Module sein (kein `module.exports`).

---

## 4. Git & Deployment

### 4.1 Pre-Push Hook & Version-Bump
Der Hook `scripts/bump-version.sh` erhöht automatisch die Patch-Version bei jedem Push.
- Erstellt Commit `chore: bump version to X.Y.Z` mit `--no-verify`
- Hook erkennt bereits gebumpte Commits und überspringt (kein Loop)
- **Folge:** Nach jedem Push entstehen 2 Commits (Feature + Bump). Der lokale `origin/...`-Ref ist danach veraltet.

### 4.2 Veralteter Remote-Ref nach Push
**Problem:** Nach Push mit GITHUB_TOKEN-URL ist `origin/branch` lokal veraltet → `git log origin/branch..HEAD` zeigt fälschlich 2 unpushed Commits.
**Fix:**
```bash
git fetch "https://user:$TOKEN@github.com/org/repo.git" branch:refs/remotes/origin/branch
```

### 4.3 403 bei git push (Proxy-Token abgelaufen)
```bash
git push "https://cryptoclemens:${GITHUB_TOKEN}@github.com/cryptoclemens/AutoToDo.git" <branch>
```
`GITHUB_TOKEN` per `env | grep GITHUB_TOKEN` ermitteln.

### 4.4 TypeScript vor jedem Push prüfen
```bash
npx tsc --noEmit
```
Fängt alle TS-Fehler ab, ohne den vollen Build (der lokal wegen fehlender Google Fonts scheitert).

---

## 5. UX-Patterns

### 5.1 Überfällige Elemente visuell hervorheben
LOP-Items mit `due_date < today` und Status ≠ `abgeschlossen` rot markieren:
```tsx
const overdue = !isDone && new Date(due_date) < today
<span className={overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
  {overdue && <span>⚠</span>}
  {formattedDate}
</span>
```

### 5.2 Erledigte Items automatisch nach unten sortieren + ausgrauen
```ts
const STATUS_ORDER = { offen: 0, in_bearbeitung: 1, abgeschlossen: 2 }
items.sort((a, b) => (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0))
```
Row-Styling:
```tsx
const isDone = item.status === 'abgeschlossen'
<tr className={isDone ? 'opacity-60 bg-gray-50' : ''}>
```

### 5.3 Dashboard Statistik-Karten
Workspace-weite KPIs (offen / überfällig / erledigt / gesamt) über alle Projekte aggregieren:
- Query: `lop_items.select('status, due_date').in('project_id', projectIds)`
- Nur anzeigen wenn `totalCount > 0` (kein leerer Stats-Block bei neuen Workspaces)
- Überfällig-Karte nur rot einfärben wenn `overdueCount > 0`

### 5.4 Mobile Navigation (Hamburger)
Animierter Hamburger (3 Balken → X via CSS `translate` + `rotate`).
Mobile Drawer als zusätzlicher `<div>` unterhalb der `<nav>`, gesteuert durch `useState(false)`.
Bei Link-Klick: `setMobileOpen(false)` schließt den Drawer automatisch.

### 5.5 Skeleton-Screens
`loading.tsx` neben `page.tsx` – Next.js zeigt es automatisch während SSR lädt.
Pattern: gleiche Grid-Struktur wie die echte Seite, alle Elemente als `animate-pulse bg-gray-200 rounded`.

---

## 6. Sicherheit

### 6.1 Security Headers (immer setzen)
In `next.config.js` für alle Routen:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 6.2 Webhook-Signierung (HMAC-SHA256)
```ts
crypto.createHmac('sha256', secret).update(body).digest('hex')
```
Shared Secret: `randomBytes(32).toString('hex')` (64 Hex-Zeichen).
Header: `X-AutoToDo-Signature: <hex>`.

### 6.3 Retry mit exponential backoff
```ts
async function retry(fn, attempt = 1) {
  try { return await fn() }
  catch (e) {
    if (attempt >= 3) throw e
    await new Promise(r => setTimeout(r, 2 ** attempt * 1000))
    return retry(fn, attempt + 1)
  }
}
```

### 6.4 API-Key-Hashing (SHA-256)
Niemals Plaintext-API-Keys in der DB. Immer SHA-256-gehasht speichern, nur beim Erstellen einmalig zeigen.

---

## 7. Bekannte Vercel-Eigenheiten

### 7.1 Inline-Verarbeitung statt fire-and-forget
Vercel beendet Background-Requests sofort nach Response. LLM-Verarbeitung muss synchron im Request-Handler laufen, mit `export const maxDuration = 60`.

### 7.2 ES Module in next.config.js
```js
// Richtig:
import createNextIntlPlugin from 'next-intl/plugin'
export default withNextIntl(nextConfig)
// NICHT: module.exports = ...
```

### 7.3 Umgebungsvariablen-Checkliste
Für vollständige Funktion braucht AutoToDo auf Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENCRYPTION_SECRET` (64 Hex-Zeichen, `openssl rand -hex 32`)
- `CRON_SECRET` (32 alphanumerische Zeichen)
- `RESEND_API_KEY` (optional, für E-Mail-Versand)
- `MOLLIE_API_KEY` (optional, für Zahlungsabwicklung)

---

## 8. Datenbankschema-Patterns

### 8.1 Migrations nummerieren und idempotent schreiben
`001_initial.sql`, `002_rls.sql`, ... – aufsteigend nummerieren.
`IF NOT EXISTS`, `ON CONFLICT DO NOTHING` für Idempotenz.

### 8.2 Storage-Bucket-Migrations
Buckets per SQL anlegen:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', true, 2097152, ARRAY['image/png','image/jpeg','image/webp','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;
```

### 8.3 `get_workspace_members_with_email` als SECURITY DEFINER RPC
Um E-Mail-Adressen aus `auth.users` zu lesen (die nur als Superuser zugänglich sind), Postgres-Funktion mit `SECURITY DEFINER` erstellen.

---

---

## 9. Freemium-Modell & Plan-Gates

### 9.1 Zentrale Limit-Konfiguration
Alle Plan-Limits in einer einzigen Datei (`lib/plans.ts`) definieren – keine hardcodierten Zahlen in Routen oder Komponenten. Grandfathering über `planExpiresAt`: solange in der Zukunft → Beta-Limits gelten.

### 9.2 Gate-Funktionen pattern
```ts
export async function checkProjectLimit(supabase, workspaceId, plan, planExpiresAt?): Promise<GateResult>
// GateResult: { allowed: true } | { allowed: false; reason: string; upgradeHint: Plan }
```
Bei `!gate.allowed` → HTTP 402 zurückgeben. Frontend kann darauf mit UpgradeNudge reagieren.

### 9.3 Monatliche Nutzungs-Counter
`workspace_usage`-Tabelle mit `period_start DATE` und `transcripts_month INTEGER`. Reset durch Upsert:
```sql
INSERT INTO workspace_usage (workspace_id, transcripts_month, period_start)
VALUES (id, 1, date_trunc('month', now()))
ON CONFLICT (workspace_id) DO UPDATE SET
  transcripts_month = CASE WHEN excluded.period_start > workspace_usage.period_start
    THEN 1 ELSE workspace_usage.transcripts_month + 1 END,
  period_start = GREATEST(excluded.period_start, workspace_usage.period_start)
```

### 9.4 Gast-System (tokenbasiert)
`project_guests`-Tabelle mit UUID-Token, 30-Tage-Ablauf. Öffentliche Seite `/guest/[token]` ohne Login – kein Middleware-Schutz nötig (eigener Route-Group `(guest)`). Viral CTA am Ende der Seite.

---

## 10. Zahlungsdienstleister: Mollie statt Stripe

### 10.1 Warum Mollie für DACH-SaaS
- EU-Unternehmen (Niederlande) → einfachere DSGVO-Compliance (kein US-Datentransfer)
- Nativ SEPA-Lastschrift, Klarna, iDEAL – Standard in DE/NL
- Günstigere EUR-Transaktionen, kein Währungskonvertierungs-Aufschlag
- Mollie Subscriptions API: `POST /v2/subscriptions` (Customer-basiert)

### 10.2 Mollie Webhook-Verifizierung
Mollie signiert Webhooks **nicht** mit HMAC (anders als Stripe). Verifizierung durch Fetch der Ressource:
```ts
const payment = await mollieClient.payments.get(paymentId)
// Nur wenn payment.status === 'paid' → DB updaten
```
Eigenen Webhook-Secret via Custom Header oder Metadata-Token für Basis-Schutz.

### 10.3 Mollie Checkout Flow
1. `POST /v2/payments` → Response enthält `_links.checkout.href`
2. Nutzer zu `checkoutUrl` redirecten
3. Mollie → `webhookUrl` (POST mit `id=pay_xxx`)
4. Mollie → `redirectUrl` (GET, nach Bezahlung)

---

## 11. next-intl – Vollständige i18n-Abdeckung

### 11.1 Alle Strings aus Komponenten auslagern
Toast-Nachrichten, Confirm-Dialoge, Button-Labels, Platzhalter – **alles** in `messages/de.json` + `messages/en.json`. Regel: Kein deutsches Wort direkt im JSX/TSX außer Eigennamen.

### 11.2 Server vs. Client Components
- Server Component (async): `const t = await getTranslations('namespace')` (aus `next-intl/server`)
- Client Component: `const t = useTranslations('namespace')` (aus `next-intl`)
- `getTranslations` in Server Components **nicht** aus `next-intl` importieren (nur aus `next-intl/server`)

### 11.3 Cookie-basiertes Locale ohne URL-Routing
```ts
// i18n/request.ts
const locale = cookies().get('locale')?.value ?? 'de'
```
Kein Pathname-Präfix (`/de/`, `/en/`) nötig. Locale wird im Cookie gespeichert und pro Request gelesen.

### 11.4 Pluralisierung in next-intl
```ts
// messages/de.json
"success": "{count} Einladung erstellt.",
"successPlural": "{count} Einladungen erstellt.",

// Komponente
toast.success(count === 1 ? t('success', { count }) : t('successPlural', { count }))
```

### 11.5 Rechtliche Seiten: Nur Shell übersetzen
AGB/Datenschutz/Impressum unterliegen deutschem Recht → Inhalt bleibt auf Deutsch.
Nur `LegalPageShell` (Nav-Buttons, Footer) wird via `useTranslations('legal')` lokalisiert.

---

---

## 12. Cloudflare DNS + Custom Domain

### 12.1 Vercel + Cloudflare: Proxy ausschalten
Für Vercel-Deployments muss der Cloudflare-Proxy auf **DNS-only** (graue Wolke) stehen.
Vercel stellt das SSL-Zertifikat via ACME-Challenge aus — das funktioniert nur bei direktem DNS-Lookup.
Mit orangener Wolke (proxied) schlägt die Zertifikat-Ausstellung fehl.

### 12.2 CNAME-Record für Subdomain → Vercel
```
Typ:     CNAME
Name:    autotodo        (→ autotodo.vencly.com)
Inhalt:  cname.vercel-dns.com
Proxy:   DNS-only (grau)
```
Zusätzlich in Vercel Dashboard → Settings → Domains hinzufügen.

### 12.3 Supabase Redirect-URLs nach Domain-Wechsel
Supabase → Authentication → URL Configuration aktualisieren:
- Site URL: neue Domain
- Redirect URLs: `https://neue-domain/auth/callback`
Vergisst man das, schlagen E-Mail-Bestätigungen + Passwort-Reset fehl.

### 12.4 NEXT_PUBLIC_* brauchen Redeploy
`NEXT_PUBLIC_*`-Variablen werden zur **Build-Zeit** eingebettet, nicht zur Laufzeit.
ENV-Var in Vercel ändern → danach Redeploy erzwingen, sonst bleibt der alte Wert aktiv.

---

## 13. E-Mail-Digest: Diagnose

### 13.1 responsible_user_id vs. Freitext
Der tägliche Digest filtert auf `.not('responsible_user_id', 'is', null)`.
Nur LOP-Punkte, die über das **Mitglied-Dropdown** verknüpft sind, triggern E-Mails.
Freitext im `responsible`-Feld reicht nicht — kein User, keine E-Mail.

### 13.2 Dry-Run-Modus zur Diagnose
```
GET /api/cron/daily-digest?dry_run=true
Authorization: Bearer <CRON_SECRET>
```
Gibt zurück, wer EINE E-Mail bekäme und für wie viele Items — ohne tatsächlich zu senden.

---

## 14. Self-hosted Deployment (Coolify/Docker)

### 14.1 Next.js Standalone Output
Für Docker-Deployments `output: 'standalone'` in `next.config.mjs` setzen.
Next.js baut dann ein minimales `.next/standalone/`-Verzeichnis ohne `node_modules`.

### 14.2 sharp als Production-Dependency
`sharp` muss in `dependencies` (nicht `devDependencies`) stehen:
```bash
npm install sharp --save
```
Im standalone-Build wird `node_modules` nicht mitgeliefert — `sharp` fehlt sonst zur Laufzeit.

### 14.3 NEXT_PUBLIC_* in Coolify als Build-Vars
In Coolify unter Environment Variables müssen `NEXT_PUBLIC_*`-Vars als **Build Args** markiert sein.
Reine Runtime-Vars werden von Next.js nicht in den Client-Bundle eingebettet.

### 14.5 Perplexity AI – OpenAI-kompatibler BYOK-Provider
Perplexity nutzt die OpenAI SDK-Schnittstelle mit Custom `baseURL`:
```ts
const client = new OpenAI({ apiKey: config.apiKey, baseURL: 'https://api.perplexity.ai' })
```
Wichtig: Perplexity-Modelle (`sonar`, `sonar-pro`) unterstützen `response_format: { type: 'json_object' }` **nicht** zuverlässig — JSON-Zäune im Output stripping notwendig:
```ts
const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
```
API-Key-Format: `pplx-…`, erhältlich unter perplexity.ai/settings/api.

### 14.4 Self-hosted Supabase Fallback-Strategie
Drei ENV-Vars tauschen = Fallback auf Supabase Cloud in ~10 Min:
```
NEXT_PUBLIC_SUPABASE_URL        → Supabase Cloud URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   → Cloud Anon Key
SUPABASE_SERVICE_ROLE_KEY       → Cloud Service Role Key
```
Alle anderen Vars (Resend, Mollie, Encryption, App URL) bleiben identisch.

---

## 15. @base-ui/react – Bekannte Bugs & Workarounds

### 15.1 SelectValue löst Display-Text lazy auf
**Problem:** `<SelectValue>` im `<SelectTrigger>` zeigt den rohen `value`-Prop (z. B. eine UUID) an, bis das Dropdown zum ersten Mal geöffnet wird. Erst dann rendert das Portal die `<SelectItem>`-Kinder und `SelectValue` kann den richtigen Label-Text ermitteln.
**Fix:** Display-Text explizit im Trigger rendern statt auf `SelectValue` zu verlassen:
```tsx
<SelectTrigger>
  {matchedMember
    ? <span className="flex-1 text-left truncate text-sm">{matchedMember.display_name}</span>
    : <SelectValue placeholder={placeholder} />}
</SelectTrigger>
```
**Gilt für:** Alle `@base-ui/react` Select-Komponenten wenn der `value` ein technischer Identifier (UUID, Enum) ist.

---

## 16. Vercel – Env Var Änderungen

### 16.1 Env Var Änderung erfordert Redeploy
Ändert man in Vercel eine `RESEND_FROM`-Variable (oder jede andere), greift der neue Wert **nicht** automatisch. Es ist ein neuer Deployment-Vorgang nötig (Redeploy im Vercel-Dashboard oder ein neuer Push).
**Ausnahme:** `NEXT_PUBLIC_*`-Vars werden zur Build-Zeit eingebettet → Redeploy zwingend. Server-seitige Vars werden zur Runtime gelesen → Redeploy ebenfalls nötig da Vercel Serverless Functions gecacht sind.

### 16.2 RESEND_FROM Format in Vercel
Wert muss das vollständige Format haben: `AutoToDo <noreply@vencly.app>`
Nicht nur `noreply@vencly.app` – Resend akzeptiert zwar beide, aber mit Display-Namen ist die E-Mail professioneller.
**Wichtiger:** Die Domain (`vencly.app`) muss in Resend unter Domains verifiziert sein.

---

## 17. Notion API – Internal Integration Token

### 17.1 Internal Integration Token vs. OAuth
Für einfache BYOK-Integrationen (Nutzer konfiguriert selbst) ist der Internal Integration Token (`secret_...`) deutlich einfacher als OAuth:
- Nutzer erstellt Token unter `notion.so/profile/integrations`
- Token teilt keine App-Registration-Kosten
- Validierung gegen `GET https://api.notion.com/v1/users/me` mit `Authorization: Bearer <token>`

### 17.2 Notion-Seiten müssen explizit geteilt werden
Nach Token-Erstellung muss der Nutzer jede Seite/Datenbank in Notion explizit mit der Integration teilen (über das „..." Menü → „Connections"). Ohne das → 404 bei Block-Abfragen.

### 17.3 Notion Blocks rekursiv fetchen
Notion API gibt nur direkte Kinder zurück. Für verschachtelte Inhalte (Toggle-Listen, Sub-Pages) müssen `/v1/blocks/{id}/children` rekursiv bis zu einer sinnvollen Tiefe (z. B. 3) aufgerufen werden.

### 17.4 Nur `export HTTP_METHODS` in Route Files
**Problem:** `export async function getNotionToken(...)` in `app/api/settings/integrations/notion/route.ts` erzeugt Build-Fehler: *"Route files can only export HTTP methods"*
**Fix:** Hilfsfunktionen in `lib/`-Dateien auslagern (`lib/notion.ts`) und von dort importieren.

*Diese Datei bei neuen Projekten als Referenz nutzen und projektspezifische Learnings anhängen.*

---

## 21. Tauri 2 Desktop-App (AutoToDo-Desktop)

### 21.1 `ureq` JSON-Parsing: `.into_json()` vs `.into_string()`
**Problem:** `response.into_json::<serde_json::Value>()` → `method not found` — erfordert das `json`-Feature-Flag in `ureq`.
**Fix:** `.into_string()` + `serde_json::from_str(&body)` — funktioniert ohne Feature-Flag.

### 21.2 Tauri `dialog.message` auf Remote-URLs blockiert
**Problem:** `alert()` in bridge.js (injiziert per `on_page_load`) wirft `dialog.message not allowed` auf Remote-URLs (`autotodo.vencly.com`).
**Fix:** Eigene `showNotice()`-Funktion als DOM-Element (`position:fixed; bottom`) statt `alert()`.

### 21.3 `tauri_plugin_notification` injiziert JS in alle WebViews
**Problem:** Das Notification-Plugin registriert einen JS-Handler global — auch auf Remote-URLs → Konsolen-Fehler `notification.is_permission_granted not allowed`.
**Fix:** Plugin komplett entfernen (`tauri_plugin_notification::init()` aus `lib.rs`, `"notification:default"` aus `capabilities/default.json`). Native Browser-Notifications werden nicht benötigt.

### 21.4 Stream-Pause ohne WAV-Merging
**Problem:** Pause + Resume bei Audio-Aufnahme erfordert normalerweise WAV-Dateien zusammenzufügen.
**Fix:** `cpal`-Stream pausieren (`stream.0.pause()`) — der `Vec<f32>`-Sample-Puffer im Speicher wächst einfach nicht weiter. Resume mit `stream.0.play()`. Alle Samples sind beim `stop()` vollständig vorhanden.

### 21.5 `on_page_load` Bridge-Injection nur auf vertrauenswürdigen URLs
bridge.js nur injecten wenn `url.contains("autotodo.vencly.com")` — nicht auf der lokalen Login-Seite (`index.html`). Verhindert Fehler wenn Tauri-APIs noch nicht bereit sind.

### 21.6 Desktop-App im Browser-Kontext erkennen
**Pattern:** `window.__autoToDo` ist nur vorhanden wenn bridge.js injiziert wurde (Tauri-Desktop-App auf vertrauenswürdiger URL).
```ts
// Tauri erkennen
const isDesktopApp = typeof window !== 'undefined' && !!window.__autoToDo
```
Verwenden in React-Komponenten mit `useEffect(() => { setIsDesktopApp(!!window.__autoToDo) }, [])`.

### 21.7 SSR Cookies auf `NextResponse.redirect()`
**Problem:** `createServerClient()` aus `@supabase/ssr` schreibt Cookies in `next/headers` (cookieStore) — bei einem `NextResponse.redirect()` landen die Cookies nicht in der Response.
**Fix:** Response zuerst erstellen, dann `createServerClient` mit `setAll`-Callback darauf zeigen:
```ts
const response = NextResponse.redirect(url)
const supabase = createServerClient(url, key, {
  cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    ),
  },
})
```

### 21.9 whisper-rs: Meetily-konforme FullParams
**Vorteil:** Kein externes `whisper-cli`-Binary nötig. Modell wird direkt in Rust geladen.
**macOS:** `whisper-rs = { version = "0.13", features = ["metal"] }` aktiviert Metal-GPU.
**Meetily-Standard FullParams** (BeamSearch statt Greedy, Stille-Unterdrückung intern):
```rust
let mut params = FullParams::new(SamplingStrategy::BeamSearch { beam_size: 5, patience: 1.0 });
params.set_language(Some("de"));
params.set_no_timestamps(true);
params.set_suppress_blank(true);
params.set_suppress_non_speech_tokens(true);
params.set_temperature(0.3);
params.set_entropy_thold(2.4);
params.set_logprob_thold(-1.0);
params.set_no_speech_thold(0.55); // Whisper filtert Stille intern – kein externer VAD-Gate nötig
params.set_max_initial_ts(1.0);
```
**Regel:** Kein externer Binary-Gate vor Whisper. `no_speech_thold=0.55` ersetzt den WebRTC-VAD-Schwellwert.

### 21.10 Meetily-Audiopipeline – RNNoise standardmäßig deaktiviert
**Meetily-Quelle:** `RNNOISE_APPLY_ENABLED: bool = false` — Kommentar: *"Whisper handles noise well internally"*
**Unsere Pipeline (korrekt):** WAV → mono f32 → rubato SincFixedIn → 16 kHz → Whisper
**Fehler (historisch):** RNNoise mit normalisierten f32 [-1..1] betrieben → Signal auf ~0 reduziert → Halluzination
**Warum:** nnnoiseless-Tests zeigen i16-Range-Floats (aus `.raw`-PCM-Bytes gelesen), aber Meetily übergibt normalisierte f32 ohne Skalierung und hat es deaktiviert. Sicherste Lösung: RNNoise weglassen.
**rubato SincFixedIn:** Verarbeitet in fixen 4096-Sample-Blöcken; letzter Block wird mit Nullen aufgefüllt.
**Fallback:** lineare Interpolation wenn rubato-Init fehlschlägt.
**Crate:** `rubato = "0.15"` (nnnoiseless entfernt).

### 21.12 macOS Mikrofonberechtigung: NSMicrophoneUsageDescription Pflicht
**Problem:** Ohne `NSMicrophoneUsageDescription` in der Info.plist verweigert macOS Ventura/Sonoma den Mikrofonzugriff **ohne Dialog und ohne Fehlermeldung**. cpal bekommt Nullen → Whisper halluziniert auf Stille.
**Symptom:** 3 Minuten Sprache → „Die Strecke ist nicht so gut. ." (typische Whisper-Halluzination für Stille).
**Fix in `tauri.conf.json`:**
```json
"macOS": {
  "infoPlist": {
    "NSMicrophoneUsageDescription": "AutoToDo benötigt Mikrofonzugriff für Meeting-Aufnahmen."
  }
}
```
**Diagnose:** RMS-Logging nach Aufnahme (`rms < 0.001` → Warnung). Normaler Sprachpegel: RMS > 0.01.
**Merke:** Das Entitlement `com.apple.security.device.audio-input` allein reicht nicht — der Usage-String ist zusätzlich zwingend.
**System-Audio (BlackHole/Loopback):** Benötigt NUR Mikrofon-Permission (virtuelle Input-Geräte). Screen-Recording-Permission nur für zukünftiges ScreenCaptureKit (Phase 2).

### 21.13 GitHub Actions: Tauri Build Matrix
```yaml
matrix:
  include:
    - platform: macos-latest   # ARM (M1/M2/M3)
      args: '--target aarch64-apple-darwin'
    - platform: macos-13       # Intel
      args: '--target x86_64-apple-darwin'
    - platform: windows-latest # Windows 10/11
      args: ''
```
Rust-Toolchain mit explizitem `targets`-Feld pro Platform. Windows benötigt kein Cross-Compilation-Target.

---

## 18. Table Row Editing – Escape & Outside-Click

### 18.1 Escape-Key + Outside-Click für Inline-Edit-Zeilen
**Problem:** `<tr>` hat kein natives `blur`-Event. Escape-Taste und Klick außerhalb der Zeile haben den Edit-Modus nicht beendet.
**Fix:** `useEffect` mit `document.addEventListener('keydown', ...)` + `document.addEventListener('mousedown', ...)`:
```ts
useEffect(() => {
  if (!editing) return
  const cancel = () => { setDraft(item); setEditing(false) }
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel() }
  const onMouse = (e: MouseEvent) => {
    if (rowRef.current && !rowRef.current.contains(e.target as Node)) cancel()
  }
  document.addEventListener('keydown', onKey)
  document.addEventListener('mousedown', onMouse)
  return () => {
    document.removeEventListener('keydown', onKey)
    document.removeEventListener('mousedown', onMouse)
  }
}, [editing])
```
**Wichtig:** `rowRef` muss auf dem `<tr>`-Element sitzen. Cleanup-Funktion immer mitgeben um Memory Leaks zu vermeiden.

### 18.2 Status-Toggle: Dropdown statt Cycling
**Problem:** Click-to-cycle (offen → in_bearbeitung → abgeschlossen) verursacht versehentliche Statusänderungen.
**Fix:** Relative-positioned Wrapper + State `dropdownOpen` + Dropdown-Div mit allen 3 Optionen. Outside-Click per separatem `useEffect` schließen.
**Regel:** Destructive/irreversible UI-Aktionen immer bewusste Bestätigung erfordern (Dropdown, Dialog, Confirm).

---

## 19. `useSearchParams()` in Next.js App Router

### 19.1 `useSearchParams()` unreliable nach SSR
**Problem:** `useSearchParams()` gibt in Client Components nach SSR/Hydration manchmal `null` oder leere Params zurück, bis die Seite vollständig hydratisiert ist. Führt dazu, dass `?tab=ki` immer auf Default-Tab fällt.
**Fix:** `window.location.search` in einem `useEffect` lesen (nur client-side, nach Hydration):
```ts
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const t = params.get('tab')
  if (t && VALID_TABS.includes(t)) setTab(t)
}, [])
```
**Gilt für:** Alle Fälle wo URL-Parameter zum initialen State-Setzen genutzt werden.

---

## 20. LLM Prompt Engineering – Dedup & Name Matching

### 20.1 Duplikat-Prävention im System-Prompt
Damit die KI keine Duplikate erstellt, reicht es nicht, bestehende Items zu übergeben.
Der Prompt muss **explizit** anweisen:
- Vor jedem `create`: semantische Ähnlichkeit mit bestehenden Items prüfen
- Bei Überschneidung: `update` + `lop_item_id` des bestehenden Items verwenden
- Umbenennung: `update` + `title`-Feld (neues Feld im Schema ergänzen)
- `create` nur wenn eindeutig kein Bezug zu einem bestehenden Eintrag besteht
Bestehende Items mit `description` übergeben (nicht nur `title`) – mehr Kontext = besseres Matching.

### 20.3 LLM max_tokens: Trunkierung erkennen statt JSON-Parse-Fehler
**Problem:** Bei langen Transkripten wurde die LLM-Antwort bei 4096 Tokens abgeschnitten. Das führte zu ungültigem JSON und kryptischen Parse-Fehlern in der UI.
**Fix:** `max_tokens` auf 8192 erhöhen + explizite Trunkierungs-Erkennung:
```ts
// Anthropic
if (message.stop_reason === 'max_tokens') {
  throw new Error('LLM-Antwort wurde abgeschnitten (Transkript zu lang).')
}
// OpenAI / Azure / Perplexity
if (completion.choices[0]?.finish_reason === 'length') {
  throw new Error('LLM-Antwort wurde abgeschnitten (Transkript zu lang).')
}
```
**Regel:** Immer `stop_reason`/`finish_reason` prüfen bevor JSON geparst wird.

### 20.2 Namens-Matching via Workspace-Mitglieder-Kontext
Workspace-Mitglieder (Name + E-Mail) als separaten Block in den User-Prompt einfügen:
```
Workspace-Mitglieder:
- Katharina Müller (k.mueller@firma.de)
- Markus Schmidt (m.schmidt@firma.de)
```
KI normalisiert automatisch Tippfehler im Transkript (Katarina → Katharina) wenn der korrekte Name im Kontext steht.
Externe Personen (nicht in der Liste) → Freitext-Name aus Transkript beibehalten.
