# Requirements: AutoToDo

**Defined:** 2026-04-16
**Core Value:** Meeting-Nachfolge ohne manuelle Arbeit — Transkript hochladen → LOP sofort strukturiert

## Milestone 6 — Abgeschlossen ✓

Alle Requirements shipped und validated.

### LOP-Erweiterungen

- ✓ **LOP-01**: Externe Links pro LOP-Punkt (URL + optionales Label, max 5, neue Tab) — migration 021
- ✓ **LOP-02**: LOP-Inhalte on-the-fly übersetzen via BYOK-LLM (Browser-State only, Globe-Button)
- ✓ **LOP-03**: KPI "Offen pro Verantwortlichem" auf Projektseite (max 6 Personen)
- ✓ **LOP-04**: Ø Bearbeitungszeit auf Projektseite (aus abgeschlossenen Items)

### ContextNotes

- ✓ **CTX-01**: ContextNotes standardmäßig eingeklappt beim Seitenaufruf
- ✓ **CTX-02**: Text-Truncation bei 120 Zeichen mit "mehr/weniger" Toggle
- ✓ **CTX-03**: Inline-Editierung von Context-Note-Text (Bleistift-Icon)
- ✓ **CTX-04**: Sortierung nach Wichtigkeit (risk > decision > availability > info), dann Datum

### Admin

- ✓ **ADM-01**: Super-Admin Übersicht `/admin` — globale KPIs (Workspaces, Nutzer, Inhalte)
- ✓ **ADM-02**: Workspace-Liste `/admin/workspaces` — alle Workspaces mit Counts + Suche
- ✓ **ADM-03**: Aktivitäts-Feed auf Übersicht (letzte 25 LOP + 10 Transkripte + 10 Workspaces)
- ✓ **ADM-04**: Friends-Code Nutzungs-Badge (Aktiv/Nicht genutzt + LOP/Transkript-Counts)

## Milestone 7 — Aktiv

### Aufgaben-Abhängigkeiten (Wave)

- [ ] **WAVE-01**: LOP-Punkt kann auf anderen LOP-Punkt "warten auf" (blockiert-Status)
- [ ] **WAVE-02**: Blockierte Items visuell als abhängig kennzeichnen in der Tabelle
- [ ] **WAVE-03**: Abhängigkeitskette beim Status-Ändern prüfen (warnung wenn Vorgänger offen)

### Desktop App

- [ ] **DESK-01**: Electron-Wrapper für lokale Audio-Aufnahme
- [ ] **DESK-02**: Aufnahme direkt an Transkript-API übergeben

### Notion-Integration

- [ ] **NOT-01**: LOP-Punkte nach Notion exportieren (unidirektional)
- [ ] **NOT-02**: Status-Sync Notion → AutoToDo (bidirektional)

## Backlog (v2+)

- Öffentliche API für LOP-Item-Zugriff
- Slack-Integration: LOP-Punkt-Benachrichtigungen
- Wiederkehrende Meetings / Projektvorlagen
- Mobile App (nach Desktop-Validation)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Eigenes LLM-Hosting | BYOK-Strategie gesetzt; kein Datenschutzrisiko |
| Eigene E-Mail-Infrastruktur | Resend ist gesetzt und funktioniert |
| Stripe / PayPal | Mollie ist DSGVO-konform und EU-fokussiert |
| Vollständige Offline-Fähigkeit | Realtime-Features benötigen Verbindung |
| Native iOS/Android App | Web-first Priorität |

## Traceability

| Requirement | Milestone | Status |
|-------------|-----------|--------|
| WAVE-01–03 | 7 | Pending |
| DESK-01–02 | 7 | Pending |
| NOT-01–02 | 7 | Pending |

---
*Last updated: 2026-04-16 nach Milestone 6 Abschluss + GSD Setup*
