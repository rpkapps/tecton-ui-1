/// <reference types="node" />
/**
 * Renders the docs corpus into the files AI coding agents fetch.
 *
 * The docs are MDX: every code sample lives inside `<ComponentPreview name="…" />`
 * and friends, so a plain fetch of a docs page returns no code. This script
 * resolves those components against the real sources and emits plain markdown.
 *
 *   content/llms-preamble.md   ─┐
 *   content/docs/ ** /*.mdx     ├─►  public/llms.txt       rules + linked index
 *   src/examples/*.tsx          │    public/llms-full.txt  rules + every page
 *   packages/tecton-react/…     ─┘   public/docs/ ** .md    one file per page
 *                                    scripts/llms-report.json
 *
 * `llms-full.txt` inlines one canonical example per page (`<slug>-demo`); the
 * per-page twins carry every example. Pass --all-examples to inline them all.
 *
 * Usage: bun run scripts/build-llms.mts [--all-examples]
 * Env:   SITE_URL  absolute origin for links (default: root-relative paths)
 */
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const WWW = path.resolve(HERE, "..")
const REPO = path.resolve(WWW, "../..")
const PKG = path.join(REPO, "packages/tecton-react")
const DOCS = path.join(WWW, "content/docs")
const EXAMPLES = path.join(WWW, "src/examples")
const PUBLIC = path.join(WWW, "public")

const SITE = (process.env.SITE_URL ?? "").replace(/\/+$/, "")
const ALL_EXAMPLES = process.argv.includes("--all-examples")

/** Components that carry real content and are rendered rather than dropped. */
const KNOWN_TAGS = new Set([
  "ComponentPreview",
  "ComponentSource",
  "Callout",
  "Tabs",
  "TabsList",
  "TabsTrigger",
  "TabsContent",
  "Steps",
  "Step",
  "ComponentsList",
  "IconGallery",
  "PaletteTable",
  "TokenTable",
  "LinkedCard",
  "Image",
  "Kbd",
  "KbdGroup",
])

const report = {
  generatedAt: new Date().toISOString(),
  siteUrl: SITE || "(root-relative)",
  allExamples: ALL_EXAMPLES,
  pages: 0,
  examplesInlined: 0,
  /** Examples referenced by a page but absent from src/examples. */
  missingExamples: [] as string[],
  /** Sources referenced by <ComponentSource> that could not be resolved. */
  missingSources: [] as string[],
  /** Capitalised tags encountered outside code fences with no renderer. */
  unhandledTags: {} as Record<string, number>,
  bytes: {} as Record<string, number>,
}

// ---------------------------------------------------------------- utilities

async function readOrNull(file: string) {
  try {
    return (await fs.readFile(file, "utf8")).replace(/\r\n/g, "\n")
  } catch {
    return null
  }
}

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const out: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full)))
    else if (entry.name.endsWith(".mdx")) out.push(full)
  }
  return out
}

/** Absolute (or root-relative) URL of a page's markdown twin. */
function pageUrl(slug: string) {
  return `${SITE}/docs/${slug}.md`
}

// -------------------------------------------------------------- frontmatter

type Frontmatter = {
  title?: string
  description?: string
  upstream?: string
  links?: Record<string, string>
}

/**
 * The frontmatter in this repo is flat except for a `links:` map of two keys,
 * so a full YAML parser would be more dependency than the shape warrants.
 */
