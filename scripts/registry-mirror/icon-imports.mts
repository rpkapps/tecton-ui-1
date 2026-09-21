/**
 * icon-imports — points the generated components at the Tecton icon compat module.
 *
 *   bun run scripts/icon-imports.mts          (from the mirror's apps/v4;
 *                                              copied there by registry-mirror.sh build)
 *
 * Upstream's aria base sources do not import an icon library at all: they render
 * `<IconPlaceholder lucide="CheckIcon" tabler="IconCheck" … />` and the *CLI*
 * turns that into `import { CheckIcon } from "lucide-react"` while it writes the
 * file, from the hard-coded `iconLibraries` table and `components.json`'s
 * `iconLibrary`. There is no registry-side knob for the module name, and no
 * import line to sed in `apps/v4/registry/bases/aria/ui/*.tsx`.
 *
 * So the rewrite happens one step later, on the built registry of the one style
 * this mirror serves: every `registry:ui` file that still holds an
 * `IconPlaceholder` gets the CLI's own `transformIcons` applied here (same
 * transform, same ts-morph settings as `applyIconTransform` in
 * build-registry.mts), and then the module specifier of the import it just added
 * is replaced with `@tecton/react/icons/lucide-compat`. The CLI's own pass finds
 * no placeholder left and writes the file through unchanged, so the installed
 * component is byte for byte what it used to be apart from that one specifier.
 *
 * Doing it here rather than in `overlay()` keeps `tecton.patch` free of twenty
 * icon-import hunks (an upstream bump never conflicts on them) and keeps
 * `registry-mirror.sh export` honest: eight of the twenty files are also in
 * OVERLAY_FILES, so a rewrite of the clone's working tree would be exported back
 * into the patch for those eight and not for the other twelve.
 *
 * Only `registry:ui` files are rewritten — the examples and blocks in the same
 * registry are not installed into this repository and keep their placeholders.
 */
import { promises as fs } from "fs"
import path from "path"
import { transformIcons } from "shadcn/utils"
import { Project, ScriptKind } from "ts-morph"

/** The module the generated components import their glyphs from. */
const COMPAT_MODULE = "@tecton/react/icons/lucide-compat"
/** The icon library the placeholders are resolved through before the rename. */
const ICON_LIBRARY = "lucide"
const ICON_MODULE = "lucide-react"
/** Fail loudly if the registry stops looking the way this script expects. */
const EXPECTED_FILES = Number(process.env.TECTON_ICON_FILES ?? 20)

const style = process.env.SHADCN_STYLE ?? "aria-tecton"
const styleDir = path.join(process.cwd(), "public/r/styles", style)

const project = new Project({ compilerOptions: {} })

type TransformIconsConfig = Parameters<typeof transformIcons>[0]["config"]
const config = { iconLibrary: ICON_LIBRARY } as TransformIconsConfig

async function resolvePlaceholders(filename: string, content: string) {
  const sourceFile = project.createSourceFile(filename, content, {
    scriptKind: ScriptKind.TSX,
    overwrite: true,
  })
  await (
    transformIcons as (opts: {
      filename: string
      raw: string
      sourceFile: typeof sourceFile
      config: TransformIconsConfig
    }) => Promise<unknown>
  )({ filename, raw: content, sourceFile, config })
  return sourceFile.getText()
}

const entries = (await fs.readdir(styleDir)).filter((name) => name.endsWith(".json"))
const rewritten: string[] = []
let imports = 0

for (const name of entries.sort()) {
  const itemPath = path.join(styleDir, name)
  const item = JSON.parse(await fs.readFile(itemPath, "utf8"))
  if (!Array.isArray(item.files)) continue

  let changed = false
  for (const file of item.files) {
    if (file.type !== "registry:ui") continue
    if (typeof file.content !== "string" || !file.content.includes("IconPlaceholder")) continue

    const resolved = await resolvePlaceholders(path.basename(file.path), file.content)
    const before = resolved.split(`from "${ICON_MODULE}"`).length - 1
    if (before !== 1) {
      throw new Error(
        `${name}: expected exactly one "${ICON_MODULE}" import after resolving the placeholders, found ${before}`
      )
    }
    file.content = resolved.replaceAll(`from "${ICON_MODULE}"`, `from "${COMPAT_MODULE}"`)
    imports += before
    changed = true
  }

  if (!changed) continue
  rewritten.push(name.replace(/\.json$/, ""))
  // Same shape the build writes (prettier, two spaces, no trailing newline), so
  // the next build's writeIfChanged only reacts to real content changes.
  await fs.writeFile(itemPath, JSON.stringify(item, null, 2))
}

if (rewritten.length !== EXPECTED_FILES) {
  throw new Error(
    `expected ${EXPECTED_FILES} registry:ui item(s) with icon placeholders in ${style}, rewrote ${rewritten.length}` +
      (rewritten.length ? `: ${rewritten.join(", ")}` : "")
  )
}

console.log(
  `   🔤 ${COMPAT_MODULE}: ${imports} import(s) in ${rewritten.length} item(s) — ${rewritten.join(", ")}`
)
