/**
 * Lints every `Correct:` example in the component usage guidelines
 * (packages/tecton-react/guidelines/*.md) with the shipped `recommended`
 * preset, so the guidelines, the docs rendered from them and the linter
 * cannot drift apart — a contract this package stops shipping shows up here
 * as a guideline example that no longer lints clean.
 *
 * A guideline's frontmatter says where its own exports come from (`module`),
 * but an example is free to reach into any other component the same way an
 * application does — a Slider example wraps itself in a Field, an
 * AppShellMain example renders a Canvas — so the export-name -> module map
 * is built once from every guideline's frontmatter before any body is read.
 *
 * Nothing is written to disk: each snippet is linted through
 * `eslint.lintText` with a synthetic `filePath` inside test/, so the
 * theme-aware rules resolve `test/components.json` the way a consumer app
 * resolves its own.
 *
 * Usage: node scripts/guidelines.mjs
 */
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { ESLint } from "eslint"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TEST = path.resolve(HERE, "../test")
const GUIDELINES = path.resolve(HERE, "../../tecton-react/guidelines")

/** The fenced `tsx` block that follows a bare `Wrong:` or `Correct:` line. */
const BLOCK_RE = /(Wrong|Correct):\n\n```tsx\n([\s\S]*?)```/g
/** Every JSX element name — closing tags never match, there is no letter after `</`. */
const ELEMENT_RE = /<([A-Z]\w*)/g

/** `module: "@tecton/react/components/badge"` / `exports: [Badge, badgeVariants]` -> both, or null. */
function readFrontmatter(raw) {
  const fence = /^---\n([\s\S]*?)\n---/.exec(raw)
  if (!fence) return null
  const yaml = fence[1]
  const moduleMatch = /^module:\s*"?([^"\n]+?)"?\s*$/m.exec(yaml)
  const exportsMatch = /^exports:\s*\[([^\]]*)\]/m.exec(yaml)
  if (!moduleMatch || !exportsMatch) return null
  return {
    module: moduleMatch[1],
    exports: exportsMatch[1]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  }
}

const files = readdirSync(GUIDELINES)
  .filter((entry) => entry.endsWith(".md") && entry !== "README.md")
  .sort()

const raw = new Map(
  files.map((file) => [
    file,
    readFileSync(path.join(GUIDELINES, file), "utf8").replace(/\r\n/g, "\n"),
  ])
)

/** export name -> module path, across every guideline — not just the one being read. */
const importFrom = new Map()
for (const file of files) {
  const frontmatter = readFrontmatter(raw.get(file))
  if (!frontmatter) continue
  for (const name of frontmatter.exports) {
    if (!importFrom.has(name)) importFrom.set(name, frontmatter.module)
  }
}

/**
 * Turns one `Correct:` snippet into a lintable module: an element block
 * becomes a component that returns it inside a fragment, so `no-restyle`
 * sees real JSX call sites; anything else — a `const chartConfig = ...`, a
 * bare statement — is left at module level exactly as written. Imports are
 * synthesised only for the names the frontmatter map actually resolves;
 * everything else (Recharts' `BarChart`, a Lucide icon, a made-up domain
 * icon) is left undeclared, which is not this rule's concern.
 */
function synthesize(code) {
  const names = new Set([...code.matchAll(ELEMENT_RE)].map((match) => match[1]))
  const byModule = new Map()
  for (const name of names) {
    const module = importFrom.get(name)
    if (!module) continue
    if (!byModule.has(module)) byModule.set(module, new Set())
    byModule.get(module).add(name)
  }
  const importLines = [...byModule.entries()]
    .map(
      ([module, names_]) =>
        `import { ${[...names_].sort().join(", ")} } from "${module}"`
    )
    .join("\n")

  const trimmed = code.trim()
  const body = trimmed.startsWith("<")
    ? `export function Example() {\n  return (\n    <>\n${trimmed}\n    </>\n  )\n}\n`
    : `${trimmed}\n`
  return importLines ? `${importLines}\n\n${body}` : body
}

const eslint = new ESLint({ cwd: TEST })
const failures = []
let checked = 0
let parseFailures = 0

for (const file of files) {
  const text = raw.get(file)
  const name = path.basename(file, ".md")
  let match
  let n = 0
  BLOCK_RE.lastIndex = 0
  while ((match = BLOCK_RE.exec(text))) {
    if (match[1] !== "Correct") continue
    n += 1
    checked += 1
    const code = synthesize(match[2])
    const filePath = path.join(TEST, `guideline-${name}-${n}.tsx`)
    const [result] = await eslint.lintText(code, { filePath })
    for (const message of result.messages) {
      if (message.fatal) {
        parseFailures += 1
        failures.push(`${file}#${n}  parse-error  ${message.message}`)
      } else {
        failures.push(
          `${file}#${n}  ${message.ruleId ?? "?"}  ${message.message}`
        )
      }
    }
  }
}

if (failures.length) {
  const parseNote = parseFailures
    ? ` (${parseFailures} of them parse failures)`
    : ""
  console.error(`[guidelines] ${failures.length} message(s)${parseNote}:`)
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}
console.log(
  `[guidelines] ${checked} Correct examples across ${files.length} guidelines lint clean under recommended.`
)
