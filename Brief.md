# AutoToDo – Projektbrief

**Version:** 2.5 (Phase-2-Edition) | Stand: März 2026
**Stack:** Next.js 14 · Supabase · Vercel · Claude API (BYOK) · Stripe (geplant)
**Modell:** Multi-Tenant SaaS, Shared DB mit RLS-Isolation, Bring Your Own Key (LLM)

---

## Produktvision

AutoToDo ist ein KI-gestütztes Projektmanagement-Tool für Teams, die regelmäßige Meetings abhalten und deren Ergebnisse strukturiert nachverfolgen wollen.

**Kernworkflow:**
Meeting-Transkript hochladen → KI extrahiert offene Punkte und Statusänderungen → LOP wird automatisch aktualisiert → manuell nachbearbeitbar → Export als XLSX

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
Landing Page → Registrierung (E-Mail, Passwort, Workspace-Name)
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

**Aktueller Status:** Einladungslinks werden generiert und angezeigt. Wenn `RESEND_API_KEY` als Umgebungsvariable gesetzt ist, werden Einladungs-E-Mails automatisch verschickt.

**Projektspezifische Mitgliedschaft:** Über `project_members`-Tabelle – Einladungen von der Projektseite tragen den Nutzer auch in `project_members` ein (nicht nur in `workspace_members`).

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

### Fallback-Strategie
- Free-Tier: Optionaler Betreiber-Fallback-Key (Haiku), max. 10 Transkripte/Monat
- Ab Starter-Tier: BYOK verpflichtend

---

## Public API & Webhooks

### REST API (implementiert ab M7)
Basis-URL: `https://autotodo.app/api/v1`
Authentifizierung: `Authorization: Bearer ak_live_...`

**Implementierte Endpunkte:**
- `GET/POST /api/v1/projects` – Projekte lesen/anlegen
- `GET/POST /api/v1/lop?projectId=…` – LOP-Punkte lesen/anlegen
- `POST /api/v1/transcripts` – Transkript per API hochladen

**API-Key-Verwaltung:** `/settings/api` – Keys erstellen (SHA-256-gehashed), Scopes (`read`/`write`), widerrufen.

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
- Versionsformat: SemVer `MAJOR.MINOR.PATCH` (z.B. `0.1.15` → `0.1.16`)

---

## Datenbankschema (Multi-Tenant)

### Tabellen
- `workspaces` – Tenants/Organisationen
- `workspace_members` – Mitglieder mit Rollen
- `workspace_llm_config` – BYOK-Konfiguration (verschlüsselt)
- `projects` – Projekte pro Workspace
- `transcripts` – Meeting-Transkripte (verschlüsselt in Supabase Storage)
- `lop_items` – LOP-Punkte mit KI-Metadaten
- `lop_item_history` – Audit-Log
- `api_keys` – API-Keys (SHA-256-gehashed)
- `webhook_endpoints` – Webhook-Konfigurationen (Phase 3)
- `invitations` – Einladungs-Tokens (inkl. `project_id`)
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
| 0.70 – 0.84 | Angewendet, aber als "KI-Änderung" markiert |
| < 0.70 | `requires_review = true` → gelber Vorschlag in UI |

### Fehlerbehandlung
- JSON-Parse-Fehler: 1 Retry mit expliziterem Prompt
- Timeout (>30s): Status → `error`, Nutzer-Toast mit Retry
- Rate Limit: Exponential backoff, max 3 Versuche

---

## Datensicherheit

| Schicht | Maßnahme |
|---|---|
| Transport | TLS 1.3 (Vercel) |
| Authentifizierung | Supabase Auth (JWT) |
| Autorisierung | Postgres RLS |
| Transkripte | AES-256-GCM |
| LLM-API-Keys | AES-256-GCM (Envelope Encryption) |
| API-Keys | SHA-256-gehashed (lib/apiKeyAuth.ts) |
| Webhooks | HMAC-SHA256 (Phase 2) |
| Input-Validierung | Zod auf allen API Routes |
| Tenant-Isolation | workspace_id + RLS + Service-Role-Client |

---

## Entwicklungsphasen

### Phase 1 – SaaS-Kern ✅ Abgeschlossen
- Supabase: Schema + RLS deployen (7 Migrations)
- Next.js 14 + TypeScript + Tailwind + shadcn/ui
- Middleware (Auth-Schutz + Workspace-Header)
- Supabase Auth: Registrierung, Login, Passwort-Reset, E-Mail-Bestätigung
- Workspace-Erstellung bei Registrierung + Onboarding-Wizard
- Einladungs-Flow (Token-basiert, Resend-E-Mail optional)
- Projekt-CRUD inkl. Inline-Umbenennung des Projekttitels
- LOP-Tabelle (Inline-Edit, Status-Toggle, Filter nach Status/Priorität/Verantwortlichem)
- LOP-Detail-Dialog (Klick auf Titel öffnet vollständiges Edit-Popup)
- Transkript-Upload: Textarea (Copy & Paste) + Datei-Upload (.txt/.rtf)
- LLM-Verarbeitung: Anthropic, OpenAI, Azure OpenAI (Microsoft Copilot)
- KI-Vorschläge Review-Flow
- XLSX-Export mit Workspace-Branding (Farbe + Name)
- Branding-Settings: Logo-Upload (Supabase Storage) + Akzentfarbe
- API-Key-Verwaltung UI + öffentliche REST API (`/api/v1/`)
- Projektspezifische Mitgliedschaft (`project_members`-Tabelle)
- Feedback-Button (unten links, Kategorie-Auswahl, in DB gespeichert)
- „How to"-Popup in Navigation (6-Schritte-Tour)
- Vercel-Deployment + Single-Domain-Fixes

### Phase 2 – SaaS-Features (nächste Schritte)
- Webhook-System (Registrierung + Delivery + HMAC-SHA256-Signatur + Retry)
- Audit-Log UI
- Rollenverwaltung UI
- Subdomain-Routing (`[slug].autotodo.app`)

### Phase 3 – Wachstum (optional)
- Stripe-Billing (Free/Pro/Enterprise)
- Custom Domain (CNAME-Support)
- E-Mail-Benachrichtigungen (Fälligkeits-Reminder)
- Slack/Teams-Integration via Webhook
- Mehrsprachigkeit (DE/EN)
- SSO (SAML für Enterprise)

### Phase 4 – UX-Polish & Legal
- Landing Page: Hero, Features, Pricing
- App-Layout: Sidebar, Mobile-Ansicht, Dark Mode
- Dashboard: Statistik-Karten
- LOP-Tabelle: visuelles Redesign
- Impressum, Datenschutzerklärung, Cookie-Consent

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
