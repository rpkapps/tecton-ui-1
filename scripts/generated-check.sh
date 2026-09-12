#!/usr/bin/env bash
# Verifies that no CLI-generated component was hand-edited: runs
# `shadcn add <item> --diff <file>` for every aria UI item and fails on any
# reported difference. Set REGISTRY_URL when ui.shadcn.com is unreachable
# (see scripts/registry-mirror.sh).
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKG="$ROOT/packages/tecton-react"
CLI="${SHADCN_CLI:-$PKG/node_modules/.bin/shadcn}"
export npm_config_user_agent="${npm_config_user_agent:-pnpm/10.33.0 npm/? node/v22 linux x64}"

failed=0
checked=0
for file in "$PKG"/src/components/*.tsx; do
  item="$(basename "$file" .tsx)"
  output="$("$CLI" add "$item" --diff "$item.tsx" -c "$PKG" 2>&1)"
  status=$?
  checked=$((checked + 1))
  if [ $status -ne 0 ] || ! echo "$output" | grep -q "No changes." || echo "$output" | grep -q "(overwrite)"; then
    echo "✗ $item"
    echo "$output" | head -40
    failed=$((failed + 1))
  else
    echo "✓ $item"
  fi
done

echo "checked=$checked failed=$failed"
[ "$failed" -eq 0 ]
