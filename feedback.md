# AutoToDo – Feedback

> Nutzerfeedback und Feature-Wünsche, automatisch gesammelt über den Feedback-Button.
> Diese Datei wird beim nächsten Session-Start ausgelesen, um neue Features in Tasks.md zu übertragen.

---

## F-001 | 2026-03-27 12:05:14 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Plenum
**Nutzer:** clemens.pompey@vencly.com

Ich fände es cool, wenn ich auf Excel offline bearbeitete XSLX, die ich vorher von dieser Seite runtergeladen habe, wieder hochladen kann, und dann ein Abbgleich mit der jweiliegen Lop-Liste stattfindet
**Lösung:** XlsxImportDialog implementiert – XLSX hochladen, Abgleich mit bestehender LOP-Liste, Zusammenführung per Dialog bestätigen.

---
## B-001 | 2026-03-27 12:14:26 | 🐛 Fehler | Status: bearbeitet
**Workspace:** Plenum
**Nutzer:** clemens.pompey@vencly.com

Die Schreibweise bei den Status ist etwas komisch, z.B. in_bearbeitung
**Lösung:** StatusBadge und alle Dropdowns zeigen jetzt lesbare Labels: „Offen", „In Bearbeitung", „Abgeschlossen".

---
## F-002 | 2026-04-02 08:20:28 | ✨ Feature-Wunsch | Status: gestrichen
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Links in LOP-Punkten in Hyperlinks überführen und im neuen Tab bei click öffnen

---
## F-003 | 2026-04-10 07:30:18 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Weitere KPI: Anzahl Tasks pro Verantwortlichen und durchschnittliche Bearbeitungszeit
**Lösung:** Projektseite zeigt jetzt beide KPIs: Ø Bearbeitungszeit (badge, bereits vorhanden) + neue Zeile „Offen pro Person" mit den Top-6-Verantwortlichen und ihrer Anzahl offener/in-Bearbeitung-Tasks.

---
## F-004 | 2026-04-10 07:32:46 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Kontext-Übersicht optimieren: Nach Chronologie und Wichtigkeit ordnen und intelligente Einkürzung bzw. Verknüpfung der Informationen. Max. 7-10 Punkte. Jeweils editier- und löschbar.
**Lösung:** ContextNotes sortiert jetzt nach Wichtigkeit (Risiko > Entscheidung > Verfügbarkeit > Info), dann nach nächstem Ablaufdatum. Max. 10 Punkte sichtbar mit „Weitere anzeigen"-Toggle. Inline-Bearbeitung per Stift-Icon (Cmd+Enter zum Speichern, Esc zum Abbrechen). Löschen/Archivieren wie bisher per ×-Button.

---
## F-005 | 2026-04-13 07:45:40 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Pro LOP-Listen-Punkt die Mögichkeit, im Pop-up in einem eigenen Feld externe Links hinzuzufügen, z.B. für Dokumente, etc..
**Lösung:** Neuer Abschnitt „Externe Links" im LOP-Popup. URL eingeben (mit optionaler Bezeichnung), wird als klickbarer Link im neuen Tab geöffnet. Links werden in einer neuen `links`-Spalte (JSONB) in `lop_items` gespeichert (Migration 021).

---
## B-002 | 2026-04-13 08:52:02 | 🐛 Fehler | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Übersetzungsfunktion klappt nicht
**Lösung:** LanguageSwitcher auf window.location.reload() umgestellt (router.refresh() in startTransition war unzuverlässig).

---
## B-003 | 2026-04-13 08:54:46 | 🐛 Fehler | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Darkmode klappt nicht
**Lösung:** dark:-Varianten zu WorkspaceNav, App-Layout und LopTable hinzugefügt. ThemeProvider-Crash (fehlende bridge-Methode) separat gefixt.

---
## F-006 | 2026-04-20 10:37:33 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

