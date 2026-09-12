/**
 * tokens-build — generates the Tecton shadcn theme from `tokens/tecton.map.json`.
 *
 *   bun run scripts/tokens-build.mts        (or: tsx scripts/tokens-build.mts)
 *
 * Inputs
 *   src/styles/tecton-tokens.css   generated Tecton export: light (:root) + dark (.dark) tokens
 *   tokens/tecton.map.json         shadcn variable → Tecton token mapping (per mode)
 *
 * Outputs
 *   src/styles/tecton-theme.css    :root / .dark (var() refs) / @theme inline
 *   src/styles/globals.css         CLI-managed file, patched in place (values + imports only)
 *   registry/theme.json            shadcn `registry:theme` item with literal values
 *   ../../docs/TOKEN-MAPPING.md    mapping table + known deviations
 *
 * Env: GLOBALS_CSS=<path> overrides the globals.css location (used by tests).
 */
/// <reference types="node" />
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clampChroma, converter, parse } from "culori";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const repoRoot = path.resolve(pkgRoot, "..", "..");

const TOKENS_CSS = path.join(pkgRoot, "src/styles/tecton-tokens.css");
const MAP_JSON = path.join(pkgRoot, "tokens/tecton.map.json");
const THEME_CSS = path.join(pkgRoot, "src/styles/tecton-theme.css");
const GLOBALS_CSS = process.env.GLOBALS_CSS ?? path.join(pkgRoot, "src/styles/globals.css");
const REGISTRY_THEME = path.join(pkgRoot, "registry/theme.json");
const MAPPING_DOC = path.join(repoRoot, "docs/TOKEN-MAPPING.md");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Confidence = "exact" | "approximated" | "derived";
interface Mapping {
  dark: string;
  /** Tecton token, literal value or "derived"; defaults to `dark`. */
  light?: string;
  confidence: Confidence;
  note?: string;
}
interface TokenMap {
  version: number;
  shadcn: Record<string, Mapping>;
  extra: Record<string, Mapping>;
  theme: Record<string, string>;
  light: { strategy: string; note?: string; overrides?: Record<string, string>; overrideNotes?: Record<string, string> };
  checks?: { allow?: string[] };
}

interface Resolved {
  name: string; // shadcn variable name without --
  token: string; // --tecton-* name (dark)
  lightToken: string; // --tecton-* name (light) or literal
  dark: string; // var(--tecton-…) reference
  darkLiteral: string; // resolved literal (hex etc.)
  light: string; // var(--tecton-…) reference or literal
  lightLiteral: string;
  isColor: boolean;
  confidence: Confidence;
  note: string;
  extra: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const toOklch = converter("oklch");

/** Parse `--name: value;` declarations from a CSS string into a map. */
export function parseCustomProperties(css: string): Map<string, string> {
  const out = new Map<string, string>();
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(noComments))) out.set(m[1], m[2].trim());
  return out;
}

/**
 * Split a themed token file into light and dark maps. Top-level blocks whose
 * selector mentions "dark" override the base (light) declarations.
 */
export function parseThemedTokens(css: string): { light: Map<string, string>; dark: Map<string, string> } {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const light = new Map<string, string>();
  const dark = new Map<string, string>();
  let i = 0;
  while (i < noComments.length) {
    const open = noComments.indexOf("{", i);
    if (open === -1) break;
    const selector = noComments.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < noComments.length && depth > 0) {
      if (noComments[j] === "{") depth++;
      else if (noComments[j] === "}") depth--;
      j++;
    }
    const body = parseCustomProperties(noComments.slice(open + 1, j - 1));
    const isDark = /dark/.test(selector);
    for (const [k, v] of body) {
      if (isDark) dark.set(k, v);
      else light.set(k, v);
    }
    i = j;
  }
  for (const [k, v] of light) if (!dark.has(k)) dark.set(k, v);
  return { light, dark };
}

