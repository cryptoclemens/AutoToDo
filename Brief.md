# AutoToDo – Projektbrief

**Version:** 3.2 (Layout-Optimierung, Mehrsprachigkeit, Webhooks & Audit) | Stand: März 2026 · v0.1.61
**Stack:** Next.js 14 · Supabase · Vercel · Claude API (BYOK) · Stripe (geplant)
**Modell:** Multi-Tenant SaaS, Shared DB mit RLS-Isolation, Bring Your Own Key (LLM)

---

## Produktvision

AutoToDo ist ein KI-gestütztes Projektmanagement-Tool für Teams, die regelmäßige Meetings abhalten und deren Ergebnisse strukturiert nachverfolgen wollen.

**Kernworkflow:**
Meeting-Transkript hochladen → KI extrahiert offene Punkte und Statusänderungen → LOP wird automatisch aktualisiert → KI-Vorschläge im Review-Panel prüfen/bearbeiten/annehmen → manuell nachbearbeitbar → Export als XLSX

**Primäre Zielgruppe:** Unternehmensberatungen, Projektsteuerer, Engineering-Teams (tägliche/wöchentliche Standups)

**Betreibermodell (BYOK):** Jeder Workspace hinterlegt seinen eigenen LLM-API-Key. KI-Kosten entstehen direkt beim Workspace-Betreiber – AutoToDo trägt keine variablen KI-Kosten.

---

## SaaS-Konzept & Multi-Tenancy

### Tenant-Modell: Workspace

```
Workspace (= Tenant / Organisation)
  └── Projekte (mehrere pro Workspace)
       └── LOPs (eine pro Projekt)
            └── LOP-Punkte (n pro LOP)
            └── Transkripte (n pro Projekt)
  └── Mitglieder (n pro Workspace, mit Rollen)
  └── Branding (Logo, Akzentfarbe)
  └── LLM-Konfiguration (BYOK: Provider + API-Key + Modell)
  └── AutoToDo-API-Keys (für Webhook/API-Zugang, Phase 2)
```

### Workspace-Auflösung

Die App läuft aktuell auf Single-Domain (Vercel). Workspace-Auflösung erfolgt über `resolveWorkspace()`:
1. Wenn ein `x-workspace-slug`-Header gesetzt ist (Subdomain-Routing): Workspace per Slug suchen
2. Fallback: ersten Workspace des eingeloggten Nutzers per Membership ermitteln

Ziel: Subdomain-Routing mit `[slug].autotodo.app` über Vercel Wildcard Domain (Phase 2).

### Rollenmodell

| Rolle | Rechte |
|---|---|
| `workspace_owner` | Alle Rechte, Billing, Workspace löschen |
| `workspace_admin` | Mitglieder einladen/entfernen, Branding, API-Keys |
| `project_admin` | Projekte anlegen/archivieren, alle Inhalte bearbeiten |
| `editor` | Transkripte hochladen, LOP-Punkte bearbeiten, Status setzen |
| `viewer` | Nur lesen, Export erlaubt |

---

## Onboarding-Flow

### Selbst-Registrierung (Self-Service)
```
Landing Page → Registrierung (3 Schritte):
  Schritt 1: Konto erstellen (Name, E-Mail, Passwort, AGB-Zustimmung)
  Schritt 2: Workspace einrichten (Name, Subdomain)
  Schritt 3: KI-Anbieter konfigurieren (optional, überspringbar)
→ E-Mail-Bestätigung (Supabase Auth → /auth/callback)
→ Redirect zu /onboarding
```

### Onboarding-Wizard (3 Schritte)
1. **Workspace einrichten** – Name, Akzentfarbe
2. **Erstes Projekt anlegen** – Name, Beschreibung
3. **Team einladen** – E-Mail-Adressen, Rolle

### Einladungs-Flow
```
Einladungs-Link generieren (Projektseite oder Team-Einstellungen)
→ Optional: automatischer E-Mail-Versand via Resend (wenn RESEND_API_KEY gesetzt)
→ Empfänger öffnet /invite/[token] → Registrierung/Login
→ Automatische Workspace- und Projekt-Mitgliedschaft → Redirect zu Dashboard
```

**Aktueller Status:** Einladungslinks werden generiert und angezeigt. Wenn `RESEND_API_KEY` als Umgebungsvariable gesetzt ist, werden Einladungs-E-Mails automatisch verschickt. Token basieren auf `randomBytes(32)` (256 Bit Entropie).

**Projektspezifische Mitgliedschaft:** Über `project_members`-Tabelle – Einladungen von der Projektseite tragen den Nutzer auch in `project_members` ein (nicht nur in `workspace_members`).

