/**
 * rename-package — renames the `@tecton/react` package literal across the repo.
 *
 *   bun run scripts/rename-package.mts <new-name> [--dry-run]
 *
 * The library package `@tecton/react` may be renamed later (scope and name are
 * both undecided). The literal appears in generated component self-imports,
 * hand-written `src/tecton` and block imports, apps/www examples and docs,
 * config (tsconfig paths, vitest aliases, the eslint config, the registry
 * mirror overlay, the blocks registry builder) and prose (CLAUDE.md,
 * README.md, docs/UPSTREAM.md).
 *
 * What it does:
 *   1. Reads the current name (OLD) from packages/tecton-react/package.json
 *      and validates NEW (a valid npm name, scoped or not, different from OLD).
 *   2. Unless --dry-run, refuses to run against a dirty working tree.
 *   3. Walks `git ls-files -z` (tracked files only), skipping generated
 *      output that must be rebuilt instead of edited, and binary files.
 *   4. Replaces every exact literal OLD that ends at a word boundary (the
 *      next character is not a letter, digit, `-`, `.` or `_`) with NEW,
 *      preserving line endings and everything else in the file byte-for-byte.
 *   5. Prints a per-category summary, the follow-up checklist, and the list
 *      of things this script intentionally does not handle.
 *
 * Never partially writes: every edit is computed in memory first, and files
 * are only written once every file has been read and rewritten successfully.
 *
 * Does NOT touch: pnpm-lock.yaml, apps/www/public/r/**, the blocks registry
 * output, the lucide compat map, docs/TOKEN-MAPPING.md, or the shadcn
 * registry namespace `@tecton` (a different literal from the package name).
 */
/// <reference types="node" />
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function usage(): string {
  return "Usage: bun run scripts/rename-package.mts <new-name> [--dry-run]";
}

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const NEW_NAME_ARG = args.find((a) => !a.startsWith("--"));

// ---------------------------------------------------------------------------
// 1. Read OLD, validate NEW
// ---------------------------------------------------------------------------
const PKG_JSON_PATH = path.join(repoRoot, "packages/tecton-react/package.json");
const OLD_NAME = (JSON.parse(readFileSync(PKG_JSON_PATH, "utf8")) as { name: string }).name;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A pragmatic subset of npm's package-name rules: enough to catch typos. */
function validateName(name: string | undefined): string | null {
  if (!name) return `missing <new-name> argument.\n\n${usage()}`;
  if (name === OLD_NAME) return `NEW name is the same as the current name (${OLD_NAME}); nothing to rename.`;
  if (name.length > 214) return `"${name}" is not a valid npm package name: longer than 214 characters.`;
  if (/[A-Z]/.test(name)) return `"${name}" is not a valid npm package name: must be lowercase.`;
  if (/\s/.test(name)) return `"${name}" is not a valid npm package name: must not contain whitespace.`;
  const scoped = /^@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/;
  const unscoped = /^[a-z0-9][a-z0-9._-]*$/;
  if (!scoped.test(name) && !unscoped.test(name)) {
    return (
      `"${name}" is not a valid npm package name: expected an optionally-scoped ` +
      `name such as "acme-ui" or "@acme/ui" (lowercase letters, digits, "-", "." and "_" only).`
    );
  }
  return null;
}

const nameError = validateName(NEW_NAME_ARG);
if (nameError) fail(nameError);
const NEW = NEW_NAME_ARG as string;

console.log(`Renaming ${OLD_NAME} -> ${NEW}${DRY_RUN ? " (dry run)" : ""}`);
console.log("");

