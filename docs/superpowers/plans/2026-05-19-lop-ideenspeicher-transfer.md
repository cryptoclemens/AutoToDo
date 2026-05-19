# LOP ↔ Ideenspeicher Transfer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LOP-Punkte können per Status `geparkt` in den Ideenspeicher überführt und von dort wieder als aktive Aufgaben reaktiviert werden.

**Architecture:** Neuer Status `geparkt` in `lop_items`. `GET /api/ideas` liefert beide Quellen (idea_items + geparkte lop_items) mit einem `source`-Flag zusammengeführt. Frontend unterscheidet beim Reaktivieren anhand von `source`, ob eine Idee gelöscht oder ein LOP-Punkt reaktiviert wird.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (Postgres), Tailwind CSS, next-intl, zod

---

## Dateiübersicht

| Datei | Aktion |
|---|---|
| `supabase/migrations/034_lop_parked_status.sql` | Neu — CHECK-Constraint erweitern |
| `app/api/lop/[id]/route.ts` | Ändern — `updateSchema` + `completed_at`-Logik |
| `app/api/ideas/route.ts` | Ändern — GET merged mit parkenden lop_items |
| `components/lop/StatusBadge.tsx` | Ändern — `geparkt`-Badge hinzufügen |
| `messages/de.json` | Ändern — neue Übersetzungsschlüssel |
| `messages/en.json` | Ändern — neue Übersetzungsschlüssel |
| `components/lop/LopTable.tsx` | Ändern — Idea-Typ, handleParkItem, handleIdeaPromote |
| `components/lop/LopTableRow.tsx` | Ändern — onPark-Prop, Park-Button, geparkt-Styling |
| `components/lop/LopItemDialog.tsx` | Ändern — Status-Typ, Park/Unpark-Buttons |
| `components/dashboard/DashboardUpdates.tsx` | Ändern — F-021 Eintrag |

---

## Task 1: DB-Migration — CHECK-Constraint erweitern

**Files:**
- Create: `supabase/migrations/034_lop_parked_status.sql`

- [ ] **Schritt 1: Migration anlegen**

```sql
-- supabase/migrations/034_lop_parked_status.sql
ALTER TABLE lop_items DROP CONSTRAINT IF EXISTS lop_items_status_check;
ALTER TABLE lop_items ADD CONSTRAINT lop_items_status_check
  CHECK (status IN ('offen', 'in_bearbeitung', 'abgeschlossen', 'geparkt'));
```

- [ ] **Schritt 2: Migration anwenden**

```bash
cd /root/autotodo
supabase db push
```

Erwartete Ausgabe: `Applying migration 034_lop_parked_status.sql...` ohne Fehler.

- [ ] **Schritt 3: Committen**

```bash
git add supabase/migrations/034_lop_parked_status.sql
git commit -m "feat: add 'geparkt' status to lop_items"
```

---

## Task 2: PATCH API — `geparkt` als gültiger Status

**Files:**
- Modify: `app/api/lop/[id]/route.ts:15`

- [ ] **Schritt 1: updateSchema erweitern**

In `app/api/lop/[id]/route.ts` Zeile 15 ändern — `status` enum um `'geparkt'` erweitern:

```ts
// Vorher:
status: z.enum(['offen', 'in_bearbeitung', 'abgeschlossen']).optional(),

// Nachher:
status: z.enum(['offen', 'in_bearbeitung', 'abgeschlossen', 'geparkt']).optional(),
```

- [ ] **Schritt 2: `completed_at`-Logik anpassen**

`geparkt` verhält sich wie `offen` — `completed_at` bleibt `null`. Zeilen 86–90 anpassen:

```ts
if (parsed.data.status === 'abgeschlossen' && existing.status !== 'abgeschlossen') {
  updatePayload.completed_at = new Date().toISOString()
} else if (parsed.data.status && parsed.data.status !== 'abgeschlossen') {
  updatePayload.completed_at = null
}
```

Diese Logik ist bereits korrekt — `geparkt !== 'abgeschlossen'` → `completed_at = null`. Keine Änderung nötig.

