/**
 * build — compiles the publishable output of `@tecton/react` into `dist/`.
 *
 *   bun run scripts/build.mts          (pnpm --filter @tecton/react build)
 *
 * The package is consumed one module at a time (`@tecton/react/components/button`),
 * so the output is UNBUNDLED: one `.js` + `.js.map` + `.d.ts` per source module,
 * mirroring the `src/` layout under `dist/`. The `.js.map` embeds its sources;
 * there is no `.d.ts.map`, since it could only point into `src/`, which is not
 * published (`declarationMap: false` in tsconfig.build.json).
 *
 * Steps
 *   1. clean dist/
 *   2. JS — esbuild with every specifier marked external, so each entry keeps its
 *      own `"use client"` directive and its imports (`@tecton/react/...` package
 *      self-imports stay verbatim; relative ones gain the `.js` extension).
 *   3. .d.ts — `tsconfig.build.json` through the TypeScript API. `paths` is kept on
 *      purpose: the emitted declarations then name `@tecton/react/...` verbatim,
 *      exactly like the sources. `stripInternal` drops every declaration tagged
 *      `@internal` (a context another Tecton module reads, the portal plumbing),
 *      so it never reaches a consumer's types.
 *   4. the relative specifiers inside the emitted `.d.ts` gain `.js` too.
 *   5. CSS — `src/styles/*.css` copied to `dist/styles/`, with every plain
 *      `@source "<path>";` directive collapsed into a single one pointing at `../`
 *      + the built `.js`, so Tailwind scans the built output instead of the
 *      (unpublished) sources. `@source inline(…)` and `@source not …` are not
 *      paths to scan and are copied verbatim.
 *   6. checks on the output, each failing the build:
 *      - every entry whose source starts with `"use client"` starts with it in
 *        `dist/` too (an RSC consumer breaks without it);
 *      - every import in `dist/` resolves: a relative one to a file that exists,
 *        a `@tecton/react/…` self-import through the `exports` map to a file that
 *        exists, and a bare one to a declared dependency or peer dependency that
 *        is installed and exports that subpath.
 *
 * `KNOWN_DTS_FAILURES` below tolerates declaration-emit errors for a short list of
 * generated files that a regeneration step still has to fix; every other diagnostic
 * fails the build.
 */
/// <reference types="node" />
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import ts from "typescript";
import {
  collapseSourcePaths,
  directivesOf,
  exportsSubpath,
  specifiersOf,
  splitSpecifier,
} from "./build-checks.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const SRC = path.join(pkgRoot, "src");
const DIST = path.join(pkgRoot, "dist");

/**
 * Files whose declaration emit is known to fail and is fixed by a later
 * regeneration of the shadcn sources. Their diagnostics are printed as warnings
 * instead of failing the build; nothing else is tolerated.
 */
const KNOWN_DTS_FAILURES: Array<string> = [];

/** Entry points: `<dir>` × `<extensions>`, top level only, never `__tests__`. */
const ENTRY_DIRS: Array<{ dir: string; exts: Array<string> }> = [
  { dir: "src/components", exts: [".tsx"] },
  { dir: "src/tecton", exts: [".tsx"] },
  // Built (the Tecton modules import it by relative path) but not exported.
  { dir: "src/tecton/internal", exts: [".ts", ".tsx"] },
  { dir: "src/hooks", exts: [".ts"] },
  { dir: "src/lib", exts: [".ts"] },
  { dir: "src/icons", exts: [".ts", ".tsx"] },
];

function posix(p: string) {
  return p.split(path.sep).join("/");
}

function relFromPkg(absolute: string) {
  return posix(path.relative(pkgRoot, absolute));
}

function collectEntryPoints() {
  const entries: Array<string> = [];
  for (const { dir, exts } of ENTRY_DIRS) {
    const absolute = path.join(pkgRoot, dir);
    if (!existsSync(absolute)) throw new Error(`Missing entry directory: ${dir}`);
    for (const item of readdirSync(absolute, { withFileTypes: true })) {
      if (!item.isFile()) continue;
      if (item.name.endsWith(".d.ts")) continue;
      if (!exts.some((ext) => item.name.endsWith(ext))) continue;
      const file = path.join(absolute, item.name);
      if (relFromPkg(file).includes("__tests__")) continue;
      entries.push(file);
    }
  }
  return entries.sort();
}

/**
 * Every import except the entry point itself is left to the consumer's bundler.
 * Relative specifiers are extensionless in the sources (`./types`), so they get
 * the `.js` the emitted ESM needs; bare ones (`react`, `@tecton/react/...`) are
 * passed through untouched.
 */
const markExternal: esbuild.Plugin = {
  name: "mark-external",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (args.kind === "entry-point") return null;
      const relative = args.path.startsWith(".");
      const resolved =
        relative && !/\.[cm]?js$/.test(args.path) ? `${args.path}.js` : args.path;
      return { path: resolved, external: true };
    });
  },
};

