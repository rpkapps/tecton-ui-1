/**
 * tokens-build — generates the Tecton shadcn theme from `tokens/tecton.map.json`.
 *
 *   bun run scripts/tokens-build.mts        (or: tsx scripts/tokens-build.mts)
 *
 * Inputs
 *   src/styles/tecton-tokens.css   generated Tecton export: light (:root) + dark (.dark) tokens
 *   tokens/tecton.map.json         shadcn variable → Tecton token mapping (per mode) + palette config
 *   tokens/tecton.tokens.json      Tecton Figma variables export (DTCG JSON): the foundational colour ramps
 *
 * Outputs
 *   src/styles/tecton-palette.css  :root / .dark raw ramp values + @theme inline (Tailwind palette, stock reset)
 *   src/styles/tecton-theme.css    :root / .dark (var() refs) / @theme inline
 *   src/styles/globals.css         CLI-managed file, patched in place (values + imports only)
 *   src/styles/tecton-base.css     hand-authored base rules (thin scrollbars), import kept in globals.css
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
const PALETTE_CSS = path.join(pkgRoot, "src/styles/tecton-palette.css");
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
  palette?: PaletteConfig;
}
interface PaletteConfig {
  source: string;
  note?: string;
  prefix?: string;
  resetTailwind?: boolean;
  shades?: string[];
  families: string[];
}
/** One palette colour: a shade (`white`) or a ramp step (`red-140`), with its value per mode. */
interface PaletteEntry {
  name: string; // CSS suffix: white | red-140
  family: string; // white | red
  step?: string; // 140
  light: string;
  dark: string;
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

/** Hand-authored base rules (src/styles/tecton-base.css), imported by globals.css after the fonts. */
const BASE_IMPORT = '@import "./tecton-base.css";';
/** The same rules for registry consumers, who do not get tecton-base.css. */
const BASE_CSS: Record<string, Record<string, Record<string, string>>> = {
  "@layer base": {
    "*": { "scrollbar-width": "thin", "scrollbar-color": "var(--border) transparent" },
  },
};

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
// Palette (foundational colour ramps from the Figma variables export)
// ---------------------------------------------------------------------------
type Dtcg = { $value?: unknown; [key: string]: unknown };

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** Direct `<step>: { $value }` children of a DTCG group, ordered numerically. */
function rampSteps(group: Dtcg | undefined): [string, string][] {
  if (!group) return [];
  const steps: [string, string][] = [];
  for (const [key, node] of Object.entries(group)) {
    if (key.startsWith("$") || typeof node !== "object" || node === null) continue;
    const value = (node as Dtcg).$value;
    if (typeof value !== "string") continue; // nested group (transparent, core, surface…)
    const m = /^\d+/.exec(key);
    if (!m) throw new Error(`palette: step "${key}" is not numeric`);
    steps.push([m[0], value.toLowerCase()]);
  }
  return steps.sort((a, b) => Number(a[0]) - Number(b[0]));
}

/**
 * The contrast ramp of a family in one mode: its direct steps, or the
 * `contrasts` sub-group when the direct level only holds sub-groups (gray on dark).
 */
function contrastRamp(family: string, node: Dtcg, mode: "onLight" | "onDark"): [string, string][] {
  const modeNode = node[mode] as Dtcg | undefined;
  if (!modeNode) throw new Error(`palette: ${family} has no ${mode} ramp`);
  const direct = rampSteps(modeNode);
  if (direct.length) return direct;
  const contrasts = rampSteps(modeNode.contrasts as Dtcg | undefined);
  if (!contrasts.length) throw new Error(`palette: ${family}/${mode} has no steps`);
  return contrasts;
}

function loadPalette(config: PaletteConfig | undefined): PaletteEntry[] {
  if (!config) return [];
  const file = path.join(path.dirname(MAP_JSON), config.source);
  const root = JSON.parse(readFileSync(file, "utf8")) as { foundational?: { color?: Record<string, Dtcg> } };
  const colors = root.foundational?.color;
  if (!colors) throw new Error(`palette: ${config.source} has no foundational/color group`);
  const entries: PaletteEntry[] = [];
  for (const shade of config.shades ?? []) {
    const value = (colors.shades?.[shade] as Dtcg | undefined)?.$value;
    if (typeof value !== "string") throw new Error(`palette: shades/${shade} not found`);
    entries.push({ name: kebab(shade), family: kebab(shade), light: value.toLowerCase(), dark: value.toLowerCase() });
  }
  let stepSet: string | undefined;
  for (const family of config.families) {
    const node = colors[family];
    if (!node) throw new Error(`palette: family ${family} not found`);
    const light = contrastRamp(family, node, "onLight");
    const dark = contrastRamp(family, node, "onDark");
    const steps = light.map(([s]) => s).join(",");
    if (steps !== dark.map(([s]) => s).join(",")) throw new Error(`palette: ${family} light/dark steps differ`);
    stepSet ??= steps;
    if (steps !== stepSet) throw new Error(`palette: ${family} steps (${steps}) differ from ${config.families[0]} (${stepSet})`);
    const name = kebab(family);
    light.forEach(([step, value], i) => {
      entries.push({ name: `${name}-${step}`, family: name, step, light: value, dark: dark[i][1] });
    });
  }
  return entries;
}

const paletteConfig = map.palette;
const palette = loadPalette(paletteConfig);
const palettePrefix = paletteConfig?.prefix ?? "tecton-palette";
const paletteVar = (e: PaletteEntry) => `--${palettePrefix}-${e.name}`;
const paletteReset = paletteConfig?.resetTailwind ?? true;
/** `@theme inline` entries of the palette, reset first. */
const paletteThemeEntries: [string, string][] = [
  ...(paletteReset && palette.length ? [["--color-*", "initial"] as [string, string]] : []),
  ...palette.map((e): [string, string] => [`--color-${e.name}`, `var(${paletteVar(e)})`]),
];
const PALETTE_IMPORT = '@import "./tecton-palette.css";';

/**
 * How many opaque colour tokens of the Tecton export are literal members of the
 * exposed ramps (per mode). Reported in TOKEN-MAPPING.md; the semantic tokens
 * are picks from these ramps, so a low number means the two exports drifted.
 */
function paletteCoverage(mode: "light" | "dark") {
  const values = new Set(palette.map((e) => e[mode]));
  const source = mode === "light" ? lightTokens : tokens;
  let total = 0;
  let member = 0;
  const misses: string[] = [];
  for (const [name, raw] of source) {
    if (!name.startsWith("--tecton-color-")) continue;
    const v = raw.trim().toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(v)) continue; // alpha and non-hex values are not ramp members
    total++;
    if (values.has(v)) member++;
    else misses.push(name);
  }
  return { total, member, misses };
}

