/**
 * tokens-build — generates the Tecton shadcn theme from `tokens/tecton.map.json`.
 *
 *   bun run scripts/tokens-build.mts        (or: tsx scripts/tokens-build.mts)
 *
 * Inputs
 *   src/styles/tecton-tokens.css   generated Tecton export: light (:root) + dark (.dark) tokens
 *   tokens/tecton.map.json         shadcn variable → Tecton token mapping (per mode) + palette config
 *   tokens/tecton.tokens.json      Tecton Figma variables export (DTCG JSON): the foundational colour ramps
 *   shadcn/tailwind.css            installed shadcn stylesheet, vendored (scripts/vendor-shadcn-css.mts)
 *
 * Outputs
 *   src/styles/shadcn.css          vendored copy of shadcn/tailwind.css (so consumers need no CLI)
 *   src/styles/tecton-palette.css  :root / .dark raw ramp values + @theme inline (Tailwind palette, stock reset)
 *   src/styles/tecton-theme.css    :root / .dark / .light (var() refs) / @theme inline
 *   src/styles/scoped.css          utilities-only entry for micro-frontend remotes (no preflight, no
 *                                  fonts, no variables: @theme inline with a fallback chain per token)
 *   src/styles/scoped-theme.css    opt-in [data-tecton-root] variable blocks for a remote without a shell
 *   src/styles/globals.css         CLI-managed file, patched in place (values, imports, dark
 *                                  variant, the .light block)
 *   src/styles/tecton-base.css     hand-authored base rules (thin scrollbars), import kept in globals.css
 *   registry/theme.json            shadcn `registry:theme` item with literal values
 *   ../../docs/TOKEN-MAPPING.md    mapping table + known deviations
 *
 * The map is validated against tokens/tecton.map.schema.json first. Parsing,
 * resolution and the globals.css block helpers live in scripts/tokens-lib.mts,
 * which tokens-check.mts shares.
 *
 * Env: GLOBALS_CSS=<path> overrides the globals.css location (used by tests).
 */
/// <reference types="node" />
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DARK_MARK,
  LIGHT_BLOCK,
  LIGHT_MARK,
  SCOPED_DARK,
  SCOPED_LIGHT,
  SCOPED_ROOT,
  type Block,
  type JsonSchema,
  type PaletteConfig,
  type Resolved,
  findBlock,
  isColorValue,
  isStaleThemeEntry,
  parseCustomProperties,
  parseThemedTokens,
  parseTokenMap,
  patchBlock,
  readsTectonToken,
  resolveTokenMap,
  resolveValue,
  rootOnly,
} from "./tokens-lib.mjs";
import { VENDORED_CSS as SHADCN_CSS, vendorShadcnCss } from "./vendor-shadcn-css.mjs";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const repoRoot = path.resolve(pkgRoot, "..", "..");

const TOKENS_CSS = path.join(pkgRoot, "src/styles/tecton-tokens.css");
const MAP_JSON = path.join(pkgRoot, "tokens/tecton.map.json");
const MAP_SCHEMA = path.join(pkgRoot, "tokens/tecton.map.schema.json");
const THEME_CSS = path.join(pkgRoot, "src/styles/tecton-theme.css");
const SCOPED_CSS = path.join(pkgRoot, "src/styles/scoped.css");
const SCOPED_THEME_CSS = path.join(pkgRoot, "src/styles/scoped-theme.css");
const PALETTE_CSS = path.join(pkgRoot, "src/styles/tecton-palette.css");
const GLOBALS_CSS = process.env.GLOBALS_CSS ?? path.join(pkgRoot, "src/styles/globals.css");
const REGISTRY_THEME = path.join(pkgRoot, "registry/theme.json");
const MAPPING_DOC = path.join(repoRoot, "docs/TOKEN-MAPPING.md");

