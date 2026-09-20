/**
 * guidelines-lib — the one reader of `guidelines/*.md`.
 *
 * A guideline file is written once (see guidelines/README.md for the contract)
 * and rendered twice: into the Agent Skills under `skills/` (skills-build.mts)
 * and into the component's docs page (apps/www/scripts/sync-guidelines.mts).
 * Both renderers, and the validator behind `guidelines:check`, share this file so
 * the contract is enforced in exactly one place.
 *
 * Nothing here writes to disk. The module is imported from bun scripts in two
 * packages, so it stays dependency-free apart from `node:fs` and Bun's YAML
 * parser (bun >= 1.2 ships `Bun.YAML`; the scripts are all run with bun).
 */
/// <reference types="node" />
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))

/** packages/tecton-react */
export const PKG_ROOT = path.resolve(here, "..")
export const GUIDELINES_DIR = path.join(PKG_ROOT, "guidelines")
export const FAMILIES_FILE = "families.json"
export const PKG_JSON = path.join(PKG_ROOT, "package.json")
export const SRC_DIR = path.join(PKG_ROOT, "src")

/** The two source folders whose modules a guideline file may describe. */
export const MODULE_DIRS = ["components", "tecton"] as const
export const PKG_NAME = "@tecton/react"

export const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM"] as const
export type Severity = (typeof SEVERITIES)[number]

/** The three body headings, in the order the contract requires. */
export const BODY_HEADINGS = ["Use it when", "Do", "Don't"] as const

export const MIN_LINES = 40
export const MAX_LINES = 100

// ---------------------------------------------------------------------------
// types
// ---------------------------------------------------------------------------

export type NotForEntry = { need: string; use: string }

export type Frontmatter = {
  component: string
  module: string
  family: string
  exports: string[]
  notFor: NotForEntry[]
  related: string[]
}

export type DontEntry = {
  severity: string
  title: string
  /** The heading text without the leading `### `, verbatim. */
  heading: string
  /** The fenced blocks, fences included. */
  wrong: string
  wrongLang: string
  correct: string
  correctLang: string
  /** The sentence after the Correct: block. */
  closing: string
  /** Everything below the heading line, verbatim. */
  body: string
}

export type BodySections = {
  useWhen: string
  do: string
  dont: string
  useWhenBullets: string[]
  doBullets: string[]
  dontEntries: DontEntry[]
  /** Structural problems found while splitting; the validator reports them. */
  errors: string[]
}

export type ParsedGuideline = {
  /** Absolute path. */
  file: string
  /** File name without `.md` — must equal the module basename. */
  name: string
  raw: string
  lineCount: number
  /** The YAML between the `---` fences, or null when there is no frontmatter. */
  frontmatterRaw: string | null
  frontmatter: Record<string, unknown>
  body: string
}

export type Guideline = ParsedGuideline & {
  meta: Frontmatter
  /** `components/badge` — the module key used everywhere else. */
  module: string
  sections: BodySections
}

export type Family = {
  title: string
  choice: string
  modules: string[]
  skill?: { description: string }
}

export type External = { import: string; docs: string; note?: string }

export type FamiliesFile = {
  families: Record<string, Family>
  externals: Record<string, External>
}

export type Reference =
  | {
      kind: "module"
      name: string
      /** `components/badge` */
      module: string
      /** `@tecton/react/components/badge` */
      modulePath: string
      /** `/docs/components/badge` */
      docs: string
      hasGuideline: boolean
    }
  | {
      kind: "external"
      name: string
      /** The full statement from families.json, e.g. `import { toast } from "sonner"`. */
      import: string
      /** Just the specifier, e.g. `sonner`. */
      importFrom: string
      docs: string
    }

export type Catalog = {
  families: FamiliesFile
  /** `components/badge` -> the value exports the module declares. */
  moduleExports: Map<string, string[]>
  /** Export name -> the module that declares it (names are unique package-wide). */
  byExportName: Map<string, string>
  /** `components/badge` -> the families that list it. */
  familiesOfModule: Map<string, string[]>
  /** The keys of the package `exports` map, e.g. `./components/badge`. */
  packageExports: Set<string>
  version: string
  /** `components/badge` -> its validated guideline. Filled by `loadGuidelines`. */
  guidelines: Map<string, Guideline>
}

