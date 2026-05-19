# F-022: Feiertage im Tätigkeitsnachweis & E-Mail-Cron — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tätigkeitsnachweis zeigt alle Monatstage mit ausgegrauten Wochenenden/Feiertagen; E-Mail-Digest überspringt Feiertage gemäß konfigurierbarem Workspace-Bundesland.

**Architecture:** Migration 035 adds `bundesland` to `workspaces`. A new `getHolidayLabels()` in `lib/holidays.ts` maps dates to names. The Tätigkeitsnachweis API returns all calendar days + non-working metadata. The modal renders all days with grayed-out non-working rows. The settings page gets a Bundesland selector. The digest cron filters out workspaces whose Bundesland is on holiday today.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase Postgres, `lib/holidays.ts` (has `getGermanHolidays`, `getWorkingDays`, `BUNDESLAENDER`), next-intl (`useTranslations('settings')`)

---

### Task 1: DB Migration 035 — bundesland auf workspaces

**Files:**
- Create: `supabase/migrations/035_workspace_bundesland.sql`

- [ ] **Step 1: Migrationsdatei anlegen**

```sql
-- supabase/migrations/035_workspace_bundesland.sql
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS bundesland TEXT DEFAULT NULL;
```

- [ ] **Step 2: Migration auf Produktion anwenden**

```bash
cd /root/deploy/autotodo
bash deploy-autotodo.sh migrate /root/autotodo/supabase/migrations/035_workspace_bundesland.sql
```

Expected: `ALTER TABLE` ohne Fehler.

- [ ] **Step 3: Spalte verifizieren**

```bash
docker compose -f /root/deploy/autotodo/docker-compose.autotodo.yml exec -T supabase-db \
  psql -U postgres -d postgres -c "\d workspaces" | grep bundesland
```

Expected: `bundesland | text |`

- [ ] **Step 4: Commit**

```bash
git -C /root/autotodo add supabase/migrations/035_workspace_bundesland.sql
git -C /root/autotodo commit -m "feat: migration 035 — add bundesland to workspaces"
```

---

### Task 2: lib/holidays.ts — getHolidayLabels() ergänzen

**Files:**
- Modify: `lib/holidays.ts`

- [ ] **Step 1: `getHolidayLabels` nach `getWorkingDays` einfügen**

```ts
export function getHolidayLabels(year: number, bundesland?: string | null): Record<string, string> {
  const e = easter(year)
  const labels: Record<string, string> = {}
  const add = (date: Date, name: string) => { labels[fmt(date)] = name }
  const addStr = (str: string, name: string) => { labels[str] = name }

  addStr(`${year}-01-01`, 'Neujahr')
  add(shift(e, -2), 'Karfreitag')
  add(shift(e, 1), 'Ostermontag')
  addStr(`${year}-05-01`, 'Tag der Arbeit')
  add(shift(e, 39), 'Christi Himmelfahrt')
  add(shift(e, 50), 'Pfingstmontag')
  addStr(`${year}-10-03`, 'Tag der Deutschen Einheit')
  addStr(`${year}-12-25`, '1. Weihnachtstag')
  addStr(`${year}-12-26`, '2. Weihnachtstag')

  if (!bundesland) return labels

  if (['BW', 'BY', 'ST'].includes(bundesland))
    addStr(`${year}-01-06`, 'Heilige Drei Könige')
  if (['BE', 'MV'].includes(bundesland))
    addStr(`${year}-03-08`, 'Internationaler Frauentag')
  if (['BW', 'BY', 'HE', 'NW', 'RP', 'SL'].includes(bundesland))
    add(shift(e, 60), 'Fronleichnam')
  if (['BY', 'SL'].includes(bundesland))
    addStr(`${year}-08-15`, 'Mariä Himmelfahrt')
  if (bundesland === 'TH')
    addStr(`${year}-09-20`, 'Weltkindertag')
  if (['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH'].includes(bundesland))
    addStr(`${year}-10-31`, 'Reformationstag')
  if (['BW', 'BY', 'NW', 'RP', 'SL'].includes(bundesland))
    addStr(`${year}-11-01`, 'Allerheiligen')
  if (bundesland === 'SN') {
    const nov23 = new Date(year, 10, 23)
    add(shift(nov23, -((nov23.getDay() + 4) % 7)), 'Buß- und Bettag')
  }

  return labels
}
```

