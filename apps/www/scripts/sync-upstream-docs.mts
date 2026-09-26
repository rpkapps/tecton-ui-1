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
 * The sync is atomic: every page and example is generated in memory and
 * checked first (previews resolve, same-page anchors exist, no stock Tailwind
 * colour, no clashing DOM ids…); only when all of that passes are the old
 * synced files replaced. A failed run leaves the working tree untouched.
 *
 * Usage:  bun run scripts/sync-upstream-docs.mts
 * Env:    SHADCN_UPSTREAM_DIR  path to a shadcn-ui/ui git checkout at the commit
 *         pinned in docs/UPSTREAM.md (default: <repo>/.cache/shadcn-ui). Only
 *         apps/v4/content/docs, apps/v4/examples/aria and apps/v4/public/images
 *         are read.
 */
import { execFileSync } from "node:child_process"
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import { withGuidelines } from "./sync-guidelines.mts"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const WWW = path.resolve(HERE, "..")
const REPO = path.resolve(WWW, "../..")
const UPSTREAM = path.resolve(
  process.env.SHADCN_UPSTREAM_DIR ?? path.join(REPO, ".cache/shadcn-ui")
)
const V4 = path.join(UPSTREAM, "apps/v4")
const COMPONENTS_DIR = path.join(REPO, "packages/tecton-react/src/components")
const BLOCKS_REGISTRY = path.join(REPO, "packages/tecton-blocks/registry.json")
const DOCS = path.join(WWW, "content/docs")
const OUT_DOCS = path.join(DOCS, "components")
const OUT_EXAMPLES = path.join(WWW, "src/examples")
const IMAGES_OUT = path.join(WWW, "public/images")

const SYNCED_EXAMPLE_HEADER = "// Synced from shadcn/ui"
const SYNCED_PAGE_MARKER = /^upstream: apps\/v4\//m

/** Upstream examples that do not type-check against the pinned dependencies. */
const BROKEN_EXAMPLES: Record<string, string> = {
  "select-field-dynamic":
    "uses SelectValue render props (id/name) that react-aria-components 1.21 does not expose",
}

/**
 * Upstream `type="block"` previews render a full-page demo in an iframe, which
 * this site can only do for a Tecton block (`/view/<block>`). A preview listed
 * here shows that block instead; any other block preview is removed together
 * with its `<figure>`. The upstream example itself is not synced.
 */
const BLOCK_PREVIEWS: Record<string, string> = {
  // "A sidebar that collapses to icons."
  "sidebar-demo": "sidebar-01",
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
  [
    /^@\/styles\/aria-[a-z]+\/ui(?:-rtl)?\/(.+)$/,
    "@tecton/react/components/$1",
  ],
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
  "lucide-react",
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

/** The regular files in `dir` (subdirectories and the like are skipped). */
async function listFiles(dir: string): Promise<string[]> {
  if (!(await exists(dir))) return []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name)
}

/**
 * A literal (or single-page regex) rewrite of upstream text. Throws when the
 * text is not there, so an upstream wording change fails the sync instead of
 * silently shipping the unrewritten text.
 */
function replaceOrThrow(
  source: string,
  from: string | RegExp,
  to: string,
  label: string
): string {
  if (typeof from === "string") {
    if (!source.includes(from)) {
      throw new Error(
        `${label}: upstream text not found (${JSON.stringify(from.slice(0, 80))}); update the rewrite`
      )
    }
    return source.split(from).join(to)
  }
  if (!from.test(source))
    throw new Error(
      `${label}: upstream text not found (${from}); update the rewrite`
    )
  from.lastIndex = 0
  return source.replace(from, to)
}

/**
 * Replaces the occurrences of `from`, in order, with `to[0]`, `to[1]`…; throws
 * unless there are exactly `to.length` of them.
 */
function replaceEachOrThrow(
  source: string,
  from: string,
  to: string[],
  label: string
): string {
  const parts = source.split(from)
  if (parts.length - 1 !== to.length) {
    throw new Error(
      `${label}: expected ${to.length} × ${JSON.stringify(from)}, found ${parts.length - 1}; update the rewrite`
    )
  }
  return parts.reduce((out, part, index) => out + to[index - 1] + part)
}

// Per-example source fixes for upstream demos that assume the vega look.
const EXAMPLE_REWRITES: Record<string, (code: string) => string> = {
  // Upstream's docs site serves its components at /components; ours at /docs/components.
  "breadcrumb-separator": (code) =>
    replaceOrThrow(
      code,
      'href="/components"',
      'href="/docs/components"',
      "breadcrumb-separator"
    ),
  // The Tecton trigger paints a hover / expanded surface. Upstream pads the
  // item, which insets that surface while the item dividers still run to the
  // border; padding the trigger and content instead keeps the surface as wide
  // as the dividers.
  "accordion-borders": (code) => {
    const label = "accordion-borders"
    code = replaceOrThrow(
      code,
      'className="border-b px-4 last:border-b-0"',
      'className="border-b last:border-b-0"',
      label
    )
    code = replaceOrThrow(
      code,
      "<AccordionTrigger>{item.trigger}</AccordionTrigger>",
      '<AccordionTrigger className="px-4">{item.trigger}</AccordionTrigger>',
      label
    )
    return replaceOrThrow(
      code,
      "<AccordionContent>{item.content}</AccordionContent>",
      '<AccordionContent className="px-4">{item.content}</AccordionContent>',
      label
    )
  },
  // The edge-to-edge scroll area draws a divider above itself; the footer
  // below it gets the matching divider (and, through the card's
  // `[.border-t]:pt-(--card-spacing)` rule, its top inset back).
  "card-edge-to-edge": (code) =>
    replaceOrThrow(
      code,
      '<CardFooter className="justify-end gap-2">',
      '<CardFooter className="justify-end gap-2 border-t">',
      "card-edge-to-edge"
    ),
  // Upstream gives all four inputs `id="radius"` while the labels point at
  // `radius-x` / `radius-y`: the labels name nothing and the id repeats.
  "collapsible-settings": (code) => {
    const label = "collapsible-settings"
    code = replaceEachOrThrow(
      code,
      '<Input id="radius" ',
      [
        '<Input id="radius-x" ',
        '<Input id="radius-y" ',
        '<Input id="radius-x-2" ',
        '<Input id="radius-y-2" ',
      ],
      label
    )
    code = replaceEachOrThrow(
      code,
      'htmlFor="radius-x"',
      ['htmlFor="radius-x"', 'htmlFor="radius-x-2"'],
      label
    )
    return replaceEachOrThrow(
      code,
      'htmlFor="radius-y"',
      ['htmlFor="radius-y"', 'htmlFor="radius-y-2"'],
      label
    )
  },
}

