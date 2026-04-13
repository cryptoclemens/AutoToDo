# AutoToDo – Feedback

> Nutzerfeedback und Feature-Wünsche, automatisch gesammelt über den Feedback-Button.
> Diese Datei wird beim nächsten Session-Start ausgelesen, um neue Features in Tasks.md zu übertragen.

---

## 2026-03-27 12:05:14 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Plenum
**Nutzer:** clemens.pompey@vencly.com

Ich fände es cool, wenn ich auf Excel offline bearbeitete XSLX, die ich vorher von dieser Seite runtergeladen habe, wieder hochladen kann, und dann ein Abbgleich mit der jweiliegen Lop-Liste stattfindet
**Lösung:** XlsxImportDialog implementiert – XLSX hochladen, Abgleich mit bestehender LOP-Liste, Zusammenführung per Dialog bestätigen.

---
## 2026-03-27 12:14:26 | 🐛 Fehler | Status: bearbeitet
**Workspace:** Plenum
**Nutzer:** clemens.pompey@vencly.com

Die Schreibweise bei den Status ist etwas komisch, z.B. in_bearbeitung
**Lösung:** StatusBadge und alle Dropdowns zeigen jetzt lesbare Labels: „Offen", „In Bearbeitung", „Abgeschlossen".

---
## 2026-04-02 08:20:28 | ✨ Feature-Wunsch | Status: gestrichen
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Links in LOP-Punkten in Hyperlinks überführen und im neuen Tab bei click öffnen

---
## 2026-04-10 07:30:18 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Weitere KPI: Anzahl Tasks pro Verantwortlichen und durchschnittliche Bearbeitungszeit
**Lösung:** Projektseite zeigt jetzt beide KPIs: Ø Bearbeitungszeit (badge, bereits vorhanden) + neue Zeile „Offen pro Person" mit den Top-6-Verantwortlichen und ihrer Anzahl offener/in-Bearbeitung-Tasks.

---
## 2026-04-10 07:32:46 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Kontext-Übersicht optimieren: Nach Chronologie und Wichtigkeit ordnen und intelligente Einkürzung bzw. Verknüpfung der Informationen. Max. 7-10 Punkte. Jeweils editier- und löschbar.
**Lösung:** ContextNotes sortiert jetzt nach Wichtigkeit (Risiko > Entscheidung > Verfügbarkeit > Info), dann nach nächstem Ablaufdatum. Max. 10 Punkte sichtbar mit „Weitere anzeigen"-Toggle. Inline-Bearbeitung per Stift-Icon (Cmd+Enter zum Speichern, Esc zum Abbrechen). Löschen/Archivieren wie bisher per ×-Button.

---
## 2026-04-13 07:45:40 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Pro LOP-Listen-Punkt die Mögichkeit, im Pop-up in einem eigenen Feld externe Links hinzuzufügen, z.B. für Dokumente, etc..
**Lösung:** Neuer Abschnitt „Externe Links" im LOP-Popup. URL eingeben (mit optionaler Bezeichnung), wird als klickbarer Link im neuen Tab geöffnet. Links werden in einer neuen `links`-Spalte (JSONB) in `lop_items` gespeichert (Migration 021).

---
## 2026-04-13 08:52:02 | 🐛 Fehler | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Übersetzungsfunktion klappt nicht
**Lösung:** LanguageSwitcher auf window.location.reload() umgestellt (router.refresh() in startTransition war unzuverlässig).

---
## 2026-04-13 08:54:46 | 🐛 Fehler | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Darkmode klappt nicht
**Lösung:** dark:-Varianten zu WorkspaceNav, App-Layout und LopTable hinzugefügt. ThemeProvider-Crash (fehlende bridge-Methode) separat gefixt.

---
