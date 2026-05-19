# F-023: Benachrichtigungsfrequenz & Account-Info — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der E-Mail-Digest erhält eine Frequenzeinstellung (Täglich / 2× pro Woche / Wöchentlich / Aus); ein Hinweis-Link verweist auf die bereits vorhandene Name/E-Mail-Bearbeitung.

**Architecture:** Migration 036 adds `digest_frequency` enum to `workspaces` and backfills from `digest_enabled`. The notifications API replaces the boolean toggle with the new enum. The cron checks `digest_frequency` and day-of-week. `SettingsPageClient` replaces the toggle UI with a select and shows an account-link hint.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase Postgres, next-intl (`useTranslations('settings')`)

---

### Task 1: DB Migration 036 — digest_frequency auf workspaces

**Files:**
- Create: `supabase/migrations/036_workspace_digest_frequency.sql`

- [ ] **Step 1: Migrationsdatei anlegen**

```sql
-- supabase/migrations/036_workspace_digest_frequency.sql
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS digest_frequency TEXT NOT NULL DEFAULT 'daily'
  CONSTRAINT workspaces_digest_frequency_check
    CHECK (digest_frequency IN ('daily', 'twice_weekly', 'weekly', 'disabled'));

-- Bestehende deaktivierte Workspaces migrieren
UPDATE workspaces SET digest_frequency = 'disabled' WHERE digest_enabled = false;
```

- [ ] **Step 2: Migration anwenden**

```bash
cd /root/deploy/autotodo
bash deploy-autotodo.sh migrate /root/autotodo/supabase/migrations/036_workspace_digest_frequency.sql
```

Expected: `ALTER TABLE`, dann `UPDATE X` ohne Fehler.

- [ ] **Step 3: Verifizieren**

```bash
docker compose -f /root/deploy/autotodo/docker-compose.autotodo.yml exec -T supabase-db \
  psql -U postgres -d postgres -c "SELECT digest_enabled, digest_frequency, COUNT(*) FROM workspaces GROUP BY 1,2;"
```

Expected: Zeilen mit korrektem Mapping (`false` → `disabled`, `true` → `daily`).

- [ ] **Step 4: Commit**

```bash
git -C /root/autotodo add supabase/migrations/036_workspace_digest_frequency.sql
git -C /root/autotodo commit -m "feat: migration 036 — add digest_frequency to workspaces"
```

---

### Task 2: GET/PATCH /api/settings/notifications — digest_frequency

**Files:**
- Modify: `app/api/settings/notifications/route.ts`

Aktueller Stand: `patchSchema` hat `digest_enabled: z.boolean().optional()`. GET liest `digest_enabled`. PATCH schreibt `digest_enabled`.

- [ ] **Step 1: patchSchema ersetzen**

```ts
const patchSchema = z.object({
  digest_enabled: z.boolean().optional(),
  digest_frequency: z.enum(['daily', 'twice_weekly', 'weekly', 'disabled']).optional(),
  slack_webhook_url: z.string().url().nullable().optional(),
  bundesland: z.string().nullable().optional(),
})
```

- [ ] **Step 2: GET-Select erweitern**

```ts
    .select('digest_enabled, digest_frequency, slack_webhook_url, bundesland')
```

- [ ] **Step 3: PATCH updates-Builder um digest_frequency ergänzen**

Nach der bestehenden `digest_enabled`-Zeile:
```ts
  if (parsed.data.digest_enabled !== undefined) updates.digest_enabled = parsed.data.digest_enabled
  if (parsed.data.digest_frequency !== undefined) {
    updates.digest_frequency = parsed.data.digest_frequency
    updates.digest_enabled = parsed.data.digest_frequency !== 'disabled'
  }
```

- [ ] **Step 4: TypeScript prüfen**

```bash
cd /root/autotodo && npx tsc --noEmit 2>&1 | head -20
```

Expected: keine Fehler.

- [ ] **Step 5: Commit**

```bash
git add app/api/settings/notifications/route.ts
git commit -m "feat: notifications API supports digest_frequency"
```

---

### Task 3: Cron — Frequenz-Check pro Workspace

**Files:**
- Modify: `app/api/cron/daily-digest/route.ts`

Aktueller Stand: Cron filtert `.eq('digest_enabled', true)` und hat (nach F-022) bereits den `bundesland`-Feiertags-Filter.

- [ ] **Step 1: Workspaces-Query auf digest_frequency umstellen**

