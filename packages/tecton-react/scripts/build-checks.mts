/**
 * build-checks — the pure helpers of `build.mts`: the `@source` rewrite of the
 * stylesheets and the output checks (`"use client"` kept, every import in
 * `dist/` resolvable), kept apart so the tests can exercise them without
 * running a build.
 */

/**
 * `@source "<path>";` — a path Tailwind scans. Not `@source inline("…")`, which
 * safelists candidates, nor `@source not "…"`, which excludes a path: both mean
 * the same in `dist/` as in `src/`.
 */
const SOURCE_PATH = /^\s*@source\s+(["'])[^"']*\1\s*;\s*$/;

/**
 * Collapse every `@source "<path>";` line of a stylesheet into a single
 * `replacement` at the position of the first, leaving every other line —
 * `@source inline(…)` and `@source not …` included — as it is. Line endings
 * come out as `\n`.
 */
export function collapseSourcePaths(css: string, replacement: string): string {
  let seen = false;
  const out: Array<string> = [];
  for (const line of css.split(/\r?\n/)) {
    if (SOURCE_PATH.test(line)) {
      if (seen) continue;
      seen = true;
      out.push(replacement);
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

/**
 * The directive prologue of a module: the string-literal statements before the
 * first other statement, comments and whitespace skipped (`"use client"`,
 * `"use strict"`).
 */
export function directivesOf(code: string): Array<string> {
  const found: Array<string> = [];
  const skip = /(?:\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*/y;
  // a string that ends its statement: `"use client".length` is an expression
  const directive = /(["'])((?:(?!\1)[^\\\n]|\\.)*)\1[ \t]*(?:;|(?=\r?\n|$))/y;
  let pos = 0;
  for (;;) {
    skip.lastIndex = pos;
    skip.exec(code);
    directive.lastIndex = skip.lastIndex;
    const m = directive.exec(code);
    if (!m) return found;
    found.push(m[2]);
    pos = directive.lastIndex;
  }
}

/** `@scope/name/sub` → [`@scope/name`, `./sub`]; `name` → [`name`, `.`]. */
export function splitSpecifier(specifier: string): [string, string] {
  const parts = specifier.split("/");
  const size = specifier.startsWith("@") ? 2 : 1;
  const name = parts.slice(0, size).join("/");
  const rest = parts.slice(size).join("/");
  return [name, rest ? `./${rest}` : "."];
}

/** Whether a package's `exports` field has an entry for `subpath`, patterns included. */
export function exportsSubpath(exportsField: unknown, subpath: string): boolean {
  if (exportsField === undefined) return true; // no map: every file is reachable
  if (typeof exportsField === "string" || Array.isArray(exportsField)) return subpath === ".";
  if (typeof exportsField !== "object" || exportsField === null) return false;
  const keys = Object.keys(exportsField);
  // a conditions object (`{ import, default }`) describes `.` alone
  if (!keys.some((key) => key.startsWith("."))) return subpath === ".";
  return keys.some((key) => {
    const star = key.indexOf("*");
    if (star === -1) return key === subpath;
    return (
      subpath.length >= key.length - 1 &&
      subpath.startsWith(key.slice(0, star)) &&
      subpath.endsWith(key.slice(star + 1))
    );
  });
}

/** Every module specifier a built file names: imports, re-exports, `import()`, CSS `@import`. */
export function specifiersOf(file: string, code: string): Array<string> {
  const found: Array<string> = [];
  if (file.endsWith(".css")) {
    const css = code.replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of css.matchAll(/@import\s+(?:url\(\s*)?(["'])([^"']+)\1/g)) found.push(m[2]);
    return found;
  }
  const patterns = [
    /^\s*(?:import|export)\b[^;"'`]*?\bfrom\s*(["'])([^"']+)\1/gm,
    /^\s*import\s*(["'])([^"']+)\1/gm,
    /\bimport\(\s*(["'])([^"']+)\1\s*\)/g,
  ];
  for (const pattern of patterns) for (const m of code.matchAll(pattern)) found.push(m[2]);
  return found;
}