function parseFrontmatter(raw: string): { data: Frontmatter; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(raw)
  if (!match) return { data: {}, body: raw }

  const data: Frontmatter = {}
  let nested: string | null = null
  for (const line of match[1].split("\n")) {
    if (!line.trim()) continue
    const indented = /^\s/.test(line)
    const pair = /^\s*([\w-]+)\s*:\s*(.*)$/.exec(line)
    if (!pair) continue
    const [, key, rawValue] = pair
    const value = rawValue.trim().replace(/^["'](.*)["']$/, "$1")

    if (indented && nested) {
      ;(data as Record<string, unknown>)[nested] = {
        ...((data as Record<string, Record<string, string>>)[nested] ?? {}),
        [key]: value,
      }
      continue
    }
    if (!value) {
      nested = key
      continue
    }
    nested = null
    ;(data as Record<string, unknown>)[key] = value
  }
  return { data, body: raw.slice(match[0].length) }
}

// ------------------------------------------------------------- JSX scanning

type Tag = {
  name: string
  attrs: Record<string, string>
  body: string
  start: number
  end: number
}

/**
 * Reads a JSX attribute list starting just after the tag name. Values may be
 * quoted strings or brace expressions (`icon={<InfoIcon />}`), which are
 * matched by depth so nested braces and JSX do not end them early.
 */
function readAttrs(src: string, from: number) {
  const attrs: Record<string, string> = {}
  let i = from
  while (i < src.length) {
    while (i < src.length && /\s/.test(src[i])) i++
    if (src.startsWith("/>", i)) return { attrs, end: i + 2, selfClosing: true }
    if (src[i] === ">") return { attrs, end: i + 1, selfClosing: false }

    const name = /^[A-Za-z][\w-]*/.exec(src.slice(i))?.[0]
    if (!name) return { attrs, end: i + 1, selfClosing: false }
    i += name.length
    while (i < src.length && /\s/.test(src[i])) i++

    if (src[i] !== "=") {
      attrs[name] = "true"
      continue
    }
    i++
    while (i < src.length && /\s/.test(src[i])) i++

    const quote = src[i]
    if (quote === '"' || quote === "'") {
      const close = src.indexOf(quote, i + 1)
      if (close === -1) return { attrs, end: src.length, selfClosing: true }
      attrs[name] = src.slice(i + 1, close)
      i = close + 1
    } else if (quote === "{") {
      let depth = 0
      let j = i
      for (; j < src.length; j++) {
        if (src[j] === "{") depth++
        else if (src[j] === "}" && --depth === 0) break
      }
      attrs[name] = src.slice(i + 1, j)
      i = j + 1
    } else {
      const word = /^\S+/.exec(src.slice(i))?.[0] ?? ""
      attrs[name] = word
      i += word.length
    }
  }
  return { attrs, end: src.length, selfClosing: true }
}

/** Finds the first capitalised JSX element in `src` at or after `from`. */
function nextTag(src: string, from: number): Tag | null {
  const re = /<([A-Z][A-Za-z0-9]*)/g
  re.lastIndex = from
  const open = re.exec(src)
  if (!open) return null

  const name = open[1]
  const { attrs, end, selfClosing } = readAttrs(src, open.index + name.length + 1)
  if (selfClosing) {
    return { name, attrs, body: "", start: open.index, end }
  }

  // Paired element: walk forward counting same-name opens so nesting is safe.
  const nest = new RegExp(`<${name}(?=[\\s/>])|</${name}>`, "g")
  nest.lastIndex = end
  let depth = 1
  let match: RegExpExecArray | null
  while ((match = nest.exec(src))) {
    depth += match[0].startsWith("</") ? -1 : 1
    if (depth === 0) {
      return {
        name,
        attrs,
        body: src.slice(end, match.index),
        start: open.index,
        end: nest.lastIndex,
      }
    }
  }
  // Unclosed — treat the opening tag alone as the element.
  return { name, attrs, body: "", start: open.index, end }
}

// ------------------------------------------------------------ data sources

const exampleCache = new Map<string, string | null>()

async function exampleSource(name: string) {
  if (!exampleCache.has(name)) {
    const raw = await readOrNull(path.join(EXAMPLES, `${name}.tsx`))
    // Match the docs site, which hides the provenance header of synced examples.
    exampleCache.set(name, raw?.replace(/^\/\/ Synced from shadcn\/ui[^\n]*\n/, "") ?? null)
  }
  return exampleCache.get(name) ?? null
}

/** Mirrors src/lib/sources.ts: public import path -> file under the package. */
async function librarySource(spec: string) {
  const candidates = [
    `src/${spec}.tsx`,
    `src/${spec}.ts`,
    `src/components/${spec}.tsx`,
    `src/tecton/${spec}.tsx`,
  ]
  for (const rel of candidates) {
    const raw = await readOrNull(path.join(PKG, rel))
    if (raw !== null) return raw
  }
  return null
}

type Doc = { slug: string; file: string; data: Frontmatter; body: string }

let allDocs: Doc[] = []
let icons: { icons: { name: string; slug: string; description: string; lucide: string | null; domain: boolean }[] }
let tokenMap: {
  shadcn: Record<string, { confidence: string; note?: string }>
  extra: Record<string, { confidence: string; note?: string }>
  palette: { families: string[]; prefix: string }
}
let themeVars: { cssVars: { light: Record<string, string>; dark: Record<string, string> } }

// --------------------------------------------------------------- renderers

type Ctx = { examples: "all" | "demo"; slug: string }

function fence(code: string, lang = "tsx") {
  return `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n`
}

async function renderPreview(tag: Tag, ctx: Ctx) {
  const name = tag.attrs.name
  if (!name) return ""
  // The full-corpus file keeps one canonical example per page; the per-page
  // twins keep them all. Without this the single file is ~3 MB.
  if (ctx.examples === "demo" && !ALL_EXAMPLES && name !== `${ctx.slug.split("/").pop()}-demo`) {
    return ""
  }
  const source = await exampleSource(name)
  if (source === null) {
    if (!report.missingExamples.includes(name)) report.missingExamples.push(name)
    return `\n_(example \`${name}\` unavailable)_\n`
  }
  report.examplesInlined++
  return `\n**Example — \`${name}\`**\n${fence(source)}`
}

async function renderSource(tag: Tag) {
  const spec = tag.attrs.src ?? tag.attrs.name
  if (!spec) return ""
  const source = (await librarySource(spec)) ?? (await exampleSource(spec))
  if (source === null) {
    if (!report.missingSources.includes(spec)) report.missingSources.push(spec)
    return `\n_(source \`${spec}\` unavailable)_\n`
  }
  const title = tag.attrs.title ?? spec
  return `\n**Source — \`${title}\`**\n${fence(source)}`
}

/** Drops the common leading indentation MDX authors give an element's body. */
function dedent(text: string) {
  const indents = text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => /^[ \t]*/.exec(line)![0].length)
  const common = indents.length ? Math.min(...indents) : 0
  return common ? text.split("\n").map((line) => line.slice(common)).join("\n") : text
}

async function renderCallout(tag: Tag, ctx: Ctx) {
  const inner = (await transformMarkdown(dedent(tag.body), ctx)).trim()
  const head = tag.attrs.title ? `**${tag.attrs.title}**\n\n` : ""
  const quoted = (head + inner)
    .split("\n")
    .map((line) => (line.trim() ? `> ${line}` : ">"))
    .join("\n")
  return `\n${quoted}\n`
}

async function renderTabs(tag: Tag, ctx: Ctx) {
  // Trigger labels name the panels; without them the values alone read poorly.
  const labels = new Map<string, string>()
  let cursor = 0
  for (;;) {
    const trigger = nextTag(tag.body, cursor)
    if (!trigger) break
    if (trigger.name === "TabsTrigger" && trigger.attrs.value) {
      labels.set(trigger.attrs.value, trigger.body.replace(/<[^>]*>/g, "").trim())
    }
    cursor = trigger.name === "TabsList" ? trigger.start + 1 : trigger.end
  }

  const parts: string[] = []
  cursor = 0
  for (;;) {
    const panel = nextTag(tag.body, cursor)
    if (!panel) break
    cursor = panel.name === "Tabs" ? panel.start + 1 : panel.end
    if (panel.name !== "TabsContent") continue
    const value = panel.attrs.value ?? ""
    const body = (await transformMarkdown(panel.body, ctx)).trim()
    parts.push(`**${labels.get(value) ?? value}**\n\n${body}`)
  }
  return `\n${parts.join("\n\n")}\n`
}

function renderComponentsList(tag: Tag) {
  const section = tag.attrs.section ?? "components"
  const pages = allDocs
    .filter((doc) => doc.slug.startsWith(`${section}/`) && !doc.slug.endsWith("/index"))
    .sort((a, b) => (a.data.title ?? "").localeCompare(b.data.title ?? ""))
  return `\n${pages
    .map((doc) => `- [${doc.data.title}](${pageUrl(doc.slug)}) — ${doc.data.description ?? ""}`)
    .join("\n")}\n`
}

function renderIconGallery() {
  const rows = icons.icons
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(
      (icon) =>
        `| \`${icon.name}Icon\` | ${icon.description} | ${icon.lucide ? `\`${icon.lucide}\`` : "—"} | ${icon.domain ? "yes" : "—"} |`
    )
  return [
    "",
    `All ${icons.icons.length} icons are exported from \`@tecton/react/icons\`.`,
    "",
    "| Import | Glyph | Closest lucide | Domain icon |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n")
}