- [ ] **Step 2: TypeScript prüfen**

```bash
cd /root/autotodo && npx tsc --noEmit 2>&1 | head -20
```

Expected: keine Fehler.

- [ ] **Step 3: Commit**

```bash
git add lib/holidays.ts
git commit -m "feat: add getHolidayLabels() to lib/holidays"
```

---

### Task 3: GET /api/taetigkeitsnachweise — allDays + nonWorkingDays + holidayLabels

**Files:**
- Modify: `app/api/taetigkeitsnachweise/route.ts`

Aktueller Stand: Zeile 6 importiert `getWorkingDays`. Zeile 45 ruft `getWorkingDays(y, m, bundesland)` auf (mit Projekt-Bundesland). Zeile 127 gibt `{ days, workingDays }` zurück.

- [ ] **Step 1: Import erweitern (Zeile 6)**

```ts
import { getWorkingDays, getGermanHolidays, getHolidayLabels } from '@/lib/holidays'
```

- [ ] **Step 2: Workspace-Bundesland laden — nach Zeile 27 (nach resolveWorkspace)**

```ts
  const { data: wsRow } = await supabase
    .from('workspaces').select('bundesland').eq('id', workspace.id).single()
  const wsBundesland: string | null = (wsRow as { bundesland: string | null } | null)?.bundesland ?? null
```

- [ ] **Step 3: allDays + nonWorkingDays + holidayLabels berechnen — nach Zeile 45**

```ts
  const daysCount = new Date(y, m, 0).getDate()
  const allDays: string[] = Array.from({ length: daysCount }, (_, i) => {
    const d = String(i + 1).padStart(2, '0')
    return `${month}-${d}`
  })

  const holidays = getGermanHolidays(y, wsBundesland)
  const holidayLabels = getHolidayLabels(y, wsBundesland)
  const nonWorkingDays: string[] = allDays.filter(date => {
    const dow = new Date(date + 'T00:00:00').getDay()
    return dow === 0 || dow === 6 || holidays.has(date)
  })
```

- [ ] **Step 4: Return-Statement (Zeile 127) ersetzen**

```ts
  return NextResponse.json({ days, workingDays, allDays, nonWorkingDays, holidayLabels })
```

- [ ] **Step 5: TypeScript prüfen**

```bash
cd /root/autotodo && npx tsc --noEmit 2>&1 | head -20
```

Expected: keine Fehler.

- [ ] **Step 6: Commit**

```bash
git add app/api/taetigkeitsnachweise/route.ts
git commit -m "feat: tätigkeitsnachweis API returns allDays, nonWorkingDays, holidayLabels"
```

---

### Task 4: TaetigkeitsnachweisModal — alle Tage, Feiertage ausgegraut

**Files:**
- Modify: `components/dashboard/TaetigkeitsnachweisModal.tsx`

Aktueller Stand: Zeile 57 hat `workingDays` state. Zeile 68-69 setzt `workingDays`. Zeile 94 berechnet `activeDays`. Zeilen 177–227 rendern Tabellenzeilen.

- [ ] **Step 1: State-Deklarationen ersetzen (Zeile 57)**

```ts
  const [allDays, setAllDays] = useState<string[]>([])
  const [nonWorkingDays, setNonWorkingDays] = useState<Set<string>>(new Set())
  const [holidayLabels, setHolidayLabels] = useState<Record<string, string>>({})
```