---

## KI-Vorschläge Review-Panel

Nach der Transkript-Verarbeitung erscheinen KI-Vorschläge mit `requires_review = true` in einem gelben Banner. Beim Klick auf „Anzeigen" öffnet sich ein Inline-Panel mit allen offenen Vorschlägen. Jeder Vorschlag kann:

- **Bearbeitet** werden (alle Felder inline editierbar: Titel, Beschreibung, Status, Priorität, Verantwortlich, Fälligkeit)
- **Angenommen** werden (✓) – speichert Änderungen, entfernt `requires_review`
- **Abgelehnt** werden (✗) – löscht den Vorschlag

Konfidenz-Badges zeigen grün (≥85%), gelb (≥70%) oder rot (<70%). Quellentext aus dem Transkript wird angezeigt (falls vorhanden). Panel schließt sich automatisch wenn alle Vorschläge bearbeitet sind.

---

## Vencly-Branding & Betreiber

AutoToDo wird betrieben von der **vencly GmbH**, Leopoldstraße 31, 80802 München (HRB 290524).

| Element | Umsetzung |
|---|---|
| Betreiber | vencly GmbH (Impressum, AGB, Datenschutzerklärung) |
| Logo | Gradient-V + „vencly"-Text (`public/vencly-logo.svg`) |
| Favicon | Gradient-V (`app/icon.svg`, Next.js App Router) |
| Farbverlauf | `#1D4ED8 → #6D28D9 → #DB2777 → #EA580C` |
| Platzierung | Landing-Page-Nav oben links + Dashboard unten rechts |
| Link | Klick öffnet `www.vencly.com` in neuem Tab |
| Rechtliches | Impressum (§ 5 TMG), AGB, Datenschutzerklärung im LegalModal |
| Kontakt | info@vencly.com · datenschutz@vencly.com |

---

## Custom Branding

| Element | Beschreibung |
|---|---|
| Logo | Topnav (ersetzt AutoToDo-Logo) |
| Akzentfarbe | Buttons, Badges, Highlights (CSS Custom Property `--brand`) |
| Workspace-Name | Navigation, E-Mails, Exports |
| E-Mail-Absender-Name | "Acme Consulting via AutoToDo" |

XLSX-Exports enthalten Workspace-Name in der Kopfzeile.

---

## LLM-Konfiguration: Bring Your Own Key (BYOK)

### Unterstützte Provider

| Provider | Modell(e) | Status |
|---|---|---|
| Anthropic | claude-sonnet-4-6, claude-haiku-4-5 | ✅ MVP |
| OpenAI | gpt-4o, gpt-4o-mini | ✅ MVP |
| Azure OpenAI (Microsoft Copilot) | gpt-4o, gpt-4o-mini + Custom Deployment | ✅ MVP |
| Google | gemini-1.5-pro, gemini-1.5-flash | Phase 2 |
| Mistral | mistral-large, mistral-small | Phase 2 |
| Ollama (lokal) | llama3, mistral, ... | Phase 3 |

### Sicherheit
- API-Keys werden AES-256-GCM verschlüsselt in `workspace_llm_config` gespeichert
- `ENCRYPTION_SECRET` (64-Hex-Zeichen) zwingend als Umgebungsvariable erforderlich
- Kein direkter Client-Zugriff – ausschließlich über Server-Side API Routes
- Kein Logging des entschlüsselten Keys

### Transkript-Verarbeitung (Vercel-kompatibel)
- Verarbeitung erfolgt **synchron inline** im Upload-Request (kein fire-and-forget)
- `maxDuration = 60` gibt Vercel 60 Sekunden für LLM-Verarbeitung
- Retry-Button in der UI für hängende/fehlerhafte Transkripte
- Eigener Retry-Endpunkt `/api/transcripts/[id]/retry` mit User-Auth (kein Internal-Secret nötig)

### Fallback-Strategie
- Free-Tier: Optionaler Betreiber-Fallback-Key (Haiku), max. 10 Transkripte/Monat
- Ab Starter-Tier: BYOK verpflichtend

---

## Einstellungen-Hub (`/settings`)

Einheitliche Einstellungsseite mit Tabs – ersetzt das bisherige Redirect-zu-Branding-Pattern.

| Tab | Inhalt | Sichtbar für |
|---|---|---|
| **Konto** | E-Mail ändern (Bestätigungs-Mail), Passwort ändern | Alle |
| **Workspace** | Logo, Name, Akzentfarbe | Admin |
| **Team** | Mitglieder-Übersicht, Einladungsformular | Admin |
| **KI-Konfiguration** | LLM-Provider, Modell, API-Key (BYOK) | Admin |
| **API-Keys** | Keys erstellen/widerrufen, Scope-Auswahl | Admin |