function renderPaletteTable() {
  const families = tokenMap.palette.families
  // Every family shares one ramp, so the first family's keys give the steps.
  const head = `${tokenMap.palette.prefix}-${families[0]}-`
  const steps = Object.keys(themeVars.cssVars.light)
    .filter((key) => key.startsWith(head))
    .map((key) => key.slice(head.length))
  return [
    "",
    "Utilities are `<utility>-<family>-<step>`, for example `bg-blue-120` or `text-graphite-830`.",
    "A step is a contrast level — the same perceived distance from the page background in both",
    "modes — so a single utility is correct in light and dark and never needs a `dark:` pair.",
    "",
    `- **Families** (${families.length}): ${families.map((f) => `\`${f}\``).join(", ")}, plus \`white\` and \`black\`.`,
    `- **Steps** (${steps.length}): ${steps.join(", ")}.`,
    "",
    "Stock Tailwind colours (`bg-red-500`, `text-zinc-400`) are reset away and emit no CSS.",
    "",
  ].join("\n")
}

function renderTokenTable() {
  const entries = [
    ...Object.entries(tokenMap.shadcn),
    ...Object.entries(tokenMap.extra),
  ]
  const rows = entries.map(([name, mapping]) => {
    const light = themeVars.cssVars.light[name] ?? ""
    const dark = themeVars.cssVars.dark[name] ?? ""
    return `| \`--${name}\` | \`bg-${name}\` / \`text-${name}\` | ${light} | ${dark} | ${mapping.note ?? ""} |`
  })
  return [
    "",
    `${entries.length} semantic tokens. Each is available as a Tailwind utility (\`bg-\`, \`text-\`, \`border-\`, \`ring-\`).`,
    "",
    "| Variable | Utilities | Light | Dark | Purpose |",
    "| --- | --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n")
}

