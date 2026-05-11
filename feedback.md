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
## F-009 | 2026-05-07 11:47:27 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** markus.wanzek@plenum.de

Hinzufügen von Co-Verantwortlichen, wenn man zusammen an einem Task arbeitet. Macht das Sinn?
**Lösung:** Neues Feld co_responsibles (JSONB) auf lop_items. Im LOP-Dialog: Workspace-Mitglieder per Dropdown hinzufügen, als Chips mit ×-Button angezeigt. Wird mit gespeichert.

---
## F-010 | 2026-05-07 11:48:14 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** markus.wanzek@plenum.de

Kontext Feld wird zu lang. Bitte immer nur die relevanten für den Tag/die Woche und nicht mehr relevante automatisch löschen.
**Lösung:** GET-Route archiviert automatisch: abgelaufene Notizen (relevant_until < heute) sowie info/availability > 14 Tage und risk/decision > 30 Tage ohne Deadline. Im Header kurzer Hinweis wenn etwas bereinigt wurde.

---
## G-002 | 2026-05-07 11:49:00 | 💬 Allgemein | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** markus.wanzek@plenum.de

Stauts Feld "in_Berarbeitung" durch "In Bearbeitung" ersetzen.
**Lösung:** AdminOverviewClient und MergeSuggestionDialog zeigen jetzt "In Bearbeitung" statt des Rohwerts.

---
## B-006 | 2026-05-07 11:50:25 | 🐛 Fehler | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** markus.wanzek@plenum.de

Verantwortlichkeiten unter "Markus" "Markus Wanzek I Plenum" zusammen mergen.
**Lösung:** DB-Backfill: "Markus Wanzek I Plenum" und "Markus Wanzek" → "Markus" (20 LOP-Punkte). Admin-Steuerung: neues Tool "Verantwortliche zusammenführen" für zukünftige Alias-Normalisierung.

---
## F-011 | 2026-05-07 11:51:14 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** markus.wanzek@plenum.de

Mein eigenes Profil ändern -> Ich will mein Anzeigename "Markus Wanzek I Plenum" ändern zu Markus
**Lösung:** Neues Feld "Anzeigename" im Konto-Tab der Einstellungen. Name wird in user_metadata.full_name gespeichert und gilt für LOP-Punkte und Transkripte.

---
## F-012 | 2026-05-07 11:52:21 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** markus.wanzek@plenum.de

Im Dashboard weitere Funktionen ergänzen:
z.B. Übersicht wie viel pro Person schon geschafft wurde und Burn-Rate
**Lösung:** Zwei neue Karten im Dashboard: "Fortschritt pro Person" (Fortschrittsbalken erledigt/gesamt, Top 8) und "Burn-Rate" (Balkendiagramm abgeschlossener Tasks pro KW, letzte 8 Wochen).

---
## F-013 | 2026-05-08 08:50:21 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Tätigkeitsnachsweise: bei meiner Firma muß ich tagesscharfe Tätigkeitsnachweise einreichen. Es wäre hilfreich, wenn jeder Nutzer bei AutoToDo einen Button hätte, bei dem via Pop-up in tabellarischer Ansicht monatsscharf die Tätigkeiten pro Tag auf maximal zwei Felder (je 100 Zeichen) dargestellt werden.
**Lösung:** Button „Tätigkeitsnachweis" im Dashboard-Header (für alle Nutzer). Pop-up zeigt monatliche Tabelle: Tag | Tätigkeit 1 (LOP-Items, wo Nutzer verantwortlich) | Tätigkeit 2 (Meetings/Transkripte). Beide Felder editierbar, max. 100 Zeichen, vorausgefüllt aus API. Monat per Pfeil wechselbar, Drucken/PDF-Button.

---
## F-015 | 2026-05-08 14:33:31 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Auch in der Webversion angemeldet bleiben, z.B. über Cookie
**Lösung:** `createBrowserClient` erhält `cookieOptions: { maxAge: 365 Tage }` – die Session bleibt nach Browser-Neustart erhalten.