// ---------------------------------------------------------------------------
// YAML
// ---------------------------------------------------------------------------

type YamlParser = { parse: (text: string) => unknown }

const bunGlobal = globalThis as unknown as { Bun?: { YAML?: YamlParser } }

/** bun >= 1.2 ships `Bun.YAML`; every script that uses this module runs with bun. */
export function parseYaml(text: string): unknown {
  const yaml = bunGlobal.Bun?.YAML
  if (!yaml) {
    throw new Error(
      "Bun.YAML is not available — run this script with bun (`bun run scripts/...`), " +
        "or add the `yaml` package as a devDependency of @tecton/react and use it here."
    )
  }
  return yaml.parse(text)
}

// ---------------------------------------------------------------------------
// module paths
// ---------------------------------------------------------------------------

/** `@tecton/react/components/badge` -> `components/badge` (null when not ours). */
export function moduleKeyOf(modulePath: string): string | null {
  const prefix = `${PKG_NAME}/`
  if (!modulePath.startsWith(prefix)) return null
  const key = modulePath.slice(prefix.length)
  const [dir, ...rest] = key.split("/")
  if (rest.length !== 1) return null
  if (!(MODULE_DIRS as readonly string[]).includes(dir)) return null
  return key
}

/** `components/badge` -> `@tecton/react/components/badge` */
export function modulePathOf(moduleKey: string): string {
  return `${PKG_NAME}/${moduleKey}`
}

/** `components/badge` -> `/docs/components/badge` */
export function docsUrlOf(moduleKey: string): string {
  return `/docs/${moduleKey}`
}

/** `components/badge` -> `packages/tecton-react/src/components/badge.tsx` */
export function sourceFileOf(moduleKey: string): string {
  return path.join(SRC_DIR, `${moduleKey}.tsx`)
}

// ---------------------------------------------------------------------------
// the catalog: families, real exports, package exports
// ---------------------------------------------------------------------------

export function loadFamilies(dir: string = GUIDELINES_DIR): FamiliesFile {
  // A fixture folder passed with `--dir` may carry its own families.json; when
  // it does not, the package's own manifest is the one being validated against.
  const local = path.join(dir, FAMILIES_FILE)
  const file = existsSync(local) ? local : path.join(GUIDELINES_DIR, FAMILIES_FILE)
  const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<FamiliesFile>
  if (!parsed.families || typeof parsed.families !== "object") {
    throw new Error(`${file}: missing the "families" object`)
  }
  return { families: parsed.families, externals: parsed.externals ?? {} }
}

/** Every `.tsx` module under src/components and src/tecton, as module keys. */
export function sourceModules(): string[] {
  const modules: string[] = []
  for (const dir of MODULE_DIRS) {
    const full = path.join(SRC_DIR, dir)
    if (!existsSync(full)) continue
    for (const entry of readdirSync(full, { withFileTypes: true })) {
      if (!entry.isFile()) continue
      if (!entry.name.endsWith(".tsx") || entry.name.endsWith(".d.tsx")) continue
      modules.push(`${dir}/${entry.name.slice(0, -".tsx".length)}`)
    }
  }
  return modules.sort()
}

/**
 * The value exports of a module, read from its `export { ... }` statements.
 *
 * The generated components are never hand-edited, so the statement list at the
 * bottom of the file is the whole public surface. `export type { ... }` blocks
 * and inline `type` specifiers are skipped: a guideline names components and
 * variant factories, not types. `X as Y` contributes `Y`.
 */
export function readModuleExports(moduleKey: string): string[] {
  const file = sourceFileOf(moduleKey)
  const source = readFileSync(file, "utf8")
  const names: string[] = []
  const statement = /(?:^|\n)export\s*(type\s*)?\{([^}]*)\}/g
  let match: RegExpExecArray | null
  while ((match = statement.exec(source))) {
    if (match[1]) continue // export type { ... }
    for (const raw of match[2].split(",")) {
      const specifier = raw.replace(/\/\/[^\n]*/g, "").trim()
      if (!specifier || /^type\s/.test(specifier)) continue
      const parts = specifier.split(/\s+as\s+/)
      const name = (parts[1] ?? parts[0]).trim()
      if (/^[A-Za-z_$][\w$]*$/.test(name)) names.push(name)
    }
  }
  return names
}

