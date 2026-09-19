/**
 * restore-use-client — puts back the `"use client"` directives the shadcn CLI drops.
 *
 *   bun run scripts/restore-use-client.mts [--check]
 *
 * Why this exists. `components.json` sets `"rsc": false`, so the CLI runs
 * `transformRsc` over every file it writes, which strips a leading
 * `"use client"`. That transform is buggy at the pinned upstream commit
 * (packages/shadcn/src/utils/transformers/transform-rsc.ts):
 *
 *     const directiveRegex = /^["']use client["']$/g   // module scope, /g flag
 *     ...
 *     if (first && directiveRegex.test(first.getText())) first.remove()
 *
 * A `/g` regex keeps `lastIndex` between calls, and `RegExp.prototype.test`
 * advances it on a match and only resets it on a miss. The regex object is a
 * module-level constant shared by every file of a single `shadcn add` run, so
 * the directive is removed from the first file, kept in the second, removed
 * from the third… Which components keep it therefore depends on how many files
 * that particular invocation happened to touch and in what order — `shadcn add
 * button` and `shadcn add sidebar` disagree about button.tsx.
 *
 * @tecton/react is a client component library: every file that upstream marks
 * `"use client"` must keep the directive, or a React Server Components
 * consumer breaks at build time. So after every `shadcn add`, this script
 * copies the directive back from the aria base sources in the registry mirror
 * clone, which are the ground truth (`scripts/registry-mirror.sh`).
 *
 * It only ever adds the directive — a component whose upstream source has none
 * is left alone — and it preserves each file's existing line endings, so it is
 * safe to run on a CRLF working copy. `scripts/generated-check.sh` ignores
 * differences that consist only of this directive, so restoring it does not
 * make the generated check fail (see docs/UPSTREAM.md).
 */
/// <reference types="node" />
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const repoRoot = path.resolve(pkgRoot, "../..");
const COMPONENTS_DIR = path.join(pkgRoot, "src/components");
const MIRROR_DIR =
  process.env.SHADCN_MIRROR_DIR ?? path.join(repoRoot, ".cache/shadcn-ui");
const BASES_DIR = path.join(MIRROR_DIR, "apps/v4/registry/bases/aria/ui");

const DIRECTIVE = '"use client"';
const check = process.argv.includes("--check");

if (!existsSync(BASES_DIR)) {
  console.error(
    `restore-use-client: the registry mirror clone is missing.\n` +
      `  expected the aria base sources at ${BASES_DIR}\n` +
      `  run \`scripts/registry-mirror.sh setup\` (see docs/UPSTREAM.md), or set\n` +
      `  SHADCN_MIRROR_DIR to an existing clone.`
  );
  process.exit(1);
}

/** The first line of `source`, and the newline sequence the file uses. */
function firstLine(source: string): { line: string; eol: string } {
  const index = source.indexOf("\n");
  if (index === -1) return { line: source, eol: "\n" };
  const line = source.slice(0, index);
  return line.endsWith("\r")
    ? { line: line.slice(0, -1), eol: "\r\n" }
    : { line, eol: "\n" };
}

function hasDirective(source: string): boolean {
  return firstLine(source).line.trim().replace(/;$/, "") === DIRECTIVE;
}

let restored = 0;
let present = 0;
let notUpstream = 0;
const missingBase: string[] = [];
const wouldRestore: string[] = [];

for (const file of readdirSync(COMPONENTS_DIR).sort()) {
  if (!file.endsWith(".tsx")) continue;

  const basePath = path.join(BASES_DIR, file);
  if (!existsSync(basePath)) {
    missingBase.push(file);
    notUpstream += 1;
    continue;
  }

  if (!hasDirective(readFileSync(basePath, "utf8"))) {
    notUpstream += 1;
    continue;
  }

  const installedPath = path.join(COMPONENTS_DIR, file);
  const installed = readFileSync(installedPath, "utf8");
  if (hasDirective(installed)) {
    present += 1;
    continue;
  }

  wouldRestore.push(file);
  restored += 1;
  if (check) continue;

  // Match the files that kept the directive: the directive, a blank line, then
  // the original content — in the line ending this file already uses.
  const { eol } = firstLine(installed);
  writeFileSync(installedPath, `${DIRECTIVE}${eol}${eol}${installed}`, "utf8");
}

if (missingBase.length > 0) {
  console.warn(
    `restore-use-client: no aria base source for ${missingBase.join(", ")} — skipped.`
  );
}

if (check) {
  console.log(
    `missing the directive ${restored} / already present ${present} / upstream has no directive ${notUpstream}`
  );
  if (restored > 0) {
    console.error(
      `restore-use-client: ${wouldRestore.join(", ")} lost the "use client" directive. ` +
        `Run \`pnpm --filter @tecton/react use-client:restore\`.`
    );
    process.exit(1);
  }
} else {
  console.log(
    `restored ${restored} / already present ${present} / upstream has no directive ${notUpstream}`
  );
}