- [ ] **Schritt 3: TypeScript-Prüfung**

```bash
cd /root/autotodo && npx tsc --noEmit 2>&1 | head -20
```

Erwartete Ausgabe: kein Fehler.

- [ ] **Schritt 4: Committen**

```bash
git add app/api/lop/[id]/route.ts
git commit -m "feat: accept 'geparkt' status in PATCH /api/lop/[id]"
```

---

## Task 3: GET /api/ideas — Merged Response

**Files:**
- Modify: `app/api/ideas/route.ts`

- [ ] **Schritt 1: GET-Handler ersetzen**

`app/api/ideas/route.ts` — GET-Funktion vollständig ersetzen:

```ts
export async function GET(request: NextRequest) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId fehlt.' }, { status: 400 })

  const supabase = db()
  const slug = headers().get('x-workspace-slug') ?? ''
  const workspace = await resolveWorkspace(supabase, user.id, slug)
  if (!workspace) return NextResponse.json({ error: 'Workspace nicht gefunden.' }, { status: 404 })

  const [{ data: ideas }, { data: parked }] = await Promise.all([
    supabase
      .from('idea_items')
      .select('id, title, note, created_by_name, created_at')
      .eq('project_id', projectId)
      .eq('workspace_id', workspace.id),
    supabase
      .from('lop_items')
      .select('id, title, description, created_at')
      .eq('project_id', projectId)
      .eq('workspace_id', workspace.id)
      .eq('status', 'geparkt'),
  ])

  const result = [
    ...(ideas ?? []).map(i => ({ ...i, note: i.note, source: 'idea' as const })),
    ...(parked ?? []).map(i => ({
      id: i.id,
      title: i.title,
      note: i.description,
      created_by_name: null,
      created_at: i.created_at,
      source: 'parked_lop' as const,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json(result)
}
```

- [ ] **Schritt 2: TypeScript-Prüfung**

```bash
cd /root/autotodo && npx tsc --noEmit 2>&1 | head -20
```

Erwartete Ausgabe: kein Fehler.

- [ ] **Schritt 3: Committen**

```bash
git add app/api/ideas/route.ts
git commit -m "feat: GET /api/ideas returns parked lop_items with source flag"
```

---

## Task 4: StatusBadge — `geparkt` Badge

**Files:**
- Modify: `components/lop/StatusBadge.tsx`

- [ ] **Schritt 1: Typ und Styling erweitern**

`components/lop/StatusBadge.tsx` vollständig ersetzen:

```tsx
'use client'

import { useTranslations } from 'next-intl'

export type Status = 'offen' | 'in_bearbeitung' | 'abgeschlossen' | 'geparkt'

const styleMap: Record<Status, { pill: string; dot: string }> = {
  offen:          { pill: 'bg-slate-100 text-slate-600',       dot: 'bg-slate-400' },
  in_bearbeitung: { pill: 'bg-blue-50 text-blue-700',          dot: 'bg-blue-500' },
  abgeschlossen:  { pill: 'bg-emerald-50 text-emerald-700',    dot: 'bg-emerald-500' },
  geparkt:        { pill: 'bg-amber-50 text-amber-700',        dot: 'bg-amber-400' },
}

export default function StatusBadge({ status }: { status: Status }) {
  const t = useTranslations('lop.status')
  const s = styleMap[status] ?? styleMap.offen
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {t(status)}
    </span>
  )
}
```

Hinweis: `Status` wird jetzt auch exportiert, damit andere Dateien es importieren können und den Typ nicht lokal duplizieren müssen.

- [ ] **Schritt 2: TypeScript-Prüfung**

