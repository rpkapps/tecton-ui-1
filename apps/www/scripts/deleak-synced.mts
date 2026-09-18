/// <reference types="node" />
/**
 * Re-applies the audience rewrites of `sync-upstream-docs.mts` to the files
 * that are already synced, without an upstream checkout.
 *
 * `docs:sync` needs shadcn/ui cloned at the pinned commit (~5 minutes of
 * setup). When all you changed is a `MDX_DELEAK` / `SAMPLE_REWRITES` rule, this
 * brings `content/docs/components`, `content/docs/utils` and the synced
 * `src/examples` in line with it and fails on anything still naming the base
 * library — the same check the sync runs. The result is what the next full sync
 * would produce.
 *
 * Usage:  bun run scripts/deleak-synced.mts [--check]
 */
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  assertNoBaseLeak,
  deleak,
  EXAMPLE_REWRITES,
  rewriteBasePrimitives,
  rewriteSampleIdentity,
} from "./sync-upstream-docs.mts"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const WWW = path.resolve(HERE, "..")
const EXAMPLE_HEADER = "// Synced from shadcn/ui"

const check = process.argv.includes("--check")

/**
 * Rewrites of text this script's own earlier output produced, which no longer
 * has an upstream form to match. They are a superset of `deleak`, not a
 * replacement: a full sync reaches the same result from the upstream source.
 */
const ALREADY_SYNCED: [RegExp | string, string][] = [
  [
    /<Callout variant="info">The source of this file lives in the upstream shadcn\/ui repository:[\s\S]*?<\/Callout>/g,
    '<Callout variant="info">This helper lives in your own project — it is not part of `@tecton/react`. The snippet below shows how it is used.</Callout>',
  ],
  [
    "Nothing to install: the utility ships with `@tecton/react/globals.css`, which imports `shadcn/tailwind.css`.",
    "Nothing to install: the utility ships with `@tecton/react/globals.css`.",
  ],
  // Tecton sections: the sync injects scripts/docs-extras/<name>.mdx, so these
  // land through that file on a full run.
  [
    "The Tecton style overlay adds the status colours and surface styles of the design system's *StatusAlert* to the shadcn `Alert`.",
    "`Alert` carries the status colours and surface styles of the design system's *StatusAlert*.",
  ],
  [
    "The recipes below are copy-paste starting points for the layouts a Tecton application usually needs; each one is a self-contained example built on `useTable` and the shadcn `Table` components.",
    "The recipes below are starting points for the layouts a Tecton application usually needs; each one is a self-contained example built on `useTable` and the `Table` components.",
  ],
  [
    'Add a display column with a React Aria `Checkbox slot="selection"`',
    'Add a display column with a `Checkbox slot="selection"`',
  ],
]

function applyAlreadySynced(mdx: string) {
  for (const [pattern, replacement] of ALREADY_SYNCED) {
    mdx =
      typeof pattern === "string"
        ? mdx.split(pattern).join(replacement)
        : mdx.replace(pattern, replacement)
  }
  return mdx
}

const changed: string[] = []

async function rewrite(file: string, transform: (source: string) => string) {
  const current = await fs.readFile(file, "utf8")
  const next = transform(current)
  const rel = path.relative(WWW, file)
  if (next === current) return
  changed.push(rel)
  if (!check) await fs.writeFile(file, next)
}

async function main() {
  for (const folder of ["content/docs/components", "content/docs/utils"]) {
    const dir = path.join(WWW, folder)
    for (const name of await fs.readdir(dir)) {
      if (!name.endsWith(".mdx")) continue
      const file = path.join(dir, name)
      // only the synced pages: hand-written ones are edited directly
      if (!/^upstream: apps\/v4\//m.test(await fs.readFile(file, "utf8")))
        continue
      await rewrite(file, (source) => {
        // same tail as transformMdx(), so a full sync lands on the same bytes
        const next =
          deleak(applyAlreadySynced(source))
            .replace(/\n\n+/g, "\n\n")
            .trimEnd() + "\n"
        assertNoBaseLeak(next, path.join(folder, name))
        return next
      })
    }
  }

  const examples = path.join(WWW, "src/examples")
  for (const name of await fs.readdir(examples)) {
    const file = path.join(examples, name)
    const source = await fs.readFile(file, "utf8")
    if (!source.startsWith(EXAMPLE_HEADER)) continue
    await rewrite(file, (current) => {
      const newline = current.indexOf("\n")
      const header = current.slice(0, newline + 1)
      const body = current.slice(newline + 1)
      const identity = rewriteSampleIdentity(rewriteBasePrimitives(body))
      const next =
        EXAMPLE_REWRITES[name.replace(/\.tsx$/, "")]?.(identity) ?? identity
      assertNoBaseLeak(next, `src/examples/${name}`)
      return header + next
    })
  }

  if (check && changed.length) {
    console.error(`[deleak] ${changed.length} file(s) are out of date:`)
    for (const file of changed) console.error(`  ${file}`)
    process.exit(1)
  }
  console.log(
    `[deleak] ${changed.length} file(s) ${check ? "out of date" : "rewritten"}.`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