Die Sub-Seiten (`/settings/branding`, `/settings/llm`, etc.) bleiben als direkte URLs erhalten.

---

## E-Mail-Digest & Verantwortlichen-Verknüpfung (M7e)

### Konzept

Täglich wird jedem Verantwortlichen automatisch eine E-Mail mit seinen offenen LOP-Punkten zugeschickt. Dafür müssen Verantwortliche aus den eingeladenen Workspace-Mitgliedern ausgewählt werden (statt Freitext), damit eine E-Mail-Adresse hinterlegt ist.

### Verantwortlichen-Auswahl aus Mitgliedern

Das Feld „Verantwortlich" in LOP-Tabelle und Detail-Dialog wird von einem Freitext-Eingabefeld auf ein Dropdown umgestellt, das die eingeladenen Workspace-Mitglieder (Name + E-Mail) auflistet.

| Aspekt | Umsetzung |
|---|---|
| DB | Neue Spalte `responsible_user_id` (FK → `workspace_members`) neben bestehendem `responsible` (Freitext-Fallback) |
| API | `GET /api/members?workspaceId=…` liefert Mitgliederliste mit E-Mail für Dropdown |
| UI | Dropdown in LopTableRow, LopItemDialog und AddLopItemForm |
| Fallback | Bestehende Freitext-Einträge ohne `responsible_user_id` bleiben lesbar angezeigt |

### Täglicher E-Mail-Digest

| Aspekt | Umsetzung |
|---|---|
| Auslöser | Vercel Cron Job, täglich um z. B. 07:00 Uhr (`/api/cron/daily-digest`) |
| Inhalt | Alle eigenen offenen (`offen` + `in_bearbeitung`) LOP-Punkte des Empfängers über alle Projekte, sortiert nach Fälligkeit |
| Format | HTML-E-Mail via Resend: Titel, Status, Fälligkeitsdatum, Direktlink zur Projektseite |
| Opt-out | Einstellung im Settings-Tab „Benachrichtigungen" pro Workspace (Standard: ein) |
| Voraussetzung | `RESEND_API_KEY` muss gesetzt sein |

### Direktlink in der E-Mail

Jeder LOP-Punkt enthält einen Link der Form `https://autotodo.app/projects/[id]`, der direkt zur Projektseite mit der entsprechenden LOP-Liste führt.

---

## Public API & Webhooks

### REST API (implementiert ab M7)
Basis-URL: `https://autotodo.app/api/v1`
Authentifizierung: `Authorization: Bearer ak_live_...`

**Implementierte Endpunkte:**
- `GET/POST /api/v1/projects` – Projekte lesen/anlegen
- `GET/POST /api/v1/lop?projectId=…` – LOP-Punkte lesen/anlegen
- `POST /api/v1/transcripts` – Transkript per API hochladen

**API-Key-Verwaltung:** `/settings/api` – Keys erstellen (SHA-256-gehashed), Scopes (`read`/`write`), widerrufen. GET- und POST-Endpunkte prüfen Scope explizit.

**Webhooks (Phase 3):**

| Event | Beschreibung |
|---|---|
| `lop.item.created` | Neuer LOP-Punkt |
| `lop.item.updated` | Status oder Felder geändert |
| `lop.item.review_required` | KI-Vorschlag wartet auf Bestätigung |
| `transcript.processed` | Transkript-Verarbeitung abgeschlossen |

Delivery: 3 Retries (exponential backoff), HMAC-SHA256-Signatur

---

## Versionsverwaltung

### Versions-Badge (Landing Page)
Die Landing Page zeigt unten rechts ein fixiertes Badge mit der aktuellen Applikationsversion.

### Automatischer Versions-Bump
Bei jedem `git push` erhöht ein `pre-push` Git-Hook automatisch die Patch-Version in `package.json`:
- `scripts/bump-version.sh` – liest aktuelle Version, erhöht Patch-Zahl, committed mit `--no-verify`
- `scripts/install-hooks.sh` – einmalig nach dem Klonen ausführen
- Versionsformat: SemVer `MAJOR.MINOR.PATCH` (z.B. `0.1.31` → `0.1.32`)

---

## Datenbankschema (Multi-Tenant)

