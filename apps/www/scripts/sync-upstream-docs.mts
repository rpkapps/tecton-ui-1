/// <reference types="node" />
/**
 * Ports the upstream shadcn/ui docs for the React Aria base into this site.
 *
 *   content/docs/components/aria/<name>.mdx  ->  content/docs/components/<name>.mdx
 *   examples/aria/<example>.tsx              ->  src/examples/<example>.tsx
 *
 * Only the pages of components that exist in packages/tecton-react/src/components
 * (plus a few upstream guide pages) are synced. Import paths are rewritten to
 * `@tecton/react/...`; examples that depend on upstream-only infrastructure
 * (AI SDK, next/font, react-day-picker…) are skipped and the previews that
 * reference them are removed from the page. A report is written next to this
 * script so the skips are visible.
 *
 * Usage:  bun run scripts/sync-upstream-docs.mts
 * Env:    SHADCN_UPSTREAM_DIR  path to a shadcn-ui/ui checkout at the commit
 *         pinned in docs/UPSTREAM.md (default: <repo>/.cache/shadcn-ui)
 */
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Project, QuoteKind, ScriptKind, SyntaxKind, ts } from "ts-morph"
import { tectonIconImportFor, verifyAgainstManifest } from "../../../scripts/upstream-icons.mts"
import { withGuidelines } from "./sync-guidelines.mts"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const WWW = path.resolve(HERE, "..")
const REPO = path.resolve(WWW, "../..")
const UPSTREAM = path.resolve(
  process.env.SHADCN_UPSTREAM_DIR ?? path.join(REPO, ".cache/shadcn-ui")
)
const V4 = path.join(UPSTREAM, "apps/v4")
const COMPONENTS_DIR = path.join(REPO, "packages/tecton-react/src/components")
const OUT_DOCS = path.join(WWW, "content/docs/components")
const OUT_EXAMPLES = path.join(WWW, "src/examples")

/** Upstream examples that do not type-check against the pinned dependencies. */
const BROKEN_EXAMPLES: Record<string, string> = {
  "select-field-dynamic": "uses SelectValue render props (id/name) that react-aria-components 1.21 does not expose",
}

/** Upstream docs pages without a component file that are still worth keeping. */
const EXTRA_PAGES = ["data-table", "date-picker"]

/**
 * Other upstream docs folders that are synced page by page. The pages reference
 * `examples/aria/*` like the component pages do.
 */
const EXTRA_FOLDERS: Record<string, { title: string; pages: string[] }> = {
  utils: { title: "Utilities", pages: ["scroll-fade", "shimmer"] },
}

/** Module specifiers examples may import, and how to rewrite them. */
const IMPORT_REWRITES: [RegExp, string][] = [
  [/^@\/styles\/aria-[a-z]+\/ui(?:-rtl)?\/(.+)$/, "@tecton/react/components/$1"],
  [/^@\/hooks\/use-mobile$/, "@tecton/react/hooks/use-mobile"],
  [/^next\/image$/, "@/components/shims/image"],
  [/^next\/link$/, "@/components/shims/link"],
  [/^@\/components\/language-selector$/, "@/components/language-selector"],
  [/^@\/hooks\/(use-media-query|use-copy-to-clipboard)$/, "@/hooks/$1"],
]

/** Bare/external modules that are dependencies of apps/www. */
const ALLOWED_MODULES = new Set([
  "react",
  "react-dom",
  "cn",
  "@tecton/react/icons",
  "react-aria-components",
  "sonner",
  "@internationalized/date",
  "recharts",
  "input-otp",
  "@tanstack/react-table",
  "zod",
  "embla-carousel-autoplay",
  "react-textarea-autosize",
  "class-variance-authority",
  "@shadcn/react/questionnaire",
])

type Report = {
  upstream: string
  pages: string[]
  examples: string[]
  skippedExamples: Record<string, string>
  removedPreviews: Record<string, string[]>
}

