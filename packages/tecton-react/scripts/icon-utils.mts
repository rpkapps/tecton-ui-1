/**
 * icon-utils — helpers shared by `extract-icons.mts` and `build-icons.mts`.
 *
 *   - manifest loading / types for `icons/icons.json`
 *   - naming helpers (kebab ⇄ PascalCase, gallery label → slug)
 *   - `normalizeSvg()` — the single place where a raw SVG (Storybook DOM,
 *     designer export, …) is turned into the canonical form committed under
 *     `icons-src/<variant>/<slug>.svg`
 *
 * Keep this dependency-free (node built-ins only) so both scripts run under
 * `bun` or `tsx` without extra installs.
 */
/// <reference types="node" />
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const here = path.dirname(fileURLToPath(import.meta.url));
export const pkgRoot = path.resolve(here, "..");
export const MANIFEST_PATH = path.join(pkgRoot, "icons/icons.json");
export const ICONS_SRC_DIR = path.join(pkgRoot, "icons-src");
export const ICONS_OUT_DIR = path.join(pkgRoot, "src/icons");

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------
export type IconVariant = "outlined" | "filled";
export const ICON_VARIANTS: readonly IconVariant[] = ["outlined", "filled"];

export interface IconManifestEntry {
  /** PascalCase name without the `Icon` suffix, e.g. `AddCircle`. */
  name: string;
  /** Exact gallery label, e.g. `AddCircleIcon`. Also the exported identifier. */
  label: string;
  /** kebab-case id, e.g. `add-circle`. File name of the SVG + generated TSX. */
  slug: string;
  description: string;
  /** Closest lucide icon (kebab-case lucide name) or `null` when none fits. */
  lucide: string | null;
  /** `true` for oil & gas / subsurface domain glyphs that have no lucide peer. */
  domain: boolean;
}

export interface IconManifest {
  version: number;
  source?: string;
  notes?: string;
  variants: IconVariant[];
  sizes: number[];
  count: number;
  icons: IconManifestEntry[];
}

export function loadManifest(file: string = MANIFEST_PATH): IconManifest {
  const manifest = JSON.parse(readFileSync(file, "utf8")) as IconManifest;
  if (!Array.isArray(manifest.icons)) {
    throw new Error(`${file}: expected an "icons" array`);
  }
  if (manifest.count !== manifest.icons.length) {
    console.warn(
      `warning: ${path.relative(pkgRoot, file)} says count=${manifest.count} but lists ${manifest.icons.length} icons`,
    );
  }
  return manifest;
}

// ---------------------------------------------------------------------------
// Naming
// ---------------------------------------------------------------------------

/** `circle-plus` → `CirclePlus`, `loader-2` → `Loader2`. */
export function kebabToPascal(kebab: string): string {
  return kebab
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/** `AddCircleIcon` → `add-circle`, `ThreeD` → `three-d`, `add_circle.svg` → `add-circle`. */
export function toSlug(input: string): string {
  return (
    input
      .replace(/\.svg$/i, "")
      .replace(/Icon$/, "")
      // split camel/Pascal boundaries: "AddCircle" → "Add-Circle", "ThreeD" → "Three-D"
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
      .replace(/[\s_]+/g, "-")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

/** Look up a manifest entry by anything that slugifies to its slug. */
export function findIconBy(manifest: IconManifest, labelOrSlug: string): IconManifestEntry | undefined {
  const slug = toSlug(labelOrSlug);
  return manifest.icons.find((icon) => icon.slug === slug);
}

// ---------------------------------------------------------------------------
// icons-src scanning
// ---------------------------------------------------------------------------

/**
 * Returns `{ outlined: { slug → absolute path }, filled: { … } }` for every
 * SVG under `icons-src/`. Files directly in `icons-src/` (no variant folder)
 * are treated as `outlined`. File names are slugified, so both
 * `AddCircleIcon.svg` and `add-circle.svg` map to slug `add-circle`.
 */
export function scanIconSources(dir: string = ICONS_SRC_DIR): Record<IconVariant, Map<string, string>> {
  const result: Record<IconVariant, Map<string, string>> = { outlined: new Map(), filled: new Map() };
  if (!existsSync(dir)) return result;

  const collect = (folder: string, variant: IconVariant) => {
    if (!existsSync(folder)) return;
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".svg")) continue;
      const slug = toSlug(entry.name);
      const file = path.join(folder, entry.name);
      if (result[variant].has(slug)) {
        console.warn(`warning: duplicate ${variant} source for "${slug}": ${file} (ignored)`);
        continue;
      }
      result[variant].set(slug, file);
    }
  };

  collect(dir, "outlined");
  for (const variant of ICON_VARIANTS) collect(path.join(dir, variant), variant);
  return result;
}

// ---------------------------------------------------------------------------
// SVG normalisation
// ---------------------------------------------------------------------------

/** Values of `fill` / `stroke` that must NOT be rewritten to currentColor. */
const KEEP_PAINT = new Set(["none", "currentcolor", "inherit", "transparent", "context-fill", "context-stroke"]);

/** Root-level attributes injected by MUI / Storybook / editors that carry no glyph data. */
const DROP_ROOT_ATTRS = new Set([
  "width",
  "height",
  "class",
  "style",
  "focusable",
  "aria-hidden",
  "aria-label",
  "role",
  "data-testid",
  "font-size",
  "color",
  "xml:space",
  "xmlns:xlink",
  "xmlns:serif",
  "version",
]);

export interface NormalizeOptions {
  /**
   * When true, `fill`/`stroke` colours are left untouched (used for the few
   * multi-colour glyphs such as `strata`). Gradients (`url(#…)`) are always kept.
   */
  keepColors?: boolean;
}

