# Design: LOP ↔ Ideenspeicher Transfer

**Datum:** 2026-05-19  
**Status:** Genehmigt  
**Feature-ID:** F-016

---

## Zusammenfassung

LOP-Punkte können in den Ideenspeicher „geparkt" werden (status = `geparkt`) und von dort wieder als aktive LOP-Aufgaben reaktiviert werden. Der umgekehrte Weg (Idee → LOP) existiert bereits und bleibt unverändert.

---

## Entscheidungen

| Frage | Entscheidung |
|---|---|
| Was passiert beim Parken? | Status-Change auf `geparkt`, kein Löschen |
| Sichtbarkeit in LOP-Tabelle | Sichtbar, aber gegraut (wie `abgeschlossen`) |
| Rückweg (Ideenspeicher → LOP) | Status zurück auf `offen`, kein neuer Datensatz |
| API-Strategie | Merged GET `/api/ideas` (Ansatz A) |
| UI-Einstiegspunkte | Hover-Menü, Detail-Dialog, Inline-Edit |

---

## Datenbankschicht

### Migration `034_lop_parked_status.sql`

- Entfernt bestehenden CHECK-Constraint auf `lop_items.status`
- Setzt neuen CHECK: `status IN ('offen', 'in_bearbeitung', 'abgeschlossen', 'geparkt')`
- Keine Datenmigration nötig (alle existierenden Werte bleiben gültig)

---

## API-Schicht

### `PATCH /api/lop/[id]`

- `updateSchema`: `status` enum um `'geparkt'` erweitern
- `completed_at` bleibt `null` bei `geparkt` (gleiche Logik wie `offen`)

### `GET /api/ideas`

Liefert künftig beide Quellen zusammengeführt:

```ts
interface IdeaResponse {
  id: string           // idea_items.id ODER lop_items.id
  title: string
  note: string | null
  created_by_name: string | null
  created_at: string
  source: 'idea' | 'parked_lop'
}
```

Implementierung: `idea_items` + `lop_items WHERE status = 'geparkt'` separat abfragen, nach `created_at DESC` sortiert zusammenführen, einheitliches Response-Format zurückgeben.

---

## Frontend-Schicht

### `StatusBadge.tsx`

- Neuer Status `'geparkt'` mit amber-Styling
- Type `Status` um `'geparkt'` erweitern

### `LopTableRow.tsx`

- **Hover-Menü:** drittes Icon (Glühbirnen-SVG) zwischen Bearbeiten und Löschen → `onPark(item.id)`
- **Inline-Edit-Modus:** Button „→ Idee" neben Speichern/Abbrechen
- **Styling:** `geparkt` erhält `opacity-50` wie `abgeschlossen`
- Neues Prop: `onPark: (id: string) => void`

### `LopItemDialog.tsx`

- `Status` type um `'geparkt'` erweitern
- Footer: Button „In Ideenspeicher parken" wenn `status !== 'geparkt'`
- Footer: Button „Reaktivieren" wenn `status === 'geparkt'`
- Beide rufen `onUpdate(id, { status: ... })` auf und schließen den Dialog

### `LopTable.tsx`

**Neue `Idea`-Typ-Felder:**
```ts
interface Idea {
  id: string
  title: string
  note: string | null
  created_by_name: string | null
  created_at: string
  source: 'idea' | 'parked_lop'   // NEU
}
```

**Neue Funktion `handleParkItem(id: string)`:**
```ts
// PATCH /api/lop/[id] { status: 'geparkt' }
// Aktualisiert items-State lokal
// Lädt ideas neu (router.refresh() reicht nicht — ideas werden per fetch geholt)
```

**Geänderte Funktion `handleIdeaPromote(id: string)`:**
- Wenn `idea.source === 'parked_lop'`: `PATCH /api/lop/[id] { status: 'offen' }`
- Wenn `idea.source === 'idea'`: bisheriger `PATCH /api/ideas/[id]` (unverändert)
- In beiden Fällen: Item aus `ideas`-State entfernen + `router.refresh()`

**Ideenspeicher-Anzeige für geparkte LOP-Punkte:**
- Kleines Badge „Aus LOP" neben dem Titel
- „→ Aufgabe"-Button bleibt sichtbar (reaktiviert via `handleIdeaPromote`)

---

## Übersetzungen

### `messages/de.json` — Ergänzungen unter `lop`

```json
"status": {
  "geparkt": "Geparkt"
},
"parkItem": "In Ideenspeicher parken",
"unparkItem": "Reaktivieren",
"parkedBadge": "Aus LOP"
```

### `messages/en.json` — Ergänzungen unter `lop`

```json
"status": {
  "geparkt": "Parked"
},
"parkItem": "Park in idea storage",
"unparkItem": "Reactivate",
"parkedBadge": "From LOP"
```

---

## Dashboard-Update

Neuer Eintrag in `components/dashboard/DashboardUpdates.tsx`:

```ts
{
  id: 'F-016',
  date: '19.05.2026',
  title: 'LOP ↔ Ideenspeicher',
  description: 'LOP-Punkte können in den Ideenspeicher geparkt und von dort wieder als Aufgaben reaktiviert werden.',
}
```

---

## Änderungsübersicht

| Datei | Art |
|---|---|
| `supabase/migrations/034_lop_parked_status.sql` | Neu |
| `app/api/ideas/route.ts` | Änderung (GET) |
| `app/api/lop/[id]/route.ts` | Änderung (updateSchema) |
| `components/lop/StatusBadge.tsx` | Änderung |
| `components/lop/LopTableRow.tsx` | Änderung |
| `components/lop/LopItemDialog.tsx` | Änderung |
| `components/lop/LopTable.tsx` | Änderung |
| `messages/de.json` + `messages/en.json` | Änderung |
| `components/dashboard/DashboardUpdates.tsx` | Änderung |

---

## Nicht im Scope

- Filterung nach „geparkt" in der LOP-Tabelle (Status-Filter zeigt es automatisch via vorhandenem Filter)
- Benachrichtigungen bei Park/Reaktivierung
- Bulk-Park (mehrere LOP-Punkte gleichzeitig)
