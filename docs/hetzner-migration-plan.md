# Migrationsplan: Vercel + Supabase Cloud → Hetzner CX32 + Self-hosted Supabase

**Erstellt:** März 2026
**Ziel:** AutoToDo (+ 2–3 weitere Projekte) vollständig auf Hetzner CX32 betreiben, mit Supabase Cloud als warm standby für schnellen Fallback.
**RTO (Recovery Time Objective):** ~10 Minuten
**RPO (Recovery Point Objective):** ~1 Stunde (stündliche Backups)

---

## Architekturübersicht

```
NORMAL (Self-hosted):

  Hetzner CX32 (8 GB RAM, 4 vCPU, ~€9/mo)
  ┌─────────────────────────────────────────────────────┐
  │  Coolify (Control Plane + Reverse Proxy Traefik)    │
  │                                                     │
  │  ┌─────────────────┐  ┌──────────────────────────┐  │
  │  │  AutoToDo        │  │  Self-hosted Supabase    │  │
  │  │  (Next.js)       │  │  ┌──────────────────┐   │  │
  │  │  ~500 MB         │  │  │ PostgreSQL        │   │  │
  │  ├─────────────────┤  │  │ GoTrue (Auth)    │   │  │
  │  │  Projekt B       │  │  │ PostgREST        │   │  │
  │  │  ~400 MB         │  │  │ Storage (MinIO)  │   │  │
  │  ├─────────────────┤  │  │ Kong Gateway     │   │  │
  │  │  Projekt C       │  │  └──────────────────┘   │  │
  │  │  ~400 MB         │  │  ~2.5 GB RAM             │  │
  │  └─────────────────┘  └──────────────────────────┘  │
  │                                                     │
  │  RAM-Nutzung: ~4.3 GB / 8 GB  ✅ ausreichend Puffer │
  └─────────────────────────────────────────────────────┘
         │ stündlicher pg_dump → restore
         ▼
  Supabase Cloud (lgnlviezjdvxgmknmfog.supabase.co)
  [WARM STANDBY — immer aktuell, bereit zur Aktivierung]


FALLBACK (env var wechseln + redeploy, ~10 Min):

  App zeigt auf Supabase Cloud statt self-hosted.
  Kein Code-Change nötig — nur 3 ENV-Vars.
```

---

## Hardware-Dimensionierung CX32

| Komponente | RAM | Storage |
|---|---|---|
| Self-hosted Supabase | ~2.5 GB | ~10 GB |
| AutoToDo (Next.js) | ~500 MB | ~1 GB |
| Projekt B | ~400 MB | ~1 GB |
| Projekt C | ~400 MB | ~1 GB |
| Coolify + Traefik | ~400 MB | ~2 GB |
| OS + Reserve | ~500 MB | ~5 GB |
| **Gesamt** | **~4.7 GB / 8 GB** | **~20 GB / 80 GB** |

CX32 (4 vCPU, 8 GB RAM, 80 GB NVMe) ist für dieses Setup ausreichend dimensioniert.
Bei mehr als 3 Projekten → CX42 (16 GB RAM) empfohlen.

---

## Phase 0 — Vorbereitung (kein Downtime, ~2 h)

### 0.1 Hetzner-Server bereitstellen

```bash
# Im Hetzner Cloud Console:
# - CX32 (Ubuntu 24.04 LTS)
# - Standort: Nürnberg oder Falkenstein (DSGVO-konform)
# - SSH-Key hinterlegen
# - Firewall: Port 22, 80, 443 freigeben

# Server absichern
ssh root@<server-ip>
apt update && apt upgrade -y
adduser deploy
usermod -aG sudo deploy
# SSH-Key für deploy-User einrichten, root-Login deaktivieren
```

### 0.2 Coolify installieren

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
# Nach Installation: https://<server-ip>:8000 aufrufen
# Admin-Account erstellen
# Domain für Coolify-Dashboard einrichten (optional)
```

### 0.3 DNS vorbereiten

Im DNS-Provider (z.B. Cloudflare):
```
# Neuen A-Record anlegen (noch NICHT auf neue IP zeigen)
autotodo.vencly.com     A  <alte-vercel-ip>   TTL: 300  ← noch alt
api.autotodo.vencly.com A  <alte-vercel-ip>   TTL: 300