function readPackageExports(): { keys: Set<string>; version: string } {
  const manifest = JSON.parse(readFileSync(PKG_JSON, "utf8")) as {
    version?: string
    exports?: Record<string, unknown>
  }
  return {
    keys: new Set(Object.keys(manifest.exports ?? {})),
    version: manifest.version ?? "0.0.0",
  }
}

export function loadCatalog(dir: string = GUIDELINES_DIR): Catalog {
  const families = loadFamilies(dir)
  const moduleExports = new Map<string, string[]>()
  const byExportName = new Map<string, string>()
  for (const moduleKey of sourceModules()) {
    const names = readModuleExports(moduleKey)
    moduleExports.set(moduleKey, names)
    for (const name of names) if (!byExportName.has(name)) byExportName.set(name, moduleKey)
  }
  const familiesOfModule = new Map<string, string[]>()
  for (const [family, entry] of Object.entries(families.families)) {
    for (const moduleKey of entry.modules ?? []) {
      familiesOfModule.set(moduleKey, [...(familiesOfModule.get(moduleKey) ?? []), family])
    }
  }
  const { keys, version } = readPackageExports()
  return {
    families,
    moduleExports,
    byExportName,
    familiesOfModule,
    packageExports: keys,
    version,
    guidelines: new Map(),
  }
}

/**
 * Resolves a `use:` or `related:` name.
 *
 * The README says a replacement is "a `component` or `exports` name from any
 * guideline file, or a key of `externals`". Guideline files land one at a time,
 * so a name that is a real export of a module without a guideline file yet
 * resolves to that module too — the renderers only need the module and its
 * docs URL, and `hasGuideline` says whether the skill can link deeper.
 */