---
## B-007 | 2026-05-09 11:57:04 | 🐛 Fehler | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Katarina, Katharina und Katharina Lugunja wird mehrmals angezeigt; Clemens und Clemens Pompey wird mehrmals angezeigt → bitte mergen. Logik entwickeln, dass dieselbe Person nicht mehrmals eingegeben/erstellt wird.
**Lösung:** DB-Backfill: „Katharina" + „Katharina Lugonia" → „Katarina" (35 Punkte), „Clemens Pompeÿ" → „Clemens" (24 Punkte). Prävention: Freitext-Feld in `ResponsibleSelect` zeigt jetzt per `<datalist>` Autocomplete aller bekannten Namen aus der aktuellen LOP-Liste.

---
## B-008 | 2026-05-11 | 🐛 Fehler | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Ø Bearbeitungszeit zeigt 23 Tage – zu hoch, weil updated_at statt Abschluss-Zeitpunkt verwendet wurde.
**Lösung:** Migration 029 fügt `completed_at` hinzu (Backfill: 88 Items). API setzt `completed_at` exakt beim Wechsel auf „abgeschlossen" (und löscht es bei Rückstufung). Projektseite berechnet Ø aus `completed_at - created_at`.

---
## F-016 | 2026-05-09 11:54:22 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Tätigkeitsnachweis: deutschlandweite gesetzliche Feiertage + Wochenenden ausschließen, lokale Feiertage je konfiguriertem Projekt-Bundesland berücksichtigen. Max. 2×100 Zeichen pro Tag. Logik: abgehakte Daily-Todos + Transkript + hinterlegte Deadlines + Tagesplanung. Wiederholende Aufgaben über mehrere Tage sollen korrekt abgebildet werden.
**Lösung:** `lib/holidays.ts` mit Gaußscher Osterberechnung + allen 16 Bundesländern. Migration 030: `bundesland`-Feld auf `projects`. Projekt-Branding-Seite hat neuen Bundesland-Selektor. API gibt `workingDays[]` zurück (Wochenenden + Feiertage gefiltert). Tätigkeitsnachweis zeigt alle Arbeitstage; LOP-Logik nutzt `completed_at` + `due_date` statt `created_at`.

---
## F-017 | 2026-05-09 12:00:02 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Rollenkonzept entwickeln (noch nicht umsetzen) – erst Konzept erstellen: Welche Rollen muss es geben (z.B. Admin, Team-Lead)? Welche Rechte haben unterschiedliche Rollen (z.B. Rechteauswahl, Bezahlfunktion, Auswertungsfunktion, Änderungsfunktion, neue Projekte erstellen, neue Teammitglieder einladen)?
**Lösung:** `docs/rollen-konzept.md` mit 6 Rollen (Inhaber, Admin, Team-Lead, Mitarbeiter, Betrachter, Gast), vollständiger Berechtigungsmatrix und Implementierungsplan. Noch nicht in Code umgesetzt.

---
## F-014 | 2026-05-08 13:10:45 | ✨ Feature-Wunsch | Status: bearbeitet
**Workspace:** Vencly
**Nutzer:** clemens.pompey@vencly.com

Neuer Button „Tagesplanung" pro Nutzer: Pop-up zeigt, was der jeweilige Nutzer an dem Tag macht (auch historisch einsehbar), wird automatisch aus Transkripten befüllt. Im Stand-up-Modus erscheint nach Klick auf „Aufnahme starten" ein Hinweis, dass jeder einmal kurz berichtet, was er an dem Tag macht. Hintergrund: damit wird der Tätigkeitsbericht deutlich genauer ausgefüllt. Im Anschluss gleicht der Tätigkeitsbericht mit Tagesplan und LOP-Liste ab.
**Lösung:** Migration 027 (daily_plans). Klemmbrett-Icon in WorkspaceNav öffnet TagesplanungModal: editierbares Feld mit Auto-Save, vorausgefüllt aus offenen LOP-Punkten, Verlauf der letzten 14 Tage. Stand-up-Banner erscheint 8 Sek. nach Klick auf „Aufnahme starten". Tätigkeitsnachweis bevorzugt gespeicherten Tagesplan vor LOP/Meeting-Fallback.

---