# TTL auf 5 Minuten senken — 24h vor Cutover
# Damit DNS-Wechsel beim Cutover schnell wirkt
```

### 0.4 `next.config.mjs` anpassen (einzige Code-Änderung)

```js
// next.config.mjs
const nextConfig = {
  output: 'standalone',  // ← Pflicht für Docker-Deployment
  // ...rest bleibt identisch
}
```

```bash
# sharp für Bildoptimierung in dependencies (nicht devDependencies)
npm install sharp
```

---

## Phase 1 — Self-hosted Supabase einrichten (~2 h)

### 1.1 Supabase Docker Compose deployen

Coolify unterstützt Docker Compose nativ. Im Coolify-Dashboard:

```
New Resource → Docker Compose → Repository/URL
→ https://github.com/supabase/supabase (docker-compose.yml aus /docker/)
```

Oder manuell auf dem Server:

```bash
git clone --depth 1 https://github.com/supabase/supabase.git
cd supabase/docker

# .env aus Vorlage erstellen
cp .env.example .env
```

### 1.2 Supabase `.env` konfigurieren

```bash
# Kritische Werte generieren und setzen:

# Postgres-Passwort (neu generieren)
POSTGRES_PASSWORD=$(openssl rand -hex 32)

# JWT Secret (MUSS identisch mit Supabase Cloud sein für Auth-Kompatibilität)
# Den aktuellen Wert aus Supabase Cloud holen:
# Supabase Dashboard → Project Settings → API → JWT Secret
JWT_SECRET=<aus-supabase-cloud-kopieren>

# Anon + Service Role Keys ebenfalls aus Supabase Cloud übernehmen
# ODER neu generieren (dann müssen alle Apps aktualisiert werden)
ANON_KEY=<aus-supabase-cloud>
SERVICE_ROLE_KEY=<aus-supabase-cloud>

# Site URL für Auth-Redirects
SITE_URL=https://autotodo.vencly.com
ADDITIONAL_REDIRECT_URLS=https://autotodo.vencly.com/auth/callback

# SMTP für Auth-Emails (Resend SMTP-Bridge oder direkter SMTP)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=<RESEND_API_KEY>
SMTP_SENDER_NAME=AutoToDo
```

### 1.3 Storage-Backend: MinIO oder lokaler Disk

Supabase Storage kann entweder auf dem lokalen Disk oder mit S3-kompatiblem MinIO laufen.

**Empfehlung für Einfachheit: lokaler Disk** (reicht für < 10 GB)

```bash
# In supabase/docker/docker-compose.yml bereits vorkonfiguriert
# Storage läuft auf lokalem Volume: ./volumes/storage
```

Für Hetzner Object Storage als S3-Backend (optional, mehr Redundanz):
```bash
STORAGE_BACKEND=s3
GLOBAL_S3_BUCKET=autotodo-storage
GLOBAL_S3_ENDPOINT=https://fsn1.your-objectstorage.com
GLOBAL_S3_FORCE_PATH_STYLE=true
AWS_ACCESS_KEY_ID=<hetzner-object-storage-key>
AWS_SECRET_ACCESS_KEY=<hetzner-object-storage-secret>
```

### 1.4 Supabase starten und Zugang prüfen

```bash
docker compose up -d
docker compose ps  # alle Services healthy?

# Studio erreichbar unter http://<server-ip>:3000
# API erreichbar unter http://<server-ip>:8000
```

In Coolify: Traefik-Route für Supabase einrichten:
```
db.autotodo.vencly.com    → Port 8000 (Kong API Gateway)
studio.autotodo.vencly.com → Port 3000 (Supabase Studio)
```

---

## Phase 2 — Datenmigration (~1 h)

### 2.1 Schema + Daten aus Supabase Cloud exportieren

```bash
# Verbindungsdaten aus Supabase Cloud Dashboard:
# Project Settings → Database → Connection string

# Vollständiger Export (Schema + Daten + RLS-Policies)
pg_dump \
  --no-owner \
  --no-acl \
  --schema=public \
  --schema=auth \
  "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres" \
  > supabase_export_$(date +%Y%m%d_%H%M).sql
```

### 2.2 In self-hosted Supabase importieren

```bash
# Verbindung zum self-hosted Postgres (via Docker)
docker exec -it supabase-db psql -U postgres

# Import (public schema)
psql \
  "postgresql://postgres:<POSTGRES_PASSWORD>@localhost:5432/postgres" \
  < supabase_export_*.sql
```

### 2.3 Storage-Dateien migrieren

```bash
# Logos und Transcripts aus Supabase Storage herunterladen
# Mit Supabase CLI:
supabase db pull  # Schema
npx supabase storage cp --recursive ss:///logos ./backup/logos
npx supabase storage cp --recursive ss:///transcripts ./backup/transcripts

