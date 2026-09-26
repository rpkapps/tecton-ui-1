/// <reference types="node" />
/**
 * Builds the `@tecton` shadcn registry.
 *
 * Only blocks are published: components, Tecton components, icons and the
 * theme are consumed from the `@tecton/react` package and are not installed
 * one by one. Block files keep their `@tecton/react/...` imports, so every
 * item lists `@tecton/react` as a dependency and `shadcn add` installs it.
 *
 * 1. Reads the block metadata from src/blocks/index.ts (the docs gallery's
 *    registry) and checks it against the block folders.
 * 2. Stages this package's src/blocks into registry/src, checking each file:
 *    every bare import must be a known dependency, and a file that uses
 *    hooks, contexts or event props must start with "use client".
 * 3. Writes registry.json (one `registry:block` item per block; a block that
 *    imports another block lists it as a registry dependency).
 * 4. Runs `shadcn build registry.json` (the CLI ships with the `shadcn`
 *    runtime dependency) into a temporary folder next to the output, then
 *    swaps it in, so a failed build leaves apps/www/public/r as it was.
 *
 * Usage: bun run scripts/registry-build.mts [--output <dir> --force]
 * The output is apps/www/public/r; another folder is replaced wholesale, so
 * it needs --force.
 */
import { spawnSync } from "node:child_process"
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PKG = path.resolve(HERE, "..")
const SRC = path.join(PKG, "src")
const STAGE = path.join(PKG, "registry/src")
const DEFAULT_OUTPUT = path.resolve(PKG, "../../apps/www/public/r")

function parseOutput(argv: string[]) {
  const flag = argv.indexOf("--output")
  if (flag === -1) return DEFAULT_OUTPUT
  const value = argv[flag + 1]
  if (value === undefined || value.startsWith("--"))
    throw new Error("--output needs a folder")
  const output = path.resolve(PKG, value)
  const root = path.parse(output).root
  // The output is deleted and recreated: never a filesystem root, this
  // package or a folder that contains it.
  if (output === root || output === PKG || PKG.startsWith(output + path.sep)) {
    throw new Error(`refusing to replace ${output}: it holds the sources`)
  }
  if (output !== DEFAULT_OUTPUT && !argv.includes("--force")) {
    throw new Error(
      `refusing to replace ${output}: the registry builds into ` +
        `${path.relative(PKG, DEFAULT_OUTPUT)}. Pass --force to replace ` +
        `another folder (its current contents are deleted).`
    )
  }
  return output
}

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
  categories?: string[] | undefined
  files?: RegistryFile[]
  cssVars?: Record<string, Record<string, string>>
  css?: Record<string, unknown>
}

/** The package the blocks are built on; every item depends on it. */
const TECTON_PACKAGE = "@tecton/react"

/** External packages the block sources may import, mapped to registry deps. */
const KNOWN_DEPENDENCIES = new Set([
  "class-variance-authority",
  "cn",
  "lucide-react",
  "@tanstack/react-table",
  "recharts",
  "sonner",
])

/** Imports every React application already has; not listed as dependencies. */
const PEER_DEPENDENCIES = new Set(["react", "react-dom"])

/** Package name of a bare import specifier (`@scope/name/sub` → `@scope/name`). */
function packageName(spec: string) {
  const parts = spec.split("/")
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? spec)
}

/**
 * A file that runs on the client only must say so: a hook call, a context
 * or an event handler prop in a file without "use client" breaks a React
 * Server Components app that renders the block from a server component.
 */
