/**
 * tokens-check — validates the generated Tecton shadcn theme.
 *
 *   bun run scripts/tokens-check.mts [--json]
 *
 * Reads src/styles/tecton-theme.css + src/styles/tecton-tokens.css, resolves every
 * var() reference for both modes and fails (exit 1) on:
 *   - a variable missing in either mode, or a dangling var() reference
 *   - WCAG contrast < 4.5:1 for surface/foreground pairs (destructive on background < 3:1)
 *   - ring vs background < 3:1 (border/input vs background < 1.5:1 is reported only)
 *   - sanity rules: dark L(background) < L(foreground) (light: the opposite);
 *     muted-foreground lightness between background and foreground
 *   - palette (src/styles/tecton-palette.css): the stock reset comes first, every
 *     --color-<family>-<step> resolves in both modes, both modes declare the same
 *     ramps, and every semantic colour is a literal member of an exposed ramp
 *     (except the ones allow-listed under `checks.allow` as `palette:<token>`)
 *   - opt-in scoped theme (src/styles/scoped-theme.css): the same variable/contrast/sanity
 *     checks run against its [data-tecton-root] blocks as the modes `scoped-light` and
 *     `scoped-dark`; the light block is repeated last unchanged and the shadcn variable
 *     names match tecton-theme.css
 *   - scoped entry (src/styles/scoped.css): utilities only — not one variable block (the
 *     `@layer base` border/outline rule is all that may name the root), no :root, no body
 *     rule, neither a tailwindcss nor a fontsource import, and an `@theme inline` block
 *     whose `--color-*: initial` reset comes first and whose every fallback chain ends in
 *     the literal of the outermost variable — `light-dark(<light>, <dark>)` when the two
 *     modes differ, the single literal when they agree (so the chains cannot drift from
 *     the token export); the entries left bare must be calc(), a font list or `initial`
 *   - the light block: `.light, [data-theme="light"]` mirrors `:root` declaration for
 *     declaration (same properties, values and order) and comes after `.dark`, in
 *     tecton-theme.css and globals.css alike, and rides along in registry/theme.json's
 *     `css` — without it an inverted light section keeps the dark values it inherits
 *   - the `dark:` variant: globals.css and scoped.css declare the same `@custom-variant
 *     dark`, it is the one tokens-build writes (not the CLI's stock line), and
 *     registry/theme.json ships it too
 *   - vendored shadcn stylesheet (src/styles/shadcn.css): present, its header names the
 *     installed shadcn version, its body is byte-identical to `shadcn/tailwind.css`,
 *     and globals.css imports the copy instead of the package
 *   - the map itself: tokens/tecton.map.json matches tokens/tecton.map.schema.json, and
 *     the `:root`, `.dark` and `@theme inline` blocks of globals.css and tecton-theme.css
 *     hold exactly what the map resolves to (scripts/tokens-lib.mts, the resolution
 *     tokens-build uses): every mapped variable present with its generated value, no
 *     non-colour variable in `.dark`, and nothing left over that reads a `--tecton-*`
 *     token the map no longer names — so a hand edit of globals.css (`--primary:
 *     #ff00ff`) or a stale build fails here instead of passing every contrast check
 * Pairs listed in tecton.map.json `checks.allow` are reported as expected failures and
 * do not fail the run.
 */
/// <reference types="node" />
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { converter, parse, wcagContrast } from "culori";
import {
  LIGHT_BLOCK,
  SCOPED_DARK,
  SCOPED_LIGHT,
  SCOPED_ROOT,
  type JsonSchema,
  type ResolvedMap,
  type Rgb,
  type TokenMap,
  blockDecls,
  blockDrift,
  compositeOver,
  describeDrift,
  expectedBlocks,
  isStaleThemeEntry,
  readsTectonToken,
  resolveTokenMap,
  resolveValue,
  validateAgainstSchema,
} from "./tokens-lib.mjs";
import { VENDORED_CSS, normalizeNewlines, parseVendored, readUpstream } from "./vendor-shadcn-css.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const TOKENS_CSS = path.join(pkgRoot, "src/styles/tecton-tokens.css");
const THEME_CSS = path.join(pkgRoot, "src/styles/tecton-theme.css");
const SCOPED_CSS = path.join(pkgRoot, "src/styles/scoped.css");
const SCOPED_THEME_CSS = path.join(pkgRoot, "src/styles/scoped-theme.css");
const PALETTE_CSS = path.join(pkgRoot, "src/styles/tecton-palette.css");
const GLOBALS_CSS = process.env.GLOBALS_CSS ?? path.join(pkgRoot, "src/styles/globals.css");
const MAP_JSON = path.join(pkgRoot, "tokens/tecton.map.json");
const MAP_SCHEMA = path.join(pkgRoot, "tokens/tecton.map.schema.json");
const asJson = process.argv.includes("--json");

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function parseDecls(body: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /(--[\w*-]+)\s*:\s*([^;]+);/g; // `*` for the `--color-*: initial` reset
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) out.set(m[1], m[2].trim());
  return out;
}

