/**
 * icon-imports — resolves the registry's icon placeholders to Tecton icons.
 *
 *   bun run scripts/icon-imports.mts          (from the mirror's apps/v4;
 *                                              copied there by registry-mirror.sh build)
 *
 * Upstream's aria base sources do not import an icon library at all: they render
 * `<IconPlaceholder lucide="CheckIcon" tabler="IconCheck" … />`, one identifier
 * per icon library it supports, and the *CLI* turns the placeholder into a
 * component plus an import while it writes the file — from its hard-coded
 * `iconLibraries` table and `components.json`'s `iconLibrary`. There is no
 * registry-side knob for which icon set is used, and no import line to patch in
 * `apps/v4/registry/bases/aria/ui/*.tsx`.
 *
 * Tecton ships its own icon set and no compatibility layer for anyone else's,
 * so this script resolves the placeholders itself, one step after the registry
 * build and before the CLI ever sees them: every `<IconPlaceholder>` in a
 * `registry:ui` file becomes the Tecton component that carries the same meaning
 * (`scripts/upstream-icons.mts` is the translation table, shared with
 * `pnpm docs:sync`), keeping the placeholder's own props, and the file gets one
 * `import { … } from "@tecton/react/icons"`. The edit is a ts-morph rewrite of
 * the JSX tag and the import, not a text substitution.
 *
 * The CLI's own icon transform then finds no placeholder left and writes the
 * file through unchanged, so `components.json` does not need an `iconLibrary`
 * key at all.
 *
 * Doing it here rather than in `overlay()` keeps `tecton.patch` free of icon
 * hunks (an upstream bump never conflicts on them) and keeps
 * `registry-mirror.sh export` honest: eight of the twenty affected files are
 * also in OVERLAY_FILES, so a rewrite of the clone's working tree would be
 * exported back into the patch for those eight and not for the other twelve.
 *
 * Only `registry:ui` files are rewritten — the examples and blocks in the same
 * registry are not installed into this repository and keep their placeholders.
 *
 * It fails loudly rather than dropping a glyph: on an identifier
 * `scripts/upstream-icons.mts` does not know, on a placeholder it cannot
 * resolve, and when the number of rewritten items is not the expected 20.
 */
import { promises as fs } from "fs"
import path from "path"
import { Project, ScriptKind, SyntaxKind } from "ts-morph"
import { tectonIconImportFor, verifyAgainstManifest } from "./upstream-icons.mjs"

/** The module the generated components import their glyphs from. */
const ICON_MODULE = "@tecton/react/icons"
/** The placeholder element, and the prop naming the identifier we translate. */
const PLACEHOLDER = "IconPlaceholder"
const UPSTREAM_LIBRARY = "lucide"
/** Every per-library prop the placeholder carries; all of them are dropped. */
const LIBRARY_PROPS = new Set([
  "lucide",
  "tabler",
  "hugeicons",
  "phosphor",
  "remixicon",
])
/** Fail loudly if the registry stops looking the way this script expects. */
const EXPECTED_FILES = Number(process.env.TECTON_ICON_FILES ?? 20)

const style = process.env.SHADCN_STYLE ?? "aria-tecton"
const styleDir = path.join(process.cwd(), "public/r/styles", style)
/** Set by scripts/registry-mirror.sh so the table can be checked against the manifest. */
const tectonRoot = process.env.TECTON_ROOT

if (tectonRoot) {
  const manifest = JSON.parse(
    await fs.readFile(path.join(tectonRoot, "packages/tecton-react/icons/icons.json"), "utf8")
  )
  verifyAgainstManifest(manifest, "icon-imports")
} else {
  console.warn("   ⚠ TECTON_ROOT is not set — skipping the icons.json cross-check")
}

const project = new Project({ compilerOptions: {} })

/** True when the file's imports end in a semicolon (the aria sources do not). */
function useSemicolon(sourceFile: ReturnType<Project["createSourceFile"]>) {
  return sourceFile.getImportDeclarations()[0]?.getText().endsWith(";") ?? false
}

/**
 * Replace every `<IconPlaceholder>` with its Tecton component and import them.
 * Returns the rewritten source and how many components it now imports.
 */
function resolvePlaceholders(filename: string, content: string) {
  const sourceFile = project.createSourceFile(filename, content, {
    scriptKind: ScriptKind.TSX,
    overwrite: true,
  })

  const used = new Set<string>()
  for (const element of sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)) {
    const tagName = element.getTagNameNode()
    if (tagName?.getText() !== PLACEHOLDER) continue

    const attributes = element.getAttributes().flatMap((attribute) => {
      const jsxAttribute = attribute.asKind(SyntaxKind.JsxAttribute)
      return jsxAttribute ? [jsxAttribute] : []
    })
    const upstreamAttribute = attributes.find(
      (attribute) => attribute.getNameNode().getText() === UPSTREAM_LIBRARY
    )
    const identifier = upstreamAttribute
      ?.getInitializer()
      ?.getText()
      .replace(/^["']|["']$/g, "")
    if (!identifier) {
      throw new Error(
        `${filename}: a <${PLACEHOLDER}> has no "${UPSTREAM_LIBRARY}" identifier to translate ` +
          `(${element.getText().replace(/\s+/g, " ").slice(0, 120)})`
      )
    }

    const tectonIcon = tectonIconImportFor(
      identifier,
      `${filename}: <${PLACEHOLDER} ${UPSTREAM_LIBRARY}="${identifier}">`
    )
    used.add(tectonIcon)

    // Drop every per-library prop, keep the placeholder's own (className, slot…).
    for (const attribute of attributes) {
      if (LIBRARY_PROPS.has(attribute.getNameNode().getText())) attribute.remove()
    }
    tagName.replaceWithText(tectonIcon)
  }

  if (!used.size) return { code: sourceFile.getText(), icons: [] as string[] }

  // The placeholder import goes; the Tecton one takes its place.
  for (const importDeclaration of sourceFile.getImportDeclarations()) {
    if (!importDeclaration.getModuleSpecifier().getLiteralText().includes("icon-placeholder")) {
      continue
    }
    const placeholder = importDeclaration
      .getNamedImports()
      .find((named) => named.getName() === PLACEHOLDER)
    placeholder?.remove()
    if (!importDeclaration.getNamedImports().length && !importDeclaration.getDefaultImport()) {
      importDeclaration.remove()
    }
  }
  const semicolon = useSemicolon(sourceFile)
  const added = sourceFile.addImportDeclaration({
    moduleSpecifier: ICON_MODULE,
    namedImports: [...used].sort().map((name) => ({ name })),
  })
  if (!semicolon) added.replaceWithText(added.getText().replace(";", ""))

  const code = sourceFile.getText()
  if (code.includes(PLACEHOLDER)) {
    throw new Error(`${filename}: a <${PLACEHOLDER}> survived the rewrite`)
  }
  return { code, icons: [...used].sort() }
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
    if (typeof file.content !== "string" || !file.content.includes(PLACEHOLDER)) continue

    const { code, icons } = resolvePlaceholders(path.basename(file.path), file.content)
    if (!icons.length) {
      throw new Error(`${name}: ${file.path} holds a <${PLACEHOLDER}> that resolved to nothing`)
    }
    file.content = code
    imports += icons.length
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
  `   🔤 ${ICON_MODULE}: ${imports} icon(s) in ${rewritten.length} item(s) — ${rewritten.join(", ")}`
)
