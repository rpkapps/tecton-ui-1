/**
 * vendor-shadcn-css — copies the installed `shadcn/tailwind.css` into
 * `src/styles/shadcn.css` so consumers do not need the shadcn CLI.
 *
 *   bun run scripts/vendor-shadcn-css.mts   (also called by tokens-build.mts)
 *
 * `globals.css` is written by the CLI with `@import "shadcn/tailwind.css";`,
 * which makes the whole CLI (Babel, ts-morph, an MCP SDK, undici…) a runtime
 * dependency of every application that imports the stylesheet. The file itself
 * is ~16 kB of `@theme inline` keyframes, `@custom-variant` and `@utility`
 * rules, so it is vendored instead and `shadcn` stays a devDependency;
 * `tokens-build.mts` rewrites the import in globals.css to the local copy.
 *
 * Inputs
 *   shadcn/tailwind.css            resolved from the installed shadcn package
 *
 * Outputs
 *   src/styles/shadcn.css          header comment + the upstream file verbatim
 *
 * The vendored body is compared byte for byte by `tokens-check.mts`, so nothing
 * but the header may differ from upstream. Re-run after bumping shadcn.
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");

/** The vendored copy (generated). */
export const VENDORED_CSS = path.join(pkgRoot, "src/styles/shadcn.css");
/** The upstream stylesheet, as globals.css imports it before patching. */
export const UPSTREAM_SPECIFIER = "shadcn/tailwind.css";

const require_ = createRequire(import.meta.url);

/** Line endings differ between a fresh checkout and a fresh write on Windows. */
export function normalizeNewlines(css: string): string {
  return css.replace(/\r\n/g, "\n");
}

/** The header line naming the version the copy was taken from. */
export function vendoredHeader(version: string): string {
  return `/* VENDORED from shadcn@${version} (tailwind.css) by scripts/vendor-shadcn-css.mts — do not edit; re-run tokens:build after bumping shadcn */`;
}

/** Split a vendored file into the version its header names and the body after it. */
export function parseVendored(css: string): { version?: string; body: string } {
  const text = normalizeNewlines(css);
  const nl = text.indexOf("\n");
  const first = nl === -1 ? text : text.slice(0, nl);
  const m = /^\/\* VENDORED from shadcn@(\S+) \(tailwind\.css\)/.exec(first);
  return { version: m?.[1], body: nl === -1 ? "" : text.slice(nl + 1) };
}

/** The `shadcn` package root that owns `tailwind.css`. */
function packageRootOf(file: string): string {
  let dir = path.dirname(file);
  for (;;) {
    const manifest = path.join(dir, "package.json");
    if (existsSync(manifest)) {
      const name = (JSON.parse(readFileSync(manifest, "utf8")) as { name?: string }).name;
      if (name === "shadcn") return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`vendor-shadcn-css: no shadcn package.json above ${file}`);
    dir = parent;
  }
}

/** The installed upstream stylesheet and the shadcn version it belongs to. */
export function readUpstream(): { version: string; file: string; css: string } {
  let file: string;
  try {
    file = require_.resolve(UPSTREAM_SPECIFIER);
  } catch (e) {
    throw new Error(
      `vendor-shadcn-css: cannot resolve ${UPSTREAM_SPECIFIER} — is shadcn installed? (${(e as Error).message})`
    );
  }
  const manifest = path.join(packageRootOf(file), "package.json");
  const version = (JSON.parse(readFileSync(manifest, "utf8")) as { version?: string }).version;
  if (!version) throw new Error(`vendor-shadcn-css: ${manifest} has no version`);
  return { version, file, css: readFileSync(file, "utf8") };
}

/**
 * The vendored copy must be self-contained: a relative `@import` or `url()` in
 * the upstream file would resolve against src/styles instead of the shadcn
 * package. shadcn 4.21 has neither (16 kB of at-rules, no asset references), so
 * this only guards a future bump — inline the reference here if it ever trips.
 */
function assertSelfContained(css: string, file: string) {
  const relative: string[] = [];
  for (const m of css.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/g)) {
    if (/^[./]/.test(m[1])) relative.push(`@import "${m[1]}"`);
  }
  for (const m of css.matchAll(/url\(\s*(?:["']([^"']+)["']|([^)"']+))\s*\)/g)) {
    const ref = (m[1] ?? m[2]).trim();
    if (!/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(ref)) relative.push(`url(${ref})`);
  }
  if (relative.length) {
    throw new Error(
      `vendor-shadcn-css: ${file} is not self-contained (${relative.join(", ")}) — inline these before vendoring`
    );
  }
}

/** Write src/styles/shadcn.css from the installed shadcn package. */
export function vendorShadcnCss(): { version: string; changed: boolean } {
  const { version, file, css } = readUpstream();
  assertSelfContained(css, file);
  const next = `${vendoredHeader(version)}\n${css}`;
  const current = existsSync(VENDORED_CSS) ? readFileSync(VENDORED_CSS, "utf8") : undefined;
  // compare through the newline normalisation `tokens-check` uses, so a CRLF
  // checkout of an unchanged file is not rewritten
  const changed = current === undefined || normalizeNewlines(current) !== normalizeNewlines(next);
  if (changed) writeFileSync(VENDORED_CSS, next);
  return { version, changed };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const invokedDirectly =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const { version, changed } = vendorShadcnCss();
  const rel = path.relative(path.resolve(pkgRoot, "..", ".."), VENDORED_CSS);
  console.log(`[vendor-shadcn-css] ${changed ? "wrote" : "unchanged"} ${rel} from shadcn@${version}`);
}