/** Return the body of the first top-level block with the given selector. */
function blockBody(css: string, selector: string): string {
  const re = new RegExp(`(^|[};\\s])${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{`, "m");
  const m = re.exec(css);
  if (!m) throw new Error(`block ${selector} not found`);
  const open = m.index + m[0].length - 1;
  let depth = 1;
  let j = open + 1;
  while (j < css.length && depth > 0) {
    if (css[j] === "{") depth++;
    else if (css[j] === "}") depth--;
    j++;
  }
  return css.slice(open + 1, j - 1);
}

/** Light (:root) and dark (.dark) token maps from the themed Tecton export. */
function parseThemedTokens(css: string) {
  const lightT = new Map<string, string>();
  const darkT = new Map<string, string>();
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open === -1) break;
    const selector = css.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    const body = parseDecls(css.slice(open + 1, j - 1));
    for (const [k, v] of body) (/dark/.test(selector) ? darkT : lightT).set(k, v);
    i = j;
  }
  for (const [k, v] of lightT) if (!darkT.has(k)) darkT.set(k, v);
  return { light: lightT, dark: darkT };
}
const themedTokens = parseThemedTokens(stripComments(readFileSync(TOKENS_CSS, "utf8")));
const themeCss = stripComments(readFileSync(THEME_CSS, "utf8"));
const light = parseDecls(blockBody(themeCss, ":root"));
const dark = parseDecls(blockBody(themeCss, ".dark"));

// The opt-in scoped theme declares the same variables on the remote's root marker
// instead of :root, so the checks below can run against it as two more modes. The
// scoped entry itself (scoped.css) declares none and is checked separately.
const scopedCss = stripComments(readFileSync(SCOPED_CSS, "utf8"));
const scopedThemeCss = stripComments(readFileSync(SCOPED_THEME_CSS, "utf8"));
const scopedLight = parseDecls(blockBody(scopedThemeCss, SCOPED_ROOT));
const scopedDark = parseDecls(blockBody(scopedThemeCss, SCOPED_DARK));
const scopedLightAgain = parseDecls(blockBody(scopedThemeCss, SCOPED_LIGHT));
/** The `@custom-variant dark` line of a stylesheet, exactly as written. */
const variantOf = (css: string) => /^@custom-variant\s+dark\b[^\r\n]*/m.exec(css)?.[0].trim();
const scopedVariant = variantOf(scopedCss);
const paletteCss = existsSync(PALETTE_CSS) ? stripComments(readFileSync(PALETTE_CSS, "utf8")) : "";
const map = JSON.parse(readFileSync(MAP_JSON, "utf8")) as TokenMap;
/** Schema violations of the map; reported below, and the map is not resolved when there are any. */
const schemaErrors = validateAgainstSchema(map, JSON.parse(readFileSync(MAP_SCHEMA, "utf8")) as JsonSchema);
/** What the map resolves to, exactly as tokens-build resolves it (undefined when it cannot be resolved). */
let resolvedMap: ResolvedMap | undefined;
let resolveError: string | undefined;
if (!schemaErrors.length) {
  try {
    resolvedMap = resolveTokenMap(map, themedTokens);
  } catch (e) {
    resolveError = (e as Error).message;
  }
}
const allow = new Set(map.checks?.allow ?? []);

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------
type Mode = "light" | "dark" | "scoped-light" | "scoped-dark";
const modes: Record<Mode, Map<string, string>> = { light, dark, "scoped-light": scopedLight, "scoped-dark": scopedDark };
/** Every mode the variable, contrast and sanity checks run against. */
const CHECK_MODES = Object.keys(modes) as Mode[];
/** The colour scheme a mode belongs to (a scoped mode shares its allow-list entries). */
const baseMode = (mode: Mode): "light" | "dark" => (mode.endsWith("dark") ? "dark" : "light");
/** The Tecton export a scope falls back to (the scoped blocks declare their own). */
const scopeTokens = new Map<Map<string, string>, Map<string, string>>([
  [light, themedTokens.light],
  [dark, themedTokens.dark],
  [scopedLight, themedTokens.light],
  [scopedDark, themedTokens.dark],
]);

/** Resolve `value` in a scope: its own declarations first, then the Tecton export. */
function resolve(value: string, scope: Map<string, string>): string {
  const tokens = scopeTokens.get(scope) ?? themedTokens.dark;
  return resolveValue(value, (name) => scope.get(name) ?? tokens.get(name));
}

const toOklch = converter("oklch");

/**
 * Resolved colour for a variable in a mode, as an opaque colour: a translucent
 * one is composited over `under`, which the caller has already made opaque.
 */
function color(mode: Mode, name: string, under?: Rgb) {
  const raw = modes[mode].get(`--${name}`);
  if (raw === undefined) return undefined;
  return compositeOver(resolve(raw, modes[mode]), under);
}