function buildPaletteCss(): string {
  const lines: string[] = [];
  lines.push(
    `/* GENERATED by scripts/tokens-build.mts from tokens/${paletteConfig?.source ?? "tecton.tokens.json"} (Tecton Figma variables export, foundational/color) — do not edit */`
  );
  lines.push("/*");
  lines.push(" * Foundational colour ramps: one 23-step contrast ramp per family and mode. A step is");
  lines.push(" * the same perceived distance from the page background in light and dark, so a single");
  lines.push(" * utility (bg-red-140) is correct in both modes; the raw values switch with the mode.");
  lines.push(" * Tailwind's stock palette is reset so only Tecton colours can appear.");
  lines.push(" */");
  lines.push(":root,");
  lines.push('[data-theme="light"],');
  lines.push(".light {");
  for (const e of palette) lines.push(`  ${paletteVar(e)}: ${e.light};`);
  lines.push("}");
  lines.push("");
  lines.push(".dark,");
  lines.push('[data-theme="dark"] {');
  for (const e of palette) if (e.dark !== e.light) lines.push(`  ${paletteVar(e)}: ${e.dark};`);
  lines.push("}");
  lines.push("");
  lines.push("@theme inline {");
  for (const [k, v] of paletteThemeEntries) lines.push(`  ${k}: ${v};`);
  lines.push("}");
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// 1. tecton-theme.css
// ---------------------------------------------------------------------------
function buildThemeCss(): string {
  const lines: string[] = [];
  lines.push("/* GENERATED by scripts/tokens-build.mts from tokens/tecton.map.json — do not edit */");
  lines.push('@import "./tecton-tokens.css";');
  if (palette.length) lines.push(PALETTE_IMPORT);
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
  // the palette (raw ramps + Tailwind @theme with the stock reset) must come before
  // the semantic @theme inline block below, which the reset would otherwise wipe
  if (palette.length) {
    if (!css.includes(PALETTE_IMPORT)) css = css.replace(anchor, `${anchor}\n${PALETTE_IMPORT}`);
    anchor = PALETTE_IMPORT;
  } else css = css.replace(`${PALETTE_IMPORT}\n`, "");
  for (const imp of fontImports) {
    if (!css.includes(imp)) css = css.replace(anchor, `${anchor}\n${imp}`);
    anchor = imp;
  }
  // base rules that are not variable values (thin scrollbars…), see tecton-base.css
  if (!css.includes(BASE_IMPORT)) css = css.replace(anchor, `${anchor}\n${BASE_IMPORT}`);

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
  // raw palette ramps, then the semantic variables that pick from them
  for (const e of palette) {
    light[`${palettePrefix}-${e.name}`] = e.light;
    dark[`${palettePrefix}-${e.name}`] = e.dark;
  }
  const theme: Record<string, string> = {};
  // palette first: `color-*: initial` resets Tailwind's stock colours before the
  // Tecton ramps and the semantic --color-* entries are (re)declared
  for (const [k, v] of paletteThemeEntries) theme[k.replace(/^--/, "")] = v;
  for (const [k, v] of themeEntries) {
    // registry consumers have no --tecton-* tokens: resolve to literals, keep
    // --color-<extra> as a reference to the :root/.dark variable.
    theme[k.replace(/^--/, "")] = k.startsWith("--color-") ? v : resolveValue(v, tokens);
  }
  const css: Record<string, Record<string, unknown>> = {};
  for (const f of FONT_IMPORTS) css[`@import "${f}"`] = {};
  Object.assign(css, BASE_CSS);
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: "tecton",
    type: "registry:theme",
    title: "Tecton",
    description:
      "Tecton design tokens mapped onto the shadcn CSS variables (light and dark, from the Tecton CSS export), the Tecton colour ramps as the Tailwind palette (stock palette reset), Figtree + IBM Plex Mono via Fontsource.",
    dependencies: ["@fontsource/figtree", "@fontsource/ibm-plex-mono"],
    cssVars: { theme, light, dark },
    css,
  };
}

