/**
 * consumer-check — proves an application needs nothing but `@tecton/react`
 * (and its peers) to import and type-check every public module.
 *
 *   bun run scripts/consumer-check.mts       (pnpm consumer:check, after `pnpm build`)
 *
 * Steps
 *   1. `npm pack` the package (no lifecycle scripts: `dist/` must already be built).
 *   2. In a temporary directory outside the workspace, create an application whose
 *      only dependencies are the tarball, the peers (`react`, `react-dom`,
 *      `tailwindcss`) and `typescript` + the React types, and install it with
 *      pnpm's isolated (strict) layout, so the application can only reach what it
 *      declares.
 *   3. Write a module that imports every JS subpath of the `exports` map and every
 *      `<Name>Props` alias the build appended, then `tsc --noEmit` it with
 *      `skipLibCheck: false`: a declaration that needs a package the application
 *      does not declare, or an alias that does not resolve, fails the check.
 */
/// <reference types="node" />
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const manifest = JSON.parse(readFileSync(path.join(pkgRoot, "package.json"), "utf8")) as {
  name: string
  exports: Record<string, string | Record<string, string>>
  devDependencies: Record<string, string>
}

function run(command: string, args: Array<string>, cwd: string) {
  // `shell` so `npm`/`pnpm` resolve to their `.cmd` shims on Windows.
  execFileSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" })
}

/** `./dist/components/dialog.d.ts` → `@tecton/react/dialog`, for every JS subpath. */
function typedSubpaths() {
  const byTypes = new Map<string, string>()
  for (const [subpath, entry] of Object.entries(manifest.exports)) {
    if (typeof entry !== "object" || !entry.types?.startsWith("./dist/")) continue
    byTypes.set(path.normalize(path.join(pkgRoot, entry.types)), `${manifest.name}${subpath.slice(1)}`)
  }
  return byTypes
}

function consumerSource() {
  const lines: Array<string> = []
  let aliases = 0
  ;[...typedSubpaths()].forEach(([dts, specifier], index) => {
    lines.push(`import * as m${index} from "${specifier}"`)
    lines.push(`void m${index}`)
    const names = [...readFileSync(dts, "utf8").matchAll(/^export type (\w+Props) = import\("react"\)/gm)].map(
      (match) => match[1]
    )
    if (names.length) lines.push(`import type { ${names.join(", ")} } from "${specifier}"`)
    for (const name of names) lines.push(`export type Check${index}_${name} = ${name}`)
    aliases += names.length
  })
  if (!aliases) throw new Error("No <Name>Props aliases found in dist/ — run `pnpm build` first.")
  return { source: `${lines.join("\n")}\n`, modules: typedSubpaths().size, aliases }
}

function main() {
  const work = mkdtempSync(path.join(os.tmpdir(), "tecton-consumer-"))
  try {
    run("npm", ["pack", "--ignore-scripts", "--silent", "--pack-destination", work], pkgRoot)
    const tarball = readdirSync(work).find((name) => name.endsWith(".tgz"))
    if (!tarball) throw new Error("npm pack produced no tarball")

    const app = path.join(work, "app")
    const dev = manifest.devDependencies
    mkdirSync(app)
    writeFileSync(
      path.join(app, "package.json"),
      JSON.stringify(
        {
          name: "tecton-consumer-check",
          private: true,
          type: "module",
          dependencies: {
            [manifest.name]: `file:../${tarball}`,
            react: dev.react,
            "react-dom": dev["react-dom"],
            tailwindcss: dev.tailwindcss,
          },
          devDependencies: {
            "@types/react": dev["@types/react"],
            "@types/react-dom": dev["@types/react-dom"],
            typescript: dev.typescript,
          },
        },
        null,
        2
      )
    )
    writeFileSync(path.join(app, ".npmrc"), "node-linker=isolated\nauto-install-peers=false\n")
    writeFileSync(
      path.join(app, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "es2022",
            // `esnext.disposable`: the code highlighter's types (`shiki/core`) use `Symbol.dispose`.
            lib: ["es2022", "dom", "dom.iterable", "esnext.disposable"],
            module: "esnext",
            moduleResolution: "bundler",
            jsx: "react-jsx",
            strict: true,
            noEmit: true,
            skipLibCheck: false,
            types: [],
          },
          include: ["index.tsx"],
        },
        null,
        2
      )
    )
    const { source, modules, aliases } = consumerSource()
    writeFileSync(path.join(app, "index.tsx"), source)

    run("pnpm", ["install", "--ignore-workspace", "--silent"], app)
    run("pnpm", ["exec", "tsc", "-p", "."], app)
    console.log(`consumer-check: ${modules} modules and ${aliases} props aliases type-check with only ${manifest.name} installed`)
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

main()