```bash
cd /root/autotodo && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Schritt 3: Committen**

```bash
git add components/lop/StatusBadge.tsx
git commit -m "feat: add 'geparkt' status to StatusBadge"
```

---

## Task 5: Übersetzungen

**Files:**
- Modify: `messages/de.json`
- Modify: `messages/en.json`

- [ ] **Schritt 1: `messages/de.json` erweitern**

Unter dem Schlüssel `lop` folgende Schlüssel ergänzen:

```json
"status": {
  "offen": "Offen",
  "in_bearbeitung": "In Bearbeitung",
  "abgeschlossen": "Abgeschlossen",
  "geparkt": "Geparkt"
},
"parkItem": "In Ideenspeicher parken",
"unparkItem": "Reaktivieren",
"parkedBadge": "Aus LOP"
```

(Nur `geparkt` unter `status` ist neu; die anderen drei bestehenden Einträge bleiben.)

- [ ] **Schritt 2: `messages/en.json` erweitern**

```json
"status": {
  "offen": "Open",
  "in_bearbeitung": "In Progress",
  "abgeschlossen": "Done",
  "geparkt": "Parked"
},
"parkItem": "Park in idea storage",
"unparkItem": "Reactivate",
"parkedBadge": "From LOP"
```

- [ ] **Schritt 3: JSON validieren**

```bash
cd /root/autotodo
python3 -c "import json; json.load(open('messages/de.json')); print('de.json OK')"
python3 -c "import json; json.load(open('messages/en.json')); print('en.json OK')"
```

Erwartete Ausgabe: `de.json OK` und `en.json OK`.

- [ ] **Schritt 4: Committen**

```bash
git add messages/de.json messages/en.json
git commit -m "feat: add 'geparkt' and park/unpark translation keys"
```

---

## Task 6: LopTable — Typen, handleParkItem, handleIdeaPromote

**Files:**
- Modify: `components/lop/LopTable.tsx`

- [ ] **Schritt 1: `Idea`-Interface + `fetchIdeas`-Helper**

Das `Idea`-Interface (aktuell Zeile 19–25) um `source` erweitern und eine `fetchIdeas`-Hilfsfunktion extrahieren. Im `LopTable`-Komponentenkörper, direkt nach den State-Deklarationen, folgendes einfügen bzw. anpassen:

```ts
// Interface — Zeile 19 ersetzen:
interface Idea {
  id: string
  title: string
  note: string | null
  created_by_name: string | null
  created_at: string
  source: 'idea' | 'parked_lop'
}
```

Den bestehenden `useEffect` für ideas (Zeile 79–84) in eine benannte Funktion umwandeln:

```ts
// Bestehenden useEffect ersetzen durch:
function fetchIdeas() {
  fetch(`/api/ideas?projectId=${encodeURIComponent(projectId)}`)
    .then(r => r.ok ? r.json() : [])
    .then((data: Idea[]) => setIdeas(data))
    .catch(() => {})
}

useEffect(() => { fetchIdeas() }, [projectId])
```

- [ ] **Schritt 2: `handleParkItem` hinzufügen**

Nach `handleDelete` (aktuell ca. Zeile 232) einfügen:

```ts
async function handleParkItem(id: string) {
  const res = await fetch(`/api/lop/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'geparkt' }),
  })
  if (res.ok) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'geparkt' as LopItem['status'] } : i))
    setSelectedItem(prev => prev?.id === id ? { ...prev, status: 'geparkt' as LopItem['status'] } : prev)
    fetchIdeas()
  }
}
```

- [ ] **Schritt 3: `handleIdeaPromote` anpassen**

Bestehende Funktion (aktuell Zeile 281–287) ersetzen — Signatur auf ganzes `Idea`-Objekt ändern:

```ts
async function handleIdeaPromote(idea: Idea) {
  if (idea.source === 'parked_lop') {
    const res = await fetch(`/api/lop/${idea.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'offen' }),
    })
    if (res.ok) {
      setIdeas(prev => prev.filter(i => i.id !== idea.id))
      setItems(prev => prev.map(i => i.id === idea.id ? { ...i, status: 'offen' as LopItem['status'] } : i))
    }
  } else {
    const res = await fetch(`/api/ideas/${idea.id}`, { method: 'PATCH' })
    if (res.ok) {
      setIdeas(prev => prev.filter(i => i.id !== idea.id))
      router.refresh()
    }
  }
}
```

- [ ] **Schritt 4: Aufrufstelle von `handleIdeaPromote` anpassen**

In der JSX-Sektion (Ideenspeicher, aktuell ca. Zeile 622–629) den `onClick`-Handler anpassen:

```tsx
// Vorher:
onClick={() => handleIdeaPromote(idea.id)}