// ---------------------------------------------------------------------------
// 4. docs/TOKEN-MAPPING.md
// ---------------------------------------------------------------------------
function paletteSection(): string {
  if (!paletteConfig || !palette.length) return "";
  const families = [...new Set(palette.filter((e) => e.step).map((e) => e.family))];
  const steps = [...new Set(palette.filter((e) => e.step).map((e) => e.step as string))];
  const shades = palette.filter((e) => !e.step);
  const light = paletteCoverage("light");
  const dark = paletteCoverage("dark");
  const rows = families.map((f) => {
    const cells = steps.map((s) => {
      const e = palette.find((x) => x.family === f && x.step === s)!;
      return `\`${e.light}\`<br>\`${e.dark}\``;
    });
    return `| \`${f}\` | ${cells.join(" | ")} |`;
  });
  const misses = [...new Set([...light.misses, ...dark.misses])];
  return `
## Palette (Tailwind colour scale)

Source: \`packages/tecton-react/tokens/${paletteConfig.source}\` (Tecton Figma variables export, \`foundational/color\`).
${paletteConfig.note ?? ""}

Generated into \`src/styles/tecton-palette.css\`: \`--${palettePrefix}-<family>-<step>\` in \`:root\` / \`.dark\`
and \`--color-<family>-<step>\` in \`@theme inline\`${paletteReset ? ", after `--color-*: initial` (Tailwind's stock palette is removed)" : ""}.
Shades: ${shades.map((s) => `\`--color-${s.name}\` (\`${s.light}\`)`).join(", ")}.
Steps (contrast from the page background, both modes): ${steps.map((s) => `\`${s}\``).join(" ")}.

Coverage: ${light.member}/${light.total} opaque colour tokens of the CSS export are ramp members in light mode, ${dark.member}/${dark.total} in dark mode${misses.length ? ` (not on any exposed ramp: ${misses.map((m) => `\`${m}\``).join(", ")})` : ""}.

Values are light<br>dark.

| family | ${steps.join(" | ")} |
| --- |${steps.map(() => " --- |").join("")}
${rows.join("\n")}
`;
}

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

${paletteSection()}
## Contrast checks

\`pnpm --filter @tecton/react tokens:check\` verifies completeness, dangling \`var()\` references,
WCAG contrast for every surface/foreground pair and sanity rules for both modes.
${allow.length ? `Expected failures (Tecton's own values fail these pairs): ${allow.map((a) => `\`${a}\``).join(", ")}.` : "No expected failures are allow-listed."}

## Known deviations

Colours, radii and fonts come from the shadcn CSS variables above. Everything else Tecton-specific
about the generated components (focus ring, hover / pressed colours, flat controls, the extra
\`alert\`, \`badge\`, \`separator\`, \`input\`, \`textarea\` and \`select\` variants) lives in the
\`aria-tecton\` style overlay applied to the registry mirror (\`scripts/registry-mirror/overlay\`), so
the generated files still come unmodified from the CLI. What remains different from Tecton:

- **Focus ring inside a few base sources** — \`calendar\`, \`item\`, \`scroll-area\` and \`tabs\` hard-code
  \`ring-ring/50\` in the upstream source (not in the style file), so they keep the 50% alpha halo.
- **Status colours** — Tecton's success/error/warning/info/neutral roles have no shadcn equivalent
  beyond \`destructive\`; they are exposed as the extra tokens above and used by the overlay variants
  and by the custom components (\`count-badge\`, \`chip\`).
`;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
if (palette.length) {
  writeFileSync(PALETTE_CSS, buildPaletteCss());
  console.log(`[tokens-build] wrote ${path.relative(repoRoot, PALETTE_CSS)} (${palette.length} colours)`);
}
writeFileSync(THEME_CSS, buildThemeCss());
console.log(`[tokens-build] wrote ${path.relative(repoRoot, THEME_CSS)}`);

if (patchGlobals()) console.log(`[tokens-build] patched ${path.relative(repoRoot, GLOBALS_CSS)}`);

mkdirSync(path.dirname(REGISTRY_THEME), { recursive: true });
writeFileSync(REGISTRY_THEME, JSON.stringify(buildRegistryTheme(), null, 2) + "\n");
console.log(`[tokens-build] wrote ${path.relative(repoRoot, REGISTRY_THEME)}`);

mkdirSync(path.dirname(MAPPING_DOC), { recursive: true });
writeFileSync(MAPPING_DOC, buildMappingDoc());
console.log(`[tokens-build] wrote ${path.relative(repoRoot, MAPPING_DOC)}`);
