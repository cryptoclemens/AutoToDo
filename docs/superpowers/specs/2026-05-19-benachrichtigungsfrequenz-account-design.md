# Design: Benachrichtigungsfrequenz & Account-Info (F-019)

**Datum:** 2026-05-19  
**Status:** Genehmigt  
**Feature-ID:** F-023

---

## Zusammenfassung

Zwei Verbesserungen im Bereich Nutzerprofil und Benachrichtigungen:
1. Der E-Mail-Digest erhält eine Frequenzeinstellung: Täglich / 2× pro Woche (Mo+Do) / Wöchentlich / Aus.
2. Im Notifications-Tab erscheint ein sichtbarer Hinweis-Link auf die bereits vorhandene Name/E-Mail-Bearbeitung im Konto-Tab.

---

## Entscheidungen

| Frage | Entscheidung |
|---|---|
| Frequenzoptionen | Täglich / 2× pro Woche (Mo+Do) / Wöchentlich (Mo) / Aus |
| `digest_enabled` migrieren? | Backfill + behalten als computed alias (abwärtskompatibel) |
| Name/E-Mail-Bearbeitung | Bereits vorhanden — Hinweis-Link ergänzen, kein neues UI |

---

## Datenbankschicht

### Migration `036_workspace_digest_frequency.sql`

```sql
ALTER TABLE workspaces
  ADD COLUMN digest_frequency TEXT NOT NULL DEFAULT 'daily'
  CONSTRAINT workspaces_digest_frequency_check
    CHECK (digest_frequency IN ('daily', 'twice_weekly', 'weekly', 'disabled'));

-- Bestehende deaktivierte Workspaces migrieren
UPDATE workspaces SET digest_frequency = 'disabled' WHERE digest_enabled = false;
```

`digest_enabled` bleibt in der Tabelle erhalten. Die Anwendungslogik liest künftig ausschließlich `digest_frequency`.

---

## API-Schicht

### `GET /api/settings/notifications`

Gibt künftig `digest_frequency` statt `digest_enabled` zurück:
```ts
{ digest_frequency: 'daily' | 'twice_weekly' | 'weekly' | 'disabled', slack_webhook_url: string | null }
```

### `PATCH /api/settings/notifications`

`patchSchema` ersetzt `digest_enabled: z.boolean()` durch:
```ts
digest_frequency: z.enum(['daily', 'twice_weekly', 'weekly', 'disabled']).optional()
```

Schreibt `digest_frequency` in die DB. Schreibt gleichzeitig `digest_enabled = (digest_frequency !== 'disabled')` für Abwärtskompatibilität.

### `POST /api/cron/daily-digest`

Filterbedingung ändert sich von `digest_enabled = true` auf `digest_frequency != 'disabled'`.

Pro Workspace vor dem Versand prüfen:
```ts
const today = new Date().getDay() // 0=So, 1=Mo, ..., 4=Do
if (workspace.digest_frequency === 'weekly' && today !== 1) continue
if (workspace.digest_frequency === 'twice_weekly' && today !== 1 && today !== 4) continue
// 'daily': kein zusätzlicher Check (Crontab Mo–Fr)
```

---

## Frontend-Schicht

### `NotificationsSettings.tsx`

**Digest-Toggle → Frequency-Select:**

```tsx
<select value={digestFrequency} onChange={...}>
  <option value="daily">{t('digestFrequencyDaily')}</option>
  <option value="twice_weekly">{t('digestFrequencyTwiceWeekly')}</option>
  <option value="weekly">{t('digestFrequencyWeekly')}</option>
  <option value="disabled">{t('digestFrequencyDisabled')}</option>
</select>
```

**Hinweis-Link Name/E-Mail:**

Unter dem Frequency-Select kleiner Hinweis:
```tsx
<p>{t('accountHint')} <Link href="/settings?tab=account">{t('accountHintLink')}</Link></p>
```

---

## Übersetzungen

### `messages/de.json` — unter `settings.workspace`

```json
"digestFrequencyTitle": "E-Mail-Digest Häufigkeit",
"digestFrequencyDesc": "Wie oft soll der tägliche Aufgaben-Digest versendet werden?",
"digestFrequencyDaily": "Täglich (Mo–Fr)",
"digestFrequencyTwiceWeekly": "2× pro Woche (Mo + Do)",
"digestFrequencyWeekly": "Wöchentlich (Mo)",
"digestFrequencyDisabled": "Aus",
"accountHint": "Name oder E-Mail-Adresse ändern:",
"accountHintLink": "Konto-Einstellungen →"
```

### `messages/en.json` — unter `settings.workspace`

```json
"digestFrequencyTitle": "Email digest frequency",
"digestFrequencyDesc": "How often should the task digest be sent?",
"digestFrequencyDaily": "Daily (Mon–Fri)",
"digestFrequencyTwiceWeekly": "Twice a week (Mon + Thu)",
"digestFrequencyWeekly": "Weekly (Mon)",
"digestFrequencyDisabled": "Off",
"accountHint": "Change name or email address:",
"accountHintLink": "Account settings →"
```

---

## Dashboard-Update

```ts
{
  id: 'F-023',
  date: '19.05.2026',
  title: 'Digest-Häufigkeit wählbar',
  description: 'Der E-Mail-Digest lässt sich nun auf täglich, 2× pro Woche, wöchentlich oder aus einstellen.',
}
```

---

## Änderungsübersicht

| Datei | Art |
|---|---|
| `supabase/migrations/036_workspace_digest_frequency.sql` | Neu |
| `app/api/settings/notifications/route.ts` | Änderung |
| `app/api/cron/daily-digest/route.ts` | Änderung |
| `components/settings/NotificationsSettings.tsx` | Änderung |
| `messages/de.json` + `messages/en.json` | Änderung |
| `components/dashboard/DashboardUpdates.tsx` | Änderung |

---

## Nicht im Scope

- Per-User-Frequenz (nur pro Workspace)
- Benutzerdefinierte Versandzeiten
- Push-Benachrichtigungen (Browser/Mobile)
- Slack-Frequenz-Einstellungen