// Nachher:
onClick={() => handleIdeaPromote(idea)}
```

- [ ] **Schritt 5: `onPark` an `LopTableRow` übergeben**

In beiden `LopTableRow`-Vorkommen (Standup-Modus ca. Zeile 463 und Normalansicht ca. Zeile 508) das neue `onPark`-Prop hinzufügen:

```tsx
<LopTableRow
  key={item.id}
  item={item}
  index={index}
  canEdit={canEdit}
  members={members}
  onUpdate={handleUpdate}
  onDelete={handleDelete}
  onPark={handleParkItem}
  onOpenDetail={() => setSelectedItem(item)}
/>
```

- [ ] **Schritt 6: `onPark` an `LopItemDialog` übergeben**

Den Dialog-Aufruf (ca. Zeile 537) um `onPark` erweitern:

```tsx
<LopItemDialog
  item={selectedItem}
  canEdit={canEdit}
  members={members}
  existingNames={responsibleOptions}
  onClose={() => setSelectedItem(null)}
  onUpdate={handleUpdate}
  onDelete={handleDelete}
  onPark={handleParkItem}
/>
```

- [ ] **Schritt 7: „Aus LOP"-Badge im Ideenspeicher anzeigen**

In der Ideenspeicher-Liste (Normalansicht, ca. Zeile 610–644) beim Titel eines `parked_lop`-Eintrags ein Badge anhängen:

```tsx
<p className="text-sm text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2">
  {idea.title}
  {idea.source === 'parked_lop' && (
    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
      {t('parkedBadge')}
    </span>
  )}
</p>
```

- [ ] **Schritt 8: TypeScript-Prüfung**

```bash
cd /root/autotodo && npx tsc --noEmit 2>&1 | head -30
```

Erwartete Ausgabe: kein Fehler. Häufige Fehlerquelle: `Status`-Typ-Konflikt zwischen `LopItem['status']` und lokalem `Status`-Typ — ggf. `as LopItem['status']` durch `as 'geparkt'` ersetzen.

- [ ] **Schritt 9: Committen**

```bash
git add components/lop/LopTable.tsx
git commit -m "feat: handleParkItem, updated handleIdeaPromote, parkedBadge in Ideenspeicher"
```

---

## Task 7: LopTableRow — Park-Button + Styling

**Files:**
- Modify: `components/lop/LopTableRow.tsx`

- [ ] **Schritt 1: `Status`-Typ + Props erweitern**

Zeile 13 (`type Status`) und das `Props`-Interface anpassen:

```ts
// Zeile 13:
type Status = 'offen' | 'in_bearbeitung' | 'abgeschlossen' | 'geparkt'