const CLIENT_ONLY = [
  { pattern: /\buse[A-Z]\w*\(/, reason: "calls a hook" },
  { pattern: /\bcreateContext\(/, reason: "creates a context" },
  { pattern: /\son[A-Z][A-Za-z]*=\{/, reason: "passes an event handler" },
]

function clientOnlyReason(source: string) {
  // Comments do not count ("…see `useFoo()`…").
  const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "")
  return CLIENT_ONLY.find(({ pattern }) => pattern.test(code))?.reason
}

function hasUseClient(source: string) {
  return /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*["']use client["']/.test(source)
}

/**
 * Module specifiers of a source file: `import … from`, `export … from`,
 * side-effect `import "…"` and dynamic `import("…")`. The static forms are
 * matched at the start of a line (an import clause holds no `(`, `)` or
 * `=`), so prose such as `opens from "Open agent"` in a comment is not one.
 */
function importSpecifiers(source: string) {
  const patterns = [
    /^\s*(?:import|export)\b[^;()=]*?\bfrom\s*(["'])([^"']+)\1/gm,
    /^\s*import\s*(["'])([^"']+)\1/gm,
    /\bimport\(\s*(["'])([^"']+)\1\s*\)/g,
  ]
  return patterns.flatMap((pattern) =>
    [...source.matchAll(pattern)].map((match) => match[2] ?? "")
  )
}

function rewrite(source: string, blockName: string, file: string) {
  const deps = new Set<string>()
  const registryDeps = new Set<string>()
  const problems: string[] = []
  for (const spec of importSpecifiers(source)) {
    if (spec.startsWith(".")) {
      // `../<other-block>/…` (or `../../<other-block>/…` from a block's
      // components/ folder): cross-block imports are always relative.
      const sibling = spec.match(/^(?:\.\.\/)+([^./][^/]*)\//)?.[1]
      if (sibling && sibling !== blockName)
        registryDeps.add(`@tecton/${sibling}`)
      continue
    }
    const name = packageName(spec)
    if (name === TECTON_PACKAGE || KNOWN_DEPENDENCIES.has(name)) {
      deps.add(name)
    } else if (!PEER_DEPENDENCIES.has(name)) {
      problems.push(
        `${file}: imports "${spec}", which is not a known dependency ` +
          `(add "${name}" to KNOWN_DEPENDENCIES in scripts/registry-build.mts ` +
          `if blocks may use it)`
      )
    }
  }
  // The staged file is the source as is; the imports stay `@tecton/react/…`.
  const code = source
  if (/\.tsx?$/.test(file) && !hasUseClient(source)) {
    const reason = clientOnlyReason(source)
    if (reason)
      problems.push(`${file}: ${reason} but does not start with "use client"`)
  }
  return { code, deps, registryDeps, problems }
}

async function stage(relative: string, blockName: string) {
  // Sources may be checked out with CRLF on Windows; the registry ships LF.
  const source = (await fs.readFile(path.join(SRC, relative), "utf8")).replace(
    /\r\n/g,
    "\n"
  )
  const { code, deps, registryDeps, problems } = rewrite(
    source,
    blockName,
    relative
  )
  const out = path.join(STAGE, relative)
  await fs.mkdir(path.dirname(out), { recursive: true })
  await fs.writeFile(out, code)
  return {
    path: posix(path.relative(PKG, out)),
    deps,
    registryDeps,
    problems,
  }
}

/** Registry paths are always "/"-separated, whatever the build platform. */
function posix(p: string) {
  return p.split(path.sep).join("/")
}

type BlockMeta = {
  name: string
  title: string
  description: string
  category: string
}

/**
 * The gallery metadata, read by importing src/blocks/index.ts (its
 * `component` entries are lazy, so no block is loaded).
 */
async function readMetadata(indexPath: string): Promise<BlockMeta[]> {
  const module = (await import(pathToFileURL(indexPath).href)) as {
    blocks?: unknown
  }
  if (!Array.isArray(module.blocks))
    throw new Error(`${indexPath} does not export a \`blocks\` array`)
  return module.blocks.map((entry: Record<string, unknown>, index) => {
    for (const key of ["name", "title", "description", "category"]) {
      if (typeof entry[key] !== "string" || entry[key] === "")
        throw new Error(
          `${indexPath}: blocks[${index}] has no ${key} (${JSON.stringify(entry.name)})`
        )
    }
    return entry as BlockMeta
  })
}

async function main() {
  const OUTPUT = parseOutput(process.argv.slice(2))
  const blocksDir = path.join(SRC, "blocks")
  const folders = (await fs.readdir(blocksDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))

  // Metadata ------------------------------------------------------------------
  const metadata = await readMetadata(path.join(blocksDir, "index.ts"))
  const byName = new Map(metadata.map((meta) => [meta.name, meta]))
  const problems: string[] = []
  if (byName.size !== metadata.length)
    problems.push("src/blocks/index.ts lists a block twice")
  for (const folder of folders) {
    if (!byName.has(folder))
      problems.push(
        `src/blocks/${folder}/ is not in src/blocks/index.ts (add a \`blocks\` entry)`
      )
  }
  for (const meta of metadata) {
    if (!folders.includes(meta.name))
      problems.push(
        `src/blocks/index.ts lists "${meta.name}", which has no folder`
      )
  }

  // Blocks --------------------------------------------------------------------
  await fs.rm(STAGE, { recursive: true, force: true })
  const items: RegistryItem[] = []
  for (const block of folders) {
    const files: RegistryFile[] = []
    const deps = new Set<string>([TECTON_PACKAGE])
    const registryDeps = new Set<string>()
    const walk = async (dir: string) => {
      const entries = (await fs.readdir(dir, { withFileTypes: true })).sort(
        (a, b) => a.name.localeCompare(b.name)
      )
      for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          await walk(full)
          continue
        }
        if (!/\.(tsx?|css)$/.test(entry.name)) continue
        const relative = posix(path.relative(SRC, full))
        const staged = await stage(relative, block)
        staged.deps.forEach((d) => deps.add(d))
        staged.registryDeps.forEach((d) => registryDeps.add(d))
        problems.push(...staged.problems)
        // Every file of a block lands under components/blocks/<name>/ so the
        // relative imports inside a block (and between blocks) keep working.
        const inBlock = posix(path.relative(path.join(blocksDir, block), full))
        files.push({
          path: staged.path,
          type: /\.tsx?$/.test(entry.name)
            ? "registry:component"
            : "registry:file",
          target: `components/blocks/${block}/${inBlock}`,
        })
      }
    }
    await walk(path.join(blocksDir, block))
    if (!files.some((file) => file.target?.endsWith(`/${block}/page.tsx`)))
      problems.push(`src/blocks/${block}/ has no page.tsx`)
    const meta = byName.get(block)
    items.push({
      name: block,
      type: "registry:block",
      title: meta?.title ?? block,
      description:
        `${meta?.description ?? ""} Requires the ${TECTON_PACKAGE} package.`.trim(),
      categories: meta === undefined ? undefined : [meta.category],
      dependencies: [...deps].sort(),
      registryDependencies: [...registryDeps].sort(),
      files,
    })
  }

  if (problems.length) {
    throw new Error(
      `registry:build found ${problems.length} problem(s):\n  ` +
        problems.join("\n  ")
    )
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

  // Build ---------------------------------------------------------------------
  // Everything above only reads and stages. The CLI writes into a temporary
  // folder next to the output, which replaces the output only once the build
  // has succeeded, so a failure leaves the published registry as it was.
  const registry = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "tecton",
    homepage: "https://github.com/rpkapps/tecton-ui-1",
    items,
  }
  const registryFile = path.join(PKG, "registry.json")
  const pendingRegistry = path.join(PKG, `registry.${process.pid}.tmp.json`)
  const pendingOutput = `${OUTPUT}.${process.pid}.tmp`
  await fs.writeFile(pendingRegistry, JSON.stringify(registry, null, 2) + "\n")
  try {
    await fs.rm(pendingOutput, { recursive: true, force: true })
    const cli =
      process.env.SHADCN_CLI ?? path.join(PKG, "node_modules/.bin/shadcn")
    const result = spawnSync(
      cli,
      ["build", path.basename(pendingRegistry), "--output", pendingOutput],
      {
        cwd: PKG,
        stdio: "inherit",
        env: {
          ...process.env,
          npm_config_user_agent: "pnpm/10.33.0 npm/? node/v22 linux x64",
        },
      }
    )
    if (result.status !== 0) {
      throw new Error(`shadcn build failed (exit ${result.status})`)
    }
    await fs.rm(OUTPUT, { recursive: true, force: true })
    await fs.rename(pendingOutput, OUTPUT)
    await fs.rename(pendingRegistry, registryFile)
  } finally {
    await fs.rm(pendingOutput, { recursive: true, force: true })
    await fs.rm(pendingRegistry, { force: true })
  }
  console.log(`[registry:build] registry.json — ${items.length} items`)
  console.log(`[registry:build] wrote ${OUTPUT}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
