# AutoToDo – Rollenkonzept

> Status: **Entwurf** – noch nicht implementiert.  
> Ziel: Definition aller Rollen und ihrer Berechtigungen als Basis für eine spätere Umsetzung.

---

## 1. Bestehende Rollen (technischer Ist-Stand)

In der DB sind bereits folgende Rollen in `workspace_members` hinterlegt:

| DB-Wert | Nutzerfreundlicher Name | Aktueller Einsatz |
|---|---|---|
| `workspace_owner` | Inhaber | Wird beim Workspace-Erstellen vergeben, voller Zugriff |
| `workspace_admin` | Administrator | Einladungen, Einstellungen, API-Keys |
| `project_admin` | Projekt-Admin | Projektspezifisches Branding/Einstellungen |
| `editor` | Mitarbeiter | LOP-Punkte bearbeiten, Aufnahmen starten |
| `viewer` | Betrachter | Nur lesen, kein Bearbeiten, keine Aufnahmen |
| `guest` | Gast | Token-basierter Zugriff ohne Login (Projekt-Ebene) |

Platform-Admins (Clemens) sind zusätzlich in `superadmin_emails` hinterlegt.

---

## 2. Vorgeschlagene Ziel-Rollen

Basierend auf den Anforderungen: vier Workspace-Rollen + Gast.

### Workspace-Ebene

| Rolle | Nutzerfreundlicher Name | Beschreibung |
|---|---|---|
| `workspace_owner` | **Inhaber** | Ersteller des Workspaces, nicht entfernbar |
| `workspace_admin` | **Administrator** | Vollzugriff außer Workspace löschen |
| `team_lead` | **Team-Lead** (neu) | Projektbezogener Zugriff + Auswertungen, keine Bezahlung |
| `editor` | **Mitarbeiter** | Normaler Arbeitsalltag: LOP, Aufnahmen, Tagesplan |
| `viewer` | **Betrachter** | Nur lesen |
| `guest` | **Gast** | Tokenbasiert, projektbezogen, kein Login |

---

## 3. Berechtigungsmatrix

| Berechtigung | Inhaber | Admin | Team-Lead | Mitarbeiter | Betrachter | Gast |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **LOP-Punkte lesen** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **LOP-Punkte erstellen/bearbeiten** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **LOP-Punkte löschen** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Aufnahme starten / Transkript erstellen** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Tagesplanung** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Tätigkeitsnachweis** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Auswertungen / Dashboard-KPIs** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Neues Projekt erstellen** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Projekteinstellungen (Branding, Bundesland)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Teammitglieder einladen** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Rollen anderer Mitglieder ändern** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Mitglieder entfernen** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **API-Keys verwalten** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **LLM-Konfiguration (BYOK)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Bezahlung / Plan-Upgrade** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Workspace löschen** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Neue Rolle: Team-Lead

**Motivation:** Es gibt Nutzer, die mehr als ein normaler Mitarbeiter dürfen (z.B. Projektkoordination, Auswertungen sehen), aber keine vollständige Admin-Funktion benötigen und keinen Zugriff auf Bezahlung/Abrechnung haben sollen.

**DB-Wert:** `team_lead`  
**Wo einfügen:** `CHECK (role IN (..., 'team_lead'))` in `workspace_members`

---

## 5. Offene Punkte / Fragen

- Soll ein **Team-Lead** auch andere Mitglieder einladen dürfen? (aktuell: nein)
- Soll **Betrachter** den Tätigkeitsnachweis für sich selbst sehen dürfen?
- Soll die Gast-Rolle Kommentare oder Reaktionen auf LOP-Punkte setzen dürfen?
- Sollen Rollen **projektspezifisch** überschreibbar sein (z.B. Mitarbeiter im Workspace, aber Team-Lead in einem bestimmten Projekt)?

---

## 6. Implementierungsschritte (wenn freigegeben)

1. Migration: `team_lead` zum `CHECK`-Constraint hinzufügen
2. Alle Permissions-Checks im Code auf die neue Matrix anpassen (`workspace_admin` → `['workspace_admin', 'team_lead']` wo passend)
3. Einstellungen/Mitglieder-UI: Rolle `team_lead` als „Team-Lead" anzeigen und zuweisbar machen
4. Dashboard-Auswertungen hinter `team_lead`-Check stellen
5. Rechteauswahl für Inhaber/Admin in der Mitgliederverwaltung