// Props-Interface — onPark hinzufügen:
interface Props {
  item: LopItem
  index: number
  canEdit: boolean
  members: WorkspaceMember[]
  onUpdate: (id: string, changes: Partial<LopItem>) => Promise<void>
  onDelete: (id: string) => void
  onPark: (id: string) => void
  onOpenDetail: () => void
}
```

Funktionssignatur (Zeile 32) anpassen:

```ts
export default function LopTableRow({ item, index, canEdit, members, onUpdate, onDelete, onPark, onOpenDetail }: Props) {
```

- [ ] **Schritt 2: `geparkt`-Styling (wie `abgeschlossen`)**

Zeile 95–96 anpassen — `geparkt` erhält dieselbe Opacity:

```ts
const isDone = item.status === 'abgeschlossen'
const isParked = item.status === 'geparkt'
const rowBg = item.requires_review ? 'bg-amber-50/60' : isDone ? 'bg-gray-50/80' : ''
const rowOpacity = (isDone || isParked) ? 'opacity-50' : ''
```

- [ ] **Schritt 3: Park-Button im Hover-Menü**

Im Hover-Menü (Normalansicht, ca. Zeile 278–301) einen dritten Button zwischen Bearbeiten und Löschen einfügen — nur wenn Status nicht bereits `geparkt`:

```tsx
{canEdit && item.status !== 'geparkt' && (
  <Button
    size="sm"
    variant="ghost"
    className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
    onClick={() => onPark(item.id)}
    title="In Ideenspeicher parken"
  >
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M3.5 11c.5-1.5 1.5-2.5 3-2.5s2.5 1 3 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M6.5 1v1.5M6.5 8.5V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  </Button>
)}
```

- [ ] **Schritt 4: „→ Idee"-Button im Inline-Edit-Modus**

In der Edit-Zeile (ca. Zeile 162–170) neben den Speichern/Abbrechen-Buttons hinzufügen — nur wenn Status nicht bereits `geparkt`:

```tsx
<div className="flex gap-1">
  <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs px-2">
    {saving ? '…' : '✓'}
  </Button>
  <Button size="sm" variant="outline" onClick={handleCancel} className="h-7 text-xs px-2">
    ✕
  </Button>
  {item.status !== 'geparkt' && (
    <Button
      size="sm"
      variant="outline"
      onClick={() => { onPark(item.id); setEditing(false) }}
      className="h-7 text-xs px-2 text-amber-600 border-amber-200 hover:bg-amber-50"
      title="In Ideenspeicher parken"
    >
      💡
    </Button>
  )}
</div>
```

- [ ] **Schritt 5: TypeScript-Prüfung**

```bash
cd /root/autotodo && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Schritt 6: Committen**

```bash
git add components/lop/LopTableRow.tsx
git commit -m "feat: park button in LopTableRow hover menu and inline edit"
```

---

## Task 8: LopItemDialog — Park/Unpark im Footer

**Files:**
- Modify: `components/lop/LopItemDialog.tsx`

- [ ] **Schritt 1: `Status`-Typ + `onPark`-Prop erweitern**

Zeile 21 (`type Status`) und das `Props`-Interface anpassen:

```ts
// Zeile 21:
type Status = 'offen' | 'in_bearbeitung' | 'abgeschlossen' | 'geparkt'

// Props-Interface (ab Zeile 51) — onPark hinzufügen:
interface Props {
  item: LopItem | null
  canEdit: boolean
  members: WorkspaceMember[]
  existingNames?: string[]
  onClose: () => void
  onUpdate: (id: string, changes: Partial<LopItem>) => Promise<void>
  onDelete?: (id: string) => void
  onPark: (id: string) => void
}
```

Funktionssignatur anpassen:

```ts
export default function LopItemDialog({ item, canEdit, members, existingNames = [], onClose, onUpdate, onDelete, onPark }: Props) {
```

- [ ] **Schritt 2: Status-Dropdown um `geparkt` erweitern**

Im Status-Select (ca. Zeile 174–177) einen vierten Eintrag hinzufügen:

```tsx
<SelectContent>
  <SelectItem value="offen">Offen</SelectItem>
  <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
  <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
  <SelectItem value="geparkt">Geparkt</SelectItem>
</SelectContent>
```

- [ ] **Schritt 3: Park/Unpark-Buttons im Footer**

Den `DialogFooter` (ab Zeile 446) anpassen — Park-Button links neben dem Löschen-Button hinzufügen:

```tsx
<DialogFooter className="flex-row items-center gap-2">
  {canEdit && draft && draft.status !== 'geparkt' && (
    <Button
      variant="outline"
      size="sm"
      className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
      onClick={() => { onPark(draft.id); onClose() }}
    >
      💡 In Ideenspeicher parken
    </Button>
  )}
  {canEdit && draft && draft.status === 'geparkt' && (
    <Button
      variant="outline"
      size="sm"
      className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      onClick={() => { onPark(draft.id); onClose() }}
    >
      ↩ Reaktivieren
    </Button>
  )}
  {canEdit && onDelete && draft && (
    <Button
      variant="outline"
      size="sm"
      className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700 mr-auto"
      onClick={() => { onClose(); onDelete(draft.id) }}
    >
      Punkt löschen
    </Button>
  )}
  {canEdit && (
    <>
      <Button variant="outline" size="sm" onClick={onClose}>Abbrechen</Button>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={saving}
        style={{ backgroundColor: 'var(--brand)' }}
        className="text-white"
      >
        {saving ? 'Wird gespeichert…' : 'Speichern'}
      </Button>
    </>
  )}
</DialogFooter>
```

Hinweis: `onPark` aus `LopTable.handleParkItem` behandelt beide Richtungen — es kennt den aktuellen Status des Items und reagiert entsprechend. Das hier übergebene `onPark` macht immer eine PATCH auf `status: 'geparkt'`, aber der „Reaktivieren"-Button im Dialog sollte den Status auf `'offen'` setzen. Dafür muss `handleParkItem` in `LopTable` (Task 6) angepasst werden, um beide Richtungen zu unterstützen:

```ts
// In LopTable.tsx — handleParkItem anpassen:
async function handleParkItem(id: string) {
  const item = items.find(i => i.id === id)
  const targetStatus = item?.status === 'geparkt' ? 'offen' : 'geparkt'
  const res = await fetch(`/api/lop/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: targetStatus }),
  })
  if (res.ok) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: targetStatus as LopItem['status'] } : i))
    setSelectedItem(prev => prev?.id === id ? { ...prev, status: targetStatus as LopItem['status'] } : prev)
    fetchIdeas()
  }
}
```

- [ ] **Schritt 4: TypeScript-Prüfung**

```bash
cd /root/autotodo && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Schritt 5: Committen**