/** Resolve nested var() references against a token map. */
function resolveValue(value: string, tokens: Map<string, string>, depth = 0): string {
  if (depth > 16) throw new Error(`var() reference too deep: ${value}`);
  return value.replace(/var\((--[\w-]+)(?:\s*,\s*([^)]*))?\)/g, (_, name: string, fallback?: string) => {
    const v = tokens.get(name);
    if (v === undefined) {
      if (fallback !== undefined) return resolveValue(fallback.trim(), tokens, depth + 1);
      throw new Error(`Dangling var(${name})`);
    }
    return resolveValue(v, tokens, depth + 1);
  });
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function formatOklch(c: { l: number; c: number; h?: number; alpha?: number }): string {
  const l = round3(Math.min(1, Math.max(0, c.l)));
  const ch = round3(Math.max(0, c.c));
  const h = round3(c.h ?? 0);
  const alpha = c.alpha ?? 1;
  return alpha < 1 ? `oklch(${l} ${ch} ${h} / ${round3(alpha)})` : `oklch(${l} ${ch} ${h})`;
}

/** Light-mode derivation: invert OKLCH lightness, keep hue/chroma/alpha, clamp to sRGB. */
export function deriveLight(darkLiteral: string): string {
  const parsed = parse(darkLiteral);
  if (!parsed) throw new Error(`Not a colour: ${darkLiteral}`);
  const ok = toOklch(parsed);
  const inverted = { mode: "oklch" as const, l: 1 - ok.l, c: ok.c, h: ok.h, alpha: ok.alpha };
  const clamped = clampChroma(inverted, "oklch");
  return formatOklch({ l: clamped.l, c: clamped.c, h: clamped.h ?? inverted.h, alpha: ok.alpha });
}

function isColorValue(v: string): boolean {
  return parse(v) !== undefined;
}

/** Fontsource stylesheets registering the families named by the Tecton font tokens. */
const FONT_IMPORTS = [
  "@fontsource/figtree/400.css",
  "@fontsource/figtree/500.css",
  "@fontsource/ibm-plex-mono/400.css",
  "@fontsource/ibm-plex-mono/500.css",
];

// ---------------------------------------------------------------------------
// Resolve the mapping
// ---------------------------------------------------------------------------
const themed = parseThemedTokens(readFileSync(TOKENS_CSS, "utf8"));
const tokens = themed.dark; // dark = canonical Tecton values
const lightTokens = themed.light;
const map = JSON.parse(readFileSync(MAP_JSON, "utf8")) as TokenMap;
const overrides = map.light.overrides ?? {};

function resolveMapping(name: string, m: Mapping, extra: boolean): Resolved {
  if (!tokens.has(m.dark)) throw new Error(`${name}: unknown Tecton token ${m.dark}`);
  const darkLiteral = resolveValue(`var(${m.dark})`, tokens);
  const isColor = isColorValue(darkLiteral);
  const lightSpec = overrides[name] ?? m.light ?? m.dark;
  let light: string;
  if (lightSpec === "derived") light = isColor ? deriveLight(darkLiteral) : `var(${m.dark})`;
  else if (lightSpec.startsWith("--")) {
    if (!lightTokens.has(lightSpec)) throw new Error(`${name}: unknown Tecton token ${lightSpec}`);
    light = `var(${lightSpec})`;
  } else light = lightSpec;
  const lightLiteral = resolveValue(light, lightTokens);
  return {
    name,
    token: m.dark,
    lightToken: lightSpec,
    dark: `var(${m.dark})`,
    darkLiteral,
    light,
    lightLiteral,
    isColor,
    confidence: m.confidence,
    note: m.note ?? "",
    extra,
  };
}

const resolved: Resolved[] = [
  ...Object.entries(map.shadcn).map(([n, m]) => resolveMapping(n, m, false)),
  ...Object.entries(map.extra).map(([n, m]) => resolveMapping(n, m, true)),
];
const byName = new Map(resolved.map((r) => [r.name, r]));
const extraNames = Object.keys(map.extra);
const themeEntries: [string, string][] = [
  ...Object.entries(map.theme),
  ...extraNames.map((n): [string, string] => [`--color-${n}`, `var(--${n})`]),
];