async function exists(file: string) {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

// Per-example source fixes for upstream demos that assume the vega look.
const EXAMPLE_REWRITES: Record<string, (code: string) => string> = {
  // The Tecton trigger paints a hover / expanded surface. Upstream pads the
  // item, which insets that surface while the item dividers still run to the
  // border; padding the trigger and content instead keeps the surface as wide
  // as the dividers.
  "accordion-borders": (code) =>
    code
      .replace('className="border-b px-4 last:border-b-0"', 'className="border-b last:border-b-0"')
      .replace("<AccordionTrigger>{item.trigger}</AccordionTrigger>", '<AccordionTrigger className="px-4">{item.trigger}</AccordionTrigger>')
      .replace("<AccordionContent>{item.content}</AccordionContent>", '<AccordionContent className="px-4">{item.content}</AccordionContent>'),
  // The edge-to-edge scroll area draws a divider above itself; the footer
  // below it gets the matching divider (and, through the card's
  // `[.border-t]:pt-(--card-spacing)` rule, its top inset back).
  "card-edge-to-edge": (code) =>
    code.replace('<CardFooter className="justify-end gap-2">', '<CardFooter className="justify-end gap-2 border-t">'),
  // Custom-colour demos use Tailwind's stock palette, which the Tecton theme
  // removes (`--color-*: initial`); see TECTON_PALETTE_REWRITES.
  "badge-colors": rewriteStockColors,
  "alert-colors": rewriteStockColors,
  "avatar-badge": rewriteStockColors,
  "avatar-demo": rewriteStockColors,
  "avatar-rtl": rewriteStockColors,
  "button-group-input-group": rewriteStockColors,
  "input-group-button": rewriteStockColors,
}

/**
 * Tailwind stock colour classes used by upstream demos, and the Tecton palette
 * classes that replace them. Tecton ramp steps are contrast levels that switch
 * value with the mode, so one class replaces a light + `dark:` pair: a tinted
 * surface is step 120 with text at 830 (the filled status badge recipe), a
 * solid fill is 560 (the filled status button recipe).
 */
const TECTON_PALETTE_REWRITES: [string, string][] = [
  // badge-colors
  ["bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300", "bg-blue-120 text-blue-830"],
  ["bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300", "bg-green-120 text-green-830"],
  ["bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300", "bg-azure-120 text-azure-830"],
  ["bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300", "bg-orchid-120 text-orchid-830"],
  ["bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300", "bg-red-120 text-red-830"],
  // alert-colors
  [
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50",
    "border-yellow-160 bg-yellow-120 text-yellow-1000",
  ],
  // avatar-badge, avatar-demo, avatar-rtl
  ["bg-green-600 dark:bg-green-800", "bg-green-560"],
  // button-group-input-group
  [
    "data-[active=true]:bg-orange-100 data-[active=true]:text-orange-700 dark:data-[active=true]:bg-orange-800 dark:data-[active=true]:text-orange-100",
    "data-[active=true]:bg-saffron-120 data-[active=true]:text-saffron-830",
  ],
  // input-group-button
  ["data-[favorite=true]:fill-blue-600 data-[favorite=true]:stroke-blue-600", "data-[favorite=true]:fill-blue-560 data-[favorite=true]:stroke-blue-560"],
]

function rewriteStockColors(code: string): string {
  for (const [stock, tecton] of TECTON_PALETTE_REWRITES) code = code.split(stock).join(tecton)
  // families Tecton does not have, or steps only Tailwind has (200 … 950; 50
  // and 100 exist on both scales and cannot be told apart here)
  const leftover =
    /\b(?:bg|text|border|fill|stroke|ring)-(?:(?:orange|amber|emerald|teal|cyan|sky|indigo|purple|fuchsia|rose|slate|zinc|neutral|stone)-\d+|(?:red|yellow|lime|green|blue|violet|pink|gray)-(?:[2-9]00|950))\b/.exec(
      code
    )
  if (leftover) throw new Error(`stock Tailwind colour left in a synced example: ${leftover[0]} (add it to TECTON_PALETTE_REWRITES)`)
  return code
}

/**
 * A few upstream examples reach for `@tabler/icons-react` instead of the icon
 * library the placeholders name. Tabler's identifiers are a second vocabulary,
 * so they are translated to the first one here and then travel the same path as
 * every other icon: through `rewriteUpstreamIcons` to a Tecton name.
 */
const TABLER_TO_UPSTREAM: Record<string, string> = {
  IconBell: "BellIcon",
  IconBrandJavascript: "BracesIcon",
  IconCheck: "CheckIcon",
  IconCloud: "CloudIcon",
  IconCopy: "CopyIcon",
  IconCornerDownLeft: "CornerDownLeftIcon",
  IconFolderCode: "FolderCodeIcon",
  IconGitBranch: "GitBranchIcon",
  IconGitFork: "GitForkIcon",
  IconInfoCircle: "InfoIcon",
  IconPlus: "PlusIcon",
  IconRefresh: "RefreshCwIcon",
  IconStar: "StarIcon",
}

function rewriteTablerIcons(source: string): string {
  const match = source.match(
    /import\s*\{([^}]*)\}\s*from\s*["']@tabler\/icons-react["']\n?/
  )
  if (!match) return source
  const idents = match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const unknown = idents.filter((id) => !(id in TABLER_TO_UPSTREAM))
  if (unknown.length) {
    throw new Error(
      `unmapped @tabler/icons-react identifier(s): ${unknown.join(", ")} — add them to TABLER_TO_UPSTREAM`
    )
  }
  const upstreamImport = `import { ${idents.map((id) => TABLER_TO_UPSTREAM[id]).sort().join(", ")} } from "${UPSTREAM_ICON_MODULES[0]}"\n`
  let code = source.replace(match[0], upstreamImport)
  for (const id of idents) {
    code = code.replace(new RegExp(`\\b${id}\\b`, "g"), TABLER_TO_UPSTREAM[id])
  }
  return code
}

/**
 * Upstream names icons after the icon libraries shadcn/ui supports; Tecton ships
 * its own set and no compatibility layer for anyone else's. Every synced example
 * and every synced page therefore has its icon imports and its icon identifiers
 * rewritten to Tecton ones — `XIcon` → `CloseIcon`, `Trash2Icon` → `DeleteIcon`
 * — through `scripts/upstream-icons.mts`, the same table the registry mirror's
 * post-build step uses. An identifier the table does not know fails the sync.
 *
 * The rewrite is an AST edit (ts-morph): the import declarations are replaced
 * and each local binding is renamed through the language service, so a local
 * variable that happens to share the name, a string that happens to contain it
 * and a property of the same name are all left alone — which a regular
 * expression over JSX could not promise.
 */
/** Modules whose named imports are upstream icon identifiers. */
const UPSTREAM_ICON_MODULES = [
  "lucide-react",
  // Upstream's own icon indirection module, which a few examples import instead.
  "@/registry/icons/__lucide__",
]
/** The module every rewritten import points at. */
const TECTON_ICONS_MODULE = "@tecton/react/icons"
/** Upstream icon *types*: not icons, so not in the UPSTREAM_ICONS table. */
const UPSTREAM_ICON_TYPES: Record<string, string> = {
  LucideIcon: "TectonIconComponent",
  LucideProps: "TectonIconProps",
}

const iconProject = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: { jsx: ts.JsxEmit.Preserve, allowJs: true },
  manipulationSettings: { quoteKind: QuoteKind.Double },
})
let iconFileSeq = 0