async function buildJs(entryPoints: Array<string>) {
  await esbuild.build({
    entryPoints,
    outbase: SRC,
    outdir: DIST,
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    sourcemap: true,
    sourcesContent: true,
    tsconfig: path.join(pkgRoot, "tsconfig.json"),
    jsx: "automatic",
    // esbuild inlines NODE_ENV as "development" when it bundles for the browser;
    // keep the expression so the consumer's bundler decides.
    define: { "process.env.NODE_ENV": "process.env.NODE_ENV" },
    plugins: [markExternal],
    logLevel: "warning",
  });
}

function buildDeclarations() {
  const configPath = path.join(pkgRoot, "tsconfig.build.json");
  const read = ts.readConfigFile(configPath, ts.sys.readFile);
  if (read.error) {
    throw new Error(
      `tsconfig.build.json: ${ts.flattenDiagnosticMessageText(read.error.messageText, " ")}`
    );
  }
  const parsed = ts.parseJsonConfigFileContent(
    read.config,
    ts.sys,
    pkgRoot,
    undefined,
    configPath
  );
  if (parsed.errors.length) {
    throw new Error(
      parsed.errors
        .map((d) => ts.flattenDiagnosticMessageText(d.messageText, " "))
        .join("\n")
    );
  }

  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
  });
  const emitted = program.emit();
  const diagnostics = [
    ...ts.getPreEmitDiagnostics(program),
    ...emitted.diagnostics,
  ].filter((d) => d.category === ts.DiagnosticCategory.Error);

  const byFile = new Map<string, Array<string>>();
  for (const diagnostic of diagnostics) {
    const file = diagnostic.file ? relFromPkg(diagnostic.file.fileName) : "<project>";
    let where = "";
    if (diagnostic.file && diagnostic.start !== undefined) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start
      );
      where = `:${line + 1}:${character + 1}`;
    }
    const message = `${file}${where} — TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      " "
    )}`;
    const list = byFile.get(file) ?? [];
    list.push(message);
    byFile.set(file, list);
  }

  const unexpected = [...byFile.keys()].filter(
    (file) => !KNOWN_DTS_FAILURES.includes(file)
  );
  if (unexpected.length) {
    const lines = unexpected.flatMap((file) => byFile.get(file) ?? []);
    throw new Error(`Declaration emit failed:\n  ${lines.join("\n  ")}`);
  }
  for (const [file, messages] of byFile) {
    console.warn(
      `  warning: known declaration-emit failure in ${file} (no .d.ts written)`
    );
    for (const message of messages) console.warn(`    ${message}`);
  }
}

