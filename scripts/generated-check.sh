#!/usr/bin/env bash
# Verifies that no CLI-generated file was hand-edited: runs
# `shadcn add <item> --diff <file>` for every file under src/components,
# src/hooks and src/lib and fails on any reported difference. Set REGISTRY_URL
# when ui.shadcn.com is unreachable (see scripts/registry-mirror.sh).
#
# Tolerated: added or removed lines that are blank or consist only of the
# `"use client"` directive (a CLI quirk, see docs/UPSTREAM.md). Everything else
# fails, and so does output this script does not recognise (no file header, a
# header other than `(skip)` / `(overwrite)`, or an `(overwrite)` header with no
# diff lines under it), so a change in the CLI's output format cannot hide drift.
#
# GENERATED_CHECK_FILES="components/button.tsx hooks/use-mobile.ts" limits the
# run to those files (paths relative to packages/tecton-react/src); CI uses it
# to prove that a planted edit fails the check.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKG="$ROOT/packages/tecton-react"
CLI="${SHADCN_CLI:-$PKG/node_modules/.bin/shadcn}"
export npm_config_user_agent="${npm_config_user_agent:-pnpm/10.33.0 npm/? node/v22 linux x64}"

# The CLI colours its output whenever FORCE_COLOR is set (to anything but 0),
# which would hide every diff line from the greps below. Turn colour off, and
# strip any escape sequence that still gets through.
unset FORCE_COLOR
export NO_COLOR=1
ESC=$'\033'
strip_ansi() { sed "s/${ESC}\[[0-9;]*[A-Za-z]//g"; }

# With a built dist/ present the shadcn CLI resolves the @tecton/react aliases
# to the emitted declarations and reports (or writes) `@tecton/react/dist/...`
# imports, so every CLI command must run with dist/ absent (see docs/UPSTREAM.md).
# Park the build output for the duration of the check and put it back on exit.
# Windows often refuses to rename the tree, so fall back to deleting it and
# rebuilding it afterwards (dist/ is reproducible from src/).
PARKED="$PKG/dist.generated-check"
if [ -e "$PARKED" ]; then
  # Left behind by a run that was killed before its EXIT trap ran. Moving dist/
  # onto an existing directory would nest it inside, and the trap would then
  # restore a corrupt tree, so resolve it first.
  if [ -e "$PKG/dist" ]; then
    echo "· removing a stale packages/tecton-react/dist.generated-check left by an interrupted run (dist/ is newer)"
    rm -rf "$PARKED"
  else
    echo "· restoring packages/tecton-react/dist from a dist.generated-check left by an interrupted run"
    mv "$PARKED" "$PKG/dist" || { echo "! could not restore $PARKED; remove it by hand" >&2; exit 1; }
  fi
fi
if [ -d "$PKG/dist" ]; then
  if mv "$PKG/dist" "$PARKED" 2>/dev/null; then
    trap 'mv "$PARKED" "$PKG/dist"' EXIT
  else
    echo "· removing packages/tecton-react/dist for the check (the shadcn CLI resolves @tecton/react into it); it is rebuilt on exit"
    rm -rf "$PKG/dist"
    trap '(cd "$PKG" && pnpm build >/dev/null 2>&1) || echo "! rebuilding packages/tecton-react/dist failed; run: pnpm --filter @tecton/react build" >&2' EXIT
  fi
fi

# The registry item that installs each file under src/hooks and src/lib. A new
# file there fails the check until it is listed, so none goes undiffed.
item_for_support_file() {
  case "$1" in
    hooks/use-mobile.ts) echo sidebar ;;
    lib/utils.ts) echo utils ;;
    *) return 1 ;;
  esac
}

failed=0
checked=0

# check <item> <path relative to src/>
check() {
  local item="$1" rel="$2" name output status header real_changes diff_lines reason=""
  name="$(basename "$rel")"
  output="$("$CLI" add "$item" --diff "$name" -c "$PKG" 2>&1 | strip_ansi)"
  status=${PIPESTATUS[0]}
  checked=$((checked + 1))

  header="$(echo "$output" | grep -E "^├ src/$rel \(" || true)"
  diff_lines="$(echo "$output" | grep -E '^│ │ [-+]' | grep -vE '^│ │ [-+]{3} [ab]/' || true)"
  # Only the `"use client"` directive and blank lines may differ: the CLI's
  # --diff view and its add transform disagree on it for rsc:false projects.
  real_changes="$(echo "$diff_lines" | grep -vE '^│ │ [-+]("use client";?)?[[:space:]]*$' | grep -v '^$' || true)"

  if [ "$status" -ne 0 ]; then
    reason="the CLI exited with status $status"
  elif [ -z "$header" ]; then
    reason="no file header for src/$rel in the CLI output (item \"$item\" does not install it, or the output format changed)"
  elif [ "$header" = "├ src/$rel (skip)" ]; then
    : # no changes
  elif [ "$header" != "├ src/$rel (overwrite)" ]; then
    reason="unexpected file header: $header"
  elif [ -z "$diff_lines" ]; then
    reason="the CLI reports a change but no diff lines were recognised (output format changed?)"
  elif [ -n "$real_changes" ]; then
    reason="differs from the registry"
  fi

  if [ -n "$reason" ]; then
    echo "✗ $rel ($item): $reason"
    echo "$output" | head -40
    failed=$((failed + 1))
  else
    echo "✓ $rel"
  fi
}

files=()
if [ -n "${GENERATED_CHECK_FILES:-}" ]; then
  read -r -a files <<<"$GENERATED_CHECK_FILES"
else
  for file in "$PKG"/src/components/*.tsx "$PKG"/src/hooks/* "$PKG"/src/lib/*; do
    [ -e "$file" ] && files+=("${file#"$PKG/src/"}")
  done
fi

for rel in ${files[@]+"${files[@]}"}; do
  case "$rel" in
    components/*.tsx) item="$(basename "$rel" .tsx)" ;;
    *) item="$(item_for_support_file "$rel")" || item="" ;;
  esac
  if [ ! -e "$PKG/src/$rel" ]; then
    echo "✗ $rel: no such file"
  elif [ -z "$item" ]; then
    echo "✗ $rel: no registry item mapped to it; add it to item_for_support_file in scripts/generated-check.sh"
  else
    check "$item" "$rel"
    continue
  fi
  checked=$((checked + 1))
  failed=$((failed + 1))
done

echo "checked=$checked failed=$failed"
[ "$failed" -eq 0 ]
