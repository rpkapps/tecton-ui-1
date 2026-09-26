/**
 * tokens-lib — what `tokens-build.mts` and `tokens-check.mts` share: parsing the
 * Tecton export, resolving `tokens/tecton.map.json` (validated against its
 * schema) into the shadcn variables, and reading and patching the blocks of
 * `globals.css`.
 *
 * Side-effect free, so the tests can import it; the two scripts do the I/O.
 */
/// <reference types="node" />
import { clampChroma, converter, parse } from "culori";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type Confidence = "exact" | "approximated" | "derived";
export interface Mapping {
  dark: string;
  /** Tecton token, literal value or "derived"; defaults to `dark`. */
  light?: string;
  confidence: Confidence;
  note?: string;
}
export interface PaletteConfig {
  source: string;
  note?: string;
  prefix?: string;
  resetTailwind?: boolean;
  shades?: string[];
  families: string[];
}
export interface TokenMap {
  version: number;
  shadcn: Record<string, Mapping>;
  extra: Record<string, Mapping>;
  theme: Record<string, string>;
  light: { strategy: string; note?: string; overrides?: Record<string, string>; overrideNotes?: Record<string, string> };
  checks?: { allow?: string[]; allowNotes?: Record<string, string> };
  palette?: PaletteConfig;
}