- [ ] **Step 2: Response-Typ und Setter in load() aktualisieren (Zeilen 68–69)**

```ts
      const data: {
        days: Record<string, DayData>
        workingDays: string[]
        allDays: string[]
        nonWorkingDays: string[]
        holidayLabels: Record<string, string>
      } = await res.json()
      setAllDays(data.allDays ?? daysInMonth(m))
      setNonWorkingDays(new Set(data.nonWorkingDays ?? []))
      setHolidayLabels(data.holidayLabels ?? {})
```

- [ ] **Step 3: activeDays (Zeile 94) anpassen**

```ts
  const activeDays = allDays.length > 0 ? allDays : daysInMonth(month)
```

- [ ] **Step 4: Tabellenzeilen-Rendering (Zeilen 177–225) ersetzen**

```tsx
                  {activeDays.map(date => {
                    const val = fields[date] ?? ''
                    const remaining = MAX_LEN - val.length
                    const isNonWorking = nonWorkingDays.has(date)
                    const holidayName = holidayLabels[date]
                    return (
                      <tr
                        key={date}
                        className={`border-b border-gray-50 group ${isNonWorking ? 'opacity-50 bg-slate-50' : 'hover:bg-gray-50/50'}`}
                      >
                        <td className="py-2 pr-4 text-xs text-gray-500 whitespace-nowrap align-top pt-2.5">
                          {dayLabel(date)}
                          {holidayName && (
                            <div className="text-[10px] text-amber-600 leading-tight mt-0.5">{holidayName}</div>
                          )}
                        </td>
                        <td className="py-1.5 align-top">
                          {isNonWorking ? (
                            <div className="w-full text-xs px-1.5 py-1 text-gray-300 min-h-[24px]">–</div>
                          ) : (
                            <div className="relative" onClick={() => setEditingDate(date)}>
                              {editingDate === date ? (
                                <textarea
                                  ref={el => {
                                    if (el) {
                                      el.readOnly = true
                                      setTimeout(() => {
                                        el.readOnly = false
                                        el.focus()
                                        el.setSelectionRange(el.value.length, el.value.length)
                                      }, 50)
                                    }
                                  }}
                                  maxLength={MAX_LEN}
                                  autoComplete="off"
                                  autoCorrect="off"
                                  autoCapitalize="off"
                                  spellCheck={false}
                                  data-lpignore="true"
                                  data-1p-ignore="true"
                                  rows={val.length > 80 ? 2 : 1}
                                  value={val}
                                  onChange={e => setFields(prev => ({ ...prev, [date]: e.target.value }))}
                                  onBlur={() => setEditingDate(null)}
                                  className="w-full text-xs bg-white border border-blue-300 rounded px-1.5 py-1 focus:outline-none text-gray-800 resize-none"
                                />
                              ) : (
                                <div className="w-full text-xs px-1.5 py-1 rounded border border-transparent group-hover:border-gray-200 text-gray-700 cursor-text min-h-[24px] whitespace-pre-wrap break-words">
                                  {val || <span className="text-gray-300">–</span>}
                                </div>
                              )}
                              {editingDate === date && remaining <= 40 && (
                                <span className={`absolute right-1.5 bottom-1.5 text-xs tabular-nums ${remaining <= 10 ? 'text-red-400' : 'text-amber-400'}`}>
                                  {remaining}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
```

- [ ] **Step 5: TypeScript prüfen**

```bash
cd /root/autotodo && npx tsc --noEmit 2>&1 | head -20
```

