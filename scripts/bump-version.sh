#!/usr/bin/env bash
# bump-version.sh – Erhöht die Patch-Version in package.json automatisch
# Verwendung: bash scripts/bump-version.sh
# Wird vom pre-push Git-Hook aufgerufen.

set -e

PACKAGE_JSON="$(git rev-parse --show-toplevel)/package.json"

# Aktuelle Version auslesen
CURRENT=$(node -p "require('${PACKAGE_JSON}').version")

# Patch-Version erhöhen (z.B. 0.4.1 → 0.4.2)
NEW=$(node -e "
  const [major, minor, patch] = '${CURRENT}'.split('.').map(Number);
  console.log(major + '.' + minor + '.' + (patch + 1));
")

# package.json aktualisieren
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('${PACKAGE_JSON}', 'utf8'));
  pkg.version = '${NEW}';
  fs.writeFileSync('${PACKAGE_JSON}', JSON.stringify(pkg, null, 2) + '\n');
"

echo "Version bumped: ${CURRENT} → ${NEW}"

# Commit erstellen (ohne Hook-Loop)
git add "${PACKAGE_JSON}"
git commit --no-verify -m "chore: bump version to ${NEW}"