/** Vars that live only in :root (non-colour values such as --radius). */
const rootOnly = (r: Resolved) => !r.isColor;

// ---------------------------------------------------------------------------
// 1. tecton-theme.css
// ---------------------------------------------------------------------------
function buildThemeCss(): string {
  const lines: string[] = [];
  lines.push("/* GENERATED by scripts/tokens-build.mts from tokens/tecton.map.json — do not edit */");
  lines.push('@import "./tecton-tokens.css";');
  lines.push("");
  lines.push(":root {");
  for (const r of resolved) lines.push(`  --${r.name}: ${r.light};`);
  lines.push("}");
  lines.push("");
  lines.push(".dark {");
  for (const r of resolved) if (!rootOnly(r)) lines.push(`  --${r.name}: ${r.dark};`);
  lines.push("}");
  lines.push("");
  lines.push("@theme inline {");
  for (const [k, v] of themeEntries) lines.push(`  ${k}: ${v};`);
  lines.push("}");
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// 2. globals.css (surgical patch)
// ---------------------------------------------------------------------------
interface Block {
  start: number; // index of the opening brace
  end: number; // index of the closing brace
}

/** Find the top-level block whose selector text (trimmed) equals `selector`. */
function findBlock(css: string, selector: string): Block | undefined {
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open === -1) return undefined;
    const selStart = Math.max(css.lastIndexOf("}", open), css.lastIndexOf(";", open)) + 1;
    const sel = css.slice(selStart, open).replace(/\/\*[\s\S]*?\*\//g, "").trim();
    // brace matching
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    const close = j - 1;
    if (sel === selector) return { start: open, end: close };
    i = close + 1;
  }
  return undefined;
}

/**
 * Replace declaration values inside a block. Keeps order and indentation; appends
 * `append` entries (in order) before the closing brace if they are missing.
 */
function patchBlock(css: string, block: Block, values: Map<string, string>, append: string[]): string {
  const body = css.slice(block.start + 1, block.end);
  const lines = body.split("\n");
  const declRe = /^(\s*)(--[\w-]+)\s*:\s*(.*?);(\s*(?:\/\*.*\*\/)?\s*)$/;
  let indent: string | undefined;
  const seen = new Set<string>();
  const out = lines.map((line) => {
    const m = declRe.exec(line);
    if (!m) return line;
    indent ??= m[1];
    const name = m[2];
    seen.add(name);
    const next = values.get(name);
    if (next === undefined || next === m[3]) return line;
    return `${m[1]}${name}: ${next};${m[4]}`;
  });
  indent ??= "    ";
  const missing = append.filter((n) => !seen.has(n));
  if (missing.length) {
    // insert before the trailing whitespace line that precedes "}"
    let insertAt = out.length;
    while (insertAt > 0 && out[insertAt - 1].trim() === "") insertAt--;
    const extraLines = missing.map((n) => `${indent}${n}: ${values.get(n)};`);
    out.splice(insertAt, 0, ...extraLines);
  }
  return css.slice(0, block.start + 1) + out.join("\n") + css.slice(block.end);
}