/** Text of an element's body, for places that need a one-line label. */
function stripTags(value: string) {
  return value
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// ------------------------------------------------------------- the pipeline

/**
 * Code must be invisible to the tag scanner: fenced blocks are full of JSX, and
 * inline spans hold it too (`<Field />`, `ColumnDef<TData>`). Both are swapped
 * for placeholders across the whole page and restored once at the end.
 *
 * Masking rather than splitting matters: a `<Tabs>` or `<Callout>` body usually
 * *contains* fenced blocks, so anything that cut the page at a fence would
 * separate an opening tag from its close and leave the markup stranded.
 */
let codeSpans: string[] = []
const MASK = " "

function hide(value: string) {
  codeSpans.push(value)
  return `${MASK}${codeSpans.length - 1}${MASK}`
}

function maskFences(text: string) {
  const out: string[] = []
  let buffer: string[] | null = null
  let marker = ""

  for (const line of text.split("\n")) {
    const found = /^\s*(`{3,}|~{3,})/.exec(line)
    if (buffer) {
      buffer.push(line)
      const closes = found && line.trim() === found[1] && found[1].length >= marker.length
      if (closes) {
        out.push(hide(buffer.join("\n")))
        buffer = null
      }
      continue
    }
    if (found) {
      marker = found[1]
      buffer = [line]
      continue
    }
    out.push(line)
  }
  // An unclosed fence is left alone rather than swallowing the rest of the page.
  if (buffer) out.push(...buffer)
  return out.join("\n")
}

/**
 * Single-line only: fenced blocks are already hidden, so nothing legitimate
 * spans lines here, and an empty `` in a prop table would otherwise pair with
 * the next one several rows down and swallow everything between.
 */
function maskInlineCode(text: string) {
  return text.replace(/(`+)([^\n]*?)\1/g, (match) => hide(match))
}

function unmaskInlineCode(text: string) {
  return text.replace(new RegExp(`${MASK}(\\d+)${MASK}`, "g"), (_, index: string) =>
    codeSpans[Number(index)]
  )
}

/** Replaces the component tags in a stretch of markdown whose code is masked. */
async function transformText(masked: string, ctx: Ctx): Promise<string> {
  // MDX-only import statements carry no meaning in plain markdown. Safe here
  // because code is already masked, so imports in samples are untouched.
  const text = masked.replace(/^import\s+[^\n]*\n/gm, "")
  let out = ""
  let cursor = 0
  for (;;) {
    const tag = nextTag(text, cursor)
    if (!tag) break
    out += text.slice(cursor, tag.start)
    cursor = tag.end

    switch (tag.name) {
      case "ComponentPreview":
        out += await renderPreview(tag, ctx)
        break
      case "ComponentSource":
        out += await renderSource(tag)
        break
      case "Callout":
        out += await renderCallout(tag, ctx)
        break
      case "Tabs":
        out += await renderTabs(tag, ctx)
        break
      case "ComponentsList":
        out += renderComponentsList(tag)
        break
      case "IconGallery":
        out += renderIconGallery()
        break
      case "PaletteTable":
        out += renderPaletteTable()
        break
      case "TokenTable":
        out += renderTokenTable()
        break
      case "LinkedCard":
        out += `\n- [${stripTags(tag.body)}](${tag.attrs.href ?? ""})\n`
        break
      case "Image":
        out += `\n![${tag.attrs.alt ?? ""}](${tag.attrs.src ?? ""})\n`
        break
      case "Kbd":
      case "KbdGroup":
        out += `\`${stripTags(tag.body)}\``
        break
      // Wrappers whose children are already structured markdown.
      case "Steps":
      case "Step":
      case "TabsList":
      case "TabsContent":
        out += await transformMarkdown(tag.body, ctx)
        break
      default:
        if (!KNOWN_TAGS.has(tag.name)) {
          report.unhandledTags[tag.name] = (report.unhandledTags[tag.name] ?? 0) + 1
        }
        out += await transformMarkdown(tag.body, ctx)
    }
  }
  // Collapsing runs of blank lines is safe here but not on the whole page,
  // where it would eat blank lines inside code fences.
  return (out + text.slice(cursor)).replace(/\n{3,}/g, "\n\n")
}

/**
 * Hides all code, then rewrites the components left in the prose. Re-masking an
 * already-masked body (the recursive calls from tag renderers) is a no-op,
 * since placeholders contain neither fences nor backticks.
 */
async function transformMarkdown(md: string, ctx: Ctx): Promise<string> {
  return transformText(maskInlineCode(maskFences(md)), ctx)
}

/** Rewrites in-site doc links to the markdown twins agents can follow. */
function rewriteLinks(md: string) {
  return md.replace(/\]\(\/docs\/([^)\s#]+)(#[^)\s]*)?\)/g, (_, slug: string, hash = "") => {
    // Idempotent: renderers that already emit twin URLs must not gain a second .md.
    const clean = slug.replace(/\/$/, "").replace(/\.md$/, "")
    return `](${pageUrl(clean)}${hash})`
  })
}

async function renderPage(doc: Doc, ctx: Ctx) {
  const { data } = doc
  const head = [`# ${data.title ?? doc.slug}`]
  if (data.description) head.push("", data.description)

  const meta: string[] = [`Source: ${pageUrl(doc.slug)}`]
  if (data.links?.doc) meta.push(`React Aria docs: ${data.links.doc}`)
  if (data.links?.api) meta.push(`React Aria API: ${data.links.api}`)
  head.push("", meta.join("  \n"))

  codeSpans = []
  const rendered = unmaskInlineCode(await transformMarkdown(doc.body, ctx)).trim()

  return rewriteLinks(`${head.join("\n")}\n\n${rendered}`).trim()
}

// ---------------------------------------------------------------- ordering

/** Docs order follows the meta.json files so the index reads like the site. */
async function orderedDocs(docs: Doc[]) {
  const bySlug = new Map(docs.map((doc) => [doc.slug, doc]))
  const used = new Set<string>()
  const sections: { title: string; docs: Doc[] }[] = []

  const readMeta = async (dir: string) => {
    const raw = await readOrNull(path.join(DOCS, dir, "meta.json"))
    return raw ? (JSON.parse(raw) as { title?: string; pages?: string[] }) : null
  }

  const root = await readMeta(".")
  let current = { title: "Getting started", docs: [] as Doc[] }
  sections.push(current)

  for (const entry of root?.pages ?? []) {
    const heading = /^---(.*)---$/.exec(entry)
    if (heading) {
      current = { title: heading[1].trim(), docs: [] }
      sections.push(current)
      continue
    }
    const page = bySlug.get(entry)
    if (page) {
      current.docs.push(page)
      used.add(page.slug)
      continue
    }
    // A folder: expand it in its own meta.json order.
    const meta = await readMeta(entry)
    const folder = { title: meta?.title ?? entry, docs: [] as Doc[] }
    for (const name of meta?.pages ?? []) {
      const child = bySlug.get(`${entry}/${name}`)
      if (child && !used.has(child.slug)) {
        folder.docs.push(child)
        used.add(child.slug)
      }
    }
    sections.push(folder)
  }

  const rest = docs.filter((doc) => !used.has(doc.slug)).sort((a, b) => a.slug.localeCompare(b.slug))
  if (rest.length) sections.push({ title: "Other", docs: rest })
  return sections.filter((section) => section.docs.length)
}

// -------------------------------------------------------------------- main

async function main() {
  const [iconsRaw, mapRaw, themeRaw, preamble] = await Promise.all([
    fs.readFile(path.join(PKG, "icons/icons.json"), "utf8"),
    fs.readFile(path.join(PKG, "tokens/tecton.map.json"), "utf8"),
    fs.readFile(path.join(PKG, "registry/theme.json"), "utf8"),
    fs.readFile(path.join(WWW, "content/llms-preamble.md"), "utf8"),
  ])
  icons = JSON.parse(iconsRaw)
  tokenMap = JSON.parse(mapRaw)
  themeVars = JSON.parse(themeRaw)

  const files = (await walk(DOCS)).sort()
  allDocs = await Promise.all(
    files.map(async (file) => {
      const raw = (await fs.readFile(file, "utf8")).replace(/\r\n/g, "\n")
      const { data, body } = parseFrontmatter(raw)
      return {
        slug: path.relative(DOCS, file).replace(/\.mdx$/, "").split(path.sep).join("/"),
        file,
        data,
        body,
      }
    })
  )
  report.pages = allDocs.length

  const sections = await orderedDocs(allDocs)

  // Per-page twins: every example, so an agent can fetch one component.
  for (const doc of allDocs) {
    const out = path.join(PUBLIC, "docs", `${doc.slug}.md`)
    await fs.mkdir(path.dirname(out), { recursive: true })
    await fs.writeFile(out, `${await renderPage(doc, { examples: "all", slug: doc.slug })}\n`)
  }

  // Blocks and the registry are already machine-readable; just index them.
  const registry = JSON.parse(
    await fs.readFile(path.join(PKG, "registry.json"), "utf8")
  ) as { items: { name: string; title?: string; description?: string; categories?: string[] }[] }

  const blockIndex = [
    "## Blocks",
    "",
    "Full-page compositions, installed from the `@tecton` shadcn registry with",
    "`npx shadcn@latest add @tecton/<name>`.",
    "",
    "| Block | Category | Description |",
    "| --- | --- | --- |",
    ...registry.items.map(
      (item) =>
        `| \`@tecton/${item.name}\` | ${item.categories?.join(", ") ?? ""} | ${item.title ?? ""}${item.description ? ` — ${item.description}` : ""} |`
    ),
  ].join("\n")

  const iconIndex = [
    "## Icons",
    "",
    `${icons.icons.length} glyphs, imported as \`<Name>Icon\` from \`@tecton/react/icons\`:`,
    "",
    icons.icons
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((icon) => `${icon.name}Icon`)
      .join(", "),
  ].join("\n")

  const index = [
    "## Documentation",
    "",
    ...sections.flatMap((section) => [
      `### ${section.title}`,
      "",
      ...section.docs.map(
        (doc) =>
          `- [${doc.data.title ?? doc.slug}](${pageUrl(doc.slug)})${doc.data.description ? `: ${doc.data.description}` : ""}`
      ),
      "",
    ]),
  ].join("\n")

  const llms = [preamble.trim(), index, blockIndex, "", iconIndex, ""].join("\n\n")
  await fs.writeFile(path.join(PUBLIC, "llms.txt"), `${llms}\n`)

  const pages: string[] = []
  for (const section of sections) {
    for (const doc of section.docs) {
      pages.push(await renderPage(doc, { examples: "demo", slug: doc.slug }))
    }
  }
  const full = [
    preamble.trim(),
    blockIndex,
    iconIndex,
    "---",
    "",
    pages.join("\n\n---\n\n"),
    "",
  ].join("\n\n")
  await fs.writeFile(path.join(PUBLIC, "llms-full.txt"), `${full}\n`)

  report.bytes["llms.txt"] = Buffer.byteLength(llms)
  report.bytes["llms-full.txt"] = Buffer.byteLength(full)
  await fs.writeFile(path.join(HERE, "llms-report.json"), `${JSON.stringify(report, null, 2)}\n`)

  const unhandled = Object.keys(report.unhandledTags)
  console.log(
    `[docs:llms] ${report.pages} pages, ${report.examplesInlined} examples — ` +
      `llms.txt ${(report.bytes["llms.txt"] / 1024).toFixed(0)} KB, ` +
      `llms-full.txt ${(report.bytes["llms-full.txt"] / 1024).toFixed(0)} KB`
  )
  if (report.missingExamples.length) {
    console.warn(`[docs:llms] missing examples: ${report.missingExamples.join(", ")}`)
  }
  if (report.missingSources.length) {
    console.warn(`[docs:llms] missing sources: ${report.missingSources.join(", ")}`)
  }
  if (unhandled.length) {
    console.warn(`[docs:llms] unhandled tags: ${unhandled.join(", ")}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