/**
 * Rewrite one TypeScript / TSX source so its icons come from Tecton, and report
 * which local names changed (the MDX pass needs that; see below).
 *
 * - `import { XIcon } from "lucide-react"` becomes
 *   `import { CloseIcon } from "@tecton/react/icons"`, and every `XIcon` in the
 *   file becomes `CloseIcon`.
 * - an alias the file already chose is kept: `{ XIcon as Close }` becomes
 *   `{ CloseIcon as Close }` and nothing else in the file moves.
 * - two upstream names for one Tecton icon collapse into a single import, with
 *   both sets of usages renamed.
 * - a Tecton name already taken by something else in the file is not allowed to
 *   shadow it: that import keeps the upstream local name as an alias.
 * - `type LucideIcon` becomes `type TectonIconComponent`.
 *
 * `where` names the file (or snippet) in an error. A source that imports no
 * icons comes back untouched, which is what makes `docs:sync` idempotent.
 */
function rewriteIcons(source: string, where: string): { code: string; renames: Map<string, string> } {
  const renames = new Map<string, string>()
  if (!UPSTREAM_ICON_MODULES.some((module) => source.includes(module))) {
    return { code: source, renames }
  }
  const file = iconProject.createSourceFile(`icons-${iconFileSeq++}.tsx`, source, {
    scriptKind: ScriptKind.TSX,
    overwrite: true,
  })
  const upstreamImports = () =>
    file
      .getImportDeclarations()
      .filter((declaration) =>
        UPSTREAM_ICON_MODULES.includes(declaration.getModuleSpecifier().getLiteralText())
      )
  if (!upstreamImports().length) {
    file.delete()
    return { code: source, renames }
  }

  type Binding = {
    /** The name the source uses today. */
    local: string
    /** The `@tecton/react/icons` export it becomes. */
    tecton: string
    /** The name the source will use — `tecton`, or the alias it already had. */
    next: string
    isType: boolean
  }
  const bindings: Binding[] = []
  const locals = new Set<string>()
  for (const declaration of upstreamImports()) {
    if (declaration.getDefaultImport() || declaration.getNamespaceImport()) {
      throw new Error(`${where}: ${declaration.getText()} — only named icon imports can be rewritten`)
    }
    const typeOnly = declaration.isTypeOnly()
    for (const specifier of declaration.getNamedImports()) {
      const imported = specifier.getName()
      const local = specifier.getAliasNode()?.getText() ?? imported
      const isType = typeOnly || specifier.isTypeOnly()
      const tecton = isType ? UPSTREAM_ICON_TYPES[imported] : tectonIconImportFor(imported, where)
      if (!tecton) {
        throw new Error(
          `${where}: no Tecton type for the upstream type "${imported}" — ` +
            "add it to UPSTREAM_ICON_TYPES in scripts/sync-upstream-docs.mts"
        )
      }
      bindings.push({ local, tecton, next: local === imported ? tecton : local, isType })
      locals.add(local)
    }
  }

  // A name the source already uses for something else must not be shadowed:
  // that import keeps the name it has and carries an alias instead.
  const taken = new Set(
    file
      .getDescendantsOfKind(SyntaxKind.Identifier)
      .map((identifier) => identifier.getText())
      .filter((text) => !locals.has(text))
  )
  for (const binding of bindings) {
    if (binding.next === binding.tecton && taken.has(binding.tecton)) binding.next = binding.local
  }

  // Two locals may legitimately become one name (two upstream spellings of the
  // same icon); two different icons under one name would be a real clash.
  const byNext = new Map<string, Binding>()
  for (const binding of bindings) {
    const seen = byNext.get(binding.next)
    if (seen && seen.tecton !== binding.tecton) {
      throw new Error(
        `${where}: "${seen.local}" and "${binding.local}" would both be called "${binding.next}" ` +
          `but are different icons (${seen.tecton} / ${binding.tecton})`
      )
    }
    if (!seen) byNext.set(binding.next, binding)
  }

  // Rename the bindings whose name changes. `.rename()` goes through the
  // language service, so only real references move.
  for (const binding of bindings) {
    if (binding.next === binding.local) continue
    renames.set(binding.local, binding.next)
    const specifier = upstreamImports()
      .flatMap((declaration) => declaration.getNamedImports())
      .find((named) => (named.getAliasNode()?.getText() ?? named.getName()) === binding.local)
    if (!specifier) continue
    const node = specifier.getAliasNode() ?? specifier.getNameNode()
    node.rename(binding.next, { usePrefixAndSuffixText: false })
  }

  // One import declaration in place of the upstream ones. The first is edited in
  // place rather than removed and re-inserted, so the blank lines around it —
  // upstream separates its external imports from its local ones — survive.
  const [first, ...rest] = upstreamImports()
  for (const declaration of rest) declaration.remove()
  const semicolon = first.getText().endsWith(";")
  first.set({
    isTypeOnly: false,
    moduleSpecifier: TECTON_ICONS_MODULE,
    namedImports: [...byNext.values()]
      .sort((a, b) => a.tecton.localeCompare(b.tecton))
      .map((binding) => ({
        name: binding.tecton,
        alias: binding.next === binding.tecton ? undefined : binding.next,
        isTypeOnly: binding.isType,
      })),
  })
  if (!semicolon) first.replaceWithText(first.getText().replace(/;$/, ""))

  const code = file.getFullText()
  file.delete()
  return { code, renames }
}