export interface Resolved {
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

/** The two modes of the Tecton export: `:root` (light) and `.dark`. */
export interface ThemedTokens {
  light: Map<string, string>;
  dark: Map<string, string>;
}

// ---------------------------------------------------------------------------
// Theme markers and selectors
// ---------------------------------------------------------------------------
/** `.dark` / `[data-theme="dark"]`, and the same for light — the theme markers. */
export const DARK_MARK = '.dark, [data-theme="dark"]';
export const LIGHT_MARK = '.light, [data-theme="light"]';
/**
 * The selector of the light block, repeated after `.dark` in every file that
 * declares the shadcn variables (see tokens-build.mts, "The theme markers").
 */
export const LIGHT_BLOCK = LIGHT_MARK;

/** The remote's root marker, set by `<ThemeRoot>` (src/tecton/theme-root.tsx). */
export const SCOPED_ROOT = "[data-tecton-root]";
/** Dark when the marker itself or any ancestor carries the dark class/attribute. */
export const SCOPED_DARK = `${SCOPED_ROOT}:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *)`;
/**
 * Light again, last, so it wins over SCOPED_DARK: a root that is explicitly light
 * inside a dark host, or one whose **nearest** marker is a light island inside a
 * dark page (`<html class="dark"> … <div class="light"> … <ThemeRoot>`), which
 * SCOPED_DARK also matches through the dark ancestor. The island clause leaves
 * out a root that is itself dark (`<ThemeRoot theme="dark">` inside the island)
 * and one inside a dark island within that light island (`dark > light > dark >
 * root` stays dark), while `light > dark > light > root` — a page that is
 * explicitly light, as next-themes writes it — still reads light. Deeper than
 * that (`dark > light > dark > light > root`) reads dark.
 */
export const SCOPED_LIGHT =
  `${SCOPED_ROOT}:where(.light, [data-theme="light"], ` +
  `:is(${DARK_MARK}) :is(${LIGHT_MARK}) :not(${DARK_MARK}):not(:is(${DARK_MARK}) :is(${LIGHT_MARK}) :is(${DARK_MARK}) *))`;

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------
export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Parse `--name: value;` declarations from a CSS string into a map (`--color-*` included). */
export function parseCustomProperties(css: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /(--[\w*-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  const body = stripComments(css);
  while ((m = re.exec(body))) out.set(m[1], m[2].trim());
  return out;
}

/**
 * Split a themed token file into light and dark maps. Top-level blocks whose
 * selector mentions "dark" override the base (light) declarations.
 */
export function parseThemedTokens(css: string): ThemedTokens {
  const noComments = stripComments(css);
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

/** Where `resolveValue` looks a custom property up. */
export type Lookup = Map<string, string> | ((name: string) => string | undefined);

/**
 * Resolve every `var()` in `value`, recursively, against `lookup`.
 *
 * A small parser rather than a regex: a fallback may hold commas and
 * parentheses of its own — another `var()` with a fallback, `rgb(0 0 0 / 50%)`,
 * a font list — so the reference ends at its *matching* parenthesis. A
 * reference `lookup` does not know resolves to its fallback, and throws
 * without one.
 */
export function resolveValue(value: string, lookup: Lookup, depth = 0): string {
  if (depth > 16) throw new Error(`var() reference too deep: ${value}`);
  const get = typeof lookup === "function" ? lookup : (name: string) => lookup.get(name);
  let out = "";
  let i = 0;
  for (;;) {
    const at = value.indexOf("var(", i);
    if (at === -1) return out + value.slice(i);
    if (at > 0 && /[\w-]/.test(value[at - 1])) {
      // part of another function name (`somevar(`)
      out += value.slice(i, at + 4);
      i = at + 4;
      continue;
    }
    out += value.slice(i, at);
    let parens = 1;
    let j = at + 4;
    for (; j < value.length && parens > 0; j++) {
      if (value[j] === "(") parens++;
      else if (value[j] === ")") parens--;
    }
    if (parens !== 0) throw new Error(`Unbalanced var(): ${value}`);
    const inner = value.slice(at + 4, j - 1);
    const comma = inner.indexOf(",");
    const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();
    if (!/^--[\w-]+$/.test(name)) throw new Error(`Malformed var(${inner})`);
    const fallback = comma === -1 ? undefined : inner.slice(comma + 1).trim();
    const v = get(name);
    if (v !== undefined) out += resolveValue(v, lookup, depth + 1);
    else if (fallback !== undefined) out += resolveValue(fallback, lookup, depth + 1);
    else throw new Error(`Dangling var(${name})`);
    i = j;
  }
}

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------
const toOklch = converter("oklch");
const toRgb = converter("rgb");

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

export function isColorValue(v: string): boolean {
  return parse(v) !== undefined;
}

/** An opaque sRGB colour, channels 0–1. */
export interface Rgb {
  mode: "rgb";
  r: number;
  g: number;
  b: number;
}

/**
 * `literal` as an opaque colour: a translucent one is composited over `under`
 * (itself opaque), and left as its channels when there is nothing under it.
 * Undefined when `literal` is not a colour.
 */
export function compositeOver(literal: string, under?: Rgb): Rgb | undefined {
  const parsed = parse(literal);
  if (!parsed) return undefined;
  const rgb = toRgb(parsed);
  const alpha = rgb.alpha ?? 1;
  if (alpha < 1 && under) {
    return {
      mode: "rgb",
      r: rgb.r * alpha + under.r * (1 - alpha),
      g: rgb.g * alpha + under.g * (1 - alpha),
      b: rgb.b * alpha + under.b * (1 - alpha),
    };
  }
  return { mode: "rgb", r: rgb.r, g: rgb.g, b: rgb.b };
}

// ---------------------------------------------------------------------------
// The map: schema validation and resolution
// ---------------------------------------------------------------------------
/** The subset of JSON Schema `tokens/tecton.map.schema.json` is written in. */
export interface JsonSchema {
  $ref?: string;
  $defs?: Record<string, JsonSchema>;
  type?: "object" | "array" | "string" | "integer" | "number" | "boolean";
  required?: string[];
  properties?: Record<string, JsonSchema>;
  additionalProperties?: JsonSchema | boolean;
  items?: JsonSchema;
  enum?: unknown[];
  pattern?: string;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Validate `value` against `schema`: `type`, `required`, `properties`,
 * `additionalProperties`, `items`, `enum`, `pattern` and local `$ref`s — the
 * keywords the map's schema uses (annotations such as `description` are
 * ignored). Returns one message per violation, `[]` when it is valid.
 *
 * Hand-written because the package carries no JSON Schema validator, and a
 * keyword it does not know throws rather than passing silently.
 */
export function validateAgainstSchema(value: unknown, schema: JsonSchema, root: JsonSchema = schema, at = "$"): string[] {
  const KNOWN = new Set([
    "$schema", "$id", "$ref", "$defs", "title", "description", "type", "required",
    "properties", "additionalProperties", "items", "enum", "pattern",
  ]);
  for (const keyword of Object.keys(schema)) {
    if (!KNOWN.has(keyword)) throw new Error(`validateAgainstSchema: unsupported keyword "${keyword}" at ${at}`);
  }
  if (schema.$ref) {
    const m = /^#\/\$defs\/(.+)$/.exec(schema.$ref);
    const target = m ? root.$defs?.[m[1]] : undefined;
    if (!target) throw new Error(`validateAgainstSchema: cannot resolve $ref ${schema.$ref}`);
    return validateAgainstSchema(value, target, root, at);
  }
  const errors: string[] = [];
  if (schema.type) {
    const ok =
      schema.type === "object" ? isPlainObject(value)
      : schema.type === "array" ? Array.isArray(value)
      : schema.type === "integer" ? Number.isInteger(value)
      : typeof value === schema.type;
    if (!ok) return [`${at}: expected ${schema.type}, got ${Array.isArray(value) ? "array" : value === null ? "null" : typeof value}`];
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${at}: ${JSON.stringify(value)} is not one of ${schema.enum.map((e) => JSON.stringify(e)).join(", ")}`);
  }
  if (schema.pattern && typeof value === "string" && !new RegExp(schema.pattern).test(value)) {
    errors.push(`${at}: ${JSON.stringify(value)} does not match /${schema.pattern}/`);
  }
  if (isPlainObject(value)) {
    for (const key of schema.required ?? []) {
      if (!(key in value)) errors.push(`${at}: missing required "${key}"`);
    }
    for (const [key, child] of Object.entries(value)) {
      const property = schema.properties?.[key];
      const path = `${at}.${key}`;
      if (property) errors.push(...validateAgainstSchema(child, property, root, path));
      else if (schema.additionalProperties === false) errors.push(`${path}: not allowed`);
      else if (isPlainObject(schema.additionalProperties)) {
        errors.push(...validateAgainstSchema(child, schema.additionalProperties, root, path));
      }
    }
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => errors.push(...validateAgainstSchema(item, schema.items!, root, `${at}[${index}]`)));
  }
  return errors;
}

/** The map, parsed and validated: throws with every schema violation at once. */
export function parseTokenMap(json: string, schema: JsonSchema, file = "tecton.map.json"): TokenMap {
  const map = JSON.parse(json) as unknown;
  const errors = validateAgainstSchema(map, schema);
  if (errors.length) throw new Error(`${file} does not match its schema:\n  ${errors.join("\n  ")}`);
  return map as TokenMap;
}

/** Vars that live only in :root (non-colour values such as --radius). */
export const rootOnly = (r: Resolved) => !r.isColor;

export interface ResolvedMap {
  resolved: Resolved[];
  byName: Map<string, Resolved>;
  extraNames: string[];
  /** `@theme inline` entries: `map.theme`, then `--color-<extra>` for each colour extra. */
  themeEntries: [string, string][];
}

/** Resolve every shadcn and extra variable of the map against the Tecton export. */
export function resolveTokenMap(map: TokenMap, themed: ThemedTokens): ResolvedMap {
  const tokens = themed.dark; // dark = canonical Tecton values
  const lightTokens = themed.light;
  const overrides = map.light.overrides ?? {};
  const resolveMapping = (name: string, m: Mapping, extra: boolean): Resolved => {
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
  };
  const resolved: Resolved[] = [
    ...Object.entries(map.shadcn).map(([n, m]) => resolveMapping(n, m, false)),
    ...Object.entries(map.extra).map(([n, m]) => resolveMapping(n, m, true)),
  ];
  const byName = new Map(resolved.map((r) => [r.name, r]));
  const extraNames = Object.keys(map.extra);
  // a `--color-<name>` utility only means something for a colour: a non-colour
  // extra (a size, a duration) stays a plain variable
  const themeEntries: [string, string][] = [
    ...Object.entries(map.theme),
    ...extraNames.filter((n) => byName.get(n)!.isColor).map((n): [string, string] => [`--color-${n}`, `var(--${n})`]),
  ];
  return { resolved, byName, extraNames, themeEntries };
}

/** What `globals.css` (and `tecton-theme.css`) must declare for the map, per block. */
export interface BlockExpectations {
  root: Map<string, string>;
  dark: Map<string, string>;
  theme: Map<string, string>;
}

export function expectedBlocks(r: ResolvedMap): BlockExpectations {
  return {
    root: new Map(r.resolved.map((x) => [`--${x.name}`, x.light])),
    dark: new Map(r.resolved.filter((x) => !rootOnly(x)).map((x) => [`--${x.name}`, x.dark])),
    theme: new Map(r.themeEntries),
  };
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------
export interface Block {
  start: number; // index of the opening brace
  end: number; // index of the closing brace
}

/** Find the top-level block whose selector text (trimmed) equals `selector`. */
export function findBlock(css: string, selector: string): Block | undefined {
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

/** The declarations of a top-level block, or undefined when there is no such block. */
export function blockDecls(css: string, selector: string): Map<string, string> | undefined {
  const block = findBlock(css, selector);
  return block ? parseCustomProperties(css.slice(block.start + 1, block.end)) : undefined;
}

/** A value that reads a raw Tecton token: only the map puts one there. */
export const readsTectonToken = (value: string) => /var\(\s*--tecton-/.test(value);

/**
 * An `@theme inline` entry the map no longer accounts for (the caller has checked
 * it is not one of the map's own entries): one that reads a raw Tecton token, or
 * a `--color-<x>: var(--<x>)` whose `--<x>` is not among `rootNames` — an extra
 * the map dropped. The CLI's own entries all name a `:root` variable.
 */
export function isStaleThemeEntry(name: string, value: string, rootNames: { has(name: string): boolean }): boolean {
  if (readsTectonToken(value)) return true;
  const ref = /^var\((--[\w-]+)\)$/.exec(value.trim());
  return name.startsWith("--color-") && ref !== null && !rootNames.has(ref[1]);
}

/**
 * Replace declaration values inside a block. Keeps order and indentation; appends
 * `append` entries (in order) before the closing brace if they are missing, and
 * removes the declarations `prune` selects (a variable the map no longer has).
 */
export function patchBlock(
  css: string,
  block: Block,
  values: Map<string, string>,
  append: string[],
  prune?: (name: string, value: string) => boolean,
): { css: string; pruned: string[] } {
  const body = css.slice(block.start + 1, block.end);
  const lines = body.split("\n");
  const declRe = /^(\s*)(--[\w-]+)\s*:\s*(.*?);(\s*(?:\/\*.*\*\/)?\s*)$/;
  let indent: string | undefined;
  const seen = new Set<string>();
  const pruned: string[] = [];
  const out: string[] = [];
  for (const line of lines) {
    const m = declRe.exec(line);
    if (!m) {
      out.push(line);
      continue;
    }
    indent ??= m[1];
    const name = m[2];
    if (!values.has(name) && prune?.(name, m[3])) {
      pruned.push(name);
      continue;
    }
    seen.add(name);
    const next = values.get(name);
    out.push(next === undefined || next === m[3] ? line : `${m[1]}${name}: ${next};${m[4]}`);
  }
  indent ??= "    ";
  const missing = append.filter((n) => !seen.has(n));
  if (missing.length) {
    const unknown = missing.filter((n) => !values.has(n));
    if (unknown.length) throw new Error(`patchBlock: no value to append for ${unknown.join(", ")}`);
    // insert before the trailing whitespace line that precedes "}"
    let insertAt = out.length;
    while (insertAt > 0 && out[insertAt - 1].trim() === "") insertAt--;
    const extraLines = missing.map((n) => `${indent}${n}: ${values.get(n)};`);
    out.splice(insertAt, 0, ...extraLines);
  }
  return { css: css.slice(0, block.start + 1) + out.join("\n") + css.slice(block.end), pruned };
}

/** One way a block of a stylesheet differs from what the map resolves to. */
export interface Drift {
  name: string;
  problem: "missing" | "value" | "stale";
  got?: string;
  want?: string;
}

/**
 * Compare a block's declarations with what the map resolves to. `missing` and
 * `value` are about the expected entries; `stale` flags a declaration that
 * `isStale` says the map no longer accounts for.
 */
export function blockDrift(
  actual: Map<string, string>,
  expected: Map<string, string>,
  isStale: (name: string, value: string) => boolean = () => false,
): Drift[] {
  const drift: Drift[] = [];
  for (const [name, want] of expected) {
    const got = actual.get(name);
    if (got === undefined) drift.push({ name, problem: "missing", want });
    else if (got.trim() !== want) drift.push({ name, problem: "value", got, want });
  }
  for (const [name, value] of actual) {
    if (!expected.has(name) && isStale(name, value)) drift.push({ name, problem: "stale", got: value });
  }
  return drift;
}

export function describeDrift(d: Drift): string {
  if (d.problem === "missing") return `${d.name} missing (expected ${d.want})`;
  if (d.problem === "value") return `${d.name}: ${d.got} (expected ${d.want})`;
  return `${d.name}: ${d.got} (not in the map)`;
}