Expected: keine Fehler.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/TaetigkeitsnachweisModal.tsx
git commit -m "feat: show all days in Tätigkeitsnachweis, gray out non-working days"
```

---

### Task 5: Settings-API + SettingsPageClient — Bundesland-Selector

**Files:**
- Modify: `app/api/settings/notifications/route.ts`
- Modify: `app/(app)/settings/page.tsx`
- Modify: `components/settings/SettingsPageClient.tsx`

#### Part A: API

- [ ] **Step 1: patchSchema in `app/api/settings/notifications/route.ts` erweitern**

```ts
const patchSchema = z.object({
  digest_enabled: z.boolean().optional(),
  slack_webhook_url: z.string().url().nullable().optional(),
  bundesland: z.string().nullable().optional(),
})
```

- [ ] **Step 2: GET-Select erweitern**

```ts
    .select('digest_enabled, slack_webhook_url, bundesland')
```

- [ ] **Step 3: PATCH updates-Builder ergänzen (nach der slack_webhook_url-Zeile)**

```ts
  if ('bundesland' in parsed.data) updates.bundesland = parsed.data.bundesland
```

#### Part B: Settings-Page (Server Component)

- [ ] **Step 4: Workspace-Query in `app/(app)/settings/page.tsx` (Zeile 36) anpassen**

```ts
    .from('workspaces').select('id, name, brand_color, logo_url, digest_enabled, bundesland, plan, plan_expires_at')
```

- [ ] **Step 5: Typ-Definition (Zeile 38) anpassen**

```ts
      data: { id: string; name: string; brand_color: string; logo_url: string | null; digest_enabled: boolean; bundesland: string | null; plan: string; plan_expires_at: string | null } | null
```

- [ ] **Step 6: Default-Prop (Zeile 121) anpassen**

```ts
      workspace={ws ?? { id: workspace.id, name: workspace.name, brand_color: '#2563EB', logo_url: null, digest_enabled: true, bundesland: null, plan: 'beta', plan_expires_at: null }}
```

#### Part C: SettingsPageClient

- [ ] **Step 7: Props-Interface um bundesland erweitern**

```ts
  workspace: { id: string; name: string; brand_color: string; logo_url: string | null; digest_enabled: boolean; bundesland: string | null; plan?: string; plan_expires_at?: string | null }
```

- [ ] **Step 8: Import BUNDESLAENDER und neue States nach digestSaving (Zeile ~100)**

```ts
import { BUNDESLAENDER } from '@/lib/holidays'
// ...
  const [bundesland, setBundesland] = useState<string | null>(workspace.bundesland)
  const [bundeslandSaving, setBundeslandSaving] = useState(false)
```

- [ ] **Step 9: handleBundeslandChange nach handleDigestToggle hinzufügen**

```ts
  async function handleBundeslandChange(value: string | null) {
    setBundesland(value)
    setBundeslandSaving(true)
    try {
      await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundesland: value }),
      })
    } finally {
      setBundeslandSaving(false)
    }
  }