# In self-hosted Storage hochladen
# (Storage API unter http://localhost:8000/storage/v1)
# Skript: für jeden Bucket alle Dateien via API hochladen
```

### 2.4 Migrationsprüfung

```bash
# Zeilenanzahl vergleichen
psql supabase-cloud -c "SELECT COUNT(*) FROM lop_items;"
psql supabase-self-hosted -c "SELECT COUNT(*) FROM lop_items;"

# Auth-User vergleichen
psql supabase-cloud -c "SELECT COUNT(*) FROM auth.users;"
psql supabase-self-hosted -c "SELECT COUNT(*) FROM auth.users;"
```

---

## Phase 3 — App auf Coolify deployen (~1 h)

### 3.1 AutoToDo in Coolify anlegen

```
Coolify → New Resource → Application → Git Repository
Branch: main (oder claude/github-automated-access-WVPL6)
Build: Nixpacks oder Dockerfile
Port: 3000
```

### 3.2 Environment Variables in Coolify setzen

**WICHTIG: `NEXT_PUBLIC_*` als Build-Time UND Runtime markieren**

```bash
# Supabase → auf self-hosted zeigen
NEXT_PUBLIC_SUPABASE_URL=https://db.autotodo.vencly.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# App
NEXT_PUBLIC_APP_URL=https://autotodo.vencly.com
ENCRYPTION_SECRET=<64-hex-chars>

# Mollie
MOLLIE_API_KEY=live_xxx

# Resend
RESEND_API_KEY=re_xxx
RESEND_FROM=AutoToDo <noreply@vencly.app>

# Cron
CRON_SECRET=<random-secret>
```

### 3.3 Traefik-Konfiguration: Timeout für LLM-Verarbeitung

```yaml
# In Coolify → Server → Proxy-Konfiguration:
http:
  middlewares:
    long-timeout:
      headers:
        customResponseHeaders:
          X-Timeout: "120s"
  routers:
    autotodo:
      rule: "Host(`autotodo.vencly.com`)"
      middlewares:
        - long-timeout
```

Oder direkt im Traefik-Label der App:
```yaml
traefik.http.middlewares.timeout.headers.customrequestheaders.X-Timeout: 120s
```

### 3.4 Scheduled Task für Daily Digest

```
Coolify → Server → Scheduled Tasks → New Task
Name:     daily-digest
URL:      https://autotodo.vencly.com/api/cron/daily-digest
Method:   GET
Schedule: 0 16 * * 1-5   (Mo–Fr, 16:00 UTC)
Header:   Authorization: Bearer <CRON_SECRET>
```

---

## Phase 4 — Cutover (Produktivschaltung, ~15 Min Downtime)

```
Zeitplan:
19:00 Uhr (außerhalb Geschäftszeiten empfohlen)

19:00  Vercel: App auf Wartungsseite schalten (optional)
19:01  Finaler pg_dump von Supabase Cloud
19:05  Import in self-hosted Supabase
19:08  DNS-A-Records auf Hetzner-IP umstellen
       (TTL war auf 5 Min gesenkt → wirkt in <5 Min)
19:10  SSL-Zertifikat von Traefik/Let's Encrypt automatisch ausgestellt
19:12  Smoke-Test: Login, LOP erstellen, Transkript hochladen
19:15  ✅ Go-live

Gesamte Downtime: ~12–15 Minuten
```

---

## Phase 5 — Fallback-Absicherung (WICHTIG)

### 5.1 Stündlicher Sync: Self-hosted → Supabase Cloud

Damit Supabase Cloud jederzeit als Fallback aktiviert werden kann, muss es aktuell gehalten werden.

```bash
# Skript: /opt/scripts/sync-to-supabase-cloud.sh
#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M)
BACKUP_DIR=/opt/backups

# Dump von self-hosted
docker exec supabase-db pg_dump \
  -U postgres \
  --no-owner \
  --schema=public \
  "postgres" \
  > $BACKUP_DIR/sync_$TIMESTAMP.sql

# Restore in Supabase Cloud (nur public schema)
psql \
  "postgresql://postgres:<cloud-password>@db.<project-ref>.supabase.co:5432/postgres" \
  < $BACKUP_DIR/sync_$TIMESTAMP.sql

# Alte Backups löschen (>24h)
find $BACKUP_DIR -name "sync_*.sql" -mtime +1 -delete

