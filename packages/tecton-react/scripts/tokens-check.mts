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
 * Pairs listed in tecton.map.json `checks.allow` are reported as expected failures and
 * do not fail the run.
 */
/// <reference types="node" />
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { converter, parse, wcagContrast } from "culori";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const TOKENS_CSS = path.join(pkgRoot, "src/styles/tecton-tokens.css");
const THEME_CSS = path.join(pkgRoot, "src/styles/tecton-theme.css");
const PALETTE_CSS = path.join(pkgRoot, "src/styles/tecton-palette.css");
const MAP_JSON = path.join(pkgRoot, "tokens/tecton.map.json");
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
const map = JSON.parse(readFileSync(MAP_JSON, "utf8")) as {
  shadcn: Record<string, unknown>;
  extra: Record<string, unknown>;
  checks?: { allow?: string[] };
  palette?: { prefix?: string; resetTailwind?: boolean; families: string[]; shades?: string[] };
};
const allow = new Set(map.checks?.allow ?? []);

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------
type Mode = "light" | "dark";
const modes: Record<Mode, Map<string, string>> = { light, dark };

function resolve(value: string, scope: Map<string, string>, depth = 0): string {
  if (depth > 16) throw new Error(`var() too deep: ${value}`);
  const tokens = scope === light ? themedTokens.light : themedTokens.dark;
  return value.replace(/var\((--[\w-]+)(?:\s*,\s*([^)]*))?\)/g, (_, name: string, fallback?: string) => {
    const v = scope.get(name) ?? tokens.get(name);
    if (v === undefined) {
      if (fallback !== undefined) return resolve(fallback.trim(), scope, depth + 1);
      throw new Error(`dangling var(${name})`);
    }
    return resolve(v, scope, depth + 1);
  });
}

const toOklch = converter("oklch");
const toRgb = converter("rgb");

/** Resolved colour for a variable in a mode, composited over `over` if it has alpha. */
function color(mode: Mode, name: string, over?: string) {
  const raw = modes[mode].get(`--${name}`);
  if (raw === undefined) return undefined;
  const lit = resolve(raw, modes[mode]);
  const parsed = parse(lit);
  if (!parsed) return undefined;
  const rgb = toRgb(parsed);
  const alpha = rgb.alpha ?? 1;
  if (alpha < 1 && over) {
    const bg = toRgb(parse(over)!);
    return {
      mode: "rgb" as const,
      r: rgb.r * alpha + bg.r * (1 - alpha),
      g: rgb.g * alpha + bg.g * (1 - alpha),
      b: rgb.b * alpha + bg.b * (1 - alpha),
    };
  }
  return { mode: "rgb" as const, r: rgb.r, g: rgb.g, b: rgb.b };
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

// completeness + dangling var()
const expected = [...Object.keys(map.shadcn), ...Object.keys(map.extra)];
for (const mode of ["light", "dark"] as Mode[]) {
  for (const name of expected) {
    if (name === "radius" && mode === "dark") continue; // non-colour, :root only
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

const NON_TEXT: [string, string, number, "warn" | "fail"][] = [
  ["background", "border", 1.5, "warn"],
  ["background", "input", 1.5, "warn"],
  ["background", "ring", 3, "fail"],
  ["sidebar", "sidebar-border", 1.5, "warn"],
  ["sidebar", "sidebar-ring", 3, "fail"],
];

const fmt = (n: number) => n.toFixed(2);

for (const mode of ["light", "dark"] as Mode[]) {
  const bgLit = literal(mode, "background");
  for (const [bg, fg, min] of CONTRAST_PAIRS) {
    const b = color(mode, bg, bgLit);
    const f = color(mode, fg, literal(mode, bg));
    if (!b || !f) {
      results.push({ mode, check: `contrast ${bg}/${fg}`, value: "n/a", threshold: `≥ ${min}:1`, status: "fail", detail: "unresolvable colour" });
      continue;
    }
    const ratio = wcagContrast(b, f);
    const key = `${bg}/${fg}`;
    const allowed = allow.has(key) || allow.has(`${mode}:${key}`);
    const status: Status = ratio >= min ? "pass" : allowed ? "expected-fail" : "fail";
    results.push({ mode, check: `contrast ${key}`, value: `${fmt(ratio)}:1`, threshold: `≥ ${min}:1`, status, detail: `${literal(mode, bg)} / ${literal(mode, fg)}` });
  }
  for (const [bg, fg, min, severity] of NON_TEXT) {
    const b = color(mode, bg, bgLit);
    const f = color(mode, fg, literal(mode, bg));
    if (!b || !f) {
      results.push({ mode, check: `contrast ${bg}/${fg}`, value: "n/a", threshold: `≥ ${min}:1`, status: "fail", detail: "unresolvable colour" });
      continue;
    }
    const ratio = wcagContrast(b, f);
    const key = `${bg}/${fg}`;
    const allowed = allow.has(key) || allow.has(`${mode}:${key}`);
    const status: Status = ratio >= min ? "pass" : severity === "warn" ? "warn" : allowed ? "expected-fail" : "fail";
    results.push({ mode, check: `contrast ${key} (non-text)`, value: `${fmt(ratio)}:1`, threshold: `≥ ${min}:1${severity === "warn" ? " (report only)" : ""}`, status, detail: `${literal(mode, bg)} / ${literal(mode, fg)}` });
  }

  // sanity: lightness ordering
  const L = (name: string) => {
    const c = color(mode, name, bgLit);
    return c ? toOklch(c).l : NaN;
  };
  const lBg = L("background");
  const lFg = L("foreground");
  const lMuted = L("muted-foreground");
  const orderOk = mode === "dark" ? lBg < lFg : lBg > lFg;
  results.push({
    mode,
    check: mode === "dark" ? "L(background) < L(foreground)" : "L(background) > L(foreground)",
    value: `${lBg.toFixed(3)} vs ${lFg.toFixed(3)}`,
    threshold: "ordering",
    status: orderOk ? "pass" : "fail",
  });
  const between = mode === "dark" ? lBg < lMuted && lMuted < lFg : lFg < lMuted && lMuted < lBg;
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
if (map.palette && existsSync(PALETTE_CSS)) {
  const paletteCss = stripComments(readFileSync(PALETTE_CSS, "utf8"));
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
  for (const mode of ["light", "dark"] as Mode[]) {
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