es wäre cool, wenn die KI automatisch auch mal die bestehenden LOP-Listen liest und geänderte Schreibweisen, z.B. Namen, automatisch für zukünftige Transskripte übernimmt
**Lösung:** KI liest jetzt alle `responsible`-Felder aus bestehenden LOP-Punkten (inkl. abgeschlossener) und gibt diese als „Bekannte Personennamen" an den Prompt weiter. Workspace-Mitglieder werden separat aufgeführt. Beide Listen gelten als verbindliche Schreibweisen. Fix: Beispiel „Katarina → Katharina" aus Prompt entfernt – der Prompt stellt nun klar, dass Namen aus den Listen EXAKT so übernommen werden müssen.

---
## B-004 | 2026-05-02 08:56:42 | 🐛 Fehler | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Firmen- und LOP-Logo werden nicht mehr angezeigt

---
## B-005 | 2026-05-02 09:15:02 | 🐛 Fehler | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Logos von Firmen und der Lop-Listen werden nicht angezeigt

---
## G-001 | 2026-05-02 09:41:43 | 💬 Allgemein | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

geile App

---
## F-007 | 2026-05-05 11:17:23 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

ich hätte gerne DeepSeek als AI-Einstellungsauswahl. Könnt ihr da eine Instanz anbieten
**Lösung:** DeepSeek als BYOK-Provider implementiert (deepseek-chat, deepseek-reasoner). Nutzer hinterlegen ihren eigenen Key aus platform.deepseek.com. Migration 022 erweitert den DB-Constraint um „deepseek".

---
## F-008 | 2026-05-06 14:10:01 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** markus.wanzek@plenum.de

Neue Team-Mitglieder über Link einladen
**Lösung:** Einladungslink-Funktion unter Einstellungen → Mitglieder. Admins können einen wiederverwendbaren Link generieren (7 Tage gültig, wählbare Rolle). Jeder mit dem Link kann dem Workspace beitreten ohne vorherige E-Mail-Einladung. Link kann widerrufen werden.

---
## F-009 | 2026-05-07 11:47:27 | ✨ Feature-Wunsch | Status: offen
**Workspace:** Vencly
**Nutzer:** markus.wanzek@plenum.de

Hinzufügen von Co-Verantwortlichen, wenn man zusammen an einem Task arbeitet. Macht das Sinn?

---
## F-010 | 2026-05-07 11:48:14 | ✨ Feature-Wunsch | Status: offen
**Workspace:** Vencly
**Nutzer:** markus.wanzek@plenum.de

Kontext Feld wird zu lang. Bitte immer nur die relevanten für den Tag/die Woche und nicht mehr relevante automatisch löschen.

---
## G-002 | 2026-05-07 11:49:00 | 💬 Allgemein | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** markus.wanzek@plenum.de

Stauts Feld "in_Berarbeitung" durch "In Bearbeitung" ersetzen.
**Lösung:** AdminOverviewClient und MergeSuggestionDialog zeigen jetzt "In Bearbeitung" statt des Rohwerts.

---
## B-006 | 2026-05-07 11:50:25 | 🐛 Fehler | Status: offen
**Workspace:** Vencly
**Nutzer:** markus.wanzek@plenum.de

Verantwortlichkeiten unter "Markus" "Markus Wanzek I Plenum" zusammen mergen.

---
## F-011 | 2026-05-07 11:51:14 | ✨ Feature-Wunsch | Status: offen
**Workspace:** Vencly
**Nutzer:** markus.wanzek@plenum.de

Mein eigenes Profil ändern -> Ich will mein Anzeigename "Markus Wanzek I Plenum" ändern zu Markus

---
## F-012 | 2026-05-07 11:52:21 | ✨ Feature-Wunsch | Status: offen
**Workspace:** Vencly
**Nutzer:** markus.wanzek@plenum.de

Im Dashboard weitere Funktionen ergänzen:
z.B. Übersicht wie viel pro Person schon geschafft wurde und Burn-Rate

---
## F-013 | 2026-05-08 08:50:21 | ✨ Feature-Wunsch | Status: offen
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Tätigkeitsnachsweise: bei meiner Firma muß ich tagesscharfe Tätigkeitsnachweise einreichen. Es wäre hilfreich, wenn jeder Nutzer bei AutoToDo einen Button hätte, bei dem via Pop-up in tabellarischer Ansicht monatsscharf die Tätigkeiten pro Tag auf maximal zwei Felder (je 100 Zeichen) dargestellt werden.

---
