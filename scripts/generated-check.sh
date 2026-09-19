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

# With a built dist/ present the shadcn CLI resolves the @tecton/react aliases
# to the emitted declarations and reports (or writes) `@tecton/react/dist/...`
# imports, so every CLI command must run with dist/ absent (see docs/UPSTREAM.md).
# Park the build output for the duration of the check and put it back on exit.
# Windows often refuses to rename the tree, so fall back to deleting it and
# rebuilding it afterwards (dist/ is reproducible from src/).
if [ -d "$PKG/dist" ]; then
  if mv "$PKG/dist" "$PKG/dist.generated-check" 2>/dev/null; then
    trap 'mv "$PKG/dist.generated-check" "$PKG/dist"' EXIT
  else
    echo "· removing packages/tecton-react/dist for the check (the shadcn CLI resolves @tecton/react into it); it is rebuilt on exit"
    rm -rf "$PKG/dist"
    trap '(cd "$PKG" && pnpm build >/dev/null 2>&1) || echo "! rebuilding packages/tecton-react/dist failed; run: pnpm --filter @tecton/react build" >&2' EXIT
  fi
fi

failed=0
checked=0
for file in "$PKG"/src/components/*.tsx; do
  item="$(basename "$file" .tsx)"
  output="$("$CLI" add "$item" --diff "$item.tsx" -c "$PKG" 2>&1)"
  status=$?
  checked=$((checked + 1))
  # Only the `"use client"` directive may differ: the CLI's --diff view and its
  # add transform disagree on it for rsc:false projects (see docs/UPSTREAM.md).
  real_changes="$(echo "$output" | grep -E '^│ │ [-+]' | grep -vE '^│ │ ([-+]{3} [ab]/|[-+]("use client")?[[:space:]]*$)' || true)"
  if [ $status -ne 0 ] || [ -n "$real_changes" ]; then
    echo "✗ $item"
    echo "$output" | head -40
    failed=$((failed + 1))
  else
    echo "✓ $item"
  fi
done

echo "checked=$checked failed=$failed"
[ "$failed" -eq 0 ]