export function resolveReference(name: string, catalog: Catalog): Reference | null {
  for (const guideline of catalog.guidelines.values()) {
    if (guideline.meta.component === name || guideline.meta.exports.includes(name)) {
      return {
        kind: "module",
        name,
        module: guideline.module,
        modulePath: modulePathOf(guideline.module),
        docs: docsUrlOf(guideline.module),
        hasGuideline: true,
      }
    }
  }
  const moduleKey = catalog.byExportName.get(name)
  if (moduleKey) {
    return {
      kind: "module",
      name,
      module: moduleKey,
      modulePath: modulePathOf(moduleKey),
      docs: docsUrlOf(moduleKey),
      hasGuideline: catalog.guidelines.has(moduleKey),
    }
  }
  const external = catalog.families.externals[name]
  if (external) {
    const from = /from\s+["']([^"']+)["']/.exec(external.import ?? "")
    return {
      kind: "external",
      name,
      import: external.import ?? "",
      importFrom: from?.[1] ?? external.import ?? "",
      docs: external.docs ?? "",
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// parsing one file
// ---------------------------------------------------------------------------

function lineCountOf(raw: string): number {
  const text = raw.replace(/\r\n/g, "\n").replace(/\n+$/, "")
  return text === "" ? 0 : text.split("\n").length
}

export function parseGuideline(file: string, raw?: string): ParsedGuideline {
  const text = (raw ?? readFileSync(file, "utf8")).replace(/^﻿/, "")
  const normalized = text.replace(/\r\n/g, "\n")
  const name = path.basename(file, ".md")
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(normalized)
  if (!match) {
    return {
      file,
      name,
      raw: text,
      lineCount: lineCountOf(text),
      frontmatterRaw: null,
      frontmatter: {},
      body: normalized,
    }
  }
  const parsed = parseYaml(match[1])
  const frontmatter =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  return {
    file,
    name,
    raw: text,
    lineCount: lineCountOf(text),
    frontmatterRaw: match[1],
    frontmatter,
    body: normalized.slice(match[0].length),
  }
}

export function guidelineFiles(dir: string = GUIDELINES_DIR): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((entry) => entry.endsWith(".md") && entry !== "README.md")
    .sort()
    .map((entry) => path.join(dir, entry))
}

// ---------------------------------------------------------------------------
// splitting the body
// ---------------------------------------------------------------------------

function isFence(line: string) {
  return /^\s*(```|~~~)/.test(line)
}

type Heading = { level: number; text: string; line: number }

/** Every ATX heading outside fenced code blocks. */
function headingsOf(lines: string[]): Heading[] {
  const headings: Heading[] = []
  let fence: string | null = null
  lines.forEach((line, index) => {
    const fenceMatch = /^\s*(```+|~~~+)/.exec(line)
    if (fenceMatch) {
      if (fence === null) fence = fenceMatch[1]
      else if (line.trim().startsWith(fence)) fence = null
      return
    }
    if (fence !== null) return
    const match = /^(#{1,6})\s+(.*)$/.exec(line)
    if (match) headings.push({ level: match[1].length, text: match[2].trim(), line: index })
  })
  return headings
}

function bulletsOf(section: string): string[] {
  const bullets: string[] = []
  let fence: string | null = null
  for (const line of section.split("\n")) {
    const fenceMatch = /^\s*(```+|~~~+)/.exec(line)
    if (fenceMatch) {
      if (fence === null) fence = fenceMatch[1]
      else if (line.trim().startsWith(fence)) fence = null
      continue
    }
    if (fence !== null) continue
    const match = /^[-*]\s+(.*)$/.exec(line)
    if (match) bullets.push(match[1].trim())
    else if (bullets.length && /^\s+\S/.test(line)) {
      bullets[bullets.length - 1] += ` ${line.trim()}`
    }
  }
  return bullets
}

/** Reads the fenced block that starts at or after `start`; returns null when there is none. */
function readFence(lines: string[], start: number): { text: string; lang: string; end: number } | null {
  let index = start
  while (index < lines.length && lines[index].trim() === "") index += 1
  if (index >= lines.length) return null
  const open = /^\s*(```+|~~~+)\s*([A-Za-z0-9_-]*)\s*$/.exec(lines[index])
  if (!open) return null
  const close = open[1]
  let end = index + 1
  while (end < lines.length && !lines[end].trim().startsWith(close)) end += 1
  if (end >= lines.length) return null
  return {
    text: lines.slice(index, end + 1).join("\n"),
    lang: open[2] ?? "",
    end,
  }
}

function parseDontEntry(heading: string, body: string, errors: string[], where: string): DontEntry {
  const lines = body.split("\n")
  const severity = heading.split(/\s+/)[0] ?? ""
  const title = heading.slice(severity.length).trim()
  const wrongAt = lines.findIndex((line) => /^\s*(\*\*)?Wrong:(\*\*)?\s*$/.test(line))
  let wrong = ""
  let wrongLang = ""
  let correct = ""
  let correctLang = ""
  let closing = ""
  if (wrongAt === -1) {
    errors.push(`${where}: no "Wrong:" line`)
  } else {
    const block = readFence(lines, wrongAt + 1)
    if (!block) {
      errors.push(`${where}: no fenced code block after "Wrong:"`)
    } else {
      wrong = block.text
      wrongLang = block.lang
      const correctAt = lines.findIndex(
        (line, index) => index > block.end && /^\s*(\*\*)?Correct:(\*\*)?\s*$/.test(line)
      )
      if (correctAt === -1) {
        errors.push(`${where}: no "Correct:" line after the Wrong: block`)
      } else {
        const correctBlock = readFence(lines, correctAt + 1)
        if (!correctBlock) {
          errors.push(`${where}: no fenced code block after "Correct:"`)
        } else {
          correct = correctBlock.text
          correctLang = correctBlock.lang
          closing = lines
            .slice(correctBlock.end + 1)
            .join("\n")
            .trim()
          if (!closing) {
            errors.push(`${where}: no closing sentence after the Correct: block`)
          }
        }
      }
    }
  }
  return {
    severity,
    title,
    heading,
    wrong,
    wrongLang,
    correct,
    correctLang,
    closing,
    body: body.replace(/\n+$/, ""),
  }
}

/**
 * Splits a body into the three contract sections and the Don't entries.
 * Structural problems land in `errors`; the renderers only run on files the
 * validator accepted, so they can read the fields directly.
 */
export function splitBody(body: string): BodySections {
  const errors: string[] = []
  const lines = body.split("\n")
  const headings = headingsOf(lines)
  const tops = headings.filter((heading) => heading.level === 2)

  const notFor = headings.find((heading) => /^not for\b/i.test(heading.text))
  if (notFor) {
    errors.push(
      `body: "${notFor.text}" heading — notFor lives in the frontmatter and is rendered from there`
    )
  }

  const found = tops.map((heading) => heading.text)
  const expected = BODY_HEADINGS as readonly string[]
  if (found.length !== expected.length || found.some((text, index) => text !== expected[index])) {
    errors.push(
      `body: expected the level-2 headings ${expected.map((h) => `"## ${h}"`).join(", ")} in that order, found ${
        found.length ? found.map((h) => `"## ${h}"`).join(", ") : "none"
      }`
    )
  }

  const sectionText = (heading: string) => {
    const at = tops.findIndex((top) => top.text === heading)
    if (at === -1) return ""
    const start = tops[at].line + 1
    const next = tops[at + 1]?.line ?? lines.length
    return lines.slice(start, next).join("\n").trim()
  }

  const useWhen = sectionText("Use it when")
  const doSection = sectionText("Do")
  const dont = sectionText("Don't")

  const dontEntries: DontEntry[] = []
  if (dont) {
    const dontLines = dont.split("\n")
    const entryHeadings = headingsOf(dontLines).filter((heading) => heading.level === 3)
    if (!entryHeadings.length) {
      errors.push(`body: "## Don't" has no "### <SEVERITY> <title>" entry`)
    }
    entryHeadings.forEach((heading, index) => {
      const start = heading.line + 1
      const end = entryHeadings[index + 1]?.line ?? dontLines.length
      dontEntries.push(
        parseDontEntry(
          heading.text,
          dontLines.slice(start, end).join("\n").trim(),
          errors,
          `Don't entry "${heading.text}"`
        )
      )
    })
  }

  return {
    useWhen,
    do: doSection,
    dont,
    useWhenBullets: bulletsOf(useWhen),
    doBullets: bulletsOf(doSection),
    dontEntries,
    errors,
  }
}

// ---------------------------------------------------------------------------
// validating one file
// ---------------------------------------------------------------------------

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  if (value.some((item) => typeof item !== "string" || !item.trim())) return null
  return value as string[]
}

function asNotFor(value: unknown): NotForEntry[] | null {
  if (!Array.isArray(value)) return null
  const entries: NotForEntry[] = []
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null
    const record = item as Record<string, unknown>
    if (typeof record.need !== "string" || !record.need.trim()) return null
    if (typeof record.use !== "string" || !record.use.trim()) return null
    entries.push({ need: record.need.trim(), use: record.use.trim() })
  }
  return entries
}

