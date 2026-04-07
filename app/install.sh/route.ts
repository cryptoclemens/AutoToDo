import { NextResponse } from 'next/server'

const SCRIPT = `#!/bin/bash
set -e

echo ""
echo "  AutoToDo Desktop – Installer"
echo "  ────────────────────────────"
echo ""

# Prüfen ob macOS
if [ "$(uname)" != "Darwin" ]; then
  echo "Fehler: Dieses Script ist nur für macOS."
  exit 1
fi

# Prüfen ob Apple Silicon
ARCH=$(uname -m)
if [ "$ARCH" != "arm64" ]; then
  echo "Hinweis: Dieses Paket ist für Apple Silicon (M1/M2/M3)."
  echo "Auf Intel-Macs wird die App über Rosetta ausgeführt."
fi

TMP_DMG=$(mktemp /tmp/AutoToDo-XXXXXX.dmg)
MOUNT_DIR=$(mktemp -d /tmp/AutoToDo-mount-XXXXXX)

cleanup() {
  hdiutil detach "$MOUNT_DIR" -quiet 2>/dev/null || true
  rm -f "$TMP_DMG"
  rmdir "$MOUNT_DIR" 2>/dev/null || true
}
trap cleanup EXIT

echo "  → Lade AutoToDo Desktop herunter..."
curl -fsSL "https://autotodo.vencly.com/api/desktop/download?type=mac" -o "$TMP_DMG"

echo "  → Öffne Disk Image..."
hdiutil attach "$TMP_DMG" -mountpoint "$MOUNT_DIR" -quiet -nobrowse

APP=$(find "$MOUNT_DIR" -name "*.app" -maxdepth 2 | head -1)
if [ -z "$APP" ]; then
  echo "Fehler: Keine .app im Disk Image gefunden."
  exit 1
fi

APP_NAME=$(basename "$APP")
DEST="/Applications/$APP_NAME"

echo "  → Installiere $APP_NAME..."
if [ -d "$DEST" ]; then
  rm -rf "$DEST"
fi
cp -R "$APP" "$DEST"

echo "  → Entferne Quarantäne-Flag (xattr)..."
xattr -cr "$DEST"

echo ""
echo "  ✓ $APP_NAME wurde installiert."
echo "  Du findest die App in /Applications oder im Launchpad."
echo ""
`

export async function GET() {
  return new NextResponse(SCRIPT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
    },
  })
}