/**
 * Tailwind stock colour classes used by upstream demos, and the Tecton palette
 * classes that replace them. Tecton ramp steps are contrast levels that switch
 * value with the mode, so one class replaces a light + `dark:` pair: a tinted
 * surface is step 120 with text at 830 (the filled status badge recipe), a
 * solid fill is 560 (the filled status button recipe). Applied to every synced
 * example and page.
 */
const TECTON_PALETTE_REWRITES: [string, string][] = [
  // badge-colors
  [
    "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    "bg-blue-120 text-blue-830",
  ],
  [
    "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
    "bg-green-120 text-green-830",
  ],
  [
    "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    "bg-azure-120 text-azure-830",
  ],
  [
    "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    "bg-orchid-120 text-orchid-830",
  ],
  [
    "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    "bg-red-120 text-red-830",
  ],
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
  [
    "data-[favorite=true]:fill-blue-600 data-[favorite=true]:stroke-blue-600",
    "data-[favorite=true]:fill-blue-560 data-[favorite=true]:stroke-blue-560",
  ],
  // shimmer-color (example and utils/shimmer page)
  ["shimmer-color-blue-500/60", "shimmer-color-blue-560/60"],
  // chart examples and the chart page: a hex has no dark pair, the chart
  // tokens switch with the mode
  ['color: "#2563eb"', 'color: "var(--chart-1)"'],
  ['color: "#60a5fa"', 'color: "var(--chart-2)"'],
]

function rewriteStockColors(code: string): string {
  for (const [stock, tecton] of TECTON_PALETTE_REWRITES)
    code = code.split(stock).join(tecton)
  return code
}

/**
 * Stock colour classes the Tecton palette does not have: families Tecton does
 * not have, or steps only Tailwind has (200 … 950; 50 and 100 exist on both
 * scales and cannot be told apart here), under any colour utility.
 */
const STOCK_COLOUR =
  /(?<![\w-])(?:bg|text|fill|stroke|ring|ring-offset|from|via|to|outline|divide|shadow|decoration|accent|caret|placeholder|border|border-[xytrbl]|border-[se]|shimmer-color)-(?:(?:orange|amber|emerald|teal|cyan|sky|indigo|purple|fuchsia|rose|slate|zinc|neutral|stone)-\d+|(?:red|yellow|lime|green|blue|violet|pink|gray)-(?:[2-9]00|950))\b/

/** Throws on a stock colour left in `code` (`<Wrong>` blocks are skipped). */
function assertNoStockColours(code: string, where: string) {
  const leftover = STOCK_COLOUR.exec(
    code.replace(/<Wrong>[\s\S]*?<\/Wrong>/g, "")
  )
  if (leftover)
    throw new Error(
      `stock Tailwind colour left in ${where}: ${leftover[0]} (add it to TECTON_PALETTE_REWRITES)`
    )
}

/**
 * Upstream examples occasionally use `@tabler/icons-react`; Tecton UI ships
 * lucide (and the Tecton icon set) only, so those identifiers are mapped to
 * their lucide equivalents and the import is rewritten.
 */