/** Reads the frontmatter into a `Frontmatter`, reporting shape problems. */
export function readFrontmatter(parsed: ParsedGuideline): {
  meta: Frontmatter | null
  errors: string[]
} {
  const errors: string[] = []
  if (parsed.frontmatterRaw === null) {
    return { meta: null, errors: ["frontmatter: the file does not start with a `---` block"] }
  }
  const raw = parsed.frontmatter
  // `fatal` means the rest of the contract cannot be checked against this file;
  // everything else is reported and the checks carry on, so one typo does not
  // hide the other five problems.
  let fatal = false
  const known = new Set(["component", "module", "family", "exports", "notFor", "related"])
  for (const key of Object.keys(raw)) {
    if (!known.has(key)) errors.push(`frontmatter: unknown field "${key}"`)
  }
  const scalar = (key: "component" | "module" | "family") => {
    const value = raw[key]
    if (typeof value !== "string" || !value.trim()) {
      errors.push(`frontmatter: "${key}" must be a non-empty string`)
      fatal = true
      return ""
    }
    return value.trim()
  }
  const component = scalar("component")
  const modulePath = scalar("module")
  const family = scalar("family")

  const exports = asStringArray(raw.exports)
  if (!exports) {
    errors.push(`frontmatter: "exports" must be a non-empty list of names`)
    fatal = true
  } else if (!exports.length) {
    errors.push(`frontmatter: "exports" must list at least one export`)
    fatal = true
  }

  const notFor = asNotFor(raw.notFor)
  if (!notFor) {
    errors.push(`frontmatter: "notFor" must be a list of { need, use } entries, both non-empty`)
    fatal = true
  } else if (!notFor.length) {
    errors.push(`frontmatter: "notFor" must have at least one entry`)
  }

  const related = asStringArray(raw.related)
  if (!related) {
    errors.push(`frontmatter: "related" must be a list of names`)
    fatal = true
  }

  if (fatal) return { meta: null, errors }
  return {
    meta: {
      component,
      module: modulePath,
      family,
      exports: exports ?? [],
      notFor: notFor ?? [],
      related: related ?? [],
    },
    errors,
  }
}