### Tabellen
- `workspaces` – Tenants/Organisationen
- `workspace_members` – Mitglieder mit Rollen
- `workspace_llm_config` – BYOK-Konfiguration (verschlüsselt, inkl. `endpoint` für Azure)
- `projects` – Projekte pro Workspace
- `transcripts` – Meeting-Transkripte (AES-256-GCM verschlüsselt in Supabase Storage, privater Bucket)
- `lop_items` – LOP-Punkte mit KI-Metadaten
- `lop_item_history` – Audit-Log
- `api_keys` – API-Keys (SHA-256-gehashed, RLS aktiv)
- `webhook_endpoints` – Webhook-Konfigurationen (Phase 3)
- `invitations` – Einladungs-Token (256-Bit-randomBytes, inkl. `project_id`)
- `project_members` – projektspezifische Mitgliedschaften
- `feedback` – Nutzer-Feedback & Feature-Wünsche

### Migrations
| Datei | Inhalt |
|---|---|
| `001_initial_schema.sql` | Grundschema aller Tabellen |
| `002_rls_policies.sql` | Row-Level Security Policies |
| `003_indexes.sql` | Performance-Indexes |
| `004_lop_extensions.sql` | KI-Metadaten-Felder, Audit-Log |
| `005_fix_rls_recursion.sql` | Behebt RLS-Rekursion in workspace_members |
| `006_llm_endpoint.sql` | `endpoint`-Spalte für Azure OpenAI in workspace_llm_config |
| `007_m7.sql` | `feedback`, `project_members`, `invitations.project_id`, api_keys RLS |

### RLS-Hinweis
Die `workspace_members`-Tabelle darf sich nicht selbst in einer Policy referenzieren (Rekursion). Policy lautet:
```sql
CREATE POLICY "workspace_members_read" ON workspace_members
  FOR SELECT USING (user_id = auth.uid());
```

---

## KI-Verarbeitungs-Pipeline

### Konfidenz-Schwellwerte

| Konfidenz | Verhalten |
|---|---|
| >= 0.85 | Automatisch angewendet |
| 0.70 – 0.84 | Angewendet, aber als „KI-Änderung" markiert |
| < 0.70 | `requires_review = true` → Review-Panel in UI |

### Fehlerbehandlung
- JSON-Parse-Fehler: 1 Retry mit expliziterem Prompt
- Timeout (>60s): Status → `error`, Retry-Button in der UI
- Rate Limit: Exponential backoff, max 3 Versuche

---

## Datensicherheit (TOMs gemäß Art. 32 DSGVO)

| Schicht | Maßnahme |
|---|---|
| Transport | TLS 1.3 + HSTS (max-age 1 Jahr) |
| Security Headers | X-Frame-Options: DENY, X-Content-Type-Options: nosniff, X-XSS-Protection, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy |
| Authentifizierung | Supabase Auth (bcrypt, Cost Factor 10), JWT mit Refresh-Token-Rotation |
| Autorisierung | Postgres RLS auf allen Tabellen |
| Transkripte | AES-256-GCM (AEAD, randomisierter IV, Fehlerbehandlung bei Entschlüsselung) |
| LLM-API-Keys | AES-256-GCM (Envelope Encryption) |
| API-Keys | SHA-256-gehashed (`lib/apiKeyAuth.ts`), Scope-Prüfung auf allen Endpunkten |
| Einladungs-Token | `randomBytes(32)` – 256-Bit-Entropie |
| Storage | `transcripts`-Bucket: privat, kein Public-URL-Zugriff |
| Input-Validierung | Zod auf allen API-Routes, UUID-Format-Prüfung auf Query-Parametern |
| Tenant-Isolation | `workspace_id` + RLS + Service-Role-Client serverseitig |
| Webhooks | HMAC-SHA256-Signatur (Phase 3) |
| Audit | `lop_item_history`-Tabelle für alle LOP-Änderungen |
| Pentesting | Statisches Code-Audit durchgeführt (März 2026), alle Findings behoben |

---

## Entwicklungsphasen

