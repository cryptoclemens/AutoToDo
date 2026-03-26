#!/usr/bin/env bash
# install-hooks.sh – Installiert Git-Hooks für das Projekt
# Einmalig ausführen nach dem Klonen: bash scripts/install-hooks.sh

set -e

HOOKS_DIR="$(git rev-parse --show-toplevel)/.git/hooks"
SCRIPTS_DIR="$(git rev-parse --show-toplevel)/scripts"

# pre-push Hook: bumpt die Patch-Version vor jedem Push
cat > "${HOOKS_DIR}/pre-push" << 'EOF'
#!/usr/bin/env bash
# Automatischer Versions-Bump vor jedem Push
REPO_ROOT="$(git rev-parse --show-toplevel)"
bash "${REPO_ROOT}/scripts/bump-version.sh"
EOF

chmod +x "${HOOKS_DIR}/pre-push"
echo "✓ pre-push Hook installiert (auto version bump)"