/**
 * The full contract check for one file. `catalog.guidelines` should already hold
 * every parseable file so `use:`/`related:` resolve against them.
 */
export function validateGuideline(
  parsed: ParsedGuideline,
  catalog: Catalog
): { guideline: Guideline | null; errors: string[] } {
  const lengthErrors: string[] = []
  if (parsed.lineCount < MIN_LINES || parsed.lineCount > MAX_LINES) {
    lengthErrors.push(
      `length: the file is ${parsed.lineCount} lines; keep it between ${MIN_LINES} and ${MAX_LINES}`
    )
  }
  const { meta, errors } = readFrontmatter(parsed)
  if (!meta) return { guideline: null, errors: [...errors, ...lengthErrors] }

  const moduleKey = moduleKeyOf(meta.module)
  if (!moduleKey) {
    errors.push(
      `frontmatter: "module" must be "${PKG_NAME}/components/<name>" or "${PKG_NAME}/tecton/<name>", got "${meta.module}"`
    )
  } else {
    const basename = moduleKey.split("/")[1]
    if (basename !== parsed.name) {
      errors.push(
        `file name: "${parsed.name}.md" does not match the module basename "${basename}" of "${meta.module}"`
      )
    }
    if (!catalog.packageExports.has(`./${moduleKey}`)) {
      errors.push(
        `frontmatter: "${meta.module}" is not in the package "exports" map (run exports:build)`
      )
    }
    const real = catalog.moduleExports.get(moduleKey)
    if (!real) {
      errors.push(`frontmatter: "${meta.module}" has no source file at src/${moduleKey}.tsx`)
    } else {
      for (const name of meta.exports) {
        if (!real.includes(name)) {
          errors.push(`frontmatter: "exports" names "${name}", which ${meta.module} does not export`)
        }
      }
      if (!real.includes(meta.component)) {
        errors.push(`frontmatter: "component" is "${meta.component}", which ${meta.module} does not export`)
      } else if (!meta.exports.includes(meta.component)) {
        errors.push(`frontmatter: "exports" must include the "component" "${meta.component}"`)
      }
    }
    const family = catalog.families.families[meta.family]
    if (!family) {
      errors.push(`frontmatter: "family" is "${meta.family}", which is not a key of families.json`)
    } else if (!family.modules.includes(moduleKey)) {
      errors.push(
        `frontmatter: family "${meta.family}" does not list "${moduleKey}" (families.json lists it under ${
          (catalog.familiesOfModule.get(moduleKey) ?? ["no family"]).join(", ")
        })`
      )
    }
  }

  for (const entry of meta.notFor) {
    if (!resolveReference(entry.use, catalog)) {
      errors.push(
        `notFor: "${entry.use}" resolves to no export of @tecton/react and no key of "externals" in families.json`
      )
    }
  }
  for (const name of meta.related) {
    if (!resolveReference(name, catalog)) {
      errors.push(
        `related: "${name}" resolves to no export of @tecton/react and no key of "externals" in families.json`
      )
    }
  }

  const sections = splitBody(parsed.body)
  errors.push(...sections.errors)
  if (!sections.errors.length) {
    if (!sections.useWhen) errors.push(`body: "## Use it when" is empty`)
    if (!sections.do) errors.push(`body: "## Do" is empty`)
    if (!sections.dont) errors.push(`body: "## Don't" is empty`)
    if (sections.useWhenBullets.length < 2 || sections.useWhenBullets.length > 4) {
      errors.push(
        `body: "## Use it when" must have 2 to 4 bullets, found ${sections.useWhenBullets.length}`
      )
    }
    if (sections.doBullets.length < 2 || sections.doBullets.length > 5) {
      errors.push(`body: "## Do" must have 2 to 5 bullets, found ${sections.doBullets.length}`)
    }
    if (sections.dontEntries.length < 1 || sections.dontEntries.length > 6) {
      errors.push(`body: "## Don't" must have 1 to 6 entries, found ${sections.dontEntries.length}`)
    }
  }
  for (const entry of sections.dontEntries) {
    const where = `Don't entry "${entry.heading}"`
    if (!(SEVERITIES as readonly string[]).includes(entry.severity)) {
      errors.push(`${where}: must start with a severity (${SEVERITIES.join(" | ")})`)
    }
    if (!entry.title) errors.push(`${where}: has a severity but no title`)
    if (entry.wrong && entry.wrongLang !== "tsx") {
      errors.push(`${where}: the Wrong: block must be fenced as \`\`\`tsx, found "${entry.wrongLang || "no language"}"`)
    }
    if (entry.correct && entry.correctLang !== "tsx") {
      errors.push(`${where}: the Correct: block must be fenced as \`\`\`tsx, found "${entry.correctLang || "no language"}"`)
    }
  }

  errors.push(...lengthErrors)

  if (errors.length || !moduleKey) return { guideline: null, errors }
  return { guideline: { ...parsed, meta, module: moduleKey, sections }, errors }
}