function patchGlobals(): boolean {
  if (!existsSync(GLOBALS_CSS)) {
    console.warn(`[tokens-build] warning: ${path.relative(repoRoot, GLOBALS_CSS)} not found — skipping globals.css patch`);
    return false;
  }
  let css = readFileSync(GLOBALS_CSS, "utf8");

  // -- imports -------------------------------------------------------------
  const shadcnImport = '@import "shadcn/tailwind.css";';
  const tokensImport = '@import "./tecton-tokens.css";';
  const interImport = '@import "@fontsource-variable/inter";';
  const legacyFigtree = '@import "@fontsource-variable/figtree";';
  const legacyMono = '@import "@fontsource/ibm-plex-mono";';
  const fontImports = FONT_IMPORTS.map((f) => `@import "${f}";`);

  if (!css.includes(tokensImport)) {
    if (!css.includes(shadcnImport)) throw new Error(`globals.css: cannot find ${shadcnImport} to anchor ${tokensImport}`);
    css = css.replace(shadcnImport, `${shadcnImport}\n${tokensImport}`);
  }
  for (const legacy of [interImport, legacyFigtree, legacyMono]) css = css.replace(`${legacy}\n`, "");
  let anchor = tokensImport;
  for (const imp of fontImports) {
    if (!css.includes(imp)) css = css.replace(anchor, `${anchor}\n${imp}`);
    anchor = imp;
  }

  // -- :root ----------------------------------------------------------------
  const rootValues = new Map(resolved.map((r) => [`--${r.name}`, r.light]));
  const rootBlock = findBlock(css, ":root");
  if (!rootBlock) throw new Error("globals.css: no :root block");
  css = patchBlock(css, rootBlock, rootValues, extraNames.map((n) => `--${n}`));

  // -- .dark ----------------------------------------------------------------
  const darkValues = new Map(resolved.filter((r) => !rootOnly(r)).map((r) => [`--${r.name}`, r.dark]));
  const darkBlock = findBlock(css, ".dark");
  if (!darkBlock) throw new Error("globals.css: no .dark block");
  css = patchBlock(css, darkBlock, darkValues, extraNames.map((n) => `--${n}`));

  // -- @theme inline --------------------------------------------------------
  const themeValues = new Map(themeEntries);
  const themeBlock = findBlock(css, "@theme inline");
  if (!themeBlock) throw new Error("globals.css: no @theme inline block");
  css = patchBlock(css, themeBlock, themeValues, themeEntries.map(([k]) => k));

  writeFileSync(GLOBALS_CSS, css);
  return true;
}

// ---------------------------------------------------------------------------
// 3. registry/theme.json
// ---------------------------------------------------------------------------
function buildRegistryTheme() {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  for (const r of resolved) {
    light[r.name] = r.lightLiteral;
    if (!rootOnly(r)) dark[r.name] = r.darkLiteral;
  }
  const theme: Record<string, string> = {};
  for (const [k, v] of themeEntries) {
    // registry consumers have no --tecton-* tokens: resolve to literals, keep
    // --color-<extra> as a reference to the :root/.dark variable.
    theme[k.replace(/^--/, "")] = k.startsWith("--color-") ? v : resolveValue(v, tokens);
  }
  const css: Record<string, Record<string, never>> = {};
  for (const f of FONT_IMPORTS) css[`@import "${f}"`] = {};
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "tecton",
    type: "registry:theme",
    title: "Tecton",
    description:
      "Tecton design tokens mapped onto the shadcn CSS variables (light and dark, from the Tecton CSS export). Figtree + IBM Plex Mono via Fontsource.",
    dependencies: ["@fontsource/figtree", "@fontsource/ibm-plex-mono"],
    cssVars: { theme, light, dark },
    css,
  };
}

// ---------------------------------------------------------------------------
// 4. docs/TOKEN-MAPPING.md
// ---------------------------------------------------------------------------
function buildMappingDoc(): string {
  const esc = (s: string) => s.replace(/\|/g, "\\|");
  const row = (r: Resolved) =>
    `| \`--${r.name}\` | \`${r.token}\`${r.lightToken !== r.token ? ` / \`${r.lightToken}\`` : ""} | \`${r.darkLiteral}\` | \`${r.lightLiteral}\`${overrides[r.name] !== undefined ? " (override)" : ""} | ${r.confidence} | ${esc(r.note)} |`;
  const header = [
    "| shadcn var | Tecton token | dark value | light value | confidence | note |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  const std = resolved.filter((r) => !r.extra).map(row);
  const ext = resolved.filter((r) => r.extra).map(row);
  const theme = themeEntries.map(([k, v]) => `| \`${k}\` | \`${v}\` | \`${k.startsWith("--color-") ? v : resolveValue(v, tokens)}\` |`);
  const allow = map.checks?.allow ?? [];
  const overrideNotes = Object.entries(map.light.overrideNotes ?? {});
  const overridesSection = Object.keys(overrides).length
    ? `\n### Light overrides\n\nValues marked "(override)" come from \`light.overrides\` instead of the inversion:\n\n${Object.entries(overrides)
        .map(([k, v]) => `- \`--${k}\`: \`${v}\``)
        .join("\n")}\n${overrideNotes.length ? `\n${overrideNotes.map(([k, v]) => `- **${k}** — ${v}`).join("\n")}\n` : ""}`
    : "";

  return `# Tecton → shadcn token mapping