// ---------------------------------------------------------------------------
// 2. Refuse a dirty tree, unless --dry-run
// ---------------------------------------------------------------------------
if (!DRY_RUN) {
  const status = execFileSync("git", ["status", "--porcelain"], { cwd: repoRoot, encoding: "utf8" });
  if (status.trim().length > 0) {
    fail(
      "Working tree is not clean. This script rewrites every tracked file that " +
        `contains "${OLD_NAME}" in place, so it refuses to run with uncommitted ` +
        "changes present. Commit or stash them first, or re-run with --dry-run " +
        "to preview the rename without writing anything.\n\n" +
        status
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Enumerate tracked files
// ---------------------------------------------------------------------------
const lsFiles = execFileSync("git", ["ls-files", "-z"], {
  cwd: repoRoot,
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 64,
});
const trackedFiles = lsFiles.split("\0").filter(Boolean);

/** Generated output: rebuild it with its own tool instead of editing it here. */
const SKIP_EXACT = new Set([
  "pnpm-lock.yaml",
  "packages/tecton-blocks/registry.json",
  "docs/TOKEN-MAPPING.md",
]);
const SKIP_PREFIXES = ["apps/www/public/r/"];

function isSkippedGenerated(file: string): boolean {
  return SKIP_EXACT.has(file) || SKIP_PREFIXES.some((p) => file.startsWith(p));
}

const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".mts", ".js", ".mjs", ".cjs",
  ".json", ".jsonc", ".md", ".mdx", ".css",
  ".yml", ".yaml", ".sh", ".txt", ".html", ".svg", ".patch",
]);

// ---------------------------------------------------------------------------
// 4. Match OLD ending at a word boundary; collect every edit before writing
// ---------------------------------------------------------------------------
const MATCH_RE = new RegExp(`${escapeRegExp(OLD_NAME)}(?![A-Za-z0-9_.-])`, "g");

interface FileEdit {
  file: string;
  count: number;
  content: string;
}

const edits: FileEdit[] = [];
const skippedGenerated: string[] = [];
const skippedUnknownExtensionWithHit: string[] = [];

for (const file of trackedFiles) {
  if (isSkippedGenerated(file)) {
    skippedGenerated.push(file);
    continue;
  }

  const absPath = path.join(repoRoot, file);
  let buf: Buffer;
  try {
    buf = readFileSync(absPath);
  } catch {
    continue; // e.g. a path git knows about but that isn't on disk right now
  }

  // Crude binary sniff: a NUL byte anywhere in the first 8000 bytes.
  const sniffLen = Math.min(buf.length, 8000);
  let looksBinary = false;
  for (let i = 0; i < sniffLen; i++) {
    if (buf[i] === 0) {
      looksBinary = true;
      break;
    }
  }
  if (looksBinary) continue;

  const content = buf.toString("utf8");
  if (!content.includes(OLD_NAME)) continue;

  const ext = path.extname(file).toLowerCase();
  const isKnownText = TEXT_EXTENSIONS.has(ext) || ext === ""; // extensionless files (LICENSE, .gitignore, ...) are text too
  if (!isKnownText) {
    skippedUnknownExtensionWithHit.push(file);
    continue;
  }

  const matches = content.match(MATCH_RE);
  if (!matches || matches.length === 0) continue; // contains OLD, but never at a word boundary

  edits.push({ file, count: matches.length, content: content.replace(MATCH_RE, NEW) });
}

// ---------------------------------------------------------------------------
// 5. Assert components.json's four aliases were rewritten
// ---------------------------------------------------------------------------
const COMPONENTS_JSON = "packages/tecton-react/components.json";
const componentsJsonEdit = edits.find((e) => e.file === COMPONENTS_JSON);
if (!componentsJsonEdit) {
  fail(`Expected ${COMPONENTS_JSON} to be rewritten (it declares four "${OLD_NAME}" aliases), but no edit was produced for it.`);
}
{
  const aliases = (JSON.parse(componentsJsonEdit.content) as { aliases: Record<string, string> }).aliases;
  for (const [key, value] of Object.entries(aliases)) {
    if (!value.startsWith(`${NEW}/`)) {
      fail(`${COMPONENTS_JSON}: alias "${key}" did not rewrite to start with "${NEW}/" (got "${value}").`);
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Per-category summary
// ---------------------------------------------------------------------------
type Category =
  | "generated self-imports (packages/tecton-react/src/components)"
  | "src/tecton"
  | "blocks"
  | "apps/www"
  | "config"
  | "prose"
  | "other";

const CONFIG_FILES = new Set([
  "packages/tecton-react/tsconfig.json",
  "packages/tecton-react/components.json",
  "packages/tecton-react/vitest.config.ts",
  "apps/www/tsconfig.json",
  "scripts/registry-mirror/overlay/tecton.patch",
  "packages/tecton-blocks/scripts/registry-build.mts",
]);
function categorize(file: string): Category {
  if (CONFIG_FILES.has(file)) return "config";
  if (file.startsWith("packages/tecton-react/src/components/")) return "generated self-imports (packages/tecton-react/src/components)";
  if (file.startsWith("packages/tecton-react/src/tecton/")) return "src/tecton";
  if (file.startsWith("packages/tecton-blocks/")) return "blocks";
  if (file.startsWith("apps/www/")) return "apps/www";
  if (/\.mdx?$/.test(file)) return "prose";
  return "other";
}

const CATEGORY_ORDER: Category[] = [
  "generated self-imports (packages/tecton-react/src/components)",
  "src/tecton",
  "blocks",
  "apps/www",
  "config",
  "prose",
  "other",
];

const byCategory = new Map<Category, { files: number; occurrences: number }>();
for (const cat of CATEGORY_ORDER) byCategory.set(cat, { files: 0, occurrences: 0 });
for (const e of edits) {
  const agg = byCategory.get(categorize(e.file))!;
  agg.files += 1;
  agg.occurrences += e.count;
}

console.log("Category summary:");
console.log("| category | files | occurrences |");
console.log("| --- | --- | --- |");
for (const cat of CATEGORY_ORDER) {
  const agg = byCategory.get(cat)!;
  if (agg.files === 0) continue;
  console.log(`| ${cat} | ${agg.files} | ${agg.occurrences} |`);
}
const totalFiles = edits.length;
const totalOccurrences = edits.reduce((n, e) => n + e.count, 0);
console.log("");
console.log(`${totalFiles} files, ${totalOccurrences} occurrences of "${OLD_NAME}" -> "${NEW}".`);

if (skippedGenerated.length) {
  console.log("");
  console.log(`Skipped (generated — rebuild instead of editing): ${skippedGenerated.join(", ")}`);
}
if (skippedUnknownExtensionWithHit.length) {
  console.log("");
  console.log(
    `Skipped (unrecognised extension, but contains "${OLD_NAME}" — check by hand): ` +
      skippedUnknownExtensionWithHit.join(", ")
  );
}

// ---------------------------------------------------------------------------
// 7. Write (never partially: everything above only computed, nothing written yet)
// ---------------------------------------------------------------------------
console.log("");
if (DRY_RUN) {
  console.log("Dry run: no files were written.");
} else {
  for (const e of edits) {
    writeFileSync(path.join(repoRoot, e.file), e.content, "utf8");
  }
  console.log(`Wrote ${edits.length} files.`);
}

// ---------------------------------------------------------------------------
// Follow-up checklist
// ---------------------------------------------------------------------------
const componentsDir = path.join(repoRoot, "packages/tecton-react/src/components");
const componentItems = readdirSync(componentsDir)
  .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
  .map((f) => f.replace(/\.tsx?$/, ""))
  .sort();

console.log("");
console.log("Follow-up checklist:");
console.log("");
console.log("  pnpm install");
console.log("");
console.log("  scripts/registry-mirror.sh build && scripts/registry-mirror.sh serve   # in a second shell");
console.log(
  `  REGISTRY_URL=http://127.0.0.1:4000/r pnpm dlx shadcn@4.21.0 add ${componentItems.join(" ")} \\`
);
console.log("    --overwrite -c packages/tecton-react");
console.log("  bash scripts/generated-check.sh");
console.log("");
console.log(`  pnpm --filter ${NEW} icons:build`);
console.log(`  pnpm --filter ${NEW} tokens:build`);
console.log(`  pnpm --filter ${NEW} exports:build   # if present`);
console.log("");
console.log("  pnpm --filter @tecton/blocks registry:build");
console.log("");
console.log("  pnpm docs:sync");
console.log("");
console.log("  pnpm typecheck && pnpm test && pnpm lint");
console.log("");
console.log("Not handled by this script:");
console.log(
  "  - scripts/registry-mirror/overlay/tecton.patch only had its added-line content " +
    "changed; re-verify with scripts/registry-mirror.sh build."
);
console.log(
  "  - the shadcn registry namespace @tecton (block item names, registryDependencies, " +
    "and consumers' components.json registry key) is a different literal and was " +
    "intentionally NOT changed."
);

process.exit(0);