```bash
git add components/lop/LopItemDialog.tsx components/lop/LopTable.tsx
git commit -m "feat: park/unpark buttons in LopItemDialog footer"
```

---

## Task 9: Dashboard-Update

**Files:**
- Modify: `components/dashboard/DashboardUpdates.tsx`

- [ ] **Schritt 1: F-021-Eintrag ganz oben einfügen**

Im `UPDATES`-Array (Zeile 13) als ersten Eintrag einfügen:

```ts
{
  id: 'F-021',
  date: '19.05.2026',
  title: 'LOP ↔ Ideenspeicher',
  description: 'LOP-Punkte können in den Ideenspeicher geparkt und von dort wieder als Aufgaben reaktiviert werden – über das Hover-Menü, den Detail-Dialog oder den Inline-Edit-Modus.',
},
```

- [ ] **Schritt 2: Committen**

```bash
git add components/dashboard/DashboardUpdates.tsx
git commit -m "feat: F-021 dashboard entry for LOP ↔ Ideenspeicher"
```

---

## Task 10: Finaler TypeScript-Check + Push

- [ ] **Schritt 1: Vollständiger TypeScript-Check**

```bash
cd /root/autotodo && npx tsc --noEmit
```

Erwartete Ausgabe: keine Fehler. Bei Fehlern: Typ-Konflikte bei `Status` in `LopTableRow` und `LopItemDialog` durch Import von `Status` aus `StatusBadge` lösen oder lokale Typ-Definition anpassen.

- [ ] **Schritt 2: Branch pushen**

```bash
git push -u origin main
```

Falls 403 (Proxy-Token abgelaufen):
```bash
git push https://cryptoclemens:${GITHUB_TOKEN}@github.com/cryptoclemens/AutoToDo.git main
```

---

## Bekannte Fallstricke

1. **`LopItem['status']`-Casting:** Da `LopItem.status` in `LopItemDialog.tsx` als `'offen' | 'in_bearbeitung' | 'abgeschlossen'` typisiert ist, kann TypeScript über `'geparkt'` klagen. Nach Task 8 Schritt 1 (Type-Erweiterung) löst sich das auf.

2. **`fetchIdeas` im Scope:** Die Funktion ist im Komponentenkörper definiert und schließt über `projectId` und `setIdeas`. Sicherstellen, dass der `useEffect` nach der Funktionsdefinition steht.

3. **Constraint-Name:** PostgreSQL benennt anonyme CHECK-Constraints als `{table}_{column}_check`. Wenn `DROP CONSTRAINT IF EXISTS lop_items_status_check` einen Fehler wirft (Constraint-Name weicht ab), den tatsächlichen Namen via `\d lop_items` in psql ermitteln.