/**
 * Parses and validates every file in `dir`.
 *
 * Two passes: the first fills `catalog.guidelines` with the files whose
 * frontmatter parses, so the second can resolve `use:`/`related:` against them.
 */
export function loadGuidelines(dir: string = GUIDELINES_DIR, catalog = loadCatalog(dir)) {
  const parsedFiles = guidelineFiles(dir).map((file) => parseGuideline(file))
  for (const parsed of parsedFiles) {
    const { meta } = readFrontmatter(parsed)
    if (!meta) continue
    const moduleKey = moduleKeyOf(meta.module)
    if (!moduleKey) continue
    catalog.guidelines.set(moduleKey, {
      ...parsed,
      meta,
      module: moduleKey,
      sections: splitBody(parsed.body),
    })
  }
  const valid = new Map<string, Guideline>()
  const invalid = new Map<string, string[]>()
  for (const parsed of parsedFiles) {
    const { guideline, errors } = validateGuideline(parsed, catalog)
    if (guideline) valid.set(guideline.module, guideline)
    else invalid.set(parsed.file, errors)
  }
  catalog.guidelines = valid
  return { catalog, valid, invalid, parsedFiles }
}

// ---------------------------------------------------------------------------
// render helpers shared by the skills build and the docs render
// ---------------------------------------------------------------------------

export type NotForStyle = "skill" | "docs"

/**
 * The "Not for" list, rendered from the frontmatter (never from the body).
 *
 *   skill: `- <need>: use \`Chip\` — \`import { Chip } from "@tecton/react/tecton/chip"\``
 *   docs:  `- <need>: use [Chip](/docs/tecton/chip)`
 */
export function renderNotFor(
  meta: Frontmatter,
  catalog: Catalog,
  style: NotForStyle = "skill"
): string[] {
  return meta.notFor.map((entry) => {
    const reference = resolveReference(entry.use, catalog)
    if (!reference) return `- ${entry.need}: use ${entry.use}`
    if (style === "docs") {
      return reference.docs
        ? `- ${entry.need}: use [${reference.name}](${reference.docs})`
        : `- ${entry.need}: use ${reference.name}`
    }
    const importLine =
      reference.kind === "module"
        ? `import { ${reference.name} } from "${reference.modulePath}"`
        : reference.import
    return `- ${entry.need}: use \`${reference.name}\` — \`${importLine}\``
  })
}

/** `import { Badge, badgeVariants } from "@tecton/react/components/badge"` */
export function renderImportLine(meta: Frontmatter): string {
  return `import { ${meta.exports.join(", ")} } from "${meta.module}"`
}

/** Re-emits a Don't entry at the requested heading level, body verbatim. */
export function renderDontEntry(entry: DontEntry, level: number): string {
  return `${"#".repeat(level)} ${entry.heading}\n\n${entry.body}`
}