/** The codemod, for a TypeScript / TSX source. */
export function rewriteUpstreamIcons(source: string, where: string): string {
  return rewriteIcons(source, where).code
}

/** ```tsx fences in an MDX page, which is where the prose teaches an import. */
const CODE_FENCE = /^(```)(tsx|ts|jsx|js)\b([^\n]*\n)([\s\S]*?)^```/gm
/** A page-level `import { … } from "<an upstream icon module>"` statement. */
const ICON_IMPORT_STATEMENT = new RegExp(
  String.raw`^import\s+(?:type\s+)?\{[^}]*\}\s+from\s+["'](?:` +
    UPSTREAM_ICON_MODULES.map((module) => module.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)).join("|") +
    String.raw`)["'];?[^\S\n]*\n`,
  "gm"
)

/**
 * The same rewrite for a synced MDX page. MDX is prose, not a program, so there
 * is no one AST to walk: the fenced code samples are each rewritten as TSX — a
 * sample that tells the reader to import from an icon package is documentation
 * that would now be wrong — and a page-level import (the pages that render an
 * icon in their own prose) has its statement rewritten by the same codemod,
 * with the renamed identifiers replaced in the body, where they appear as JSX
 * element names.
 */
export function rewriteUpstreamIconsInMdx(mdx: string, where: string): string {
  let out = mdx.replace(CODE_FENCE, (match, open: string, lang: string, rest: string, body: string) => {
    if (!UPSTREAM_ICON_MODULES.some((module) => body.includes(module))) return match
    return open + lang + rest + rewriteUpstreamIcons(body, `${where} (code sample)`) + "```"
  })

  const statements = out.match(ICON_IMPORT_STATEMENT)
  if (!statements) return out
  const { code, renames } = rewriteIcons(statements.join(""), `${where} (page imports)`)
  let first = true
  out = out.replace(ICON_IMPORT_STATEMENT, () => {
    if (!first) return ""
    first = false
    return code
  })
  for (const [from, to] of renames) {
    out = out.replace(new RegExp(String.raw`\b${from}\b`, "g"), to)
  }
  return out
}


