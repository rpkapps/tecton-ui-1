/// <reference types="node" />
/**
 * Checks every internal link of the built site.
 *
 *   bun run scripts/check-links.mts   (pnpm --filter www links:check, after `build`)
 *
 * Scans dist/client/**\/*.html (the prerendered pages) for `href` and `src`
 * attributes. A link is internal when it has no scheme and is not
 * protocol-relative; it must resolve to a built page (`<path>/index.html` or
 * `<path>.html`) or a file (an asset, a public file) in dist/client. Links to
 * other origins, `mailto:` and the like, and same-page `#anchors` are not
 * checked. Exits 1 and lists every broken link with the pages that contain it.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CLIENT = path.resolve(HERE, "../dist/client")
const ORIGIN = "http://docs.invalid"

/** Elements whose `href` / `src` the browser fetches or navigates to. */
const TAG =
  /<(a|area|link|script|img|iframe|source|video|audio|track|embed)\b[^>]*>/gi
const ATTRIBUTE = /\s(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
  "#x27": "'",
  "#x2F": "/",
}

function decodeEntities(value: string) {
  return value.replace(/&(#?\w+);/g, (match, name: string) => {
    return ENTITIES[name] ?? match
  })
}

function walk(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else files.push(full)
  }
  return files
}

/** The URL a prerendered file is served at (`docs/cli/index.html` → `/docs/cli`). */
function pageUrl(file: string) {
  const relative = path.relative(CLIENT, file).split(path.sep).join("/")
  const route = relative
    .replace(/(^|\/)index\.html$/, "")
    .replace(/\.html$/, "")
  return `${ORIGIN}/${route}`
}

/** An href/src this check skips: another origin, a non-http scheme, a same-page anchor. */
function isExternal(value: string) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value) || value.startsWith("#")
}

function isFile(candidate: string) {
  return existsSync(candidate) && statSync(candidate).isFile()
}

/** Whether a site path is served by dist/client. */
function resolves(pathname: string) {
  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return false
  }
  const target = path.join(CLIENT, decoded)
  if (!target.startsWith(CLIENT)) return false
  return (
    isFile(target) ||
    isFile(path.join(target, "index.html")) ||
    isFile(`${target.replace(/\/+$/, "")}.html`)
  )
}

function main() {
  if (!existsSync(CLIENT)) {
    console.error(
      `links:check: ${path.relative(process.cwd(), CLIENT)} does not exist; run the build first.`
    )
    process.exit(1)
  }

  const pages = walk(CLIENT).filter((file) => file.endsWith(".html"))
  /** broken link → pages that contain it */
  const broken = new Map<string, Set<string>>()
  let checked = 0

  for (const page of pages) {
    const html = readFileSync(page, "utf8")
    const base = pageUrl(page)
    for (const [tag] of html.matchAll(TAG)) {
      for (const match of tag.matchAll(ATTRIBUTE)) {
        const raw = decodeEntities((match[2] ?? match[3] ?? match[4]).trim())
        if (!raw || isExternal(raw)) continue
        checked++
        const url = new URL(raw, base)
        if (url.origin === ORIGIN && resolves(url.pathname)) continue
        const pagePath = new URL(base).pathname
        let seenOn = broken.get(raw)
        if (!seenOn) {
          seenOn = new Set()
          broken.set(raw, seenOn)
        }
        seenOn.add(pagePath)
      }
    }
  }

  if (broken.size) {
    console.error(
      `links:check: ${broken.size} broken internal link${broken.size === 1 ? "" : "s"} in ${pages.length} pages:`
    )
    for (const [link, seenOn] of [...broken].sort(([a], [b]) =>
      a.localeCompare(b)
    )) {
      const list = [...seenOn].sort()
      const shown = list.slice(0, 5).join(", ")
      const more = list.length > 5 ? ` (+${list.length - 5} more)` : ""
      console.error(`  ${link}\n    on ${shown}${more}`)
    }
    process.exit(1)
  }

  console.log(
    `links:check: ${checked} internal links in ${pages.length} pages resolve.`
  )
}

main()
