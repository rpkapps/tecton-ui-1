/// <reference types="node" />
/**
 * Builds the `@tecton` shadcn registry.
 *
 * Only blocks are published: components, Tecton components, icons and the
 * theme are consumed from the `@tecton/react` package and are not installed
 * one by one. Block files keep their `@tecton/react/...` imports, so the
 * package must be installed in the consuming application.
 *
 * 1. Stages this package's src/blocks into registry/src.
 * 2. Writes registry.json (one `registry:block` item per block; a block that
 *    imports another block lists it as a registry dependency).
 * 3. Runs `shadcn build registry.json --output <out>` (the CLI ships with the
 *    `shadcn` runtime dependency) so apps/www/public/r/<name>.json exist.
 *
 * Usage: bun run scripts/registry-build.mts [--output ../../apps/www/public/r]
 */
import { spawnSync } from "node:child_process"
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PKG = path.resolve(HERE, "..")
const SRC = path.join(PKG, "src")
const STAGE = path.join(PKG, "registry/src")
const outputFlag = process.argv.indexOf("--output")
const OUTPUT = path.resolve(
  PKG,
  outputFlag > -1 ? process.argv[outputFlag + 1] : "../../apps/www/public/r"
)

type RegistryFile = {
  path: string
  type: string
  target?: string
}

type RegistryItem = {
  name: string
  type: string
  title?: string
  description?: string
  dependencies?: string[]
  registryDependencies?: string[]
  categories?: string[]
  files?: RegistryFile[]
  cssVars?: Record<string, Record<string, string>>
  css?: Record<string, unknown>
}

/** External packages the Tecton sources may import, mapped to registry deps. */
const KNOWN_DEPENDENCIES = new Set([
  "react-aria-components",
  "class-variance-authority",
  "cn",
  "lucide-react",
  "@tanstack/react-table",
  "recharts",
  "sonner",
  "@internationalized/date",
])

function rewrite(source: string, blockName: string) {
  const deps = new Set<string>()
  const registryDeps = new Set<string>()
  const code = source.replace(
    /(from\s+|import\s+|import\()\s*(["'])([^"']+)\2/g,
    (match, _prefix: string, _quote: string, spec: string) => {
      // `../<other-block>/…` (or `../../<other-block>/…` from a block's
      // components/ folder): cross-block imports are always relative.
      const sibling = spec.match(/^(?:\.\.\/)+([^./][^/]*)\//)?.[1]
      if (sibling && sibling !== blockName) registryDeps.add(`@tecton/${sibling}`)
      const bare = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]
      if (KNOWN_DEPENDENCIES.has(bare)) deps.add(bare)
      return match
    }
  )
  return { code, deps, registryDeps }
}

async function stage(relative: string, blockName: string) {
  // Sources may be checked out with CRLF on Windows; the registry ships LF.
  const source = (await fs.readFile(path.join(SRC, relative), "utf8")).replace(
    /\r\n/g,
    "\n"
  )
  const { code, deps, registryDeps } = rewrite(source, blockName)
  const out = path.join(STAGE, relative)
  await fs.mkdir(path.dirname(out), { recursive: true })
  await fs.writeFile(out, code)
  return { path: posix(path.relative(PKG, out)), deps, registryDeps }
}

/** Registry paths are always "/"-separated, whatever the build platform. */
function posix(p: string) {
  return p.split(path.sep).join("/")
}

function titleCase(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

async function main() {
  await fs.rm(STAGE, { recursive: true, force: true })
  const items: RegistryItem[] = []

  // Blocks --------------------------------------------------------------------
  const blocksDir = path.join(SRC, "blocks")
  for (const block of (await fs.readdir(blocksDir, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    if (!block.isDirectory()) continue
    const files: RegistryFile[] = []
    const deps = new Set<string>()
    const registryDeps = new Set<string>()
    const walk = async (dir: string) => {
      const entries = (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) =>
        a.name.localeCompare(b.name)
      )
      for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          await walk(full)
          continue
        }
        if (!/\.(tsx?|css)$/.test(entry.name)) continue
        const relative = posix(path.relative(SRC, full))
        const staged = await stage(relative, block.name)
        staged.deps.forEach((d) => deps.add(d))
        staged.registryDeps.forEach((d) => registryDeps.add(d))
        // Every file of a block lands under components/blocks/<name>/ so the
        // relative imports inside a block (and between blocks) keep working.
        const inBlock = posix(path.relative(path.join(blocksDir, block.name), full))
        files.push({
          path: staged.path,
          type: /\.tsx?$/.test(entry.name) ? "registry:component" : "registry:file",
          target: `components/blocks/${block.name}/${inBlock}`,
        })
      }
    }
    await walk(path.join(blocksDir, block.name))
    const registryMeta = await fs.readFile(path.join(blocksDir, "index.ts"), "utf8")
    const meta = registryMeta.match(
      new RegExp(`name: "${block.name}",\\s*title: "([^"]+)",\\s*description:\\s*"([^"]+)",\\s*category: "([^"]+)"`)
    )
    items.push({
      name: block.name,
      type: "registry:block",
      title: meta?.[1] ?? titleCase(block.name),
      description: `${meta?.[2] ?? ""} Requires the @tecton/react package.`.trim(),
      categories: meta ? [meta[3]] : undefined,
      dependencies: [...deps].sort(),
      registryDependencies: [...registryDeps].sort(),
      files,
    })
  }

  // Only blocks are published. Components ship in the package so that every
  // application runs the same themed build and upgrades with it; publishing one
  // as a registry item would hand consumers a copy to edit and diverge from.
  const notBlocks = items.filter((item) => item.type !== "registry:block")
  if (notBlocks.length) {
    throw new Error(
      `registry:build publishes blocks only, but ${notBlocks.length} item(s) are not ` +
        `registry:block: ${notBlocks.map((item) => `${item.name} (${item.type})`).join(", ")}. ` +
        `Components belong in the package, imported from @tecton/react/components/*.`
    )
  }

  // Everything above only reads and stages, so a failed check leaves the
  // published registry as it was. Clearing it comes after validation.
  await fs.rm(OUTPUT, { recursive: true, force: true })

  const registry = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "tecton",
    homepage: "https://github.com/rpkapps/tecton-ui-1",
    items,
  }
  await fs.writeFile(path.join(PKG, "registry.json"), JSON.stringify(registry, null, 2) + "\n")
  console.log(`[registry:build] registry.json — ${items.length} items`)

  const cli = process.env.SHADCN_CLI ?? path.join(PKG, "node_modules/.bin/shadcn")
  const result = spawnSync(cli, ["build", "registry.json", "--output", OUTPUT], {
    cwd: PKG,
    stdio: "inherit",
    env: { ...process.env, npm_config_user_agent: "pnpm/10.33.0 npm/? node/v22 linux x64" },
  })
  if (result.status !== 0) {
    throw new Error(`shadcn build failed (exit ${result.status})`)
  }
  console.log(`[registry:build] wrote ${OUTPUT}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
