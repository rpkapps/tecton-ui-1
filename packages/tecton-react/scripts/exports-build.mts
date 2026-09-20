/**
 * exports-build — generates the `exports` map of packages/tecton-react/package.json.
 *
 *   bun run scripts/exports-build.mts            (pnpm exports:build)
 *   bun run scripts/exports-build.mts --check    (pnpm exports:check — CI)
 *
 * The map is enumerated, not wildcarded: one entry per publishable module, so a
 * consumer's bundler and `tsc` see exactly the surface the package promises and a
 * typo fails at resolution time instead of silently reaching into `src/`.
 *
 * It is derived from the `src/` layout (the same inclusion rules the build uses),
 * not from `dist/`, so it can be regenerated without building first. The targets
 * are the build output:
 *
 *   ./package.json                  the manifest itself
 *   ./globals.css                   → dist/styles/globals.css
 *   ./styles/<name>.css             → dist/styles/<name>.css      (plain strings:
 *                                     Vite's CSS resolver matches `style` /
 *                                     `development` / `production`, none of which a
 *                                     conditions object here would carry)
 *   ./components/<name>             → dist/components/<name>.{d.ts,js}
 *   ./tecton/<name>, ./hooks/<name>, ./lib/<name>, ./icons,
 *   ./icons/lucide-compat, ./icons/<name>
 *
 * The one entry that does not point into dist/ is ./postcss/scope: hand-written ESM
 * for a consumer's PostCSS config (no build step, Node-only), shipped as-is.
 *
 * There is deliberately no "." entry: the bare `@tecton/react` import is banned by
 * @tecton/eslint-config, and the micro-frontend setup shares the `@tecton/react/`
 * prefix rather than a root module.
 */
/// <reference types="node" />
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const SRC = path.join(pkgRoot, "src");
const PKG_JSON = path.join(pkgRoot, "package.json");

/** `src/icons/*.ts` that the build emits but the package does not expose. */
const ICON_INTERNALS = new Set(["_runtime", "types", "lucide-compat.map"]);

type ExportEntry =
  | string
  | { types: string; import: string }
  | { types: string; default: string };

function moduleNames(dir: string, ext: string) {
  return readdirSync(path.join(SRC, dir), { withFileTypes: true })
    .filter(
      (item) =>
        item.isFile() &&
        item.name.endsWith(ext) &&
        !item.name.endsWith(".d.ts") &&
        !item.name.includes("__tests__")
    )
    .map((item) => item.name.slice(0, -ext.length))
    .sort();
}

function jsEntry(distPath: string) {
  return { types: `./dist/${distPath}.d.ts`, import: `./dist/${distPath}.js` };
}

function buildExports() {
  const map: Record<string, ExportEntry> = { "./package.json": "./package.json" };

  const sheets = moduleNames("styles", ".css");
  if (!sheets.includes("globals")) throw new Error("src/styles/globals.css is missing");
  map["./globals.css"] = "./dist/styles/globals.css";
  for (const name of sheets) {
    map[`./styles/${name}.css`] = `./dist/styles/${name}.css`;
  }

  // Published verbatim from the package root: plain ESM a consumer's postcss.config
  // imports, with a hand-written declaration file next to it.
  for (const file of ["postcss/scope.mjs", "postcss/scope.d.mts"]) {
    if (!existsSync(path.join(pkgRoot, file))) throw new Error(`${file} is missing`);
  }
  map["./postcss/scope"] = {
    types: "./postcss/scope.d.mts",
    default: "./postcss/scope.mjs",
  };

  for (const name of moduleNames("components", ".tsx")) {
    map[`./components/${name}`] = jsEntry(`components/${name}`);
  }
  for (const name of moduleNames("tecton", ".tsx")) {
    map[`./tecton/${name}`] = jsEntry(`tecton/${name}`);
  }
  for (const name of moduleNames("hooks", ".ts")) {
    map[`./hooks/${name}`] = jsEntry(`hooks/${name}`);
  }
  for (const name of moduleNames("lib", ".ts")) {
    map[`./lib/${name}`] = jsEntry(`lib/${name}`);
  }

  map["./icons"] = jsEntry("icons/index");
  map["./icons/lucide-compat"] = jsEntry("icons/lucide-compat");
  for (const name of moduleNames("icons", ".tsx")) {
    if (ICON_INTERNALS.has(name)) continue;
    map[`./icons/${name}`] = jsEntry(`icons/${name}`);
  }

  return map;
}

/**
 * Rewrites only the `exports` block, so the rest of package.json (key order,
 * comments-free formatting, trailing newline, CRLF or LF) is preserved verbatim.
 */
function render(map: Record<string, ExportEntry>) {
  const raw = readFileSync(PKG_JSON, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const lf = raw.replace(/\r\n/g, "\n");
  const block = /\n {2}"exports": \{[\s\S]*?\n {2}\}/;
  if (!block.test(lf)) {
    throw new Error('package.json: could not locate the "exports" block');
  }
  const serialized = JSON.stringify(map, null, 2).split("\n").join("\n  ");
  const next = lf.replace(block, `\n  "exports": ${serialized}`);
  return { current: raw, next: next.split("\n").join(eol) };
}

function describeDifferences(map: Record<string, ExportEntry>) {
  const manifest = JSON.parse(readFileSync(PKG_JSON, "utf8")) as {
    exports?: Record<string, ExportEntry>;
  };
  const current = manifest.exports ?? {};
  const added = Object.keys(map).filter((key) => !(key in current));
  const removed = Object.keys(current).filter((key) => !(key in map));
  const changed = Object.keys(map).filter(
    (key) => key in current && JSON.stringify(current[key]) !== JSON.stringify(map[key])
  );
  return { added, removed, changed };
}

function list(label: string, keys: Array<string>) {
  if (!keys.length) return;
  const shown = keys.slice(0, 10);
  console.error(`  ${label} (${keys.length}): ${shown.join(", ")}${keys.length > shown.length ? ", …" : ""}`);
}

function main() {
  const check = process.argv.includes("--check");
  const map = buildExports();
  const { current, next } = render(map);

  if (current === next) {
    console.log(
      `exports: up to date (${Object.keys(map).length} entries in packages/tecton-react/package.json)`
    );
    return;
  }

  if (check) {
    const { added, removed, changed } = describeDifferences(map);
    console.error("exports:check failed — packages/tecton-react/package.json is stale.");
    list("missing", added);
    list("stale", removed);
    list("different", changed);
    if (!added.length && !removed.length && !changed.length) {
      console.error("  the entries match but the formatting does not");
    }
    console.error("  run: pnpm --filter @tecton/react exports:build");
    process.exit(1);
  }

  writeFileSync(PKG_JSON, next);
  console.log(
    `exports: wrote ${Object.keys(map).length} entries to packages/tecton-react/package.json`
  );
}

main();