// The shadcn stylesheet globals.css imports is vendored first: the import is
// rewritten to the local copy below, so the shadcn CLI stays a devDependency.
const vendoredShadcn = vendorShadcnCss();
console.log(
  `[tokens-build] ${vendoredShadcn.changed ? "wrote" : "unchanged"} ${path.relative(repoRoot, SHADCN_CSS)} (shadcn@${vendoredShadcn.version})`
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
/** One palette colour: a shade (`white`) or a ramp step (`red-140`), with its value per mode. */
interface PaletteEntry {
  name: string; // CSS suffix: white | red-140
  family: string; // white | red
  step?: string; // 140
  light: string;
  dark: string;
}

/** Fontsource stylesheets registering the families named by the Tecton font tokens. */
const FONT_IMPORTS = [
  "@fontsource/figtree/400.css",
  "@fontsource/figtree/500.css",
  "@fontsource/ibm-plex-mono/400.css",
  "@fontsource/ibm-plex-mono/500.css",
];

/** The vendored shadcn stylesheet, replacing `@import "shadcn/tailwind.css";` in globals.css. */
const SHADCN_IMPORT = `@import "./${path.basename(SHADCN_CSS)}";`;
/** What the shadcn CLI writes, and what the import above replaces. */
const UPSTREAM_SHADCN_IMPORT = '@import "shadcn/tailwind.css";';
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
const map = parseTokenMap(
  readFileSync(MAP_JSON, "utf8"),
  JSON.parse(readFileSync(MAP_SCHEMA, "utf8")) as JsonSchema,
  path.relative(repoRoot, MAP_JSON),
);
const overrides = map.light.overrides ?? {};

const { resolved, byName, extraNames, themeEntries } = resolveTokenMap(map, themed);

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
// The theme markers
// ---------------------------------------------------------------------------
/**
 * DARK_MARK / LIGHT_MARK (tokens-lib.mts) are the theme markers, and LIGHT_BLOCK
 * the selector of the light block, repeated after `.dark` in every file that
 * declares the shadcn variables.
 *
 * A custom property's computed value is its specified value **with `var()` already
 * substituted**, resolved on the element that declares it — which is why `.dark`
 * repeats the `:root` declarations verbatim rather than being able to leave them to
 * inheritance. The same is true in the other direction: without a light block a
 * `.light` element inside a dark page re-declares the raw `--tecton-*` tokens (they
 * are keyed on the marker in the export and in the palette) but inherits `--primary`
 * and friends already substituted from the dark values above it, so the section
 * renders half dark.
 *
 * Both blocks are a single class or attribute — (0,1,0) either way — and the light
 * one is emitted **last**, so an element that somehow carries both markers reads
 * light, exactly as `scoped-theme.css` orders its blocks.
 */

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
  // the same declarations as :root, so an inverted section re-substitutes them
  lines.push(`${LIGHT_BLOCK} {`);
  for (const r of resolved) lines.push(`  --${r.name}: ${r.light};`);
  lines.push("}");
  lines.push("");
  lines.push("@theme inline {");
  for (const [k, v] of themeEntries) lines.push(`  ${k}: ${v};`);
  lines.push("}");
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// 2. scoped.css (utilities-only remote entry) + scoped-theme.css (opt-in theme)
// ---------------------------------------------------------------------------
// SCOPED_ROOT, SCOPED_DARK and SCOPED_LIGHT (the root marker `<ThemeRoot>` sets,
// and when it reads dark or light again) are shared with tokens-check.mts.

/**
 * The `dark:` utility variant, written into globals.css and scoped.css alike (the
 * two must agree, or a remote and its shell disagree about what `dark:` means).
 *
 * The shadcn CLI hard-codes `&:is(.dark *)` — descendants of a dark marker, with no
 * way to leave it again. An inverted section (`<div class="light">` in a dark page,
 * `<ThemeRoot theme="light">` in a dark shell) switches the tokens under it but not
 * the variants, so the section renders half dark. The variant below matches an
 * element whose **nearest** theme marker is dark instead:
 *
 *   - subject: a descendant of a dark marker, exactly as before (the marker element
 *     itself never matched and still does not);
 *   - minus: anything at or below a light marker that sits *inside* that dark one —
 *     `<dark> <light>` and `<dark> <light> *`, not a bare `<light> *`, which would
 *     also cancel a dark island inside a page whose root is explicitly `.light`
 *     (what next-themes writes for the light theme).
 *
 * One inversion level: a dark island inside a light island inside a dark page is
 * not supported (see the theming docs). `:where()` keeps the whole thing at the
 * specificity of the utility class alone, `:not()` included.
 */
const DARK_VARIANT =
  `@custom-variant dark (&:where(.dark *, [data-theme="dark"] *)` +
  `:not(:where(:is(${DARK_MARK}) :is(${LIGHT_MARK}), :is(${DARK_MARK}) :is(${LIGHT_MARK}) *)));`;

/**
 * Every theme variable of one mode in a stable order — the raw Tecton export,
 * the palette ramps, then the shadcn variables that reference them — declared on
 * the root marker instead of `:root`. `tecton-tokens.css` and `tecton-palette.css`
 * are keyed on `:root`/`.dark` and cannot be reused under `@scope`, so their
 * values are inlined here. Non-colour shadcn variables (`--radius`) are skipped
 * in dark, exactly as buildThemeCss does.
 */
function scopedDecls(mode: "light" | "dark"): string[] {
  const lines = [`  color-scheme: ${mode};`];
  for (const [name, value] of mode === "light" ? lightTokens : tokens) lines.push(`  ${name}: ${value};`);
  for (const e of palette) lines.push(`  ${paletteVar(e)}: ${e[mode]};`);
  for (const r of resolved) {
    if (mode === "dark" && rootOnly(r)) continue;
    lines.push(`  --${r.name}: ${mode === "light" ? r.light : r.dark};`);
  }
  return lines;
}

/**
 * The `@theme inline` entries the remote needs to compile the library's utilities:
 * the whole block of globals.css, where the CLI writes the standard shadcn mappings
 * (`--color-background`, `--radius-*`, `--font-sans`…) and tokens-build patches the
 * Tecton ones in — this run's values win — plus any entry the block lacks.
 */
function scopedThemeEntries(): [string, string][] {
  const owned = new Map(themeEntries);
  const seen = new Set<string>();
  const entries: [string, string][] = [];
  if (existsSync(GLOBALS_CSS)) {
    const css = readFileSync(GLOBALS_CSS, "utf8");
    const block = findBlock(css, "@theme inline");
    if (block) {
      // what :root declares once patchGlobals has run: the map's variables and
      // the CLI's own, not a leftover the prune there is about to remove
      const rootNames = new Set(resolved.map((r) => `--${r.name}`));
      const root = findBlock(css, ":root");
      if (root) {
        for (const [k, v] of parseCustomProperties(css.slice(root.start + 1, root.end))) {
          if (!readsTectonToken(v)) rootNames.add(k);
        }
      }
      for (const [k, v] of parseCustomProperties(css.slice(block.start + 1, block.end))) {
        if (!owned.has(k) && isStaleThemeEntry(k, v, rootNames)) continue; // pruned from globals.css
        entries.push([k, owned.get(k) ?? v]);
        seen.add(k);
      }
    }
  }
  for (const [k, v] of themeEntries) if (!seen.has(k)) entries.push([k, v]);
  return entries;
}

/**
 * The `@theme inline` entries of scoped.css in emission order (the palette reset
 * first, so it cannot wipe the semantic entries), before the fallbacks below are
 * added. Read once, before globals.css is patched, exactly as before.
 */
const scopedThemeRaw: [string, string][] = [...paletteThemeEntries, ...scopedThemeEntries()];
/** Where `lightDefinition` looks up a theme entry that references another one. */
const scopedThemeValues = new Map(scopedThemeRaw);
/** Light values of the palette ramps, keyed by their custom-property name. */
const paletteLight = new Map(palette.map((e): [string, string] => [paletteVar(e), e.light]));
/** Dark values of the palette ramps, keyed by their custom-property name. */
const paletteDark = new Map(palette.map((e): [string, string] => [paletteVar(e), e.dark]));

/** A value that is exactly one reference and nothing else — no fallback, no list, no calc(). */
const BARE_VAR = /^var\(\s*(--[\w-]+)\s*\)$/;
/** How many links of a var() chain the fallback spells out. */
const FALLBACK_DEPTH = 4;
/** References left bare because no light literal could be resolved (reported at the end). */
const unresolvedFallbacks = new Set<string>();

/**
 * Where a variable gets its value for one mode from: the shadcn mapping, a palette
 * ramp, the raw Tecton export, or another `@theme inline` entry (`--font-heading`).
 * Non-colour shadcn variables (`--radius`) are declared in `:root` only, so their
 * light definition is their definition in both modes.
 */
function definitionFor(name: string, mode: "light" | "dark"): string | undefined {
  const shadcn = byName.get(name.replace(/^--/, ""));
  if (shadcn) return mode === "dark" && !rootOnly(shadcn) ? shadcn.dark : shadcn.light;
  return (
    (mode === "light" ? paletteLight : paletteDark).get(name) ??
    (mode === "light" ? lightTokens : tokens).get(name) ??
    scopedThemeValues.get(name)
  );
}

/** The literal `name` resolves to in one mode, following a chain of bare references. */
function literalFor(name: string, mode: "light" | "dark", depth: number): string | undefined {
  if (depth > FALLBACK_DEPTH) return undefined;
  const definition = definitionFor(name, mode);
  if (definition === undefined) return undefined;
  const next = BARE_VAR.exec(definition.trim());
  if (next) return literalFor(next[1], mode, depth + 1);
  try {
    return resolveValue(definition, mode === "light" ? lightTokens : tokens);
  } catch {
    return undefined; // dangling reference: leave the entry bare
  }
}

/**
 * The literal the chain for `name` ends in. A colour whose two modes differ is
 * emitted as `light-dark(<light>, <dark>)`: the shell's tokens declare
 * `color-scheme` per mode, so the fallback follows the shell even when the shell
 * is too old to know the variable itself, and a remote with no Tecton shell at all
 * resolves it light — the value this ended in before. Everything else (a colour
 * both modes agree on, a radius, a font) stays a single literal.
 */
function terminalLiteral(name: string): string | undefined {
  const lightLit = literalFor(name, "light", 1);
  if (lightLit === undefined) return undefined;
  const darkLit = literalFor(name, "dark", 1);
  if (darkLit === undefined || darkLit === lightLit) return lightLit;
  // light-dark() takes two <color>s; anything else keeps the light literal
  if (!isColorValue(lightLit) || !isColorValue(darkLit)) return lightLit;
  return `light-dark(${lightLit}, ${darkLit})`;
}

/** The nested `var(<next>, …)` chain for `name`, ending in `terminal`. */
function chainFor(name: string, depth: number, terminal: string): string | undefined {
  if (depth > FALLBACK_DEPTH) return undefined;
  const definition = definitionFor(name, "light");
  if (definition === undefined) return undefined;
  const next = BARE_VAR.exec(definition.trim());
  if (next) {
    const inner = chainFor(next[1], depth + 1, terminal);
    return inner === undefined ? undefined : `var(${next[1]}, ${inner})`;
  }
  return terminal;
}

/**
 * Give a `@theme inline` value the fallback chain that makes a remote survive a
 * shell that does not know the token: `var(--primary)` becomes
 * `var(--primary, var(--tecton-color-action-primary-bg, light-dark(#644a78, #5d4d68)))`.
 * The intermediate links are the raw Tecton tokens, which the shell declares per
 * mode; only the literal the chain ends in has to name both modes itself. Anything
 * that is not a single bare reference (an existing fallback, `calc()`, a font list,
 * `initial`) is left alone; scoped.css is the only file that carries these chains.
 */
function withFallback(value: string): string {
  const m = BARE_VAR.exec(value.trim());
  if (!m) return value;
  const terminal = terminalLiteral(m[1]);
  const fallback = terminal === undefined ? undefined : chainFor(m[1], 1, terminal);
  if (fallback === undefined) {
    unresolvedFallbacks.add(m[1]);
    return value;
  }
  return `var(${m[1]}, ${fallback})`;
}

function buildScopedCss(): string {
  const lines: string[] = [];
  lines.push("/* GENERATED by scripts/tokens-build.mts — scoped entry for micro-frontend remotes; do not edit */");
  lines.push("/*");
  lines.push(" * A Module Federation remote may run a different @tecton/react than its host, so it");
  lines.push(" * compiles its own Tailwind and wraps the output in `@scope (.mfe-a)`, where `:root`");
  lines.push(" * matches nothing. Import this instead of globals.css — after Tailwind's split imports");
  lines.push(" * (theme + utilities, no preflight, no fonts) — and mark the remote root with <ThemeRoot>.");
  lines.push(" *");
  lines.push(" * Utilities only: not one variable is declared here. The theme variables are inherited");
  lines.push(" * from the shell, which owns them — the tenant palette, its own --primary, the current");
  lines.push(" * mode — and a declaration on the remote's root would beat every one of them. Version");
  lines.push(" * skew is absorbed by the fallback chain each @theme inline entry carries instead: the");
  lines.push(" * raw Tecton token, then the literal this build was made with. A colour whose two modes");
  lines.push(" * differ ends in light-dark(<light>, <dark>), which follows the color-scheme the shell's");
  lines.push(" * own tokens declare per mode — so even a shell too old to know the variable puts the");
  lines.push(" * remote in the right mode, and a page with no Tecton shell at all resolves it light.");
  lines.push(" * (light-dark() needs Chrome 123, Safari 17.5, Firefox 120.)");
  lines.push(" *");
  lines.push(" * Add `./scoped-theme.css` after this file only for a remote with no Tecton shell to");
  lines.push(" * inherit from, or one that must deliberately run its own token set.");
  lines.push(" */");
  lines.push('@import "tw-animate-css";');
  lines.push(SHADCN_IMPORT);
  lines.push("");
  // the palette reset first (it wipes Tailwind's stock colours), then the semantic
  // entries; `inline` means utilities inline the value — var(--primary, …) — so the
  // shell's declaration, or the fallback, reaches the utility untouched
  lines.push("@theme inline {");
  for (const [k, v] of scopedThemeRaw) lines.push(`  ${k}: ${withFallback(v)};`);
  lines.push("}");
  lines.push("");
  lines.push(DARK_VARIANT);
  lines.push('@source "../**/*.{ts,tsx}";');
  lines.push("");
  // the border colour and the focus outline, which preflight would have put on
  // `html`/`body`; the page itself is the shell's to paint (see scoped-theme.css)
  lines.push("@layer base {");
  lines.push(`  ${SCOPED_ROOT},`);
  lines.push(`  ${SCOPED_ROOT} * {`);
  lines.push("    @apply border-border outline-ring/50;");
  lines.push("  }");
  lines.push("}");
  lines.push("");
  return lines.join("\n");
}

function buildScopedThemeCss(): string {
  const lines: string[] = [];
  lines.push("/* GENERATED by scripts/tokens-build.mts — opt-in theme for micro-frontend remotes; do not edit */");
  lines.push("/*");
  lines.push(" * The variable half of the scoped entry, imported AFTER ./scoped.css:");
  lines.push(" *");
  lines.push(' *   @import "@tecton/react/styles/scoped.css";');
  lines.push(' *   @import "@tecton/react/styles/scoped-theme.css";');
  lines.push(" *");
  lines.push(" * Opt-in, and only for a remote that has no Tecton shell to inherit the theme from (a");
  lines.push(" * standalone demo, a test harness, an embed in a foreign page) or one that must run a");
  lines.push(" * different token set than its host. With a shell, importing this stops the remote from");
  lines.push(" * following it: a declaration on the root beats the value that would have been inherited.");
  lines.push(" */");
  lines.push("");
  // all three blocks are (0,1,0) thanks to :where(), so source order decides:
  // explicit-on-root > inherited from a dark ancestor > the light default
  const lightDecls = scopedDecls("light");
  lines.push(`${SCOPED_ROOT} {`, ...lightDecls, "}");
  lines.push("");
  lines.push(`${SCOPED_DARK} {`, ...scopedDecls("dark"), "}");
  lines.push("");
  lines.push(`${SCOPED_LIGHT} {`, ...lightDecls, "}");
  lines.push("");
  // owning the theme means painting the page too
  lines.push("@layer base {");
  lines.push(`  ${SCOPED_ROOT} {`);
  lines.push("    @apply bg-background text-foreground;");
  lines.push("    scrollbar-width: thin;");
  lines.push("    scrollbar-color: var(--border) transparent;");
  lines.push("  }");
  lines.push("}");
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// 3. globals.css (surgical patch)
// ---------------------------------------------------------------------------
function patchGlobals(): boolean {
  if (!existsSync(GLOBALS_CSS)) {
    console.warn(`[tokens-build] warning: ${path.relative(repoRoot, GLOBALS_CSS)} not found — skipping globals.css patch`);
    return false;
  }
  let css = readFileSync(GLOBALS_CSS, "utf8");
  const nl = css.includes("\r\n") ? "\r\n" : "\n";

  // -- imports -------------------------------------------------------------
  const animateImport = '@import "tw-animate-css";';
  const tokensImport = '@import "./tecton-tokens.css";';
  const interImport = '@import "@fontsource-variable/inter";';
  const legacyFigtree = '@import "@fontsource-variable/figtree";';
  const legacyMono = '@import "@fontsource/ibm-plex-mono";';
  const fontImports = FONT_IMPORTS.map((f) => `@import "${f}";`);

  // the CLI writes `@import "shadcn/tailwind.css";`, which would make the whole
  // shadcn CLI a runtime dependency of every consumer: point it at the vendored
  // copy instead (scripts/vendor-shadcn-css.mts)
  if (css.includes(UPSTREAM_SHADCN_IMPORT)) css = css.replace(UPSTREAM_SHADCN_IMPORT, SHADCN_IMPORT);
  else if (!css.includes(SHADCN_IMPORT)) {
    if (!css.includes(animateImport)) throw new Error(`globals.css: cannot find ${animateImport} to anchor ${SHADCN_IMPORT}`);
    css = css.replace(animateImport, `${animateImport}${nl}${SHADCN_IMPORT}`);
  }

  if (!css.includes(tokensImport)) {
    if (!css.includes(SHADCN_IMPORT)) throw new Error(`globals.css: cannot find ${SHADCN_IMPORT} to anchor ${tokensImport}`);
    css = css.replace(SHADCN_IMPORT, `${SHADCN_IMPORT}${nl}${tokensImport}`);
  }
  for (const legacy of [interImport, legacyFigtree, legacyMono]) css = css.replace(`${legacy}${nl}`, "");
  let anchor = tokensImport;
  // the palette (raw ramps + Tailwind @theme with the stock reset) must come before
  // the semantic @theme inline block below, which the reset would otherwise wipe
  if (palette.length) {
    if (!css.includes(PALETTE_IMPORT)) css = css.replace(anchor, `${anchor}${nl}${PALETTE_IMPORT}`);
    anchor = PALETTE_IMPORT;
  } else css = css.replace(`${PALETTE_IMPORT}${nl}`, "");
  for (const imp of fontImports) {
    if (!css.includes(imp)) css = css.replace(anchor, `${anchor}${nl}${imp}`);
    anchor = imp;
  }
  // base rules that are not variable values (thin scrollbars…), see tecton-base.css
  if (!css.includes(BASE_IMPORT)) css = css.replace(anchor, `${anchor}${nl}${BASE_IMPORT}`);

  // -- the dark variant ------------------------------------------------------
  // The CLI creates this line once, from a string hard-coded in its own
  // `add-custom-variant` transform, and that transform is a no-op as soon as the
  // file holds any @custom-variant at all — so the line is the CLI's to write and
  // this generator's to keep correct and in step with scoped.css. Nothing in the
  // registry (`registry/theme.json`, the mirror overlay) owns it; see
  // docs/UPSTREAM.md, "The `dark:` variant".
  const variantLine = /^@custom-variant\s+dark\b[^\r\n]*/m;
  if (!variantLine.test(css)) throw new Error("globals.css: no @custom-variant dark line");
  css = css.replace(variantLine, DARK_VARIANT);

  // A variable the map no longer has is pruned: a declaration that reads a raw
  // Tecton token can only have come from the map (the CLI writes none), and a
  // mapped variable that is not a colour has no place in `.dark`.
  const pruned: string[] = [];
  const patch = (block: Block, values: Map<string, string>, append: string[], prune: (name: string, value: string) => boolean) => {
    const result = patchBlock(css, block, values, append, prune);
    pruned.push(...result.pruned);
    css = result.css;
  };

  // -- :root ----------------------------------------------------------------
  const rootValues = new Map(resolved.map((r) => [`--${r.name}`, r.light]));
  const rootBlock = findBlock(css, ":root");
  if (!rootBlock) throw new Error("globals.css: no :root block");
  patch(rootBlock, rootValues, extraNames.map((n) => `--${n}`), (_, value) => readsTectonToken(value));

  // -- .dark ----------------------------------------------------------------
  // only the colours: a non-colour variable (--radius) is declared in :root alone
  const darkValues = new Map(resolved.filter((r) => !rootOnly(r)).map((r) => [`--${r.name}`, r.dark]));
  const darkBlock = findBlock(css, ".dark");
  if (!darkBlock) throw new Error("globals.css: no .dark block");
  patch(
    darkBlock,
    darkValues,
    extraNames.filter((n) => darkValues.has(`--${n}`)).map((n) => `--${n}`),
    (name, value) => readsTectonToken(value) || rootValues.has(name) || value === "undefined",
  );

  // -- .light, [data-theme="light"] -------------------------------------------
  // A structural block the CLI does not write: shadcn's variables stop at `:root`
  // and `.dark`, which leaves an inverted *light* section reading the dark values
  // it inherits (see LIGHT_BLOCK). It is rebuilt from the patched `:root` body on
  // every run — same declarations, same order, same indentation — and placed right
  // after `.dark`, so at equal specificity source order gives light the win. See
  // docs/UPSTREAM.md, "The light block".
  const patchedRoot = findBlock(css, ":root");
  if (!patchedRoot) throw new Error("globals.css: no :root block");
  const rootBody = css.slice(patchedRoot.start + 1, patchedRoot.end);
  const existingLight = findBlock(css, LIGHT_BLOCK);
  if (existingLight) {
    css = css.slice(0, existingLight.start + 1) + rootBody + css.slice(existingLight.end);
  } else {
    const patchedDark = findBlock(css, ".dark");
    if (!patchedDark) throw new Error("globals.css: no .dark block");
    const after = patchedDark.end + 1; // just past the closing brace
    css = `${css.slice(0, after)}${nl}${nl}${LIGHT_BLOCK} {${rootBody}}${css.slice(after)}`;
  }

  // -- @theme inline --------------------------------------------------------
  const themeValues = new Map(themeEntries);
  const themeBlock = findBlock(css, "@theme inline");
  if (!themeBlock) throw new Error("globals.css: no @theme inline block");
  // an entry that reads a raw token, or `--color-<x>: var(--<x>)` for an <x> that
  // :root no longer declares, is one the map dropped (see isStaleThemeEntry)
  const rootNow = findBlock(css, ":root");
  if (!rootNow) throw new Error("globals.css: no :root block");
  const declared = parseCustomProperties(css.slice(rootNow.start + 1, rootNow.end));
  patch(themeBlock, themeValues, themeEntries.map(([k]) => k), (name, value) => isStaleThemeEntry(name, value, declared));

  writeFileSync(GLOBALS_CSS, css);
  if (pruned.length) {
    console.log(`[tokens-build] pruned from ${path.basename(GLOBALS_CSS)} (no longer in the map): ${[...new Set(pruned)].join(", ")}`);
  }
  return true;
}

// ---------------------------------------------------------------------------
// 4. registry/theme.json
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
  // `cssVars` can only reach `:root` (`light`) and `.dark` (`dark`) — the CLI maps
  // those two keys itself — so the light block an inverted section needs comes
  // through `css`, where a plain selector is appended to the root of the consumer's
  // stylesheet, after the `:root`/`.dark` rules the same run appends. Same
  // declarations as `light` above, literals like the rest of this file.
  css[LIGHT_BLOCK] = Object.fromEntries(Object.entries(light).map(([k, v]) => [`--${k}`, v]));
  // …and the variant that goes with it. The CLI writes its own stock
  // `@custom-variant dark (&:is(.dark *));` into a v4 stylesheet before it applies
  // this field, and it will not rewrite it, so the Tecton one is appended after it:
  // Tailwind takes the last definition of a variant name, and without it a consumer
  // would get the light block but keep `dark:` utilities applying inside it.
  css[DARK_VARIANT.replace(/;$/, "")] = {};
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
// 5. docs/TOKEN-MAPPING.md
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

\`pnpm --filter @tecton/react tokens:check\` verifies the map against its schema, that the
\`:root\`, \`.dark\` and \`@theme inline\` blocks of \`globals.css\` and \`tecton-theme.css\` hold exactly
what the map resolves to, completeness, dangling \`var()\` references, WCAG contrast for every
surface/foreground pair and sanity rules for both modes.
${allow.length ? `Expected failures (Tecton's own values fail these pairs): ${allow.map((a) => `\`${a}\``).join(", ")}.` : "No expected failures are allow-listed."}

## Known deviations

Colours, radii and fonts come from the shadcn CSS variables above. Everything else Tecton-specific
about the generated components (focus ring, hover / pressed colours, flat controls, the extra
\`alert\`, \`badge\`, \`separator\`, \`input\`, \`textarea\` and \`select\` variants) lives in the
\`base-tecton\` style overlay applied to the registry mirror (\`scripts/registry-mirror/overlay\`), so
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

writeFileSync(SCOPED_CSS, buildScopedCss());
const chains = scopedThemeRaw.map(([, v]) => withFallback(v));
const withChain = chains.filter((v, i) => v !== scopedThemeRaw[i][1]).length;
const withLightDark = chains.filter((v) => v.includes("light-dark(")).length;
console.log(
  `[tokens-build] wrote ${path.relative(repoRoot, SCOPED_CSS)} (utilities only: ${scopedThemeRaw.length} @theme inline entries, ${withChain} with a fallback chain, ${withLightDark} of them light-dark(), ${scopedThemeRaw.length - withChain} bare)`
);

writeFileSync(SCOPED_THEME_CSS, buildScopedThemeCss());
console.log(
  `[tokens-build] wrote ${path.relative(repoRoot, SCOPED_THEME_CSS)} (${lightTokens.size} tokens + ${palette.length} palette + ${resolved.length} shadcn vars on ${SCOPED_ROOT})`
);

if (patchGlobals()) console.log(`[tokens-build] patched ${path.relative(repoRoot, GLOBALS_CSS)}`);

mkdirSync(path.dirname(REGISTRY_THEME), { recursive: true });
writeFileSync(REGISTRY_THEME, JSON.stringify(buildRegistryTheme(), null, 2) + "\n");
console.log(`[tokens-build] wrote ${path.relative(repoRoot, REGISTRY_THEME)}`);

mkdirSync(path.dirname(MAPPING_DOC), { recursive: true });
writeFileSync(MAPPING_DOC, buildMappingDoc());
console.log(`[tokens-build] wrote ${path.relative(repoRoot, MAPPING_DOC)}`);

// a scoped.css entry without a fallback chain works, it just gives a remote nothing
// to fall back to when the shell does not know the token — worth knowing about
if (unresolvedFallbacks.size) {
  console.warn(
    `[tokens-build] warning: no light literal for ${unresolvedFallbacks.size} reference(s), left bare in ${path.basename(SCOPED_CSS)}: ${[...unresolvedFallbacks].join(", ")}`
  );
}
