# Design: Feiertage im Tätigkeitsnachweis & E-Mail-Cron (F-018)

**Datum:** 2026-05-19  
**Status:** Genehmigt  
**Feature-ID:** F-022

---

## Zusammenfassung

Zwei Verbesserungen rund um Feiertage:
1. Der tägliche E-Mail-Digest überspringt Feiertage gemäß dem konfigurierten Bundesland des Workspaces.
2. Das Tätigkeitsnachweis-Modal zeigt alle Kalendertage — Wochenenden und Feiertage werden ausgegraut und sind nicht editierbar statt ausgeblendet.

---

## Entscheidungen

| Frage | Entscheidung |
|---|---|
| Welches Bundesland für den Cron? | Neues Feld `bundesland` direkt auf `workspaces` |
| Tätigkeitsnachweis: ausblenden oder ausgrauen? | Ausgrauen (Vollmonat sichtbar) |
| Feiertag-Label im Modal? | Kleiner Hinweistext unter dem Datum |

---

## Datenbankschicht

### Migration `035_workspace_bundesland.sql`

```sql
ALTER TABLE workspaces ADD COLUMN bundesland TEXT DEFAULT NULL;
```

Keine Datenmigration nötig — `NULL` bedeutet „nur bundesweite Feiertage".

---

## API-Schicht

### `PATCH /api/settings/notifications`

`patchSchema` um `bundesland: z.string().nullable().optional()` erweitern.  
GET gibt `bundesland` ebenfalls zurück.

### `GET /api/taetigkeitsnachweise`

**Änderung:** Statt `getWorkingDays()` werden alle Tage des Monats ermittelt.

Neues Rückgabeformat:
```ts
interface TaetigkeitsnachweisResponse {
  days: Record<string, DayData>       // unveränderter Inhalt
  allDays: string[]                   // alle Tage YYYY-MM-DD
  nonWorkingDays: string[]            // Wochenenden + Feiertage
  holidayLabels: Record<string, string> // YYYY-MM-DD → "Fronleichnam"
}
```

`nonWorkingDays` = Vereinigung aus Wochenendtagen (Sa/So) und `getGermanHolidays(year, workspace.bundesland)`.  
`holidayLabels` = nur gesetzliche Feiertage (für Tooltip im Modal).

Das `bundesland` des Workspaces wird in der Route über `resolveWorkspace()` geladen.

### `POST /api/cron/daily-digest`

Nach dem Workspace-Loop: Vor dem E-Mail-Versand prüfen ob heute ein Feiertag ist:

```ts
const todayStr = new Date().toISOString().slice(0, 10)
const holidays = getGermanHolidays(new Date().getFullYear(), workspace.bundesland ?? null)
if (holidays.has(todayStr)) continue  // diesen Workspace überspringen
```

Wochenendschutz bleibt (Crontab läuft nur Mo–Fr).

---

## Frontend-Schicht

### `TaetigkeitsnachweisModal.tsx`

**State-Änderung:** `activeDays: string[]` → `allDays: string[]` + `nonWorkingDays: Set<string>` + `holidayLabels: Record<string, string>`.

**Render jeder Zeile:**
- Alle Tage aus `allDays` rendern
- Wenn Tag in `nonWorkingDays`:
  - Zeile bekommt `opacity-50 bg-slate-50`
  - Textarea ist `readOnly` und `cursor-not-allowed`
  - Kein Zeichenzähler
  - Wenn Feiertag: kleines `<span>` mit `holidayLabels[day]` unter dem Datum
- Sonst: bisherige editierbare Logik

### Workspace-Einstellungen (Notifications-Tab)

Unterhalb des Digest-Toggles neuen Abschnitt „Bundesland für Feiertage" einfügen:  
`<select>` mit denselben Bundesland-Optionen wie im Projekt-Branding (`BUNDESLAENDER` aus `lib/holidays.ts`).  
Leerer Wert = „Nur bundesweite Feiertage".

---

## Übersetzungen

### `messages/de.json` — unter `settings.workspace`

```json
"bundeslandTitle": "Bundesland für Feiertage",
"bundeslandDesc": "Bestimmt, welche Feiertage im Tätigkeitsnachweis ausgegraut und beim E-Mail-Digest übersprungen werden.",
"bundeslandNone": "Nur bundesweite Feiertage"
```

### `messages/en.json` — unter `settings.workspace`

```json
"bundeslandTitle": "State for public holidays",
"bundeslandDesc": "Determines which holidays are grayed out in the activity report and skipped in the email digest.",
"bundeslandNone": "Federal holidays only"
```

---

## Dashboard-Update

```ts
{
  id: 'F-022',
  date: '19.05.2026',
  title: 'Feiertage im Tätigkeitsnachweis',
  description: 'Wochenenden und Feiertage werden im Tätigkeitsnachweis ausgegraut angezeigt – und der E-Mail-Digest pausiert automatisch an Feiertagen.',
}
```

---

## Änderungsübersicht

| Datei | Art |
|---|---|
| `supabase/migrations/035_workspace_bundesland.sql` | Neu |
| `app/api/settings/notifications/route.ts` | Änderung |
| `app/api/taetigkeitsnachweise/route.ts` | Änderung |
| `app/api/cron/daily-digest/route.ts` | Änderung |
| `components/dashboard/TaetigkeitsnachweisModal.tsx` | Änderung |
| `components/settings/NotificationsSettings.tsx` | Änderung |
| `messages/de.json` + `messages/en.json` | Änderung |
| `components/dashboard/DashboardUpdates.tsx` | Änderung |

---

## Nicht im Scope

- Per-User-Bundesland (nur pro Workspace)
- Feiertags-Kalender als eigene Ansicht
- Benachrichtigung wenn Feiertag übersprungen wird