echo "Sync completed: $TIMESTAMP"
```

```bash
# Als Coolify Scheduled Task oder systemd timer:
# Schedule: 0 * * * *  (jede volle Stunde)
```

### 5.2 Fallback-Prozedur (10 Minuten)

Bei Ausfall oder Überlastung des self-hosted Supabase:

```bash
# Schritt 1: In Coolify → AutoToDo → Environment Variables:
NEXT_PUBLIC_SUPABASE_URL=https://lgnlviezjdvxgmknmfog.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<original-cloud-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<original-cloud-service-role-key>

# Schritt 2: Redeploy auslösen (Coolify → Deploy)
# Dauer: ~3–5 Minuten Build + Start

# Schritt 3: Rauch-Test
# → Supabase Cloud ist seit letztem stündlichen Sync aktuell (max. 1h Datenverlust)
```

### 5.3 Monitoring & Alerting

```yaml
# Coolify hat eingebautes Health-Monitoring.
# Zusätzlich empfohlen: Uptime Kuma (kostenlos, selbst gehostet)

# Als Coolify-Service deployen:
# Image: louislam/uptime-kuma:1
# Port: 3001

# Monitore einrichten:
# - Self-hosted Supabase API: https://db.autotodo.vencly.com/rest/v1/ (alle 60s)
# - AutoToDo App: https://autotodo.vencly.com (alle 60s)
# - Supabase Studio: https://studio.autotodo.vencly.com (alle 5 Min)
# - Alert via E-Mail (Resend) oder Telegram bei Ausfall
```

---

## Kostenvergleich

| Setup | Monatlich |
|---|---|
| Vercel Pro + Supabase Cloud Free | ~$20 |
| Vercel Hobby + Supabase Cloud Pro | ~$25 |
| **Hetzner CX32 (alles selbst)** | **~€9** |
| Hetzner CX32 + Supabase Cloud als Fallback (Free) | ~€9 |
| Hetzner Object Storage (optional, für Storage-Backups) | +€3 |

**Jährliche Ersparnis: ~€130–190 gegenüber Vercel Pro.**

---

## Risikoabschätzung

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|---|---|---|---|
| Self-hosted Supabase OOM | Niedrig (CX32 hat Puffer) | Hoch | Fallback auf Cloud (<10 Min) |
| Datenverlust beim Cutover | Sehr niedrig | Hoch | Finaler pg_dump direkt vor Cutover |
| Supabase-Update bricht Setup | Mittel | Mittel | Pinned Docker Images, kein Auto-Update |
| Hetzner-Ausfall | Sehr niedrig | Hoch | Supabase Cloud als Fallback |
| Let's Encrypt SSL-Ausstellung schlägt fehl | Niedrig | Mittel | HTTP-Fallback kurzfristig, DNS-Challenge als Alternative |
| `NEXT_PUBLIC_*` nicht als Build-Time gesetzt | Mittel bei Vergessen | Hoch | Coolify-Checkliste, siehe Phase 3 |

---

## Checkliste vor Go-live

- [ ] `output: 'standalone'` in `next.config.mjs` gesetzt
- [ ] `sharp` in `dependencies` (nicht `devDependencies`)
- [ ] Alle `NEXT_PUBLIC_*` als **Build-Time + Runtime** in Coolify markiert
- [ ] JWT_SECRET identisch zwischen self-hosted und Cloud
- [ ] Datenmigration verifiziert (Zeilenzahlen stimmen überein)
- [ ] Storage-Dateien (logos, transcripts) migriert
- [ ] Auth-Callback-URL in self-hosted GoTrue gesetzt
- [ ] Traefik-Timeout >= 120s gesetzt
- [ ] Daily-Digest Scheduled Task aktiv
- [ ] Sync-Script läuft (stündlich, verifiziert)
- [ ] Mollie Webhook-URL auf neue Domain aktualisiert
- [ ] DNS TTL mindestens 24h vor Cutover auf 5 Min gesenkt
- [ ] Uptime Kuma eingerichtet und alertet
- [ ] Fallback-Prozedur einmal getestet (Test-Umgebung)

---

## Offene Entscheidungen

1. **Storage-Backend:** Lokaler Disk (einfach) vs. Hetzner Object Storage (S3, redundant) — empfohlen: Object Storage für Transcripts (privat, verschlüsselt, ~€3/mo extra)

2. **Supabase-Version pinnen:** `docker compose` auf feste Tag-Version setzen (z.B. `supabase/postgres:15.1.0.117`), kein `latest`, um unerwartete Updates zu vermeiden

3. **Weitere Projekte:** Wenn Projekt B/C ebenfalls Supabase nutzen — gleiche self-hosted Instanz verwenden (separate Schemas oder separate Projekte via Supabase Studio), spart RAM erheblich
