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
  "lucide-react",
  "react-aria-components",
  "sonner",
  "@internationalized/date",
  "@tabler/icons-react",
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

function rewriteImports(source: string): { code: string; blocked?: string } {
  let blocked: string | undefined
  const code = source.replace(
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

function transformMdx(mdx: string, name: string, removed: Set<string>) {
  // frontmatter
  mdx = mdx.replace(/^---\n([\s\S]*?)\n---/, (_m, fm: string) => {
    const lines = fm
      .split("\n")
      .filter((line) => !/^(base|component|featured):/.test(line))
    lines.push(`upstream: apps/v4/content/docs/components/aria/${name}.mdx`)
    return `---\n${lines.join("\n")}\n---`
  })

  // drop styleName props (aria-nova / aria-rhea …)
  mdx = mdx.replace(/\s+styleName="[^"]*"/g, "")

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

  // import paths and file titles
  mdx = mdx.replace(/@\/components\/ui\//g, "@tecton/react/components/")
  mdx = mdx.replace(/title="components\/ui\/([^"]+)"/g, 'title="@tecton/react/components/$1"')
  mdx = mdx.replace(/`components\/ui\/([a-z0-9-]+\.tsx)`/g, "`@tecton/react/components/$1`")

  // docs links that point at other bases
  mdx = mdx.replace(/\]\(\/docs\/components\/(?:base|radix|aria)\//g, "](/docs/components/")

  // Next.js-only bits in prose
  mdx = mdx.replace(/\n\n+/g, "\n\n")
  return mdx.trimEnd() + "\n"
}

async function main() {
  if (!(await exists(V4))) {
    throw new Error(`Upstream checkout not found at ${UPSTREAM} (set SHADCN_UPSTREAM_DIR)`)
  }
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
    const { code, blocked } = rewriteImports(source)
    if (blocked) {
      report.skippedExamples[exampleName] = `unsupported import: ${blocked}`
      exampleCache.set(exampleName, null)
      return false
    }
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
    await fs.writeFile(path.join(OUT_DOCS, `${name}.mdx`), transformMdx(mdx, name, removed))
    report.pages.push(name)
  }

  await fs.writeFile(
    path.join(OUT_DOCS, "meta.json"),
    JSON.stringify({ title: "Components", pages: ["index", ...report.pages] }, null, 2) + "\n"
  )
  report.examples.sort()
  await fs.writeFile(path.join(HERE, "sync-report.json"), JSON.stringify(report, null, 2) + "\n")

  console.log(
    `[docs:sync] ${report.pages.length} pages, ${report.examples.length} examples, ${Object.keys(report.skippedExamples).length} skipped (see scripts/sync-report.json)`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