> GENERATED by \`packages/tecton-react/scripts/tokens-build.mts\` from \`packages/tecton-react/tokens/tecton.map.json\` — do not edit.
> Edit the map (or \`src/styles/tecton-tokens.css\`) and run \`pnpm --filter @tecton/react tokens:build\`.

Both columns come from the Tecton CSS export (\`src/styles/tecton-tokens.css\`): light strategy
**${map.light.strategy}** — ${map.light.note ?? ""}

Confidence: **exact** = a Tecton token with the same meaning exists; **approximated** = the closest
Tecton token was chosen (see note); **derived** = computed, no Tecton source.

## Standard shadcn variables

${[...header, ...std].join("\n")}
${overridesSection}
## Extra tokens (Tecton additions)

Each is declared in \`:root\`/\`.dark\` and exposed as \`--color-<name>\` in \`@theme inline\`
(the documented shadcn pattern for new tokens). Only custom Tecton components and blocks use them.

${[...header, ...ext].join("\n")}

## \`@theme inline\` entries

| entry | value | resolved |
| --- | --- | --- |
${theme.join("\n")}

## Contrast checks

\`pnpm --filter @tecton/react tokens:check\` verifies completeness, dangling \`var()\` references,
WCAG contrast for every surface/foreground pair and sanity rules for both modes.
${allow.length ? `Expected failures (Tecton's own values fail these pairs): ${allow.map((a) => `\`${a}\``).join(", ")}.` : "No expected failures are allow-listed."}

## Known deviations

Everything Tecton-specific must be expressed through the shadcn CSS variables above; generated
component files are never edited. The following Tecton behaviours cannot be reproduced that way and
are documented here (and, where the behaviour matters, addressed by a custom component instead):

- **Focus ring** — Vega renders focus as \`ring-3 ring-ring/50\` (3px, 50% alpha) while Tecton draws
  a solid 2px \`#ff52a8\` outline. The colour matches; width and opacity do not.
- **Button hover** — Vega darkens with \`hover:bg-primary/80\` while Tecton lightens the surface to
  \`#74647f\` (and text to \`#ffffff\`). Same for secondary (\`#514659\`) and tertiary/ghost (\`#3a343e\`).
- **Input variants** — shadcn has a single (outlined) input; Tecton has outlined, filled
  (\`--tecton-color-input-filled-bg\` surface) and textOnly variants. Filled/textOnly are provided by the custom
  \`text-field\` / \`select-field\` components.
- **Status colours** — Tecton's success/error/warning/info/neutral roles have no shadcn equivalent
  beyond \`destructive\`; they are exposed as the extra tokens above and used by custom components
  (\`status-alert\`, \`chip\`, \`count-badge\`).
`;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
writeFileSync(THEME_CSS, buildThemeCss());
console.log(`[tokens-build] wrote ${path.relative(repoRoot, THEME_CSS)}`);

if (patchGlobals()) console.log(`[tokens-build] patched ${path.relative(repoRoot, GLOBALS_CSS)}`);

mkdirSync(path.dirname(REGISTRY_THEME), { recursive: true });
writeFileSync(REGISTRY_THEME, JSON.stringify(buildRegistryTheme(), null, 2) + "\n");
console.log(`[tokens-build] wrote ${path.relative(repoRoot, REGISTRY_THEME)}`);

mkdirSync(path.dirname(MAPPING_DOC), { recursive: true });
writeFileSync(MAPPING_DOC, buildMappingDoc());
console.log(`[tokens-build] wrote ${path.relative(repoRoot, MAPPING_DOC)}`);