```

- [ ] **Step 10: Bundesland-UI nach dem E-Mail-Digest-Block einfügen**

Nach dem schließenden `</div>` des Digest-Abschnitts (nach dem Test-E-Mail-Button):

```tsx
          {/* Bundesland für Feiertage */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{ts('bundeslandTitle')}</h3>
            <p className="text-xs text-gray-500 mb-3">{ts('bundeslandDesc')}</p>
            <select
              value={bundesland ?? ''}
              onChange={e => handleBundeslandChange(e.target.value || null)}
              disabled={bundeslandSaving}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">{ts('bundeslandNone')}</option>
              {BUNDESLAENDER.map(bl => (
                <option key={bl.code} value={bl.code}>{bl.name}</option>
              ))}
            </select>
          </div>
```

- [ ] **Step 11: TypeScript prüfen**

```bash
cd /root/autotodo && npx tsc --noEmit 2>&1 | head -20
```

Expected: keine Fehler.

- [ ] **Step 12: Commit**

```bash
git add app/api/settings/notifications/route.ts app/\(app\)/settings/page.tsx components/settings/SettingsPageClient.tsx
git commit -m "feat: bundesland selector in workspace notification settings"
```

---

### Task 6: Cron — Feiertags-Check pro Workspace

**Files:**
- Modify: `app/api/cron/daily-digest/route.ts`

- [ ] **Step 1: Import ergänzen (nach Zeile 2)**

```ts
import { getGermanHolidays } from '@/lib/holidays'
```

- [ ] **Step 2: Workspaces-Query mit bundesland (Zeile 177–180)**

```ts
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, bundesland')
    .eq('digest_enabled', true) as { data: Array<{ id: string; name: string; bundesland: string | null }> | null }
```

- [ ] **Step 3: Workspace-Feiertags-Filter nach dem Workspaces-Query (nach Zeile 184)**

```ts
  const todayStr = new Date().toISOString().slice(0, 10)
  const activeWorkspaces = (workspaces ?? []).filter(ws => {
    const holidays = getGermanHolidays(new Date().getFullYear(), ws.bundesland)
    return !holidays.has(todayStr)
  })
  if (!activeWorkspaces.length) {
    return NextResponse.json({ sent: 0, dry_run: dryRun, reason: 'All workspaces are on holiday today.' })
  }
  const workspaceIds = activeWorkspaces.map(w => w.id)
  const workspaceNameMap: Record<string, string> = Object.fromEntries(activeWorkspaces.map(w => [w.id, w.name]))
```

- [ ] **Step 4: Alte workspaceIds + workspaceNameMap Zeilen (186–187) entfernen**

Diese beiden Zeilen löschen (sie werden durch Step 3 ersetzt):
```ts
  const workspaceIds = workspaces.map(w => w.id)
  const workspaceNameMap: Record<string, string> = Object.fromEntries(workspaces.map(w => [w.id, w.name]))
```

- [ ] **Step 5: TypeScript prüfen**

```bash
cd /root/autotodo && npx tsc --noEmit 2>&1 | head -20
```

Expected: keine Fehler.

- [ ] **Step 6: Commit**

```bash
git add app/api/cron/daily-digest/route.ts
git commit -m "feat: skip digest for workspaces on holiday (F-022)"
```

---

### Task 7: i18n + DashboardUpdates

**Files:**
- Modify: `messages/de.json`
- Modify: `messages/en.json`
- Modify: `components/dashboard/DashboardUpdates.tsx`

Die neuen Keys gehören unter `settings` (nicht `settings.workspace`), da `SettingsPageClient` `useTranslations('settings')` verwendet.

- [ ] **Step 1: Deutsche Übersetzungen — nach `digestError` in `settings`**

```json
"bundeslandTitle": "Bundesland für Feiertage",
"bundeslandDesc": "Bestimmt, welche Feiertage im Tätigkeitsnachweis ausgegraut und beim E-Mail-Digest übersprungen werden.",
"bundeslandNone": "Nur bundesweite Feiertage"
```

- [ ] **Step 2: Englische Übersetzungen — nach `digestError` in `settings`**

```json
"bundeslandTitle": "State for public holidays",
"bundeslandDesc": "Determines which holidays are grayed out in the activity report and skipped in the email digest.",
"bundeslandNone": "Federal holidays only"
```

- [ ] **Step 3: JSON validieren**

```bash
python3 -c "import json; json.load(open('/root/autotodo/messages/de.json')); json.load(open('/root/autotodo/messages/en.json')); print('OK')"
```

Expected: `OK`

- [ ] **Step 4: DashboardUpdates — F-022 als erstes Element einfügen**

In `components/dashboard/DashboardUpdates.tsx`, ganz oben ins `UPDATES`-Array:

```ts
{
  id: 'F-022',
  date: '19.05.2026',
  title: 'Feiertage im Tätigkeitsnachweis',
  description: 'Wochenenden und Feiertage werden im Tätigkeitsnachweis ausgegraut – und der E-Mail-Digest pausiert automatisch an Feiertagen.',
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
git commit -m "feat: i18n and dashboard entry for F-022"
```

---

### Task 8: Push

- [ ] **Step 1: Push**

```bash
git push
```
