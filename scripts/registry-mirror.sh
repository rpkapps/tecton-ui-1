#!/usr/bin/env bash
# Local mirror of the official shadcn registry (https://ui.shadcn.com/r) for
# environments where that host is unreachable. It clones shadcn-ui/ui at the
# commit pinned in docs/UPSTREAM.md, builds the aria-vega registry with the
# upstream build script and serves it on http://127.0.0.1:4000.
#
# Usage:
#   scripts/registry-mirror.sh setup   # clone + install + build (one time, ~5 min)
#   scripts/registry-mirror.sh serve   # start the server (foreground)
#   scripts/registry-mirror.sh build   # rebuild the registry after a `git pull`
#
# Then run every shadcn CLI command with:
#   REGISTRY_URL=http://127.0.0.1:4000/r pnpm dlx shadcn@4.21.0 add <item> -c packages/tecton-react
#
# When ui.shadcn.com is reachable, simply do not set REGISTRY_URL.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIRROR_DIR="${SHADCN_MIRROR_DIR:-$ROOT/.cache/shadcn-ui}"
UPSTREAM_SHA="$(sed -n 's/^- Commit: `\([0-9a-f]*\)`.*/\1/p' "$ROOT/docs/UPSTREAM.md")"
STYLE="${SHADCN_STYLE:-aria-vega}"
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

build() {
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
  serve) serve ;;
  *) sed -n '2,16p' "$0"; exit 1 ;;
esac
