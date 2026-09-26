#!/usr/bin/env bash
# Local build of the shadcn registry with the Tecton overlay. It clones
# shadcn-ui/ui at the commit pinned in docs/UPSTREAM.md, applies the overlay in
# scripts/registry-mirror/overlay (the `tecton` style and the variant patches to
# a few aria base sources), builds the `aria-tecton` registry with the upstream
# build script and serves it on http://127.0.0.1:4000.
#
# The `aria-tecton` style exists only here, so every shadcn CLI command that
# touches packages/tecton-react must run against this mirror:
#   REGISTRY_URL=http://127.0.0.1:4000/r pnpm dlx shadcn@4.21.0 add <item> -c packages/tecton-react
#
# Usage:
#   scripts/registry-mirror.sh setup   # clone + install + overlay + build (one time, ~5 min)
#   scripts/registry-mirror.sh serve   # start the server (foreground)
#   scripts/registry-mirror.sh build   # re-apply the overlay and rebuild (after editing it or bumping upstream)
#   scripts/registry-mirror.sh export  # write the overlay patch back from the mirror's working tree
#
# Upgrading upstream: bump the commit in docs/UPSTREAM.md, run `setup`; if the
# overlay patch no longer applies, resolve it in the mirror clone (git apply
# --3way leaves conflict markers) and run `export`, then `build`.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIRROR_DIR="${SHADCN_MIRROR_DIR:-$ROOT/.cache/shadcn-ui}"
UPSTREAM_SHA="$(sed -n 's/^- Commit: `\([0-9a-f]*\)`.*/\1/p' "$ROOT/docs/UPSTREAM.md")"
STYLE="${SHADCN_STYLE:-aria-tecton}"
OVERLAY="$ROOT/scripts/registry-mirror/overlay"
# Where the overlay may patch upstream sources. The files it actually touches
# are derived, never listed: `overlay` resets whatever differs from the pinned
# commit here (plus every file the patch names) and `export` writes back
# whatever differs, so a newly patched base source needs no edit to this
# script. The registry build regenerates `__index__.tsx` and `__components__/`
# inside `registry/bases`, hence the `__*` exclusion (a pathspec without glob
# magic, so `*` also matches the files inside `__components__/`).
OVERLAY_PATHSPEC=(
  apps/v4/registry/bases
  apps/v4/registry/styles.tsx
  ':(exclude)apps/v4/registry/bases/__*'
)
BUN="${BUN:-$(command -v bun || echo "$HOME/.bun/bin/bun")}"

setup() {
  if [ ! -d "$MIRROR_DIR/.git" ]; then
    git clone --filter=blob:none https://github.com/shadcn-ui/ui.git "$MIRROR_DIR"
  fi
  git -C "$MIRROR_DIR" fetch --depth 1 origin "$UPSTREAM_SHA"
  # A clone left dirty by an earlier overlay (or by a conflicted `apply --3way`)
  # would make a plain checkout abort after a pin bump. Uncommitted edits in the
  # clone are discarded (run `export` first to keep them). Ignored files
  # (node_modules, builds) survive; everything else is rebuilt by `build` below.
  git -C "$MIRROR_DIR" reset --hard --quiet
  git -C "$MIRROR_DIR" clean -fdq
  git -C "$MIRROR_DIR" checkout --force --quiet "$UPSTREAM_SHA"
  (cd "$MIRROR_DIR" && PUPPETEER_SKIP_DOWNLOAD=1 pnpm install --frozen-lockfile --ignore-scripts)
  (cd "$MIRROR_DIR" && pnpm --filter=@shadcn/react build && pnpm --filter=@shadcn/helpers build && pnpm --filter=shadcn build)
  build
}

# Tracked upstream sources under OVERLAY_PATHSPEC that differ from the pinned commit.
overlaid_files() {
  git -C "$MIRROR_DIR" diff --name-only HEAD -- "${OVERLAY_PATHSPEC[@]}"
}

# The files tecton.patch names.
patch_files() {
  tr -d '\r' < "$OVERLAY/tecton.patch" | sed -n 's|^diff --git a/\([^ ]*\) b/.*|\1|p'
}

overlay() {
  # Reset the overlaid upstream files to the pinned commit, then re-apply the
  # Tecton overlay: the style file is copied, the source patches are applied
  # with a 3-way merge so an upstream bump reports conflicts instead of failing.
  # Both lists are reset: a file dropped from the patch still differs in the
  # clone, and a file the patch names must be clean for the patch to apply.
  local files
  files="$( (overlaid_files && patch_files) | sort -u)"
  if [ -n "$files" ]; then
    # One path per line; upstream paths contain no whitespace.
    # shellcheck disable=SC2086
    git -C "$MIRROR_DIR" checkout --quiet HEAD -- $files
  fi
  cp "$OVERLAY/style-tecton.css" "$MIRROR_DIR/apps/v4/registry/styles/style-tecton.css"
  # `git apply --3way` matches the patch against the index blobs, which are
  # always LF, so a CRLF working copy of the patch (core.autocrlf on Windows)
  # would fail to apply. The patched sources are LF-only, so dropping CR is safe.
  tr -d '\r' < "$OVERLAY/tecton.patch" | git -C "$MIRROR_DIR" apply --3way -
}

export_overlay() {
  cp "$MIRROR_DIR/apps/v4/registry/styles/style-tecton.css" "$OVERLAY/style-tecton.css"
  git -C "$MIRROR_DIR" diff HEAD -- "${OVERLAY_PATHSPEC[@]}" > "$OVERLAY/tecton.patch"
  echo "overlay exported to $OVERLAY, patching:"
  overlaid_files | sed 's/^/  /'
}

build() {
  overlay
  cp "$ROOT/scripts/registry-mirror/local-init.mts" "$MIRROR_DIR/apps/v4/scripts/local-init.mts"
  (cd "$MIRROR_DIR/apps/v4" && "$BUN" run ./scripts/build-registry.mts --indexes --registry "$STYLE")
}

serve() {
  cp "$ROOT/scripts/registry-mirror/local-init.mts" "$MIRROR_DIR/apps/v4/scripts/local-init.mts"
  SHADCN_V4_DIR="$MIRROR_DIR/apps/v4" BUN="$BUN" PORT="${PORT:-4000}" python3 "$ROOT/scripts/registry-mirror/serve.py"
}

case "${1:-}" in
  setup) setup ;;
  build) build ;;
  export) export_overlay ;;
  serve) serve ;;
  *) sed -n '2,20p' "$0"; exit 1 ;;
esac