```ts
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, bundesland, digest_frequency')
    .neq('digest_frequency', 'disabled') as {
      data: Array<{ id: string; name: string; bundesland: string | null; digest_frequency: string }> | null
    }
```

- [ ] **Step 2: Frequenz-Check vor dem Feiertags-Filter einfügen**

Nach dem `if (!workspaces?.length)` Block, vor dem `todayStr`-Block:

```ts
  const today = new Date().getDay() // 0=So, 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa
  const frequencyFilteredWorkspaces = (workspaces ?? []).filter(ws => {
    if (ws.digest_frequency === 'weekly') return today === 1       // nur Montag
    if (ws.digest_frequency === 'twice_weekly') return today === 1 || today === 4  // Mo + Do
    return true // 'daily': kein zusätzlicher Filter (Crontab Mo–Fr)
  })

  if (!frequencyFilteredWorkspaces.length) {
    return NextResponse.json({ sent: 0, dry_run: dryRun, reason: 'No workspaces scheduled for today based on frequency.' })
  }
```

- [ ] **Step 3: Feiertags-Filter auf frequencyFilteredWorkspaces umstellen**

Den bestehenden `activeWorkspaces`-Filter aus F-022 anpassen:
```ts
  const todayStr = new Date().toISOString().slice(0, 10)
  const activeWorkspaces = frequencyFilteredWorkspaces.filter(ws => {
    const holidays = getGermanHolidays(new Date().getFullYear(), ws.bundesland)
    return !holidays.has(todayStr)
  })
```

- [ ] **Step 4: TypeScript prüfen**

```bash
cd /root/autotodo && npx tsc --noEmit 2>&1 | head -20
```

Expected: keine Fehler.

- [ ] **Step 5: Commit**

```bash
git add app/api/cron/daily-digest/route.ts
git commit -m "feat: digest cron respects digest_frequency per workspace"
```

---

### Task 4: SettingsPageClient — Frequency-Select + Account-Hinweis

**Files:**
- Modify: `app/(app)/settings/page.tsx`
- Modify: `components/settings/SettingsPageClient.tsx`

#### Part A: Settings-Page (Server Component)

- [ ] **Step 1: Workspace-Query in `app/(app)/settings/page.tsx` (Zeile 36) ergänzen**

```ts
    .from('workspaces').select('id, name, brand_color, logo_url, digest_enabled, digest_frequency, bundesland, plan, plan_expires_at')
```

- [ ] **Step 2: Typ-Definition (Zeile 38) ergänzen**

```ts
      data: { id: string; name: string; brand_color: string; logo_url: string | null; digest_enabled: boolean; digest_frequency: string; bundesland: string | null; plan: string; plan_expires_at: string | null } | null
```

- [ ] **Step 3: Default-Prop (Zeile 121) ergänzen**

```ts
      workspace={ws ?? { id: workspace.id, name: workspace.name, brand_color: '#2563EB', logo_url: null, digest_enabled: true, digest_frequency: 'daily', bundesland: null, plan: 'beta', plan_expires_at: null }}
```

#### Part B: SettingsPageClient

- [ ] **Step 4: Props-Interface um digest_frequency erweitern**

```ts
  workspace: { id: string; name: string; brand_color: string; logo_url: string | null; digest_enabled: boolean; digest_frequency: string; bundesland: string | null; plan?: string; plan_expires_at?: string | null }
```

- [ ] **Step 5: Neuen State für digest_frequency nach digestSaving ergänzen**

```ts
  const [digestFrequency, setDigestFrequency] = useState<string>(workspace.digest_frequency ?? 'daily')
  const [digestFrequencySaving, setDigestFrequencySaving] = useState(false)
```

- [ ] **Step 6: handleDigestFrequencyChange nach handleDigestToggle hinzufügen**

```ts
  async function handleDigestFrequencyChange(value: string) {
    setDigestFrequency(value)
    setDigestFrequencySaving(true)
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digest_frequency: value }),
      })
      if (res.ok) {
        toast.success(ts('digestSaved', { status: ts(value === 'disabled' ? 'digestStatusDisabled' : 'digestStatusActive') }))
      } else {
        setDigestFrequency(workspace.digest_frequency ?? 'daily')
        toast.error(ts('digestError'))
      }
    } finally {
      setDigestFrequencySaving(false)
    }
  }
```

- [ ] **Step 7: Digest-UI-Block ersetzen**