/**
 * Canonicalise an SVG string:
 *   - drop XML prolog, doctype, comments, `<title>`, `<desc>`, `<metadata>`
 *   - keep `viewBox` (synthesised from width/height when missing)
 *   - remove `width`/`height` and other presentational root attributes
 *   - rewrite literal `fill`/`stroke` colours to `currentColor`
 *     (except `none`, `url(#…)` gradient/pattern refs and `<stop>` colours)
 *   - strip `id` attributes that nothing references
 *
 * The parser is regex-based on purpose: icon SVGs are tiny and flat, and
 * avoiding an XML dependency keeps the scripts runnable anywhere.
 */
export function normalizeSvg(raw: string, options: NormalizeOptions = {}): string {
  let svg = raw.trim();

  // 1. Remove non-glyph noise.
  svg = svg
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(title|desc|metadata)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .trim();

  const rootMatch = svg.match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/i);
  if (!rootMatch) throw new Error("normalizeSvg: input is not a single <svg> element");
  const rootAttrs = parseAttributes(rootMatch[1]);
  let inner = rootMatch[2];

  // 2. viewBox: keep, or synthesise from width/height.
  let viewBox = rootAttrs.get("viewBox") ?? rootAttrs.get("viewbox");
  if (!viewBox) {
    const w = parseFloat(rootAttrs.get("width") ?? "");
    const h = parseFloat(rootAttrs.get("height") ?? "");
    viewBox = Number.isFinite(w) && Number.isFinite(h) ? `0 0 ${w} ${h}` : "0 0 24 24";
  }

  // 3. Rebuild the root attribute list, dropping presentational noise.
  const keptRoot = new Map<string, string>();
  keptRoot.set("xmlns", "http://www.w3.org/2000/svg");
  keptRoot.set("viewBox", viewBox.trim().replace(/\s+/g, " "));
  for (const [name, value] of rootAttrs) {
    const lower = name.toLowerCase();
    if (lower === "xmlns" || lower === "viewbox" || DROP_ROOT_ATTRS.has(lower)) continue;
    if (lower === "id") continue;
    keptRoot.set(name, value);
  }

  // 4. Colours → currentColor (root + descendants).
  const paintFix = (attrs: Map<string, string>) => {
    if (options.keepColors) return;
    for (const prop of ["fill", "stroke"]) {
      const value = attrs.get(prop);
      if (value === undefined) continue;
      const v = value.trim();
      if (KEEP_PAINT.has(v.toLowerCase()) || v.startsWith("url(")) continue;
      attrs.set(prop, "currentColor");
    }
    const style = attrs.get("style");
    if (style) {
      attrs.set(
        "style",
        style.replace(/\b(fill|stroke)\s*:\s*([^;]+)/g, (m, prop: string, v: string) => {
          const t = v.trim();
          if (KEEP_PAINT.has(t.toLowerCase()) || t.startsWith("url(")) return m;
          return `${prop}:currentColor`;
        }),
      );
    }
  };
  paintFix(keptRoot);

  // 5. Which ids are referenced (gradients, clip paths, masks, <use>)?
  const referenced = new Set<string>();
  for (const m of inner.matchAll(/url\(\s*['"]?#([^)'"]+)['"]?\s*\)/g)) referenced.add(m[1]);
  for (const m of inner.matchAll(/(?:xlink:)?href\s*=\s*["']#([^"']+)["']/g)) referenced.add(m[1]);

  // 6. Walk every descendant tag: fix paint, strip unreferenced ids / classes.
  inner = inner.replace(/<([a-zA-Z][\w:-]*)\b([^>]*?)(\/?)>/g, (_m, tag: string, attrText: string, selfClose: string) => {
    const attrs = parseAttributes(attrText);
    const isStop = tag.toLowerCase() === "stop";
    if (!isStop) paintFix(attrs);
    const id = attrs.get("id");
    if (id !== undefined && !referenced.has(id)) attrs.delete("id");
    attrs.delete("class");
    attrs.delete("data-testid");
    return `<${tag}${serializeAttributes(attrs)}${selfClose ? " /" : ""}>`;
  });

  // 7. Whitespace: one element per line, two-space indent.
  inner = inner
    .replace(/>\s+</g, "><")
    .replace(/></g, ">\n<")
    .trim();
  let depth = 1;
  const indented = inner
    .split("\n")
    .map((raw) => {
      const line = raw.trim();
      const isClose = line.startsWith("</");
      if (isClose) depth = Math.max(1, depth - 1);
      const out = `${"  ".repeat(depth)}${line}`;
      // an opening tag that is neither self-closing nor closed on the same line nests what follows
      if (!isClose && line.startsWith("<") && !line.endsWith("/>") && !/<\/[\w:-]+>$/.test(line)) depth++;
      return out;
    })
    .join("\n");

  return `<svg${serializeAttributes(keptRoot)}>\n${indented}\n</svg>\n`;
}

/** Parse `a="1" b='2' c` into an ordered map (attribute order is preserved). */
export function parseAttributes(text: string): Map<string, string> {
  const attrs = new Map<string, string>();
  const re = /([^\s=\/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  for (const m of text.matchAll(re)) {
    const name = m[1];
    if (!name) continue;
    attrs.set(name, m[2] ?? m[3] ?? m[4] ?? "");
  }
  return attrs;
}

export function serializeAttributes(attrs: Map<string, string>): string {
  let out = "";
  for (const [name, value] of attrs) {
    out += ` ${name}="${value.replace(/"/g, "&quot;")}"`;
  }
  return out;
}