const TABLER_TO_LUCIDE: Record<string, string> = {
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
  const unknown = idents.filter((id) => !(id in TABLER_TO_LUCIDE))
  if (unknown.length) {
    throw new Error(
      `unmapped @tabler/icons-react identifier(s): ${unknown.join(", ")} — add them to TABLER_TO_LUCIDE`
    )
  }
  const mapped = idents.map((id) => TABLER_TO_LUCIDE[id])
  // an existing lucide import takes the mapped names, so no identifier is
  // imported twice
  const lucide = source.match(
    /import\s*\{([^}]*)\}\s*from\s*["']lucide-react["']/
  )
  let code: string
  if (lucide) {
    const current = lucide[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const names = [
      ...current,
      ...mapped.filter((name) => !current.includes(name)).sort(),
    ]
    code = source
      .replace(lucide[0], `import { ${names.join(", ")} } from "lucide-react"`)
      .replace(match[0], "")
  } else {
    code = source.replace(
      match[0],
      `import { ${[...new Set(mapped)].sort().join(", ")} } from "lucide-react"\n`
    )
  }
  for (const id of idents) {
    code = code.replace(new RegExp(`\\b${id}\\b`, "g"), TABLER_TO_LUCIDE[id])
  }
  return code
}

function rewriteImports(source: string): { code: string; blocked?: string } {
  let blocked: string | undefined
  const code = rewriteTablerIcons(source).replace(
    /(from\s+|import\s+|import\()\s*(["'])([^"']+)\2/g,
    (match, prefix: string, quote: string, spec: string) => {
      if (spec.startsWith(".")) return match
      for (const [pattern, replacement] of IMPORT_REWRITES) {
        if (pattern.test(spec)) {
          return `${prefix}${quote}${spec.replace(pattern, replacement)}${quote}`
        }
      }
      if (ALLOWED_MODULES.has(spec) || spec.startsWith("react/")) return match
      blocked ??= spec
      return match
    }
  )
  return { code, blocked }
}

/**
 * The React Aria handler that replaces `onClick` on a component. Upstream
 * examples written for the Radix base use `onClick`, which React Aria only
 * keeps for compatibility; `onPress` also covers keyboard and touch, and a
 * menu item reports `onAction`. A DOM element (lower-case tag) keeps `onClick`.
 */
const PRESS_HANDLERS: Record<string, string> = {
  Button: "onPress",
  InputGroupButton: "onPress",
  DropdownMenuItem: "onAction",
  ContextMenuItem: "onAction",
  MenubarItem: "onAction",
}

function rewritePressHandlers(code: string, exampleName: string): string {
  const file = ts.createSourceFile(
    `${exampleName}.tsx`,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  const edits: { start: number; end: number; text: string }[] = []
  const visit = (node: ts.Node) => {
    if (ts.isJsxAttribute(node) && node.name.getText(file) === "onClick") {
      const tag = node.parent.parent.tagName.getText(file)
      if (!/^[a-z]/.test(tag)) {
        const handler = PRESS_HANDLERS[tag.split(".").pop() ?? tag]
        if (!handler) {
          throw new Error(
            `${exampleName}: onClick on <${tag}>; add its React Aria handler to PRESS_HANDLERS`
          )
        }
        edits.push({
          start: node.name.getStart(file),
          end: node.name.getEnd(),
          text: handler,
        })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    code = code.slice(0, edit.start) + edit.text + code.slice(edit.end)
  }
  return code
}

/**
 * Upstream labels a Select with `<FieldLabel htmlFor={id}>` next to
 * `<SelectTrigger id={id}>`. React Aria always sets the trigger's
 * `aria-labelledby` (to the selected value), which overrides `<label for>`, so
 * the Select is announced by its value alone. This gives that label an id and
 * points the Select's `aria-labelledby` at it; the layout stays as upstream's.
 */
function rewriteSelectLabels(code: string, exampleName: string): string {
  const file = ts.createSourceFile(
    `${exampleName}.tsx`,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  type Opening = ts.JsxOpeningElement | ts.JsxSelfClosingElement
  const tagOf = (el: Opening) => el.tagName.getText(file)
  const attrOf = (el: Opening, name: string) =>
    el.attributes.properties.find(
      (p): p is ts.JsxAttribute =>
        ts.isJsxAttribute(p) && p.name.getText(file) === name
    )
  const valueText = (a: ts.JsxAttribute | undefined) =>
    a?.initializer?.getText(file)
  const openings: Opening[] = []
  const selects: { opening: Opening; triggerId?: string }[] = []
  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      openings.push(node)
    }
    if (ts.isJsxElement(node) && tagOf(node.openingElement) === "Select") {
      let triggerId: string | undefined
      const findTrigger = (child: ts.Node) => {
        if (
          (ts.isJsxOpeningElement(child) ||
            ts.isJsxSelfClosingElement(child)) &&
          tagOf(child) === "SelectTrigger"
        ) {
          triggerId ??= valueText(attrOf(child, "id"))
        }
        ts.forEachChild(child, findTrigger)
      }
      node.children.forEach(findTrigger)
      selects.push({ opening: node.openingElement, triggerId })
    }
    ts.forEachChild(node, visit)
  }
  visit(file)

  const labelIdFor = (id: string) =>
    id.startsWith('"')
      ? `"${id.slice(1, -1)}-label"`
      : `{\`\${${id.slice(1, -1)}}-label\`}`
  const edits: { at: number; text: string }[] = []
  for (const { opening, triggerId } of selects) {
    if (!triggerId) continue
    if (attrOf(opening, "aria-labelledby") || attrOf(opening, "aria-label"))
      continue
    const label = openings.find(
      (el) =>
        /(^|\.)(Field)?Label$/.test(tagOf(el)) &&
        valueText(attrOf(el, "htmlFor")) === triggerId
    )
    if (!label) continue
    const labelId = valueText(attrOf(label, "id")) ?? labelIdFor(triggerId)
    if (!attrOf(label, "id")) {
      edits.push({ at: label.tagName.getEnd(), text: ` id=${labelId}` })
    }
    edits.push({
      at: opening.tagName.getEnd(),
      text: ` aria-labelledby=${labelId}`,
    })
  }
  for (const edit of edits.sort((a, b) => b.at - a.at)) {
    code = code.slice(0, edit.at) + edit.text + code.slice(edit.at)
  }
  return code
}

// ---------------------------------------------------------------------------
// DOM ids
// ---------------------------------------------------------------------------

/** Attributes whose (space-separated) value names DOM ids. */
const ID_REF_ATTRS = [
  "htmlFor",
  "aria-labelledby",
  "aria-describedby",
  "aria-controls",
  "aria-errormessage",
  "aria-owns",
]
const ID_ATTR = /(?<![\w-])id="([^"]+)"/g
const ID_OR_REF_ATTR = new RegExp(
  `((?<![\\w-])(?:id|${ID_REF_ATTRS.join("|")})=")([^"]+)(")`,
  "g"
)

/**
 * Components whose `id` is the key of a React Aria collection item (a tab, a
 * toggle, a menu or list item, a table row…), not a DOM id.
 */
const COLLECTION_KEY_TAGS = new Set([
  "AccordionItem",
  "ComboboxChip",
  "ComboboxGroup",
  "ComboboxItem",
  "CommandItem",
  "ContextMenuCheckboxItem",
  "ContextMenuItem",
  "ContextMenuRadioItem",
  "DropdownMenuCheckboxItem",
  "DropdownMenuItem",
  "DropdownMenuRadioItem",
  "MenubarItem",
  "SelectItem",
  "TableHead",
  "TableRow",
  "TabsContent",
  "TabsTrigger",
  "ToggleGroupItem",
])

/** The static DOM ids of an example (`id="…"` on anything but a collection item). */
function domIds(code: string): string[] {
  const file = ts.createSourceFile(
    "example.tsx",
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  const ids: string[] = []
  const visit = (node: ts.Node) => {
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText(file) === "id" &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      !COLLECTION_KEY_TAGS.has(node.parent.parent.tagName.getText(file))
    ) {
      ids.push(node.initializer.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return ids
}

/** Renames a DOM id and the labels, ARIA references and `url(#…)` that point at it. */
function renameDomId(code: string, from: string, to: string): string {
  return code
    .replace(
      ID_OR_REF_ATTR,
      (_m, start: string, value: string, end: string) =>
        start +
        value
          .split(/\s+/)
          .map((token) => (token === from ? to : token))
          .join(" ") +
        end
    )
    .split(`url(#${from})`)
    .join(`url(#${to})`)
}

/**
 * Several examples on one page render into one document, so a DOM id may only
 * appear once per page. Where two examples share one (a demo and its RTL
 * variant, say), the later synced example gets a suffixed id: its name minus
 * the page name (`dialog-rtl` on the dialog page → `name-1-rtl`).
 */
function dedupeDomIds(
  pages: Map<string, string[]>,
  examples: Map<string, string>,
  authored: Map<string, string>
) {
  for (const [page, names] of [...pages].sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    const claimed = new Map<string, string>()
    for (const name of names) {
      const code = authored.get(name)
      if (code !== undefined)
        for (const id of domIds(code)) claimed.set(id, name)
    }
    for (const name of names) {
      let code = examples.get(name)
      if (code === undefined) continue
      for (const id of new Set(domIds(code))) {
        const owner = claimed.get(id)
        if (owner === undefined || owner === name) {
          claimed.set(id, name)
          continue
        }
        const pageName = page.split("/").pop() ?? page
        const suffix = name.startsWith(`${pageName}-`)
          ? name.slice(pageName.length + 1)
          : name
        const renamed = `${id}-${suffix}`
        code = renameDomId(code, id, renamed)
        claimed.set(renamed, name)
      }
      examples.set(name, code)
    }
  }
}

// ---------------------------------------------------------------------------
// MDX transforms
// ---------------------------------------------------------------------------

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

/**
 * Fence meta for line numbers: upstream uses rehype-pretty-code's
 * `showLineNumbers`, fumadocs reads `lineNumbers`.
 */
function toFumadocsFenceMeta(mdx: string): string {
  return mdx.replace(
    /^([ \t]*`{3,}[\w-]+ )([^\n]*)$/gm,
    (line, open: string, meta: string) => {
      if (!/\bshowLineNumbers\b/.test(meta)) return line
      // upstream occasionally repeats the flag
      const words = meta
        .replace(/\bshowLineNumbers\b/g, "lineNumbers")
        .split(" ")
      const first = words.indexOf("lineNumbers")
      return (
        open +
        words
          .filter((word, index) => word !== "lineNumbers" || index === first)
          .join(" ")
      )
    }
  )
}

// The synced examples are listed in the repository's .prettierignore (between
// the markers below) so `pnpm format` leaves upstream code untouched.
const PRETTIER_IGNORE = path.join(REPO, ".prettierignore")
const IGNORE_START =
  "# synced-examples:start (written by apps/www/scripts/sync-upstream-docs.mts)"
const IGNORE_END = "# synced-examples:end"

function prettierIgnore(current: string, examples: string[]): string {
  const block = [
    IGNORE_START,
    ...examples.map((name) => `apps/www/src/examples/${name}.tsx`),
    IGNORE_END,
  ].join("\n")
  const start = current.indexOf(IGNORE_START)
  const end = current.indexOf(IGNORE_END)
  return start !== -1 && end !== -1
    ? current.slice(0, start) + block + current.slice(end + IGNORE_END.length)
    : `${current.trimEnd()}\n\n${block}\n`
}

/**
 * Whether an upstream `/docs/…` link has a page on this site. `localPages`
 * holds every docs path ("", "installation", "components/button"…) that exists
 * after this sync; other links go to ui.shadcn.com.
 */
function isLocalDocsLink(href: string, localPages: Set<string>) {
  const [pathname] = href.split(/[#?]/)
  if (pathname === "/blocks" || pathname === "/themes") return true
  if (pathname !== "/docs" && !pathname.startsWith("/docs/")) return false
  return localPages.has(pathname.replace(/^\/docs\/?/, "").replace(/\/$/, ""))
}

/** Page-specific rewrites of upstream prose; each throws when its text is gone. */
const PAGE_REWRITES: Record<
  string,
  (mdx: string, removed: Set<string>) => string
> = {
  // Tailwind's stock palette is removed by the Tecton theme; prose and inline
  // snippets name Tecton palette steps instead (see TECTON_PALETTE_REWRITES).
  alert: (mdx) =>
    replaceOrThrow(
      mdx,
      "adding custom classes such as `bg-amber-50 dark:bg-amber-950` to the `Alert` component.",
      "adding [palette](/docs/theming#palette) classes such as `bg-yellow-120 text-yellow-1000` to the `Alert` component (a step is a contrast level, so no `dark:` variant is needed).",
      "alert page"
    ),
  badge: (mdx) =>
    replaceOrThrow(
      mdx,
      "adding custom classes such as `bg-green-50 dark:bg-green-800` to the `Badge` component.",
      "adding [palette](/docs/theming#palette) classes such as `bg-green-120 text-green-830` to the `Badge` component (a step is a contrast level, so no `dark:` variant is needed).",
      "badge page"
    ),
  chart: (mdx) =>
    replaceOrThrow(
      mdx,
      'className="mt-4 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-950"',
      'className="mt-4 border-yellow-160 bg-yellow-110"',
      "chart page"
    ),
  // `shadcn init` is for projects that own the component sources
  button: (mdx) =>
    replaceOrThrow(
      mdx,
      /\nYou can also enable this during project setup with `npx shadcn@latest init[^\n]*\n/,
      "\n",
      "button page"
    ),
  sidebar: (mdx) => {
    // Sections that ask the reader to edit the generated component file: the
    // package files are read-only for applications.
    mdx = replaceOrThrow(
      mdx,
      /\nIf you have a single sidebar in your application, you can use the `SIDEBAR_WIDTH`[^\n]*\n\n```tsx[^\n]*\nconst SIDEBAR_WIDTH[\s\S]*?```\n\nFor multiple sidebars in your application, you can use/,
      "\nTo change the width, set",
      "sidebar page (SIDEBAR_WIDTH)"
    )
    // The upstream RTL section links to shadcn's own configuration guide and a
    // hosted preview (`<Button asChild>` has no React Aria equivalent either);
    // the package supports RTL through its Direction provider.
    return replaceOrThrow(
      mdx,
      /\n## RTL\n\nTo enable RTL support in shadcn\/ui, see the \[RTL configuration guide\]\([^)]*\)\.\n\n\{\/\* prettier-ignore \*\/\}\n<Button asChild[^\n]*\n[^\n]*\n<\/Button>\n/,
      "\n## RTL\n\nThe sidebar follows the reading direction set with the [Direction](/docs/components/direction) provider; no extra configuration is needed.\n",
      "sidebar page (RTL)"
    )
  },
  // The International Calendars section goes with its (skipped) preview; the
  // RTL section's pointer to it would be a dead anchor.
  calendar: (mdx, removed) =>
    removed.has("calendar-hijri")
      ? replaceOrThrow(
          mdx,
          "\nSee also the [International Calendars Guide](#international-calendars) for enabling the international calendars such as Persian / Hijri / Jalali.\n",
          "\n",
          "calendar page"
        )
      : mdx,
}

const PREVIEW_TAG =
  /<ComponentPreview\b(?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*?\/>/gs
const SOURCE_TAG =
  /<ComponentSource\b(?:[^>"'{]|"[^"]*"|'[^']*'|\{[^}]*\})*?\/>/gs

function attr(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`(?<![\\w-])${name}="([^"]*)"`))?.[1]
}

const REMOVED_MARKER = /^\s*<!-- removed: [^>]+ -->\s*$/
const FENCE = /^\s*(`{3,}|~{3,})/

/** The Markdown headings of `lines` outside code fences. */
function headingsOf(lines: string[]) {
  const headings: { index: number; level: number; text: string }[] = []
  let fence: string | null = null
  lines.forEach((line, index) => {
    const open = FENCE.exec(line)
    if (open) {
      if (fence === null) fence = open[1]
      else if (line.trim().startsWith(fence)) fence = null
      return
    }
    if (fence !== null) return
    const heading = /^(#{1,6}) (.+)$/.exec(line)
    if (heading)
      headings.push({ index, level: heading[1].length, text: heading[2] })
  })
  return headings
}

/** Blocks of non-blank lines. */
function blockCount(lines: string[]) {
  return lines
    .join("\n")
    .split(/\n\s*\n/)
    .filter((block) => block.trim()).length
}

/**
 * Drops each removed-preview marker. When nothing is left of the marker's
 * section (up to the next heading of the same or a higher level) but at most
 * one paragraph before the preview, which introduces it, the whole section goes
 * with it; a section with more content (a variant table, subsections) keeps
 * its heading and text.
 */
function removeMarkers(mdx: string): string {
  let lines = mdx.split("\n")
  for (;;) {
    const marker = lines.findIndex((line) => REMOVED_MARKER.test(line))
    if (marker === -1) return lines.join("\n")
    const headings = headingsOf(lines)
    const owner = headings.filter((h) => h.index < marker).pop()
    let start = marker
    let end = marker + 1
    if (owner) {
      const next = headings.find(
        (h) => h.index > owner.index && h.level <= owner.level
      )
      const sectionEnd = next ? next.index : lines.length
      const before = lines.slice(owner.index + 1, marker)
      const after = lines
        .slice(marker + 1, sectionEnd)
        .filter((line) => !REMOVED_MARKER.test(line))
      if (blockCount(before) <= 1 && blockCount(after) === 0) {
        start = owner.index
        end = sectionEnd
      }
    }
    lines = [...lines.slice(0, start), ...lines.slice(end)]
  }
}

/** github-slugger, as fumadocs uses it for heading ids. */
function slugify(text: string) {
  return text
    .replace(/<[^>]*>/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "")
    .replace(/\s/g, "-")
}

function headingSlugs(mdx: string): Set<string> {
  const slugs = new Set<string>()
  const counts = new Map<string, number>()
  for (const { text } of headingsOf(mdx.split("\n"))) {
    const base = slugify(text)
    const count = counts.get(base) ?? 0
    slugs.add(count ? `${base}-${count}` : base)
    counts.set(base, count + 1)
  }
  return slugs
}

function transformMdx(
  mdx: string,
  name: string,
  removed: Set<string>,
  localPages: Set<string>,
  sha: string,
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

  // pages import icons too (a Callout icon, say); map tabler to lucide as in examples
  mdx = rewriteTablerIcons(mdx)

  // Components are consumed from the @tecton/react package, not installed one
  // by one, so the upstream "Installation" section (CLI command + manual copy)
  // is removed. Utilities ship with the package stylesheet.
  mdx = mdx.replace(
    /\n## Installation\n[\s\S]*?(?=\n## )/,
    upstreamDir.startsWith("content/docs/utils")
      ? "\n## Installation\n\nNothing to install: the utility ships with `@tecton/react/globals.css`, which imports the vendored `./shadcn.css` (the `shadcn/tailwind.css` utilities).\n"
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

  mdx = PAGE_REWRITES[name]?.(mdx, removed) ?? mdx
  mdx = mdx.replace(/\btext-gray-500\b/g, "text-muted-foreground")
  mdx = rewriteStockColors(mdx)

  // Block previews show a Tecton block (BLOCK_PREVIEWS) or go; previews of
  // skipped examples go.
  mdx = mdx.replace(PREVIEW_TAG, (tag) => {
    const previewName = attr(tag, "name")
    if (!previewName) return tag
    if (attr(tag, "type") === "block") {
      const block = BLOCK_PREVIEWS[previewName]
      return block
        ? tag.replace(`name="${previewName}"`, `name="${block}"`)
        : `<!-- removed: ${previewName} -->`
    }
    return removed.has(previewName) ? `<!-- removed: ${previewName} -->` : tag
  })
  // a figure that only framed a removed preview goes with it
  mdx = mdx.replace(
    /<figure\b[^>]*>\s*(<!-- removed: [^>]+ -->)\s*(?:<figcaption\b[^>]*>[\s\S]*?<\/figcaption>\s*)?<\/figure>/g,
    "$1"
  )
  mdx = removeMarkers(mdx)

  // links to the removed section point at the package installation page
  mdx = mdx.replace(/\]\(#installation\)/g, "](/docs/installation)")

  // import paths and file titles
  mdx = mdx.replace(/@\/components\/ui\//g, "@tecton/react/components/")
  mdx = mdx.replace(
    /title="components\/ui\/([^"]+)"/g,
    'title="@tecton/react/components/$1"'
  )
  mdx = mdx.replace(
    /`components\/ui\/([a-z0-9-]+\.tsx)`/g,
    "`@tecton/react/components/$1`"
  )

  // docs links that point at other bases
  mdx = mdx.replace(
    /\]\(\/docs\/components\/(?:base|radix|aria)\//g,
    "](/docs/components/"
  )
  // links to upstream-only pages (rtl guide, charts library, dark-mode…) go to ui.shadcn.com
  mdx = mdx.replace(
    /\]\((\/(?:docs|charts|blocks|colors|themes|examples)[^)\s]*)\)/g,
    (match, href: string) => {
      if (isLocalDocsLink(href, localPages)) return match
      return `](https://ui.shadcn.com${href})`
    }
  )
  // upstream block viewer links (/view/<style>/<block>) point at ui.shadcn.com
  mdx = mdx.replace(
    /href="\/view\/([a-z]+-[a-z]+)\//g,
    'href="https://ui.shadcn.com/view/$1/'
  )
  // sources that only exist in the upstream Next.js app cannot be shown here
  mdx = mdx.replace(
    /<ComponentSource\s+src="(\/app\/[^"]+)"[^>]*\/>/g,
    (_m, src: string) =>
      `<Callout variant="info">The source of this file lives in the upstream shadcn/ui repository: [${src.split("/").pop()}](https://github.com/shadcn-ui/ui/blob/${sha}/apps/v4${src}).</Callout>`
  )

  mdx = mdx.replace(/\n\n+/g, "\n\n")
  return mdx.trimEnd() + "\n"
}

// ---------------------------------------------------------------------------
// provenance
// ---------------------------------------------------------------------------

/** The commit the upstream checkout is at; it must be the one docs/UPSTREAM.md pins. */
async function upstreamCommit(): Promise<string> {
  let sha: string
  try {
    sha = execFileSync("git", ["-C", UPSTREAM, "rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim()
  } catch (error) {
    throw new Error(
      `${UPSTREAM} is not a git checkout (git rev-parse HEAD failed: ${String(error)})`
    )
  }
  const pin = /Commit: `([0-9a-f]{40})`/.exec(
    await fs.readFile(path.join(REPO, "docs/UPSTREAM.md"), "utf8")
  )?.[1]
  if (!pin)
    throw new Error(
      "docs/UPSTREAM.md does not name the pinned commit (Commit: `<sha>`)"
    )
  if (sha !== pin) {
    throw new Error(
      `the upstream checkout is at ${sha}, docs/UPSTREAM.md pins ${pin}; check out the pinned commit (or update the pin first)`
    )
  }
  return sha
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  if (!(await exists(V4))) {
    throw new Error(
      `Upstream checkout not found at ${UPSTREAM} (set SHADCN_UPSTREAM_DIR)`
    )
  }
  const sha = await upstreamCommit()

  const componentFiles = await listFiles(COMPONENTS_DIR)
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

  // Tecton-authored examples (no sync header) are never overwritten or removed.
  const authored = new Map<string, string>()
  for (const file of await listFiles(OUT_EXAMPLES)) {
    if (!file.endsWith(".tsx")) continue
    const content = await fs.readFile(path.join(OUT_EXAMPLES, file), "utf8")
    if (!content.startsWith(SYNCED_EXAMPLE_HEADER))
      authored.set(file.replace(/\.tsx$/, ""), content)
  }
  const blocks = new Set<string>(
    (
      JSON.parse(await fs.readFile(BLOCKS_REGISTRY, "utf8")) as {
        items: { name: string }[]
      }
    ).items.map((item) => item.name)
  )

  // The pages this run writes, so links between them resolve before they exist.
  const plannedPages: {
    key: string
    src: string
    name: string
    folder?: string
  }[] = []
  for (const name of names) {
    const src = path.join(V4, "content/docs/components/aria", `${name}.mdx`)
    if (await exists(src))
      plannedPages.push({ key: `components/${name}`, src, name })
  }
  for (const [folder, { pages }] of Object.entries(EXTRA_FOLDERS)) {
    for (const name of pages) {
      const src = path.join(V4, "content/docs", folder, `${name}.mdx`)
      if (await exists(src))
        plannedPages.push({ key: `${folder}/${name}`, src, name, folder })
    }
  }
  const localPages = new Set(plannedPages.map((page) => page.key))
  async function collectLocalPages(dir: string, prefix: string) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory())
        await collectLocalPages(path.join(dir, entry.name), rel)
      else if (entry.isFile() && entry.name.endsWith(".mdx")) {
        const content = await fs.readFile(path.join(dir, entry.name), "utf8")
        if (SYNCED_PAGE_MARKER.test(content)) continue // replaced by this run
        localPages.add(rel.replace(/\.mdx$/, "").replace(/(^|\/)index$/, ""))
      }
    }
  }
  await collectLocalPages(DOCS, "")

  /** Everything this run writes: absolute path → content. */
  const outputs = new Map<string, string>()
  const imageCopies = new Map<string, string>()
  const examples = new Map<string, string>()
  const skipped = new Set<string>()
  /** Examples shown on each page, in page order. */
  const pageExamples = new Map<string, string[]>()

  async function syncExample(exampleName: string): Promise<boolean> {
    if (examples.has(exampleName)) return true
    if (skipped.has(exampleName)) return false
    const skip = (reason: string) => {
      report.skippedExamples[exampleName] = reason
      skipped.add(exampleName)
      return false
    }
    if (BROKEN_EXAMPLES[exampleName]) return skip(BROKEN_EXAMPLES[exampleName])
    const file = path.join(V4, "examples/aria", `${exampleName}.tsx`)
    if (!(await exists(file))) return skip("no upstream example file")
    if (authored.has(exampleName)) {
      throw new Error(
        `upstream example ${exampleName} has the name of a Tecton-authored example in src/examples; rename the Tecton one`
      )
    }
    const { code: rewritten, blocked } = rewriteImports(
      await fs.readFile(file, "utf8")
    )
    if (blocked) return skip(`unsupported import: ${blocked}`)
    let code = EXAMPLE_REWRITES[exampleName]?.(rewritten) ?? rewritten
    code = rewritePressHandlers(rewriteStockColors(code), exampleName)
    code = rewriteSelectLabels(code, exampleName)
    examples.set(exampleName, code)
    return true
  }

  /** Syncs what a page previews and returns the skipped previews. */
  async function syncPageExamples(mdx: string) {
    const removed = new Set<string>()
    for (const [tag] of mdx.matchAll(PREVIEW_TAG)) {
      const previewName = attr(tag, "name")
      if (!previewName) continue
      if (attr(tag, "type") === "block") {
        if (!BLOCK_PREVIEWS[previewName]) removed.add(previewName)
        continue
      }
      if (!(await syncExample(previewName))) removed.add(previewName)
    }
    // ComponentSource may also point at an example file
    for (const [tag] of mdx.matchAll(SOURCE_TAG)) {
      const sourceName = attr(tag, "name")
      if (sourceName && !componentFiles.includes(`${sourceName}.tsx`))
        await syncExample(sourceName)
    }
    return removed
  }

  for (const page of plannedPages) {
    const mdx = await fs.readFile(page.src, "utf8")
    const removed = await syncPageExamples(mdx)
    if (removed.size)
      report.removedPreviews[page.folder ? page.key : page.name] = [...removed]
    // copy referenced upstream images (sidebar structure diagrams etc.)
    for (const [, image] of mdx.matchAll(/src="\/images\/([^"]+)"/g)) {
      const from = path.join(V4, "public/images", image)
      if (await exists(from))
        imageCopies.set(path.join(IMAGES_OUT, image), from)
    }
    const upstreamDir = page.folder ? `content/docs/${page.folder}` : undefined
    let out = transformMdx(
      mdx,
      page.name,
      removed,
      localPages,
      sha,
      upstreamDir
    )
    if (!page.folder) out = await withExtras(out, page.name)
    out = toFumadocsFenceMeta(out)
    checkSyncedContent(out, page.key, localPages)
    // The usage guidelines section is rendered from
    // packages/tecton-react/guidelines/<name>.md, after the docs-extras block,
    // so a synced page keeps it (pnpm --filter www docs:guidelines does the
    // same for the hand-written pages).
    if (!page.folder) out = withGuidelines(out, `components/${page.name}`)
    checkPage(out, page.key, { examples, authored, blocks, componentFiles })
    outputs.set(path.join(DOCS, `${page.key}.mdx`), out)
    pageExamples.set(page.key, previewedExamples(out, componentFiles))
    report.pages.push(page.folder ? page.key : page.name)
  }

  outputs.set(
    path.join(OUT_DOCS, "meta.json"),
    JSON.stringify(
      {
        title: "Components",
        pages: [
          "index",
          ...plannedPages.filter((p) => !p.folder).map((p) => p.name),
        ],
      },
      null,
      2
    ) + "\n"
  )
  // copy the upstream avatars the synced examples point at
  for (const code of examples.values()) {
    for (const [, avatar] of code.matchAll(/["'`]\/avatars\/([^"'`]+)["'`]/g)) {
      const from = path.join(V4, "public/avatars", avatar)
      if (!(await exists(from)))
        throw new Error(
          `an example points at /avatars/${avatar}, which upstream does not ship`
        )
      imageCopies.set(path.join(WWW, "public/avatars", avatar), from)
    }
  }
  for (const [folder, { title }] of Object.entries(EXTRA_FOLDERS)) {
    outputs.set(
      path.join(DOCS, folder, "meta.json"),
      JSON.stringify(
        {
          title,
          pages: plannedPages
            .filter((p) => p.folder === folder)
            .map((p) => p.name),
        },
        null,
        2
      ) + "\n"
    )
  }

  dedupeDomIds(pageExamples, examples, authored)
  for (const [name, code] of examples) {
    checkExample(name, code)
    // Synced examples are upstream code: eslint.config.js ignores them (it
    // reads the list from sync-report.json) and .prettierignore lists them.
    const header = `${SYNCED_EXAMPLE_HEADER} (apps/v4/examples/aria/${name}.tsx) by scripts/sync-upstream-docs.mts — do not edit.\n`
    outputs.set(path.join(OUT_EXAMPLES, `${name}.tsx`), header + code)
  }
  for (const [page, names] of pageExamples)
    checkPageIds(page, names, examples, authored)

  report.examples = [...examples.keys()].sort()
  outputs.set(
    path.join(HERE, "sync-report.json"),
    JSON.stringify(report, null, 2) + "\n"
  )
  const ignore = (await exists(PRETTIER_IGNORE))
    ? await fs.readFile(PRETTIER_IGNORE, "utf8")
    : ""
  outputs.set(PRETTIER_IGNORE, prettierIgnore(ignore, report.examples))

  // Everything generated and checked: replace the previously synced files
  // (hand-written pages such as components/index.mdx and Tecton-authored
  // examples are kept).
  const stale: string[] = []
  for (const dir of [
    OUT_DOCS,
    ...Object.keys(EXTRA_FOLDERS).map((folder) => path.join(DOCS, folder)),
  ]) {
    for (const file of await listFiles(dir)) {
      const full = path.join(dir, file)
      if (!file.endsWith(".mdx") || outputs.has(full)) continue
      if (SYNCED_PAGE_MARKER.test(await fs.readFile(full, "utf8")))
        stale.push(full)
    }
  }
  for (const file of await listFiles(OUT_EXAMPLES)) {
    const full = path.join(OUT_EXAMPLES, file)
    if (outputs.has(full)) continue
    if ((await fs.readFile(full, "utf8")).startsWith(SYNCED_EXAMPLE_HEADER))
      stale.push(full)
  }
  for (const file of stale) await fs.rm(file)
  for (const [file, content] of outputs) {
    const current = (await exists(file))
      ? await fs.readFile(file, "utf8")
      : null
    if (current === content) continue
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, content)
  }
  for (const [to, from] of imageCopies) {
    await fs.mkdir(path.dirname(to), { recursive: true })
    await fs.copyFile(from, to)
  }

  console.log(
    `[docs:sync] ${report.pages.length} pages, ${report.examples.length} examples, ${Object.keys(report.skippedExamples).length} skipped, ${stale.length} removed (see scripts/sync-report.json)`
  )
}

// ---------------------------------------------------------------------------
// end-of-run checks (a failure leaves the working tree untouched)
// ---------------------------------------------------------------------------

/** The examples a page renders or shows the source of, in page order. */
function previewedExamples(mdx: string, componentFiles: string[]): string[] {
  const names: string[] = []
  for (const [tag] of mdx.matchAll(PREVIEW_TAG)) {
    const name = attr(tag, "name")
    if (name && attr(tag, "type") !== "block") names.push(name)
  }
  for (const [tag] of mdx.matchAll(SOURCE_TAG)) {
    const name = attr(tag, "name")
    if (name && !componentFiles.includes(`${name}.tsx`)) names.push(name)
  }
  return [...new Set(names)]
}

/** Checks on the upstream-derived part of a page (before the guidelines). */
function checkSyncedContent(
  mdx: string,
  page: string,
  localPages: Set<string>
) {
  assertNoStockColours(mdx, `the synced page ${page}`)
  const slugs = headingSlugs(mdx)
  for (const match of mdx.matchAll(/\]\(#([^)\s]+)\)|href="#([^"]+)"/g)) {
    const anchor = match[1] ?? match[2]
    if (!slugs.has(anchor))
      throw new Error(
        `${page}: link to #${anchor}, which is not a heading on the page`
      )
  }
  for (const [, href] of mdx.matchAll(/\]\((\/docs[^)\s]*)\)/g)) {
    if (!isLocalDocsLink(href, localPages))
      throw new Error(
        `${page}: link to ${href}, which is not a page on this site`
      )
  }
}

/** Every preview and source on the finished page resolves. */
function checkPage(
  mdx: string,
  page: string,
  known: {
    examples: Map<string, string>
    authored: Map<string, string>
    blocks: Set<string>
    componentFiles: string[]
  }
) {
  for (const [tag] of mdx.matchAll(PREVIEW_TAG)) {
    const name = attr(tag, "name")
    if (!name)
      throw new Error(`${page}: <ComponentPreview> without a name: ${tag}`)
    if (attr(tag, "type") === "block") {
      if (!known.blocks.has(name))
        throw new Error(
          `${page}: block preview ${name} is not a @tecton/blocks block`
        )
    } else if (!known.examples.has(name) && !known.authored.has(name)) {
      throw new Error(`${page}: preview ${name} has no example in src/examples`)
    }
  }
  for (const [tag] of mdx.matchAll(SOURCE_TAG)) {
    const name = attr(tag, "name")
    if (
      name &&
      !known.componentFiles.includes(`${name}.tsx`) &&
      !known.examples.has(name) &&
      !known.authored.has(name)
    ) {
      throw new Error(
        `${page}: <ComponentSource name="${name}"> has no component or example file`
      )
    }
  }
  const leftover = /<ComponentPreview\b/.exec(mdx.replace(PREVIEW_TAG, ""))
  if (leftover)
    throw new Error(`${page}: a <ComponentPreview> the sync could not parse`)
}

function checkExample(name: string, code: string) {
  assertNoStockColours(code, `the synced example ${name}`)
  const ids = [...code.matchAll(ID_ATTR)].map((m) => m[1])
  const dom = domIds(code)
  for (const id of dom) {
    if (dom.filter((other) => other === id).length > 1)
      throw new Error(`${name}: DOM id "${id}" appears twice`)
  }
  for (const [, target] of code.matchAll(/(?<![\w-])htmlFor="([^"]+)"/g)) {
    if (!ids.includes(target))
      throw new Error(
        `${name}: htmlFor="${target}" names no element of the example`
      )
  }
}

function checkPageIds(
  page: string,
  names: string[],
  examples: Map<string, string>,
  authored: Map<string, string>
) {
  const owners = new Map<string, string>()
  for (const name of names) {
    const code = examples.get(name) ?? authored.get(name)
    if (code === undefined) continue
    for (const id of new Set(domIds(code))) {
      const owner = owners.get(id)
      if (owner && owner !== name)
        throw new Error(
          `${page}: DOM id "${id}" is used by both ${owner} and ${name}`
        )
      owners.set(id, name)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