Den gesamten Inhalt des `{/* E-Mail-Digest */}` Blocks (von `<div className="border-t pt-6">` bis zum schließenden `</div>`) ersetzen mit:

```tsx
          {/* E-Mail-Digest */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{ts('digestTitle')}</h3>
            <p className="text-xs text-gray-500 mb-4">{ts('digestFrequencyDesc')}</p>
            <div className="flex items-center gap-4 flex-wrap">
              <select
                value={digestFrequency}
                onChange={e => handleDigestFrequencyChange(e.target.value)}
                disabled={digestFrequencySaving}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="daily">{ts('digestFrequencyDaily')}</option>
                <option value="twice_weekly">{ts('digestFrequencyTwiceWeekly')}</option>
                <option value="weekly">{ts('digestFrequencyWeekly')}</option>
                <option value="disabled">{ts('digestFrequencyDisabled')}</option>
              </select>
              <button
                type="button"
                onClick={handleDigestTestSend}
                disabled={digestTestSending || digestFrequency === 'disabled'}
                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
              >
                {digestTestSending ? 'Sende…' : 'Test-E-Mail senden'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              {ts('accountHint')}{' '}
              <a href="/settings?tab=account" className="text-blue-600 hover:underline">
                {ts('accountHintLink')}
              </a>
            </p>
          </div>
```

- [ ] **Step 8: TypeScript prüfen**

```bash
cd /root/autotodo && npx tsc --noEmit 2>&1 | head -20
```

Expected: keine Fehler.

- [ ] **Step 9: Commit**

```bash
git add app/\(app\)/settings/page.tsx components/settings/SettingsPageClient.tsx
git commit -m "feat: digest frequency select and account hint link in settings"
```

---

### Task 5: i18n + DashboardUpdates

**Files:**
- Modify: `messages/de.json`
- Modify: `messages/en.json`
- Modify: `components/dashboard/DashboardUpdates.tsx`

Alle neuen Keys gehören unter `settings` (nicht `settings.workspace`), da `SettingsPageClient` `useTranslations('settings')` verwendet.

- [ ] **Step 1: Deutsche Übersetzungen — nach `digestError` in `settings`**

```json
"digestFrequencyDesc": "Wie oft soll der tägliche Aufgaben-Digest versendet werden?",
"digestFrequencyDaily": "Täglich (Mo–Fr)",
"digestFrequencyTwiceWeekly": "2× pro Woche (Mo + Do)",
"digestFrequencyWeekly": "Wöchentlich (Mo)",
"digestFrequencyDisabled": "Aus",
"accountHint": "Name oder E-Mail-Adresse ändern:",
"accountHintLink": "Konto-Einstellungen →"
```

- [ ] **Step 2: Englische Übersetzungen — nach `digestError` in `settings`**

```json
"digestFrequencyDesc": "How often should the task digest be sent?",
"digestFrequencyDaily": "Daily (Mon–Fri)",
"digestFrequencyTwiceWeekly": "Twice a week (Mon + Thu)",
"digestFrequencyWeekly": "Weekly (Mon)",
"digestFrequencyDisabled": "Off",
"accountHint": "Change name or email address:",
"accountHintLink": "Account settings →"
```

- [ ] **Step 3: JSON validieren**

```bash
python3 -c "import json; json.load(open('/root/autotodo/messages/de.json')); json.load(open('/root/autotodo/messages/en.json')); print('OK')"
```

Expected: `OK`

- [ ] **Step 4: DashboardUpdates — F-023 als erstes Element einfügen**

In `components/dashboard/DashboardUpdates.tsx`, ganz oben ins `UPDATES`-Array:

```ts
{
  id: 'F-023',
  date: '19.05.2026',
  title: 'Digest-Häufigkeit wählbar',
  description: 'Der E-Mail-Digest lässt sich nun auf täglich, 2× pro Woche, wöchentlich oder aus einstellen.',
},
```

- [ ] **Step 5: TypeScript prüfen**

```bash
cd /root/autotodo && npx tsc --noEmit 2>&1 | head -20
```

Expected: keine Fehler.

- [ ] **Step 6: Commit**

```bash
git add messages/de.json messages/en.json components/dashboard/DashboardUpdates.tsx
git commit -m "feat: i18n and dashboard entry for F-023"
```

---

### Task 6: Push

- [ ] **Step 1: Push**

```bash
git push
```
