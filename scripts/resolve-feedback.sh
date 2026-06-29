#!/usr/bin/env bash
# resolve-feedback.sh – Setzt den Status eines Feedback-Eintrags in DB UND prüft feedback.md.
#
# Der kanonische Erledigungs-Workflow (siehe CLAUDE.md → "Feedback erledigen"):
#   1. In feedback.md die Überschrift des Eintrags um den Status ergänzen
#      ("| Status: bearbeitet" bzw. "| Status: gestrichen") und eine "**Lösung:** …"-Zeile anhängen.
#   2. Dieses Skript aufrufen → setzt den DB-Status sofort (ohne Deploy abzuwarten).
#
# Verwendung:
#   bash scripts/resolve-feedback.sh F-029            # → status done
#   bash scripts/resolve-feedback.sh B-009 done
#   bash scripts/resolve-feedback.sh F-002 rejected   # gestrichen
#
# DB-Zugriff erfolgt über den lokalen Supabase-Docker-Container (kein Cloud-Dashboard).

set -euo pipefail

ID_RAW="${1:-}"
STATUS="${2:-done}"

if [[ -z "$ID_RAW" ]]; then
  echo "Verwendung: bash scripts/resolve-feedback.sh <F-029|B-009|G-001> [done|rejected]" >&2
  exit 1
fi

# ID parsen: Prefix (F/B/G) + Nummer → category + category_seq
ID="${ID_RAW^^}"
PREFIX="${ID:0:1}"
SEQ="$(echo "$ID" | sed -E 's/^[FBG]-?0*([0-9]+)$/\1/')"

case "$PREFIX" in
  F) CATEGORY="feature" ;;
  B) CATEGORY="bug" ;;
  G) CATEGORY="general" ;;
  *) echo "Unbekanntes Präfix '$PREFIX' – erwartet F, B oder G." >&2; exit 1 ;;
esac

if ! [[ "$SEQ" =~ ^[0-9]+$ ]]; then
  echo "Konnte keine Nummer aus '$ID_RAW' lesen (Format z.B. F-029)." >&2
  exit 1
fi

if [[ "$STATUS" != "done" && "$STATUS" != "rejected" ]]; then
  echo "Status muss 'done' oder 'rejected' sein (war: '$STATUS')." >&2
  exit 1
fi

# Warnen, wenn feedback.md den Eintrag NICHT als erledigt/gestrichen führt – beide Orte sollen synchron sein.
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$(dirname "$0")/..")"
MD="$REPO_ROOT/feedback.md"
if [[ -f "$MD" ]]; then
  HEADING="$(grep -E "^## ${PREFIX}-0*${SEQ}\b" "$MD" || true)"
  if [[ -z "$HEADING" ]]; then
    echo "⚠️  Hinweis: Keine Überschrift '## ${ID}' in feedback.md gefunden." >&2
  elif ! echo "$HEADING" | grep -qiE "bearbeitet|erledigt|gestrichen|abgelehnt"; then
    echo "⚠️  Hinweis: '${ID}' steht in feedback.md noch OHNE Erledigt-Status." >&2
    echo "    Bitte Überschrift um '| Status: bearbeitet' ergänzen, damit DB und feedback.md übereinstimmen." >&2
  fi
fi

echo "Setze ${ID} (${CATEGORY} #${SEQ}) → ${STATUS} …"
docker exec -i supabase-db psql -U postgres -d postgres -P pager=off -v ON_ERROR_STOP=1 <<SQL
UPDATE feedback SET status='${STATUS}'
WHERE category='${CATEGORY}' AND category_seq=${SEQ}
RETURNING category, category_seq, status;
SQL
