/**
 * guidelines-check — validates guidelines/*.md against guidelines/README.md.
 *
 *   bun run scripts/guidelines-check.mts            (pnpm guidelines:check)
 *   bun run scripts/guidelines-check.mts --dir <p>  (validate a fixture folder)
 *
 * Checked per file (the contract is in guidelines/README.md):
 *   - the file name is the module basename;
 *   - `component`, `module`, `family`, `exports`, `notFor`, `related` are present
 *     and well shaped, and no other field is;
 *   - `module` is in the package `exports` map, `component` and `exports` are
 *     real exports of the source module, and `component` is listed in `exports`;
 *   - `family` is a key of families.json and lists the module;
 *   - every `notFor.use` and `related` resolves to an export of the package or
 *     to a key of `externals`;
 *   - the body is exactly "## Use it when", "## Do", "## Don't", in that order,
 *     non-empty, with 2-4 / 2-5 bullets and 1-6 Don't entries, each entry a
 *     severity, a `Wrong:` tsx block, a `Correct:` tsx block and a closing
 *     sentence, and no "Not for" heading (that list is rendered from the
 *     frontmatter);
 *   - the file is 40 to 100 lines;
 *   - no text names a library underneath Tecton (by name, package or escape
 *     hatch) except a package name in an import prohibition —
 *     `libraryNameErrors` in guidelines-lib.mts.
 *
 * The same library-name lint runs over topics/*.md, the Markdown under skills/,
 * every string in families.json and every adopted rule.
 *
 * families.json itself is checked too: every module it lists exists as a source
 * file, and every public source module (`INTERNAL_MODULES` aside) is listed in
 * exactly one family — an unlisted module is an error, so the manifest stays the
 * complete map of the package.
 */
/// <reference types="node" />
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import {
  GUIDELINES_DIR,
  INTERNAL_MODULES,
  PKG_ROOT,
  libraryNameErrors,
  loadCatalog,
  loadGuidelines,
  sourceFileOf,
  sourceModules,
} from "./guidelines-lib.mts"

function argValue(flag: string): string | undefined {
  const at = process.argv.indexOf(flag)
  return at === -1 ? undefined : process.argv[at + 1]
}

function checkFamilies(dir: string): string[] {
  const errors: string[] = []
  const catalog = loadCatalog(dir)
  const seen = new Map<string, string[]>()
  for (const [family, entry] of Object.entries(catalog.families.families)) {
    if (!entry || typeof entry !== "object") {
      errors.push(`families.json: "${family}" is not an object`)
      continue
    }
    if (typeof entry.title !== "string" || !entry.title.trim()) {
      errors.push(`families.json: "${family}" has no "title"`)
    }
    if (typeof entry.choice !== "string" || !entry.choice.trim()) {
      errors.push(`families.json: "${family}" has no "choice"`)
    }
    if (!Array.isArray(entry.modules) || !entry.modules.length) {
      errors.push(`families.json: "${family}" has no "modules"`)
      continue
    }
    if (
      entry.checklist !== undefined &&
      (!Array.isArray(entry.checklist) ||
        entry.checklist.some((item) => typeof item !== "string" || !item.trim()))
    ) {
      errors.push(`families.json: "${family}".checklist must be a list of non-empty strings`)
    }
    for (const moduleKey of entry.modules) {
      seen.set(moduleKey, [...(seen.get(moduleKey) ?? []), family])
      if (INTERNAL_MODULES.has(moduleKey)) {
        errors.push(`families.json: "${family}" lists "${moduleKey}", which is internal (INTERNAL_MODULES)`)
      } else if (!existsSync(sourceFileOf(moduleKey))) {
        errors.push(
          `families.json: "${family}" lists "${moduleKey}", which has no source file at src/${moduleKey}.tsx`
        )
      }
    }
  }
  for (const [moduleKey, families] of seen) {
    if (families.length > 1) {
      errors.push(`families.json: "${moduleKey}" is listed in ${families.length} families (${families.join(", ")})`)
    }
  }
  for (const moduleKey of sourceModules()) {
    if (!seen.has(moduleKey)) {
      errors.push(`families.json: "${moduleKey}" is not listed in any family`)
    }
  }
  for (const [name, external] of Object.entries(catalog.families.externals)) {
    if (typeof external?.import !== "string" || !external.import.trim()) {
      errors.push(`families.json: external "${name}" has no "import"`)
    }
    if (typeof external?.docs !== "string" || !external.docs.trim()) {
      errors.push(`families.json: external "${name}" has no "docs"`)
    }
  }
  const strings = (value: unknown): string[] =>
    typeof value === "string"
      ? [value]
      : value && typeof value === "object"
        ? Object.values(value).flatMap(strings)
        : []
  for (const text of strings(catalog.families)) {
    errors.push(...libraryNameErrors(text, "families.json").map((error) => error.replace(/:\d+:/, ":")))
  }
  return errors
}

/** The library-name lint over the pages that are not guideline files. */
function checkPages(dir: string): string[] {
  const files: string[] = []
  const topics = path.join(dir, "topics")
  if (existsSync(topics)) {
    for (const name of readdirSync(topics).filter((entry) => entry.endsWith(".md")).sort()) {
      files.push(path.join(topics, name))
    }
  }
  // The skill ships with the package, not with a fixture folder.
  if (path.resolve(dir) === path.resolve(GUIDELINES_DIR)) {
    const skills = path.join(PKG_ROOT, "skills")
    for (const entry of readdirSync(skills, { recursive: true, encoding: "utf8" })) {
      if (entry.endsWith(".md")) files.push(path.join(skills, entry))
    }
  }
  return files.flatMap((file) =>
    libraryNameErrors(
      readFileSync(file, "utf8"),
      path.relative(PKG_ROOT, file).split(path.sep).join("/")
    )
  )
}

function main() {
  const dir = path.resolve(argValue("--dir") ?? GUIDELINES_DIR)
  const familyErrors = [...checkFamilies(dir), ...checkPages(dir)]
  const { catalog, valid, invalid, parsedFiles } = loadGuidelines(dir)

  for (const error of familyErrors) console.error(`✗ ${error}`)
  for (const [file, errors] of invalid) {
    const rel = path.relative(process.cwd(), file).split(path.sep).join("/")
    console.error(`✗ ${rel.startsWith("..") ? file.split(path.sep).join("/") : rel}`)
    for (const error of errors) console.error(`    ${error}`)
  }

  // Coverage, per family, in families.json order.
  const lines: string[] = []
  let covered = 0
  let total = 0
  for (const [family, entry] of Object.entries(catalog.families.families)) {
    const have = entry.modules.filter((moduleKey) => valid.has(moduleKey)).length
    covered += have
    total += entry.modules.length
    lines.push(`${family} ${have}/${entry.modules.length}`)
  }
  console.log(
    `guidelines: ${valid.size} valid file(s) covering ${covered}/${total} modules — ${lines.join(", ")}`
  )

  const failures = familyErrors.length + invalid.size
  if (failures) {
    console.error(
      `guidelines:check failed — ${invalid.size} of ${parsedFiles.length} file(s) invalid, ${familyErrors.length} problem(s) in families.json, topics or skills.`
    )
    console.error("  the contract is packages/tecton-react/guidelines/README.md")
    process.exit(1)
  }
  console.log("guidelines:check ok")
}

main()
