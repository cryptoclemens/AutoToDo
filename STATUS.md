# AutoToDo – Projektstatus

Letzte Aktualisierung: 19.05.2026 · Version 0.1.198

---

## Deployment

| Dienst | URL | Status |
|---|---|---|
| App | https://autotodo.vencly.com | ✅ Live |
| Supabase | https://supabase.autotodo.vencly.com | ✅ Live |
| Branch | `main` | ✅ Aktuell |

---

## Zuletzt ausgeliefert

### F-021 — LOP ↔ Ideenspeicher (bidirektionaler Transfer)
- LOP-Punkte können per Hover-Menü in den Ideenspeicher geparkt werden
- Geparkte Punkte erhalten Status `geparkt` und erscheinen im Ideenspeicher mit „Aus LOP"-Badge
- Reaktivierung möglich: Ideenspeicher-Eintrag → „→ Aufgabe" oder Dialog → „↩ Reaktivieren"
- Migration 034 (`lop_parked_status.sql`), neue `/api/ideas`-Routen (Transfer/Merge)

### F-022 — Feiertage im Tätigkeitsnachweis & E-Mail-Cron
- Tätigkeitsnachweis zeigt alle Monatstage; Wochenenden & Feiertage ausgegraut mit Feiertagsname
- `getHolidayLabels()` in `lib/holidays.ts` — Datum → Feiertagsname (bundesweit + länderspezifisch)
- Migration 035: `bundesland`-Spalte auf `workspaces`
- Workspace-Einstellungen: Bundesland-Selector (Notifications-Tab)
- E-Mail-Digest überspringt Feiertage gemäß konfiguriertem Bundesland

### F-023 — Digest-Häufigkeit & Account-Hinweis
- Toggle ersetzt durch Select: Täglich (Mo–Fr) / 2× pro Woche (Mo+Do) / Wöchentlich (Mo) / Aus
- Migration 036: `digest_frequency` TEXT mit CHECK-Constraint auf `workspaces`
- Cron respektiert `digest_frequency` — Frequenz-Filter vor Feiertags-Filter
- Account-Hinweis-Link unter Digest-Select → Konto-Tab für Name/E-Mail-Änderung

---

## Offene Punkte (Backlog)

| # | Aufgabe | Priorität |
|---|---|---|
| B.1 | WorkspaceNav: Projekt-Logo anzeigen wenn auf Projekt-Seite (M13.7) | Niedrig |
| B.2 | Landing Page: Feature-Sektion mit Screenshots (M10.2) | Niedrig |
| B.3 | PWA: Offline-Fallback-Seite (M15.7) | Niedrig |
| B.4 | Hetzner-Migration (I.3–I.7) | Niedrig (selbst-gehostet bereits live) |
| B.5 | SSO / SAML für Enterprise (9.6) | Niedrig |
| B.6 | Dark-Mode (M10.9) | Niedrig |

---

## Aktuelle Migrationen

| Nr | Datei | Inhalt |
|---|---|---|
| 034 | `034_lop_parked_status.sql` | `geparkt`-Status für lop_items |
| 035 | `035_workspace_bundesland.sql` | `bundesland` auf workspaces |
| 036 | `036_workspace_digest_frequency.sql` | `digest_frequency` auf workspaces |

---

## Feedback-Status

| ID | Thema | Status |
|---|---|---|
| F-018 | Keine E-Mails an Feiertagen, Tätigkeitsnachweis ausgrauen | ✅ Bearbeitet als F-022 |
| F-019 | Accountinfos + Digest-Häufigkeit | ✅ Bearbeitet als F-023 |
| F-020 | Marketplace-Challenges Admin (nicht-registrierte Firmen) | 🔲 Offen |
| F-021 | LOP ↔ Ideenspeicher bidirektionaler Transfer | ✅ Bearbeitet |