function literal(mode: Mode, name: string): string {
  return resolve(modes[mode].get(`--${name}`) ?? "", modes[mode]);
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------
type Status = "pass" | "fail" | "warn" | "expected-fail";
interface Check {
  mode: Mode | "both";
  check: string;
  value: string;
  threshold: string;
  status: Status;
  detail?: string;
}
const results: Check[] = [];

// the map: schema, then resolution
results.push({
  mode: "both",
  check: "tecton.map.json matches tecton.map.schema.json",
  value: schemaErrors.length ? `${schemaErrors.length} violation(s)` : "valid",
  threshold: "valid",
  status: schemaErrors.length ? "fail" : "pass",
  detail: schemaErrors.length ? schemaErrors.slice(0, 5).join("; ") : undefined,
});
results.push({
  mode: "both",
  check: "tecton.map.json resolves against the Tecton export",
  value: resolvedMap ? `${resolvedMap.resolved.length} variables` : "unresolved",
  threshold: "every token known",
  status: resolvedMap ? "pass" : "fail",
  detail: resolveError ?? (schemaErrors.length ? "fix the schema violations first" : undefined),
});

/** Non-colour variables (--radius) are declared in :root only. */
const isRootOnly = (name: string) =>
  resolvedMap ? resolvedMap.byName.get(name)?.isColor === false : name === "radius";

// completeness + dangling var()
const expected = [...Object.keys(map.shadcn), ...Object.keys(map.extra)];
for (const mode of CHECK_MODES) {
  for (const name of expected) {
    if (isRootOnly(name) && baseMode(mode) === "dark") continue; // non-colour, :root only
    const raw = modes[mode].get(`--${name}`);
    if (raw === undefined) {
      results.push({ mode, check: `defined --${name}`, value: "missing", threshold: "present", status: "fail" });
      continue;
    }
    try {
      resolve(raw, modes[mode]);
    } catch (e) {
      results.push({ mode, check: `resolvable --${name}`, value: String((e as Error).message), threshold: "no dangling var()", status: "fail" });
    }
  }
}

const CONTRAST_PAIRS: [string, string, number][] = [
  ["background", "foreground", 4.5],
  ["card", "card-foreground", 4.5],
  ["popover", "popover-foreground", 4.5],
  ["primary", "primary-foreground", 4.5],
  ["secondary", "secondary-foreground", 4.5],
  ["muted", "muted-foreground", 4.5],
  ["accent", "accent-foreground", 4.5],
  ["sidebar", "sidebar-foreground", 4.5],
  ["sidebar-primary", "sidebar-primary-foreground", 4.5],
  ["sidebar-accent", "sidebar-accent-foreground", 4.5],
  ["success", "success-foreground", 4.5],
  ["warning", "warning-foreground", 4.5],
  ["info", "info-foreground", 4.5],
  ["neutral", "neutral-foreground", 4.5],
  ["destructive", "destructive-foreground", 4.5],
  ["success-surface", "success-surface-foreground", 4.5],
  ["warning-surface", "warning-surface-foreground", 4.5],
  ["info-surface", "info-surface-foreground", 4.5],
  ["neutral-surface", "neutral-surface-foreground", 4.5],
  ["destructive-surface", "destructive-surface-foreground", 4.5],
  // status colours used as text on the page and card surfaces
  ["background", "success", 4.5],
  ["background", "warning", 4.5],
  ["background", "info", 4.5],
  ["card", "success", 4.5],
  ["card", "warning", 4.5],
  ["card", "info", 4.5],
  ["background", "destructive", 3],
];

// link text (Button variant=link, tab triggers) on the surfaces it sits on,
// for whichever of these the map defines
const mapped = new Set(expected);
for (const fg of ["link-foreground", "link-hover-foreground"]) {
  if (!mapped.has(fg)) continue;
  for (const bg of ["background", "card", "popover"]) {
    if (mapped.has(bg)) CONTRAST_PAIRS.push([bg, fg, 4.5]);
  }
}

const NON_TEXT: [string, string, number, "warn" | "fail"][] = [
  ["background", "border", 1.5, "warn"],
  ["background", "input", 1.5, "warn"],
  ["background", "ring", 3, "fail"],
  ["sidebar", "sidebar-border", 1.5, "warn"],
  ["sidebar", "sidebar-ring", 3, "fail"],
];

const fmt = (n: number) => n.toFixed(2);

for (const mode of CHECK_MODES) {
  // the page, then each surface over the page, then its foreground over that
  // surface: a translucent pair composites in the order it is painted
  const page = color(mode, "background");
  for (const [bg, fg, min] of CONTRAST_PAIRS) {
    const b = color(mode, bg, page);
    const f = b && color(mode, fg, b);
    if (!b || !f) {
      results.push({ mode, check: `contrast ${bg}/${fg}`, value: "n/a", threshold: `≥ ${min}:1`, status: "fail", detail: "unresolvable colour" });
      continue;
    }
    const ratio = wcagContrast(b, f);
    const key = `${bg}/${fg}`;
    const allowed = allow.has(key) || allow.has(`${mode}:${key}`) || allow.has(`${baseMode(mode)}:${key}`);
    const status: Status = ratio >= min ? "pass" : allowed ? "expected-fail" : "fail";
    results.push({ mode, check: `contrast ${key}`, value: `${fmt(ratio)}:1`, threshold: `≥ ${min}:1`, status, detail: `${literal(mode, bg)} / ${literal(mode, fg)}` });
  }
  for (const [bg, fg, min, severity] of NON_TEXT) {
    const b = color(mode, bg, page);
    const f = b && color(mode, fg, b);
    if (!b || !f) {
      results.push({ mode, check: `contrast ${bg}/${fg}`, value: "n/a", threshold: `≥ ${min}:1`, status: "fail", detail: "unresolvable colour" });
      continue;
    }
    const ratio = wcagContrast(b, f);
    const key = `${bg}/${fg}`;
    const allowed = allow.has(key) || allow.has(`${mode}:${key}`) || allow.has(`${baseMode(mode)}:${key}`);
    const status: Status = ratio >= min ? "pass" : severity === "warn" ? "warn" : allowed ? "expected-fail" : "fail";
    results.push({ mode, check: `contrast ${key} (non-text)`, value: `${fmt(ratio)}:1`, threshold: `≥ ${min}:1${severity === "warn" ? " (report only)" : ""}`, status, detail: `${literal(mode, bg)} / ${literal(mode, fg)}` });
  }

  // sanity: lightness ordering
  const L = (name: string) => {
    const c = color(mode, name, page);
    return c ? toOklch(c).l : NaN;
  };
  const lBg = L("background");
  const lFg = L("foreground");
  const lMuted = L("muted-foreground");
  const isDark = baseMode(mode) === "dark";
  const orderOk = isDark ? lBg < lFg : lBg > lFg;
  results.push({
    mode,
    check: isDark ? "L(background) < L(foreground)" : "L(background) > L(foreground)",
    value: `${lBg.toFixed(3)} vs ${lFg.toFixed(3)}`,
    threshold: "ordering",
    status: orderOk ? "pass" : "fail",
  });
  const between = isDark ? lBg < lMuted && lMuted < lFg : lFg < lMuted && lMuted < lBg;
  results.push({
    mode,
    check: "L(muted-foreground) between background and foreground",
    value: lMuted.toFixed(3),
    threshold: `(${Math.min(lBg, lFg).toFixed(3)}, ${Math.max(lBg, lFg).toFixed(3)})`,
    status: between ? "pass" : "fail",
  });
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
if (map.palette && paletteCss) {
  const ramps = parseThemedTokens(paletteCss); // :root (+ .light) and .dark blocks
  const prefix = `--${map.palette.prefix ?? "tecton-palette"}-`;
  const lightKeys = [...ramps.light.keys()].filter((k) => k.startsWith(prefix));
  const darkKeys = [...ramps.dark.keys()].filter((k) => k.startsWith(prefix));
  const sameKeys = lightKeys.length === darkKeys.length && lightKeys.every((k) => ramps.dark.has(k));
  results.push({
    mode: "both",
    check: "palette: light and dark declare the same ramps",
    value: `${lightKeys.length} / ${darkKeys.length}`,
    threshold: "equal sets",
    status: sameKeys ? "pass" : "fail",
  });

  // the @theme inline block: reset first, then one entry per ramp value
  const theme = parseDecls(blockBody(paletteCss, "@theme inline"));
  const themeKeys = [...theme.keys()];
  const reset = map.palette.resetTailwind ?? true;
  results.push({
    mode: "both",
    check: "palette: `--color-*: initial` precedes the ramps",
    value: themeKeys[0] === "--color-*" ? "first" : (themeKeys.indexOf("--color-*") === -1 ? "missing" : "not first"),
    threshold: reset ? "first entry" : "absent",
    status: reset ? (themeKeys[0] === "--color-*" ? "pass" : "fail") : (themeKeys.includes("--color-*") ? "fail" : "pass"),
  });
  let unresolved = 0;
  const paletteColors = new Map<string, string>(); // --color-x -> --tecton-palette-x
  for (const [k, v] of theme) {
    if (k === "--color-*") continue;
    const m = /^var\((--[\w-]+)\)$/.exec(v);
    if (!m || !ramps.light.has(m[1]) || !ramps.dark.has(m[1])) unresolved++;
    else paletteColors.set(k, m[1]);
  }
  results.push({
    mode: "both",
    check: "palette: every --color-<family>-<step> resolves in both modes",
    value: `${paletteColors.size} resolved, ${unresolved} unresolved`,
    threshold: "0 unresolved",
    status: unresolved ? "fail" : "pass",
  });
  const families = map.palette.families.length;
  const shades = map.palette.shades?.length ?? 0;
  const perFamily = families ? (paletteColors.size - shades) / families : 0;
  results.push({
    mode: "both",
    check: "palette: families × steps",
    value: `${families} families × ${perFamily} steps + ${shades} shades`,
    threshold: "integer steps",
    status: Number.isInteger(perFamily) && perFamily > 0 ? "pass" : "fail",
  });

  // every semantic colour token of the export is a literal pick from an exposed ramp
  for (const mode of ["light", "dark"] as ("light" | "dark")[]) {
    const values = new Set([...ramps[mode].entries()].filter(([k]) => k.startsWith(prefix)).map(([, v]) => v.toLowerCase()));
    const source = themedTokens[mode];
    const misses: string[] = [];
    let total = 0;
    for (const [name, raw] of source) {
      if (!name.startsWith("--tecton-color-")) continue;
      const v = raw.trim().toLowerCase();
      if (!/^#[0-9a-f]{6}$/.test(v)) continue;
      total++;
      if (!values.has(v)) misses.push(name);
    }
    const unexpected = misses.filter((m) => !allow.has(`palette:${m}`));
    const expected = misses.filter((m) => allow.has(`palette:${m}`));
    results.push({
      mode,
      check: "palette: semantic colours are ramp members",
      value: `${total - misses.length}/${total}`,
      threshold: "all (except allow-listed)",
      status: unexpected.length ? "fail" : expected.length ? "expected-fail" : "pass",
      detail: misses.length ? `off-ramp: ${misses.join(", ")}` : undefined,
    });
  }
}

// ---------------------------------------------------------------------------
// Scoped theme (src/styles/scoped-theme.css): the three variable blocks
// ---------------------------------------------------------------------------
{
  /** The shadcn variables of a block: everything that is not a raw Tecton token. */
  const shadcnVars = (decls: Map<string, string>) => [...decls.keys()].filter((k) => !k.startsWith("--tecton-")).sort();
  const sameNames = (a: string[], b: string[]) => a.length === b.length && a.every((n, i) => n === b[i]);
  for (const [selector, scoped, reference, label] of [
    [SCOPED_ROOT, scopedLight, light, ":root"],
    [SCOPED_DARK, scopedDark, dark, ".dark"],
  ] as [string, Map<string, string>, Map<string, string>, string][]) {
    const got = shadcnVars(scoped);
    const want = shadcnVars(reference);
    const missing = want.filter((n) => !got.includes(n));
    const extra = got.filter((n) => !want.includes(n));
    results.push({
      mode: "both",
      check: `scoped-theme: ${selector} declares the tecton-theme.css ${label} variables`,
      value: `${got.length} / ${want.length}`,
      threshold: "equal sets",
      status: sameNames(got, want) ? "pass" : "fail",
      detail: missing.length || extra.length ? `missing: ${missing.join(", ") || "—"}; extra: ${extra.join(", ") || "—"}` : undefined,
    });
  }

  // the light block is repeated last so that an explicitly light root inside a
  // dark host wins on source order; it must be the same declarations
  const repeated =
    scopedLightAgain.size === scopedLight.size && [...scopedLight].every(([k, v]) => scopedLightAgain.get(k) === v);
  results.push({
    mode: "both",
    check: `scoped-theme: ${SCOPED_LIGHT} repeats the root block`,
    value: `${scopedLightAgain.size} / ${scopedLight.size} declarations`,
    threshold: "identical",
    status: repeated ? "pass" : "fail",
  });
}

// ---------------------------------------------------------------------------
// Scoped entry (src/styles/scoped.css): utilities only
// ---------------------------------------------------------------------------
{
  // a declaration on the remote's root beats the value inherited from the shell,
  // so the entry declares nothing: only the @layer base border/outline rule may
  // name the root, and it does so as part of a selector list
  const declaresVars = /\[data-tecton-root\]\s*\{/.test(scopedCss);
  results.push({
    mode: "both",
    check: `scoped: no ${SCOPED_ROOT} variable block`,
    value: declaresVars ? "present" : "absent",
    threshold: "absent (the @layer base rule only)",
    status: declaresVars ? "fail" : "pass",
    detail: declaresVars ? "the shell owns the variables; move them to scoped-theme.css" : undefined,
  });

  // the remote compiles its own Tailwind and wraps the output in @scope: :root
  // matches nothing there, a body rule would leak out of the remote's subtree,
  // and preflight or fonts would be the host's to ship
  for (const [label, css] of [
    ["scoped", scopedCss],
    ["scoped-theme", scopedThemeCss],
  ] as [string, string][]) {
    const forbidden: [string, boolean][] = [
      [":root", /:root/.test(css)],
      ["body {", /\bbody\s*\{/.test(css)],
      ["tailwindcss import", /@import\s+["'][^"']*tailwindcss/.test(css)],
      ["fontsource import", /@import\s+["'][^"']*fontsource/.test(css)],
    ];
    for (const [what, present] of forbidden) {
      results.push({
        mode: "both",
        check: `${label}: no ${what}`,
        value: present ? "present" : "absent",
        threshold: "absent",
        status: present ? "fail" : "pass",
      });
    }
  }

  const scopedTheme = parseDecls(blockBody(scopedCss, "@theme inline"));
  const themeKeys = [...scopedTheme.keys()];
  results.push({
    mode: "both",
    check: "scoped: `--color-*: initial` precedes the ramps",
    value: themeKeys[0] === "--color-*" ? "first" : themeKeys.indexOf("--color-*") === -1 ? "missing" : "not first",
    threshold: "first entry",
    status: themeKeys[0] === "--color-*" ? "pass" : "fail",
  });

  // ---- the fallback chains -------------------------------------------------
  // `--color-primary: var(--primary, var(--tecton-color-action-primary-bg,
  // light-dark(#644a78, #5d4d68)))` lets a remote survive a shell that does not know
  // the token. The literal at the end of the chain must be what the token export
  // resolves the outermost variable to — both modes, as `light-dark()`, when they
  // differ — or the chains have drifted from tecton-theme.css.
  const themeInline = parseDecls(blockBody(themeCss, "@theme inline"));
  const rampPrefix = `--${map.palette?.prefix ?? "tecton-palette"}-`;
  const allRamps = paletteCss
    ? parseThemedTokens(paletteCss)
    : { light: new Map<string, string>(), dark: new Map<string, string>() };

  /** Where a variable of a chain gets its value for one mode from, in lookup order. */
  const modeValue = (name: string, mode: "light" | "dark"): string | undefined =>
    (mode === "light" ? light : dark).get(name) ??
    (name.startsWith(rampPrefix) ? allRamps[mode].get(name) : undefined) ??
    themedTokens[mode].get(name) ??
    themeInline.get(name);

  const VAR_WITH_FALLBACK = /^var\(\s*(--[\w-]+)\s*,\s*([\s\S]+)\)$/;
  /** The terminal literal when it names both modes. */
  const LIGHT_DARK = /^light-dark\(\s*([\s\S]+?)\s*,\s*([\s\S]+?)\s*\)$/;
  /** The outermost variable and the innermost fallback literal of a chain. */
  function chainOf(value: string): { outer: string; literal: string } | undefined {
    const m = VAR_WITH_FALLBACK.exec(value.trim());
    if (!m) return undefined;
    let literal = m[2].trim();
    for (let i = 0; i < 8; i++) {
      const inner = VAR_WITH_FALLBACK.exec(literal);
      if (!inner) break;
      literal = inner[2].trim();
    }
    return { outer: m[1], literal };
  }
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

  /** What the token export resolves `name` to in one mode, or undefined. */
  const wantFor = (name: string, mode: "light" | "dark"): string | undefined => {
    const definition = modeValue(name, mode);
    if (definition === undefined) return undefined;
    try {
      return resolve(definition, mode === "light" ? light : dark);
    } catch {
      return undefined;
    }
  };

  let chained = 0;
  let modeDependent = 0;
  const bare: string[] = [];
  const mismatched: string[] = [];
  for (const [name, value] of scopedTheme) {
    const chain = chainOf(value);
    if (!chain) {
      // documented exceptions only: calc(), a font list, `initial` — never a bare
      // reference, which would leave the remote with nothing to fall back to
      bare.push(`${name}: ${value}`);
      continue;
    }
    chained++;
    const wantLight = wantFor(chain.outer, "light");
    const wantDark = wantFor(chain.outer, "dark");
    // both modes named: the colour differs between them and the fallback has to
    // follow the shell's color-scheme rather than pin the remote to light
    const both = LIGHT_DARK.exec(chain.literal);
    if (both) {
      modeDependent++;
      if (wantLight === undefined || norm(wantLight) !== norm(both[1])) {
        mismatched.push(`${name} → light-dark(${both[1]}, …) (expected light ${wantLight ?? "unresolvable"})`);
      } else if (wantDark === undefined || norm(wantDark) !== norm(both[2])) {
        mismatched.push(`${name} → light-dark(…, ${both[2]}) (expected dark ${wantDark ?? "unresolvable"})`);
      } else if (norm(wantLight) === norm(wantDark)) {
        mismatched.push(`${name} → ${chain.literal} (the two modes agree: expected the single literal)`);
      }
      continue;
    }
    if (wantLight === undefined || norm(wantLight) !== norm(chain.literal)) {
      mismatched.push(`${name} → ${chain.literal} (expected ${wantLight ?? "unresolvable"})`);
    } else if (wantDark !== undefined && norm(wantDark) !== norm(wantLight) && parse(wantLight) && parse(wantDark)) {
      // a colour the export gives two values: the chain must name both or the
      // remote would pin itself to light under a dark shell that lacks the token
      mismatched.push(`${name} → ${chain.literal} (expected light-dark(${wantLight}, ${wantDark}))`);
    }
  }
  results.push({
    mode: "both",
    check: "scoped: every fallback chain ends in the literal(s) of the token export",
    value: `${chained} chained, ${modeDependent} light-dark(), ${mismatched.length} inconsistent`,
    threshold: "0 inconsistent",
    status: mismatched.length ? "fail" : "pass",
    detail: mismatched.slice(0, 5).join("; ") || undefined,
  });
  const unexpectedBare = bare.filter((entry) => /:\s*var\(\s*--[\w-]+\s*\)$/.test(entry));
  results.push({
    mode: "both",
    check: "scoped: entries without a fallback are calc(), a font list or `initial`",
    value: `${bare.length} bare, ${unexpectedBare.length} unexpected`,
    threshold: "0 unexpected",
    status: unexpectedBare.length ? "fail" : "pass",
    detail: unexpectedBare.length ? unexpectedBare.join("; ") : bare.map((b) => b.split(":")[0]).join(", "),
  });
}

// ---------------------------------------------------------------------------
// The map, as written: globals.css and tecton-theme.css hold what it resolves to
// ---------------------------------------------------------------------------
if (resolvedMap) {
  // tokens-build writes these values and nothing else may: a hand edit of
  // globals.css (the file consumers import) would otherwise pass every check
  // above, which read tecton-theme.css
  const want = expectedBlocks(resolvedMap);
  const globalsForDrift = existsSync(GLOBALS_CSS) ? stripComments(readFileSync(GLOBALS_CSS, "utf8")) : "";
  for (const [label, css] of [
    ["tecton-theme.css", themeCss],
    ["globals.css", globalsForDrift],
  ] as [string, string][]) {
    if (!css) continue;
    const rootDecls = blockDecls(css, ":root") ?? new Map<string, string>();
    const blocks: [string, Map<string, string>, (name: string, value: string) => boolean][] = [
      [":root", want.root, (_, value) => readsTectonToken(value)],
      // only colours: a non-colour variable is declared in :root alone
      [".dark", want.dark, (name, value) => readsTectonToken(value) || want.root.has(name) || value === "undefined"],
      [
        "@theme inline",
        want.theme,
        (name, value) => isStaleThemeEntry(name, value, rootDecls),
      ],
    ];
    for (const [selector, expectedDecls, isStale] of blocks) {
      const actual = blockDecls(css, selector);
      const drift = actual ? blockDrift(actual, expectedDecls, isStale) : [];
      const shown = drift.slice(0, 5).map(describeDrift).join("; ");
      results.push({
        mode: "both",
        check: `${label}: ${selector} holds what tecton.map.json resolves to`,
        value: actual === undefined ? "missing" : drift.length ? `${drift.length} different` : `${expectedDecls.size} identical`,
        threshold: "0 different",
        status: actual !== undefined && !drift.length ? "pass" : "fail",
        detail:
          actual === undefined
            ? "run tokens:build"
            : drift.length
              ? `${shown}${drift.length > 5 ? `; … ${drift.length - 5} more` : ""} — edit tecton.map.json and run tokens:build`
              : undefined,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// The light block: `.light, [data-theme="light"]` mirrors `:root`, after `.dark`
// ---------------------------------------------------------------------------
{
  // A custom property is substituted on the element that declares it, so an
  // inverted light section only re-reads the tokens if the whole `:root` set is
  // declared again on the marker. Same properties, same values, same order — and
  // after `.dark`, because both blocks weigh (0,1,0) and source order decides.
  const globalsRaw = existsSync(GLOBALS_CSS) ? readFileSync(GLOBALS_CSS, "utf8") : "";
  const globalsCss = stripComments(globalsRaw);
  for (const [label, css] of [
    ["theme", themeCss],
    ["globals.css", globalsCss],
  ] as [string, string][]) {
    if (!css) continue;
    let root: Map<string, string> | undefined;
    let mirror: Map<string, string> | undefined;
    try {
      root = parseDecls(blockBody(css, ":root"));
      mirror = parseDecls(blockBody(css, LIGHT_BLOCK));
    } catch {
      // one of the blocks is missing: reported as the failure below
    }
    const rootEntries = root ? [...root] : [];
    const mirrorEntries = mirror ? [...mirror] : [];
    const same =
      root !== undefined &&
      mirror !== undefined &&
      rootEntries.length === mirrorEntries.length &&
      rootEntries.every(([k, v], i) => mirrorEntries[i][0] === k && mirrorEntries[i][1] === v);
    const drift = rootEntries
      .map(([k, v], i) => {
        const got = mirrorEntries[i];
        if (!got) return `missing ${k}`;
        if (got[0] !== k) return `${k} vs ${got[0]} (order)`;
        if (got[1] !== v) return `${k}: ${got[1]} (expected ${v})`;
        return "";
      })
      .filter(Boolean);
    results.push({
      mode: "both",
      check: `${label}: ${LIGHT_BLOCK} mirrors :root declaration for declaration`,
      value: mirror === undefined ? "missing" : `${mirrorEntries.length} / ${rootEntries.length}`,
      threshold: "identical, in order",
      status: same ? "pass" : "fail",
      detail: same ? undefined : drift.slice(0, 5).join("; ") || "run tokens:build",
    });
    // the light block has to come last of the three, or a `.light` element that
    // also carries a dark marker would read dark
    const at = (selector: string) => css.indexOf(`${selector} {`);
    const darkAt = at(".dark");
    const lightAt = at(LIGHT_BLOCK);
    const ordered = darkAt !== -1 && lightAt > darkAt;
    results.push({
      mode: "both",
      check: `${label}: ${LIGHT_BLOCK} comes after .dark`,
      value: ordered ? "after" : "before or missing",
      threshold: "after",
      status: ordered ? "pass" : "fail",
    });
  }

  // registry consumers get :root and .dark from `cssVars`, which has no key for a
  // light marker, so the same block rides along in `css`
  const registryTheme = path.join(pkgRoot, "registry/theme.json");
  if (existsSync(registryTheme)) {
    const item = JSON.parse(readFileSync(registryTheme, "utf8")) as {
      cssVars?: { light?: Record<string, string> };
      css?: Record<string, Record<string, string>>;
    };
    const vars = Object.entries(item.cssVars?.light ?? {});
    const block = Object.entries(item.css?.[LIGHT_BLOCK] ?? {});
    const same =
      vars.length > 0 &&
      vars.length === block.length &&
      vars.every(([k, v], i) => block[i][0] === `--${k}` && block[i][1] === v);
    results.push({
      mode: "both",
      check: `registry/theme.json: css["${LIGHT_BLOCK}"] mirrors cssVars.light`,
      value: `${block.length} / ${vars.length}`,
      threshold: "identical, in order",
      status: same ? "pass" : "fail",
      detail: same ? undefined : "run tokens:build",
    });
    // and the variant that goes with it: the CLI writes its own stock line into a
    // consumer's stylesheet first and will not rewrite it, so this one is appended
    // after it and Tailwind takes the last definition of the name
    const variantKey = Object.keys(item.css ?? {}).find((k) => k.startsWith("@custom-variant dark"));
    const wanted = scopedVariant?.replace(/;$/, "");
    results.push({
      mode: "both",
      check: "registry/theme.json: css carries the same `dark` variant",
      value: variantKey === undefined ? "missing" : variantKey === wanted ? "identical" : "different",
      threshold: "identical to scoped.css",
      status: variantKey !== undefined && variantKey === wanted ? "pass" : "fail",
      detail: variantKey === wanted ? undefined : "run tokens:build",
    });
  }
}

// ---------------------------------------------------------------------------
// The `dark:` variant: the same line in globals.css and scoped.css
// ---------------------------------------------------------------------------
{
  // A shell and a remote that disagree about what `dark:` means paint the same
  // component two ways, so tokens-build writes one line into both files. The CLI's
  // stock `&:is(.dark *)` has no way out of a dark subtree, which is what the
  // `:not()` half adds: an inverted section follows its nearest theme marker.
  const globalsCss = existsSync(GLOBALS_CSS) ? readFileSync(GLOBALS_CSS, "utf8") : "";
  const inGlobals = variantOf(globalsCss);
  const inScoped = scopedVariant;
  results.push({
    mode: "both",
    check: "variant: globals.css and scoped.css declare the same `dark`",
    value: inGlobals === undefined || inScoped === undefined ? "missing" : inGlobals === inScoped ? "identical" : "different",
    threshold: "identical",
    status: inGlobals !== undefined && inGlobals === inScoped ? "pass" : "fail",
    detail: inGlobals === inScoped ? undefined : `globals.css: ${inGlobals ?? "—"}; scoped.css: ${inScoped ?? "—"}`,
  });
  const inverts = inGlobals?.includes(":not(") ?? false;
  results.push({
    mode: "both",
    check: "variant: `dark` stops at the nearest light marker",
    value: inverts ? "inverting" : "stock `&:is(.dark *)`",
    threshold: "inverting",
    status: inverts ? "pass" : "fail",
    detail: inverts ? undefined : "the shadcn CLI rewrote the line; run tokens:build",
  });
}

// ---------------------------------------------------------------------------
// Vendored shadcn stylesheet (src/styles/shadcn.css)
// ---------------------------------------------------------------------------
{
  const upstream = readUpstream();
  const exists = existsSync(VENDORED_CSS);
  results.push({
    mode: "both",
    check: `vendor: ${path.basename(VENDORED_CSS)} exists`,
    value: exists ? "present" : "missing",
    threshold: "present",
    status: exists ? "pass" : "fail",
    detail: exists ? undefined : "run tokens:build",
  });
  if (exists) {
    const { version, body } = parseVendored(readFileSync(VENDORED_CSS, "utf8"));
    results.push({
      mode: "both",
      check: "vendor: header names the installed shadcn version",
      value: version ?? "no header",
      threshold: upstream.version,
      status: version === upstream.version ? "pass" : "fail",
    });
    // compared through the newline normalisation, so a CRLF checkout still matches
    const want = normalizeNewlines(upstream.css);
    results.push({
      mode: "both",
      check: "vendor: body is byte-identical to shadcn/tailwind.css",
      value: body === want ? "identical" : `${body.length} vs ${want.length} chars`,
      threshold: "identical",
      status: body === want ? "pass" : "fail",
      detail: body === want ? undefined : "run tokens:build to re-vendor",
    });
  }
  const globals = existsSync(GLOBALS_CSS) ? readFileSync(GLOBALS_CSS, "utf8") : "";
  const vendoredImport = `@import "./${path.basename(VENDORED_CSS)}";`;
  results.push({
    mode: "both",
    check: `globals.css imports ${vendoredImport}`,
    value: globals.includes(vendoredImport) ? "present" : "missing",
    threshold: "present",
    status: globals.includes(vendoredImport) ? "pass" : "fail",
  });
  results.push({
    mode: "both",
    check: "globals.css does not import shadcn/tailwind.css",
    value: globals.includes('@import "shadcn/tailwind.css";') ? "present" : "absent",
    threshold: "absent",
    status: globals.includes('@import "shadcn/tailwind.css";') ? "fail" : "pass",
    detail: globals.includes('@import "shadcn/tailwind.css";') ? "the shadcn CLI would become a consumer dependency" : undefined,
  });
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const failed = results.filter((r) => r.status === "fail");
const expectedFail = results.filter((r) => r.status === "expected-fail");
const warned = results.filter((r) => r.status === "warn");

if (asJson) {
  console.log(JSON.stringify({ ok: failed.length === 0, results, summary: { failed: failed.length, expectedFail: expectedFail.length, warned: warned.length, total: results.length } }, null, 2));
} else {
  const icon: Record<Status, string> = { pass: "pass", fail: "FAIL", warn: "warn", "expected-fail": "expected fail" };
  console.log("| mode | check | value | threshold | status | detail |");
  console.log("| --- | --- | --- | --- | --- | --- |");
  for (const r of results) {
    console.log(`| ${r.mode} | ${r.check} | ${r.value} | ${r.threshold} | ${icon[r.status]} | ${r.detail ?? ""} |`);
  }
  console.log("");
  console.log(`${results.length} checks: ${failed.length} failed, ${expectedFail.length} expected failures, ${warned.length} warnings.`);
}

process.exit(failed.length ? 1 : 0);
