# AutoToDo Roadmap

## Milestone 6 — ABGESCHLOSSEN ✓
*LOP-Erweiterungen, ContextNotes, Admin-Dashboard*

- Phase 6.1 ✓ Externe Links auf LOP-Punkten
- Phase 6.2 ✓ ContextNotes: eingeklappt, Truncation, Inline-Edit, Sortierung
- Phase 6.3 ✓ LOP-Übersetzung via BYOK (Browser-State)
- Phase 6.4 ✓ KPI: Verantwortliche + Ø Bearbeitungszeit auf Projektseite
- Phase 6.5 ✓ Admin-Bereich: Übersicht, Workspace-Liste, Aktivitäts-Feed
- Phase 6.6 ✓ Friends-Code Nutzungsverifikation

---

## Milestone 7 — AKTIV
*Aufgaben-Abhängigkeiten · Desktop · Notion*

### Phase 7.1 — Aufgaben-Abhängigkeiten (Wave-Execution)
**Ziel:** LOP-Punkte können voneinander abhängig sein ("wartet auf")
**Requires:** Migration 022 (depends_on Spalte), UI-Erweiterung LopItemDialog + LopTable
**Wave:**
  - Wave A (parallel): Migration, API-Update (PATCH-Route), Type-Definitionen
  - Wave B (nach Wave A): UI — Dialog-Erweiterung, Tabellen-Badges, Warn-Logik

### Phase 7.2 — Desktop App (Electron)
**Ziel:** Lokale Audio-Aufnahme direkt aus Desktop-App
**Depends on:** Phase 7.1 (optional)
**Wave:**
  - Wave A: Electron-Shell + IPC-Bridge
  - Wave B: Audio-Recording + Upload an /api/transcripts

### Phase 7.3 — Notion-Integration
**Ziel:** LOP-Punkte nach Notion exportieren, Status rücksynchen
**Depends on:** MCP-Server bereits installiert (notion MCP)
**Wave:**
  - Wave A: Export-Route (POST /api/notion/sync)
  - Wave B: Bidirektionaler Sync-Mechanismus

---

## Backlog (Milestone 8+)

- 999.1 Öffentliche API
- 999.2 Slack-Benachrichtigungen
- 999.3 Projektvorlagen / wiederkehrende Meetings
- 999.4 Mobile App