/** `from "./x"` / `from "../x"` / `import("./x")` → the same with `.js`. */
function rewriteDeclarationSpecifiers() {
  const pattern = /(\bfrom\s*|\bimport\s*\(\s*)(["'])(\.{1,2}\/[^"']*)\2/g;
  let rewritten = 0;
  for (const file of walk(DIST)) {
    if (!file.endsWith(".d.ts")) continue;
    const source = readFileSync(file, "utf8");
    const next = source.replace(pattern, (match, head, quote, specifier: string) => {
      if (/\.[cm]?js$/.test(specifier)) return match;
      const target = path.resolve(path.dirname(file), `${specifier}.d.ts`);
      if (!existsSync(target)) return match;
      return `${head}${quote}${specifier}.js${quote}`;
    });
    if (next !== source) {
      writeFileSync(file, next);
      rewritten += 1;
    }
  }
  return rewritten;
}

function copyStyles() {
  const from = path.join(SRC, "styles");
  const to = path.join(DIST, "styles");
  mkdirSync(to, { recursive: true });
  const sheets = readdirSync(from).filter((name) => name.endsWith(".css")).sort();
  for (const name of sheets) {
    const out = collapseSourcePaths(readFileSync(path.join(from, name), "utf8"), '@source "../**/*.js";');
    writeFileSync(path.join(to, name), out);
  }
  return sheets.length;
}

function* walk(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) yield* walk(full);
    else yield full;
  }
}

// ---------------------------------------------------------------------------
// Output checks
// ---------------------------------------------------------------------------

/**
 * `"use client"` is what lets an RSC consumer import a component at all, and
 * nothing else checks that it survives the build: esbuild keeps a module's
 * prologue, but a bundling or banner change would drop it silently.
 */
function assertUseClient(entryPoints: Array<string>) {
  const missing: Array<string> = [];
  for (const entry of entryPoints) {
    if (!directivesOf(readFileSync(entry, "utf8")).includes("use client")) continue;
    const out = path.join(DIST, path.relative(SRC, entry)).replace(/\.tsx?$/, ".js");
    if (!existsSync(out) || !directivesOf(readFileSync(out, "utf8")).includes("use client")) {
      missing.push(relFromPkg(out));
    }
  }
  if (missing.length) {
    throw new Error(
      `"use client" is missing from ${missing.length} built module(s) whose source has it:\n  ${missing.join("\n  ")}`
    );
  }
}

type Manifest = {
  name: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  exports?: unknown;
};

/** The file a self-import resolves to, for JS (`import`/`default`) or types. */
function selfTarget(manifest: Manifest, subpath: string, kind: "js" | "types"): string | undefined {
  const entry = (manifest.exports as Record<string, unknown> | undefined)?.[subpath];
  if (typeof entry === "string") return entry;
  if (typeof entry !== "object" || entry === null) return undefined;
  const conditions = entry as Record<string, string | undefined>;
  return kind === "types" ? conditions.types : (conditions.import ?? conditions.default);
}

/**
 * Every import in `dist/` has to resolve for a consumer: a relative import to a
 * file that was built, a self-import through this package's own `exports` map,
 * and a bare one to a package the consumer is guaranteed to have — a dependency
 * or a peer dependency — that exports the subpath. esbuild marks every specifier
 * external, so nothing else would notice a typo, a missing `exports` entry or an
 * undeclared dependency before a consumer's build does.
 */
function assertImportsResolve() {
  const manifest = JSON.parse(readFileSync(path.join(pkgRoot, "package.json"), "utf8")) as Manifest;
  const declared = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ]);
  const installed = new Map<string, Manifest | null>();
  const installedManifest = (name: string) => {
    if (!installed.has(name)) {
      const file = path.join(pkgRoot, "node_modules", name, "package.json");
      installed.set(name, existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Manifest) : null);
    }
    return installed.get(name) ?? null;
  };

  const problems: Array<string> = [];
  let checked = 0;
  for (const file of walk(DIST)) {
    const kind = file.endsWith(".d.ts") ? "types" : file.endsWith(".js") ? "js" : file.endsWith(".css") ? "css" : null;
    if (!kind) continue;
    for (const specifier of specifiersOf(file, readFileSync(file, "utf8"))) {
      checked++;
      const where = `${relFromPkg(file)}: "${specifier}"`;
      if (specifier.startsWith(".")) {
        const target = path.resolve(path.dirname(file), specifier);
        const candidates =
          kind === "types"
            ? [target.replace(/\.js$/, ".d.ts"), `${target}.d.ts`, path.join(target, "index.d.ts")]
            : [target];
        if (!candidates.some((candidate) => existsSync(candidate))) problems.push(`${where} does not exist`);
        continue;
      }
      const [name, subpath] = splitSpecifier(specifier);
      if (name === manifest.name) {
        const target = selfTarget(manifest, subpath, kind === "types" ? "types" : "js");
        if (!target) problems.push(`${where} is not in the package's exports map`);
        else if (!existsSync(path.join(pkgRoot, target))) problems.push(`${where} → ${target}, which was not built`);
        continue;
      }
      if (specifier.startsWith("node:")) {
        problems.push(`${where} is a Node built-in, which a browser bundle cannot import`);
        continue;
      }
      if (!declared.has(name)) {
        problems.push(`${where}: ${name} is neither a dependency nor a peer dependency`);
        continue;
      }
      const dependency = installedManifest(name);
      if (!dependency) problems.push(`${where}: ${name} is not installed`);
      else if (!exportsSubpath(dependency.exports, subpath)) problems.push(`${where}: ${name} does not export ${subpath}`);
    }
  }
  if (problems.length) {
    throw new Error(`${problems.length} import(s) in dist/ do not resolve:\n  ${problems.join("\n  ")}`);
  }
  return checked;
}

function summarise() {
  const counts = new Map<string, { js: number; dts: number }>();
  for (const file of walk(DIST)) {
    const relative = posix(path.relative(DIST, file));
    const dir = relative.includes("/") ? relative.slice(0, relative.indexOf("/")) : ".";
    const entry = counts.get(dir) ?? { js: 0, dts: 0 };
    if (file.endsWith(".d.ts")) entry.dts += 1;
    else if (file.endsWith(".js")) entry.js += 1;
    counts.set(dir, entry);
  }
  counts.delete("styles"); // reported on its own line, in stylesheets
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
}

async function main() {
  rmSync(DIST, { recursive: true, force: true });

  const entryPoints = collectEntryPoints();
  console.log(`build: ${entryPoints.length} entry points`);
  await buildJs(entryPoints);

  assertUseClient(entryPoints);

  buildDeclarations();
  const rewritten = rewriteDeclarationSpecifiers();
  const sheets = copyStyles();
  const imports = assertImportsResolve();

  console.log("build: dist/");
  for (const [dir, { js, dts }] of summarise()) {
    console.log(`  ${dir.padEnd(12)} ${String(js).padStart(3)} js  ${String(dts).padStart(3)} d.ts`);
  }
  console.log(
    `  styles       ${String(sheets).padStart(3)} css  (${rewritten} d.ts specifiers rewritten)`
  );
  console.log(`build: ${imports} imports resolve, "use client" kept`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
