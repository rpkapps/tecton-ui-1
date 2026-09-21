#!/usr/bin/env bash
# Local build of the shadcn registry with the Tecton overlay. It clones
# shadcn-ui/ui at the commit pinned in docs/UPSTREAM.md, applies the overlay in
# scripts/registry-mirror/overlay (the `tecton` style and the variant patches to
# a few aria base sources), builds the `aria-tecton` registry with the upstream
# build script and serves it on http://127.0.0.1:4000.
#
# `build` finishes with scripts/registry-mirror/icon-imports.mts, which points the
# generated components' glyph imports at @tecton/react/icons/lucide-compat. It is
# a post-build step on the built registry rather than part of the overlay because
# upstream's aria sources import no icon library at all — they render
# <IconPlaceholder lucide="CheckIcon" …/> and the CLI writes the `lucide-react`
# import itself — so there is no import line to patch in the sources, and eight of
# the twenty affected files are in OVERLAY_FILES, where `export` would bake the
# rewrite into tecton.patch for those eight only.
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
OVERLAY_FILES="apps/v4/registry/bases/aria/ui/alert.tsx apps/v4/registry/bases/aria/ui/tabs.tsx apps/v4/registry/bases/aria/ui/badge.tsx apps/v4/registry/bases/aria/ui/input.tsx apps/v4/registry/bases/aria/ui/select.tsx apps/v4/registry/bases/aria/ui/separator.tsx apps/v4/registry/bases/aria/ui/textarea.tsx apps/v4/registry/bases/aria/ui/toggle.tsx apps/v4/registry/bases/aria/ui/button-group.tsx apps/v4/registry/bases/aria/ui/sonner.tsx apps/v4/registry/styles.tsx apps/v4/registry/bases/aria/ui/alert-dialog.tsx apps/v4/registry/bases/aria/ui/combobox.tsx apps/v4/registry/bases/aria/ui/context-menu.tsx apps/v4/registry/bases/aria/ui/dialog.tsx apps/v4/registry/bases/aria/ui/drawer.tsx apps/v4/registry/bases/aria/ui/dropdown-menu.tsx apps/v4/registry/bases/aria/ui/hover-card.tsx apps/v4/registry/bases/aria/ui/popover.tsx apps/v4/registry/bases/aria/ui/sheet.tsx apps/v4/registry/bases/aria/ui/tooltip.tsx apps/v4/registry/bases/aria/ui/sidebar.tsx apps/v4/registry/bases/aria/ui/direction.tsx"
BUN="${BUN:-$HOME/.bun/bin/bun}"

setup() {
  if [ ! -d "$MIRROR_DIR/.git" ]; then
    git clone --filter=blob:none https://github.com/shadcn-ui/ui.git "$MIRROR_DIR"
  fi
  git -C "$MIRROR_DIR" fetch --depth 1 origin "$UPSTREAM_SHA"
  git -C "$MIRROR_DIR" checkout --quiet "$UPSTREAM_SHA"
  (cd "$MIRROR_DIR" && PUPPETEER_SKIP_DOWNLOAD=1 pnpm install --frozen-lockfile --ignore-scripts)
  (cd "$MIRROR_DIR" && pnpm --filter=@shadcn/react build && pnpm --filter=@shadcn/helpers build && pnpm --filter=shadcn build)
  build
}

overlay() {
  # Reset the overlaid upstream files to the pinned commit, then re-apply the
  # Tecton overlay: the style file is copied, the source patches are applied
  # with a 3-way merge so an upstream bump reports conflicts instead of failing.
  git -C "$MIRROR_DIR" checkout --quiet HEAD -- $OVERLAY_FILES
  cp "$OVERLAY/style-tecton.css" "$MIRROR_DIR/apps/v4/registry/styles/style-tecton.css"
  # `git apply --3way` matches the patch against the index blobs, which are
  # always LF, so a CRLF working copy of the patch (core.autocrlf on Windows)
  # would fail to apply. The patched sources are LF-only, so dropping CR is safe.
  tr -d '\r' < "$OVERLAY/tecton.patch" | git -C "$MIRROR_DIR" apply --3way -
}

export_overlay() {
  cp "$MIRROR_DIR/apps/v4/registry/styles/style-tecton.css" "$OVERLAY/style-tecton.css"
  git -C "$MIRROR_DIR" diff HEAD -- $OVERLAY_FILES > "$OVERLAY/tecton.patch"
  echo "overlay exported to $OVERLAY"
}

build() {
  overlay
  cp "$ROOT/scripts/registry-mirror/local-init.mts" "$MIRROR_DIR/apps/v4/scripts/local-init.mts"
  cp "$ROOT/scripts/registry-mirror/icon-imports.mts" "$MIRROR_DIR/apps/v4/scripts/icon-imports.mts"
  (cd "$MIRROR_DIR/apps/v4" && "$BUN" run ./scripts/build-registry.mts --indexes --registry "$STYLE")
  # Post-build, not part of the overlay: upstream's aria sources carry no icon
  # import at all (see icon-imports.mts), so there is nothing to patch there.
  (cd "$MIRROR_DIR/apps/v4" && SHADCN_STYLE="$STYLE" "$BUN" run ./scripts/icon-imports.mts)
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
  *) sed -n '2,29p' "$0"; exit 1 ;;
esac