function rewriteImports(source: string, where: string): { code: string; blocked?: string } {
  let blocked: string | undefined
  let code = rewriteTablerIcons(source).replace(
    /(from\s+|import\s+|import\()\s*(["'])([^"']+)\2/g,
    (match, prefix: string, quote: string, spec: string) => {
      if (spec.startsWith(".")) return match
      for (const [pattern, replacement] of IMPORT_REWRITES) {
        if (pattern.test(spec)) {
          return `${prefix}${quote}${spec.replace(pattern, replacement)}${quote}`
        }
      }
      // The icon modules are rewritten below, once the example is known to be
      // syncable — an example that is skipped anyway must not force a new entry
      // in scripts/upstream-icons.mts.
      if (UPSTREAM_ICON_MODULES.includes(spec)) return match
      if (ALLOWED_MODULES.has(spec) || spec.startsWith("react/")) return match
      blocked ??= spec
      return match
    }
  )
  if (!blocked) code = rewriteUpstreamIcons(code, where)
  return { code, blocked }
}

// Tecton additions to a synced component page: the extra variants that the
// `aria-tecton` overlay adds to the upstream component (alert severity,
// separator emphasis, badge colours, input variants…). The content of
// `scripts/docs-extras/<name>.mdx` is inserted before the upstream
// "API Reference" section, or appended when the page has none.
const EXTRAS_DIR = path.join(WWW, "scripts/docs-extras")

async function withExtras(mdx: string, name: string) {
  const file = path.join(EXTRAS_DIR, `${name}.mdx`)
  if (!(await exists(file))) return mdx
  const extras = (await fs.readFile(file, "utf8")).trim()
  const marker = "\n## API Reference"
  const index = mdx.indexOf(marker)
  if (index === -1) return `${mdx.trimEnd()}\n\n${extras}\n`
  return `${mdx.slice(0, index).trimEnd()}\n\n${extras}\n${mdx.slice(index)}`
}

// The synced examples are listed in the repository's .prettierignore (between
// the markers below) so `pnpm format` leaves upstream code untouched.
const PRETTIER_IGNORE = path.join(REPO, ".prettierignore")
const IGNORE_START = "# synced-examples:start (written by apps/www/scripts/sync-upstream-docs.mts)"
const IGNORE_END = "# synced-examples:end"

async function writePrettierIgnore(examples: string[]) {
  const block = [
    IGNORE_START,
    ...examples.map((name) => `apps/www/src/examples/${name}.tsx`),
    IGNORE_END,
  ].join("\n")
  const current = (await exists(PRETTIER_IGNORE)) ? await fs.readFile(PRETTIER_IGNORE, "utf8") : ""
  const start = current.indexOf(IGNORE_START)
  const end = current.indexOf(IGNORE_END)
  const next =
    start !== -1 && end !== -1
      ? current.slice(0, start) + block + current.slice(end + IGNORE_END.length)
      : `${current.trimEnd()}\n\n${block}\n`
  if (next !== current) await fs.writeFile(PRETTIER_IGNORE, next)
}

const LOCAL_DOCS = new Set([
  "",
  "installation",
  "theming",
  "typography",
  "spacing",
  "cli",
  "icons",
  "forms",
  "components",
  "tecton",
  "utils",
])

function isLocalDocsLink(href: string) {
  const [pathname] = href.split(/[#?]/)
  if (pathname === "/blocks" || pathname === "/themes") return true
  if (!pathname.startsWith("/docs")) return false
  const [, , first, second] = pathname.split("/")
  // only the TanStack Form guide exists locally; the other upstream form guides
  // (react-hook-form, formisch…) stay on ui.shadcn.com
  if (first === "forms") return !second || second === "tanstack-form"
  return LOCAL_DOCS.has(first ?? "")
}

function transformMdx(
  mdx: string,
  name: string,
  removed: Set<string>,
  upstreamDir = "content/docs/components/aria"
) {
  // frontmatter
  mdx = mdx.replace(/^---\n([\s\S]*?)\n---/, (_m, fm: string) => {
    const lines = fm
      .split("\n")
      .filter((line) => !/^(base|component|featured):/.test(line))
    lines.push(`upstream: apps/v4/${upstreamDir}/${name}.mdx`)
    return `---\n${lines.join("\n")}\n---`
  })

  // drop styleName props (aria-nova / aria-rhea …)
  mdx = mdx.replace(/\s+styleName="[^"]*"/g, "")

  // Pages name icons too — in a Callout, and in the code samples that tell the
  // reader what to import. Same translation as the examples get.
  mdx = rewriteUpstreamIconsInMdx(rewriteTablerIcons(mdx), `${upstreamDir}/${name}.mdx`)

  // Components are consumed from the @tecton/react package, not installed one
  // by one, so the upstream "Installation" section (CLI command + manual copy)
  // is removed. Utilities ship with the package stylesheet.
  mdx = mdx.replace(
    /\n## Installation\n[\s\S]*?(?=\n## )/,
    upstreamDir.startsWith("content/docs/utils")
      ? "\n## Installation\n\nNothing to install: the utility ships with `@tecton/react/globals.css`, which imports `shadcn/tailwind.css`.\n"
      : "\n"
  )
  // the form guides keep their npm dependencies but not the shadcn CLI step
  mdx = mdx.replace(
    /\n(?:Add|Install) the components used in this guide:\n\n```bash\nnpx shadcn@latest add [^\n]*\n```\n/,
    "\n"
  )

  // Upstream release notes and migration steps between shadcn versions do not
  // apply to a versioned package.
  mdx = mdx.replace(/\n## Changelog\n[\s\S]*?(?=\n## |$)/, "\n")
  // Sections that ask the reader to edit the generated component file: the
  // package files are read-only for applications.
  mdx = mdx.replace(/\n## Next\.js\n[\s\S]*?(?=\n## |$)/, "\n")
  mdx = mdx.replace(
    /\nIf you have a single sidebar in your application, you can use the `SIDEBAR_WIDTH`[^\n]*\n\n```tsx[^\n]*\nconst SIDEBAR_WIDTH[\s\S]*?```\n\nFor multiple sidebars in your application, you can use/,
    "\nTo change the width, set"
  )
  // The upstream RTL section links to shadcn's own configuration guide and a
  // hosted preview (`<Button asChild>` has no React Aria equivalent either);
  // the package supports RTL through its Direction provider.
  mdx = mdx.replace(
    /\n## RTL\n\nTo enable RTL support in shadcn\/ui, see the \[RTL configuration guide\]\([^)]*\)\.\n\n\{\/\* prettier-ignore \*\/\}\n<Button asChild[^\n]*\n[^\n]*\n<\/Button>\n/,
    "\n## RTL\n\nThe sidebar follows the reading direction set with the [Direction](/docs/components/direction) provider; no extra configuration is needed.\n"
  )
  // `shadcn init` is for projects that own the component sources
  mdx = mdx.replace(
    /\nYou can also enable this during project setup with `npx shadcn@latest init[^\n]*\n/,
    "\n"
  )

  // Tailwind's stock palette is removed by the Tecton theme; prose and inline
  // snippets name Tecton palette steps instead (see TECTON_PALETTE_REWRITES).
  mdx = mdx.replace(
    "adding custom classes such as `bg-amber-50 dark:bg-amber-950` to the `Alert` component.",
    "adding [palette](/docs/theming#palette) classes such as `bg-yellow-120 text-yellow-1000` to the `Alert` component (a step is a contrast level, so no `dark:` variant is needed)."
  )
  mdx = mdx.replace(
    "adding custom classes such as `bg-green-50 dark:bg-green-800` to the `Badge` component.",
    "adding [palette](/docs/theming#palette) classes such as `bg-green-120 text-green-830` to the `Badge` component (a step is a contrast level, so no `dark:` variant is needed)."
  )
  mdx = mdx.replace(/\btext-gray-500\b/g, "text-muted-foreground")
  mdx = mdx.replace(
    'className="mt-4 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-950"',
    'className="mt-4 border-yellow-160 bg-yellow-110"'
  )
  for (const [stock, tecton] of TECTON_PALETTE_REWRITES) mdx = mdx.split(stock).join(tecton)

  // remove previews that reference skipped examples or upstream blocks
  mdx = mdx.replace(/<ComponentPreview\b[^>]*?\/>/gs, (tag) => {
    const nameMatch = tag.match(/\bname="([^"]+)"/)
    const previewName = nameMatch?.[1]
    if (!previewName) return tag
    if (/\btype="block"/.test(tag) || removed.has(previewName)) {
      return `<!-- removed: ${previewName} -->`
    }
    return tag
  })
  // a heading immediately followed by a removed preview loses the heading too
  mdx = mdx.replace(
    /\n#{2,4} [^\n]+\n\n(?:[^\n#<][^\n]*\n\n)?<!-- removed: [^>]+ -->\n/g,
    "\n"
  )
  mdx = mdx.replace(/\n?<!-- removed: [^>]+ -->\n/g, "\n")

  // links to the removed section point at the package installation page
  mdx = mdx.replace(/\]\(#installation\)/g, "](/docs/installation)")

  // import paths and file titles
  mdx = mdx.replace(/@\/components\/ui\//g, "@tecton/react/components/")
  mdx = mdx.replace(/title="components\/ui\/([^"]+)"/g, 'title="@tecton/react/components/$1"')
  mdx = mdx.replace(/`components\/ui\/([a-z0-9-]+\.tsx)`/g, "`@tecton/react/components/$1`")

  // docs links that point at other bases
  mdx = mdx.replace(/\]\(\/docs\/components\/(?:base|radix|aria)\//g, "](/docs/components/")
  // links to upstream-only pages (rtl guide, charts library, dark-mode…) go to ui.shadcn.com
  mdx = mdx.replace(/\]\((\/(?:docs|charts|blocks|colors|themes|examples)[^)\s]*)\)/g, (match, href: string) => {
    if (isLocalDocsLink(href)) return match
    return `](https://ui.shadcn.com${href})`
  })
  // upstream block viewer links (/view/<style>/<block>) point at ui.shadcn.com
  mdx = mdx.replace(/href="\/view\/([a-z]+-[a-z]+)\//g, 'href="https://ui.shadcn.com/view/$1/')
  // sources that only exist in the upstream Next.js app cannot be shown here
  mdx = mdx.replace(
    /<ComponentSource\s+src="(\/app\/[^"]+)"[^>]*\/>/g,
    (_m, src: string) =>
      `<Callout variant="info">The source of this file lives in the upstream shadcn/ui repository: [${src.split("/").pop()}](https://github.com/shadcn-ui/ui/blob/main/apps/v4${src}).</Callout>`
  )

  // Next.js-only bits in prose
  mdx = mdx.replace(/\n\n+/g, "\n\n")
  return mdx.trimEnd() + "\n"
}

async function main() {
  if (!(await exists(V4))) {
    throw new Error(`Upstream checkout not found at ${UPSTREAM} (set SHADCN_UPSTREAM_DIR)`)
  }
  // The icon translation table names Tecton icons; make sure they all still exist.
  verifyAgainstManifest(
    JSON.parse(await fs.readFile(path.join(REPO, "packages/tecton-react/icons/icons.json"), "utf8")),
    "docs:sync"
  )
  const sha = (
    await fs.readFile(path.join(UPSTREAM, ".git/HEAD"), "utf8").catch(() => "unknown")
  ).trim()

  const componentFiles = await fs.readdir(COMPONENTS_DIR)
  const names = componentFiles
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.replace(/\.tsx$/, ""))
    .concat(EXTRA_PAGES)
    .sort()

  const report: Report = {
    upstream: sha,
    pages: [],
    examples: [],
    skippedExamples: {},
    removedPreviews: {},
  }

  // Remove previously synced files only (hand-written pages such as
  // components/index.mdx and non-synced examples are kept).
  await fs.mkdir(OUT_DOCS, { recursive: true })
  for (const file of await fs.readdir(OUT_DOCS)) {
    if (!file.endsWith(".mdx")) continue
    const content = await fs.readFile(path.join(OUT_DOCS, file), "utf8")
    if (/^upstream: apps\/v4\//m.test(content)) await fs.rm(path.join(OUT_DOCS, file))
  }
  for (const folder of Object.keys(EXTRA_FOLDERS)) {
    const dir = path.join(WWW, "content/docs", folder)
    await fs.mkdir(dir, { recursive: true })
    for (const file of await fs.readdir(dir)) {
      if (!file.endsWith(".mdx")) continue
      const content = await fs.readFile(path.join(dir, file), "utf8")
      if (/^upstream: apps\/v4\//m.test(content)) await fs.rm(path.join(dir, file))
    }
  }
  await fs.mkdir(OUT_EXAMPLES, { recursive: true })
  for (const file of await fs.readdir(OUT_EXAMPLES)) {
    const content = await fs.readFile(path.join(OUT_EXAMPLES, file), "utf8")
    if (content.startsWith("// Synced from shadcn/ui")) await fs.rm(path.join(OUT_EXAMPLES, file))
  }
  const IMAGES_OUT = path.join(WWW, "public/images")
  await fs.mkdir(IMAGES_OUT, { recursive: true })

  const exampleCache = new Map<string, string | null>()

  async function syncExample(exampleName: string): Promise<boolean> {
    if (exampleCache.has(exampleName)) return exampleCache.get(exampleName) !== null
    if (BROKEN_EXAMPLES[exampleName]) {
      report.skippedExamples[exampleName] = BROKEN_EXAMPLES[exampleName]
      exampleCache.set(exampleName, null)
      return false
    }
    const file = path.join(V4, "examples/aria", `${exampleName}.tsx`)
    if (!(await exists(file))) {
      report.skippedExamples[exampleName] = "no upstream example file"
      exampleCache.set(exampleName, null)
      return false
    }
    const source = await fs.readFile(file, "utf8")
    const { code: rewritten, blocked } = rewriteImports(source, `examples/aria/${exampleName}.tsx`)
    const code = EXAMPLE_REWRITES[exampleName]?.(rewritten) ?? rewritten
    if (blocked) {
      report.skippedExamples[exampleName] = `unsupported import: ${blocked}`
      exampleCache.set(exampleName, null)
      return false
    }
    // Synced examples are upstream code: eslint.config.js ignores them (it
    // reads the list from sync-report.json) and .prettierignore lists them.
    const header = `// Synced from shadcn/ui (apps/v4/examples/aria/${exampleName}.tsx) by scripts/sync-upstream-docs.mts — do not edit.\n`
    await fs.writeFile(path.join(OUT_EXAMPLES, `${exampleName}.tsx`), header + code)
    exampleCache.set(exampleName, code)
    report.examples.push(exampleName)
    return true
  }

  for (const name of names) {
    const src = path.join(V4, "content/docs/components/aria", `${name}.mdx`)
    if (!(await exists(src))) {
      continue
    }
    const mdx = await fs.readFile(src, "utf8")
    const removed = new Set<string>()
    const previewNames = [...mdx.matchAll(/<ComponentPreview\b[^>]*?\bname="([^"]+)"[^>]*?\/>/gs)].map(
      (m) => m[1]
    )
    for (const previewName of previewNames) {
      const ok = await syncExample(previewName)
      if (!ok) removed.add(previewName)
    }
    // ComponentSource may also point at an example file
    const sourceNames = [...mdx.matchAll(/<ComponentSource\b[^>]*?\bname="([^"]+)"[^>]*?\/>/gs)].map(
      (m) => m[1]
    )
    for (const sourceName of sourceNames) {
      if (!componentFiles.includes(`${sourceName}.tsx`)) {
        await syncExample(sourceName)
      }
    }
    if (removed.size) report.removedPreviews[name] = [...removed]
    // copy referenced upstream images (sidebar structure diagrams etc.)
    for (const [, image] of mdx.matchAll(/src="\/images\/([^"]+)"/g)) {
      const from = path.join(V4, "public/images", image)
      if (await exists(from)) {
        await fs.mkdir(path.dirname(path.join(IMAGES_OUT, image)), { recursive: true })
        await fs.copyFile(from, path.join(IMAGES_OUT, image))
      }
    }
    // The usage guidelines section is rendered from
    // packages/tecton-react/guidelines/<name>.md, after the docs-extras block,
    // so a synced page keeps it (pnpm --filter www docs:guidelines does the
    // same for the hand-written pages).
    await fs.writeFile(
      path.join(OUT_DOCS, `${name}.mdx`),
      withGuidelines(await withExtras(transformMdx(mdx, name, removed), name), `components/${name}`)
    )
    report.pages.push(name)
  }

  await fs.writeFile(
    path.join(OUT_DOCS, "meta.json"),
    JSON.stringify({ title: "Components", pages: ["index", ...report.pages] }, null, 2) + "\n"
  )

  for (const [folder, { title, pages }] of Object.entries(EXTRA_FOLDERS)) {
    const outDir = path.join(WWW, "content/docs", folder)
    const synced: string[] = []
    for (const name of pages) {
      const src = path.join(V4, "content/docs", folder, `${name}.mdx`)
      if (!(await exists(src))) continue
      const mdx = await fs.readFile(src, "utf8")
      const removed = new Set<string>()
      const previewNames = [
        ...mdx.matchAll(/<ComponentPreview\b[^>]*?\bname="([^"]+)"[^>]*?\/>/gs),
      ].map((m) => m[1])
      for (const previewName of previewNames) {
        const ok = await syncExample(previewName)
        if (!ok) removed.add(previewName)
      }
      if (removed.size) report.removedPreviews[`${folder}/${name}`] = [...removed]
      await fs.writeFile(
        path.join(outDir, `${name}.mdx`),
        transformMdx(mdx, name, removed, `content/docs/${folder}`)
      )
      synced.push(name)
      report.pages.push(`${folder}/${name}`)
    }
    await fs.writeFile(
      path.join(outDir, "meta.json"),
      JSON.stringify({ title, pages: synced }, null, 2) + "\n"
    )
  }
  report.examples.sort()
  await fs.writeFile(path.join(HERE, "sync-report.json"), JSON.stringify(report, null, 2) + "\n")
  await writePrettierIgnore(report.examples)

  console.log(
    `[docs:sync] ${report.pages.length} pages, ${report.examples.length} examples, ${Object.keys(report.skippedExamples).length} skipped (see scripts/sync-report.json)`
  )
}

// `rewriteUpstreamIcons` is exported for one-off runs over hand-written files,
// so importing this module must not start a sync.
if (import.meta.main) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
