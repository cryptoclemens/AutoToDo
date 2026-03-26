# AutoToDo – Projektbrief

**Version:** 2.1 (BYOK-Edition) | Stand: März 2026
**Stack:** Next.js 14 · Supabase · Vercel · Claude API (BYOK) · Stripe
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
  └── AutoToDo-API-Keys (für Webhook/API-Zugang)
```

### Subdomain-Routing

Jeder Workspace bekommt eine Subdomain:
- `acme-consulting.autotodo.app`
- `bowa-geothermie.autotodo.app`

Technisch: Vercel Wildcard Domain (`*.autotodo.app`) + Next.js Middleware

Phase 2: Custom Domain (`lop.bowa-geothermie.de`) via CNAME-Eintrag

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
Landing Page → Registrierung (Name, E-Mail, Passwort, Workspace-Name, Subdomain)
→ E-Mail-Bestätigung (Supabase Auth)
→ Redirect zu [workspace].autotodo.app/onboarding
```

### Onboarding-Wizard (3 Schritte)
1. **Workspace einrichten** – Name, Logo (optional), Akzentfarbe
2. **Erstes Projekt anlegen** – Name, Beschreibung, optionales Transkript
3. **Team einladen** – E-Mail-Adressen, Rolle

### Einladungs-Flow
```
Einladungs-E-Mail (Resend) → /invite/[token] → Registrierung/Login
→ Automatische Workspace-Mitgliedschaft → Redirect zu Dashboard
```

---

## Custom Branding

| Element | Beschreibung |
|---|---|
| Logo | Topnav (ersetzt AutoToDo-Logo) |
| Akzentfarbe | Buttons, Badges, Highlights (CSS Custom Property `--brand`) |
| Workspace-Name | Navigation, E-Mails, Exports |
| E-Mail-Absender-Name | "Acme Consulting via AutoToDo" |

XLSX-Exports enthalten Workspace-Name und Logo in der Kopfzeile.

---

## LLM-Konfiguration: Bring Your Own Key (BYOK)

### Unterstützte Provider

| Provider | Modell(e) | Status |
|---|---|---|
| Anthropic | claude-sonnet-4, claude-haiku-4 | MVP |
| OpenAI | gpt-4o, gpt-4o-mini | MVP |
| Google | gemini-1.5-pro, gemini-1.5-flash | Phase 2 |
| Mistral | mistral-large, mistral-small | Phase 2 |
| Ollama (lokal) | llama3, mistral, ... | Phase 3 |

### Sicherheit
- API-Keys werden AES-256-GCM verschlüsselt gespeichert (Envelope Encryption)
- Kein direkter Client-Zugriff – ausschließlich über Server-Side API Routes
- Kein Logging des entschlüsselten Keys

### Fallback-Strategie
- Free-Tier: Optionaler Betreiber-Fallback-Key (Haiku), max. 10 Transkripte/Monat
- Ab Starter-Tier: BYOK verpflichtend

---

## Public API & Webhooks

### REST API
Basis-URL: `https://api.autotodo.app/v1`
Authentifizierung: `Authorization: Bearer ak_live_...`

**Endpunkte:**
- `GET/POST /projects`
- `GET/POST /projects/{id}/lop`
- `PATCH/DELETE /lop/{id}`
- `POST /projects/{id}/transcripts`
- `GET /projects/{id}/export`

### Webhooks

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
Die Landing Page zeigt unten rechts ein fixiertes Badge mit der aktuellen Applikationsversion (aus `package.json`).

### Automatischer Versions-Bump
Bei jedem `git push` erhöht ein `pre-push` Git-Hook automatisch die Patch-Version in `package.json` und erstellt einen Commit:
- `scripts/bump-version.sh` – liest aktuelle Version, erhöht Patch-Zahl, schreibt `package.json`, committed mit `--no-verify`
- `scripts/install-hooks.sh` – einmalig nach dem Klonen ausführen, um den Hook zu installieren
- Versionsformat: SemVer `MAJOR.MINOR.PATCH` (z.B. `0.1.0` → `0.1.1`)

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
- `api_keys` – API-Keys (bcrypt-gehashed)
- `webhook_endpoints` – Webhook-Konfigurationen
- `invitations` – Einladungs-Tokens

### Sicherheit
- Row-Level Security auf allen Tabellen
- workspace_id als Isolationsschlüssel in jeder Query
- Kein Cross-Tenant-Datenzugriff technisch möglich

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
| API-Keys | bcrypt-gehashed |
| Webhooks | HMAC-SHA256 |
| Input-Validierung | Zod auf allen API Routes |
| Rate Limiting | Vercel Edge Middleware |
| Tenant-Isolation | workspace_id + RLS |

---

## Entwicklungsphasen

### Phase 1 – SaaS-Kern (4–5 Wochen)
- Supabase: Schema + RLS deployen
- Next.js 14 + TypeScript + Tailwind + shadcn/ui
- Subdomain-Routing (Middleware)
- Supabase Auth: Registrierung, Login, Passwort-Reset
- Workspace-Erstellung bei Registrierung
- Onboarding-Wizard (3 Schritte)
- Einladungs-Flow (Token-basiert, Resend)
- Projekt-CRUD
- LOP-Tabelle (Inline-Edit, Status-Toggle, Filter)
- Transkript-Upload + Verschlüsselung + LLM-Verarbeitung
- KI-Vorschläge Review-Flow
- XLSX-Export (ohne Branding)
- Basis-Branding (Akzentfarbe)

### Phase 2 – SaaS-Features (2–3 Wochen)
- Custom Branding (Logo-Upload, vollständiges CSS-System)
- XLSX-Export mit Workspace-Branding
- API-Key-Verwaltung (UI + Validierung)
- Öffentliche REST API
- Webhook-System (Registrierung + Delivery + Retry)
- Audit-Log UI
- Rollenverwaltung (granulare Berechtigungen)

### Phase 3 – Wachstum (optional)
- Stripe-Billing (Free/Pro/Enterprise)
- Custom Domain (CNAME-Support)
- E-Mail-Benachrichtigungen (Fälligkeits-Reminder)
- Slack/Teams-Integration via Webhook
- Mehrsprachigkeit (DE/EN)
- SSO (SAML für Enterprise)

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

*Dieser Brief wird automatisch aktualisiert, wenn Ergänzungen oder Korrekturen an der Spezifikation vorgenommen werden.*