### Phase 1 – SaaS-Kern ✅ Abgeschlossen
- Supabase: Schema + RLS deployen (7 Migrations)
- Next.js 14 + TypeScript + Tailwind + shadcn/ui
- Middleware (Auth-Schutz + Workspace-Header)
- Supabase Auth: Registrierung, Login, Passwort-Reset, E-Mail-Bestätigung
- Registrierung 3-Schritt-Flow: Konto → Workspace → KI-Konfiguration (optional)
- AGB/Datenschutz-Zustimmungs-Checkbox bei Registrierung (Pflicht)
- Workspace-Erstellung bei Registrierung + Onboarding-Wizard
- Einladungs-Flow (256-Bit-Token, Resend-E-Mail optional)
- Projekt-CRUD inkl. Inline-Umbenennung des Projekttitels
- LOP-Tabelle (Inline-Edit, Status-Toggle, Filter nach Status/Priorität/Verantwortlichem)
- LOP-Detail-Dialog (Klick auf Titel öffnet vollständiges Edit-Popup)
- KI-Vorschläge Review-Panel (Inline-Edit, Annehmen, Ablehnen, Konfidenz-Badge)
- Transkript-Upload: Textarea (Copy & Paste) + Datei-Upload (.txt/.rtf)
- LLM-Verarbeitung synchron inline (Vercel-kompatibel): Anthropic, OpenAI, Azure OpenAI
- Retry-Button für hängende/fehlerhafte Transkripte
- XLSX-Export mit Workspace-Branding (Farbe + Name)
- Branding-Settings: Logo-Upload (Supabase Storage) + Akzentfarbe
- API-Key-Verwaltung UI + öffentliche REST API (`/api/v1/`) mit Scope-Prüfung
- Projektspezifische Mitgliedschaft (`project_members`-Tabelle)
- Feedback-Button (unten links, Kategorie-Auswahl, DB + GitHub `feedback.md`)
- „How to"-Popup in Navigation (6-Schritte-Tour mit UI-Mockups)
- Datensicherheits-Popup + AGB + Datenschutzerklärung + Impressum (vencly GmbH, § 5 TMG)
- Projekt-KPIs: offen / in Bearbeitung / abgeschlossen · % fertig · Ø Bearbeitungszeit
- Security Headers (HSTS, X-Frame-Options, nosniff, XSS-Protection, Referrer-Policy)
- Sicherheits-Audit + Härtung (decrypt-Error-Handling, 256-Bit-Token, Scope-Checks, UUID-Validierung)
- Vencly-Logo + Favicon (Gradient-V), Betreiber-Branding im Footer und Nav
- Einstellungen-Hub `/settings`: Konto (E-Mail/Passwort), Workspace, Team, KI, API-Keys
- Vercel-Deployment + Single-Domain-Fixes

### Phase 2 – SaaS-Features ✅ Abgeschlossen
- E-Mail-Digest (M7e): Tägliche Zusammenfassung offener LOP-Punkte je Verantwortlichem (Resend, Vercel Cron)
- Webhook-System (M8): Registrierung + Delivery + HMAC-SHA256-Signatur + Retry (3x, exponential backoff)
- Audit-Log UI (M8.4): Letzte 100 Änderungen mit Typ, Titel, Projekt, Zeitstempel
- Rollenverwaltung UI (M8.5): Rolle per Dropdown ändern, Mitglied entfernen
- Rechtliches & Compliance (M7b): AGB, Datenschutz, Impressum, AVV-PDF, Cookie-Banner, Consent-Timestamp

### Phase 3 – Wachstum (offen)
- Stripe-Billing (Free/Pro/Enterprise)
- Custom Domain (CNAME-Support)
- E-Mail-Benachrichtigungen (Fälligkeits-Reminder)
- Slack/Teams-Integration via Webhook
- SSO (SAML für Enterprise)

### Phase 4 – UX-Polish & Legal ✅ Teilweise abgeschlossen
- ✅ Mehrsprachigkeit DE/EN via `next-intl` (cookie-basiert, kein URL-Routing)
- ✅ Dashboard Statistik-Karten (offen, überfällig, erledigt, gesamt)
- ✅ WorkspaceNav: Icons + Mobile Hamburger-Menu
- ✅ LOP-Tabelle: überfällige Daten rot + Warnsymbol; erledigte Items ausgegraut + nach unten sortiert
- ✅ Skeleton-Screens für Dashboard + Projektseite
- ✅ Impressum, AVV-PDF, Cookie-Consent, AGB, Datenschutz
- 🔲 Landing Page: Hero-Illustration, Feature-Screenshots, erweiterte Pricing-Tabelle
- 🔲 Dark Mode

---

## Kostenschätzung

### Infrastruktur (fix, monatlich)
| Dienst | Kosten |
|---|---|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Resend | $0–20 |
| **Gesamt** | **$45–65/Monat** |

### Variable KI-Kosten (BYOK: entfallen für Betreiber)
- Free-Tier Fallback: ~$0.001/Transkript (Haiku)
- Zahlendes Tier: 0 variable KI-Kosten für Betreiber

### Pricing
| Tier | Preis | BYOK erforderlich? |
|---|---|---|
| Free | $0 | Nein (Fallback-Key) |
| Starter | $19/Monat | Ja |
| Pro | $49/Monat | Ja |
| Enterprise | ab $199/Monat | Ja |

**Break-even:** ~3 zahlende Starter-Kunden

---

*Dieser Brief wird aktualisiert, wenn Ergänzungen oder Korrekturen an der Spezifikation vorgenommen werden.*
