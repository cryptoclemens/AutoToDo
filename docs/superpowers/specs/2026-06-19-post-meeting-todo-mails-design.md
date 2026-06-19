# F-030 — Post-Meeting-ToDo-Mails

**Status:** Design freigegeben · **Datum:** 2026-06-19 · **Feedback:** F-030 (clemens.pompey@vencly.com)

## Ziel

Die abendliche Digest-Sammelmail wird **ersetzt** durch eine **event-getriggerte, personalisierte Mail**: Sobald ein Transkript fertig verarbeitet ist (KI-Extraktion abgeschlossen), erhält jedes Projekt-Mitglied mit offenen ToDos eine individuelle Mail „Deine ToDos – «Projekt»" mit allen seinen offenen Aufgaben in diesem Projekt.

> Original-Wunsch: „Statt abendliche Erinnerungsemails immer eine individuelle Email an jeweilige LOP-Listen-Mitglieder mit den ToDos nachdem eine Aufnahme beendet wurde und das Transkript bearbeitet wurde. Quasi ‚Deine ToDos aus dem heutigen Meeting:…'"

## Entscheidungen (mit Nutzer abgestimmt)

| Frage | Entscheidung |
|-------|--------------|
| Verhältnis zum Digest | **Ersetzt** den abendlichen Digest (kein Workspace-Toggle, keine Migration) |
| Trigger | **Sofort** nach KI-Verarbeitung (`processing_status = 'done'`) |
| Mail-Inhalt | **Alle offenen Items** der Person im Projekt (Status `offen` + `in_bearbeitung`) |
| Empfänger | **Nur Personen mit ≥1 offenem Item** (mit `responsible_user_id`) im Projekt |
| Digest abschalten | Code reversibel belassen; **Host-Crontab-Eintrag beim nächsten Deploy entfernen** (Server-Schritt, separat freizugeben) |

## Architektur

### 1. `lib/email/todoEmail.ts` (neu, Refactor)
Extrahiert aus `app/api/cron/daily-digest/route.ts`:
- `sendEmail(to, subject, html)` — Resend-Versand (unverändert übernommen).
- `buildTodoEmail(opts)` — generalisierter HTML-Builder. Bestehende `buildDigestEmail`-Optik, aber mit parametrisierbarem `intro`/`subtitle`, sodass Digest **und** Post-Meeting dieselbe Optik teilen.
- `daily-digest/route.ts` importiert künftig von hier (DRY, kein Verhaltens-Change am Digest selbst).

### 2. `lib/email/postMeetingNotify.ts` (neu)
```
sendPostMeetingTodoEmails(supabase, { projectId, workspaceId, dryRun? })
  → { sent, recipients[], skipped? }
```
Ablauf:
1. Wenn `RESEND_API_KEY` fehlt und nicht `dryRun` → `{ skipped: 'no RESEND_API_KEY' }`.
2. Projekt laden (Name; archivierte Projekte → skip).
3. Offene Items des Projekts laden: `status in ('offen','in_bearbeitung')`, `responsible_user_id not null`.
4. Nach `responsible_user_id` gruppieren (Empfänger = nur Personen mit ≥1 Item).
5. Pro User: Email via `supabase.auth.admin.getUserById` auflösen, Display-Name ermitteln (`full_name` → `name` → email).
6. Mail bauen (`buildTodoEmail` mit projektbezogenem Intro „Deine offenen Aufgaben aus «Projekt»") und versenden.
7. `dryRun` → nur Empfängerliste zurückgeben, kein Versand.

Robust: Einzelne Versandfehler werden gesammelt, brechen den Lauf nicht ab.

### 3. Hook in `lib/processTranscript.ts`
Direkt **nach** dem „Mark done"-Update:
```ts
try {
  await sendPostMeetingTodoEmails(supabase, {
    projectId: transcript.project_id,
    workspaceId: transcript.workspace_id,
  })
} catch { /* Mail-Fehler darf Verarbeitung nie kippen */ }
```
Gleiches Resilienz-Muster wie die bestehenden optionalen Schritte (context_notes, ideas, speaker_map).

### 4. Digest-Stilllegung
- Code von `daily-digest` bleibt funktionsfähig und reversibel.
- Der **Host-Crontab-Eintrag** (`curl … /api/cron/daily-digest`) wird beim nächsten Deploy entfernt — sonst gingen beide Mails raus. Separater Server-Schritt, nicht Teil dieses Code-PRs.

## Bewusst weggelassen (YAGNI)
- Kein Workspace-Toggle / keine `notification_mode`-Migration (da reines Ersetzen).
- Kein neuer Cron.
- Keine Review-Freigabe-Stufe vor Versand.
- Kein neues Test-Framework (Projekt hat keines; Verifikation via `next build` + `next lint` + `dryRun`).

## Verifikation
- `next lint` und `next build` (Typecheck) grün.
- `dryRun`-Pfad liefert korrekte Empfänger-/Item-Gruppierung.
- Manuell: Transkript reprocessen → Mail-Empfang prüfen (nach Deploy).
