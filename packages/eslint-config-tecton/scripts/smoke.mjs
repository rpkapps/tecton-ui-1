/**
 * Asserts the shipped presets report exactly what the fixtures declare.
 *
 * Every fixture line that should be reported carries an expectation comment
 * naming the rules; every other line must come back clean. Both directions
 * matter: a guardrail that fires on `w-full` would be turned off by the first
 * team that hits it, and so would one that fires on the application's own
 * `<div>`.
 *
 * The presets nest — `recommended` ⊂ `strict` ⊂ `project` — so an expectation
 * names the *narrowest* preset that must report it, and every wider preset
 * must report it too:
 *
 *     // expect: shadcn/no-restyle            every preset
 *     // expect strict: shadcn/no-raw-colors  strict and project
 *     // expect project: shadcn/no-raw-colors project only
 *
 * That is what pins the scope guarantee down: a line marked for `project`
 * failing to come back clean under `recommended` or `strict` is a failure.
 *
 * Runs from test/ so the theme-aware rules resolve the Tecton stylesheet
 * through test/components.json, the way a consumer app resolves its own.
 *
 * Usage: node scripts/smoke.mjs
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { ESLint } from "eslint"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TEST = path.resolve(HERE, "../test")

/** Narrowest preset first; each one also carries everything before it. */
const PRESETS = [
  { name: "recommended", config: "eslint.config.js" },
  { name: "strict", config: "eslint.strict.config.js" },
  { name: "project", config: "eslint.project.config.js" },
]

/**
 * `// expect: a, b` / `// expect strict: a` -> Map<lineNumber, Set<rule>>,
 * keeping only the expectations that apply at or below `depth`.
 */
function expectations(file, depth) {
  const found = new Map()
  const lines = readFileSync(file, "utf8").split("\n")

  // An expectation belongs to the code it annotates. Trailing it is the usual
  // form, but Prettier moves a comment that overflows onto its own line, so a
  // line that is nothing but expectations carries down to the next line of
  // code — which keeps the fixtures formattable.
  const target = (index) => {
    if (!/^\s*\{?\/\*/.test(lines[index])) return index + 1
    for (let i = index + 1; i < lines.length; i++) {
      if (lines[i].trim() && !/^\s*\{?\/[/*]/.test(lines[i])) return i + 1
    }
    return index + 1
  }

  lines.forEach((line, index) => {
    // Rule ids contain "/", so the charset must allow it — and must be tight
    // enough that the prose in this file's own docblock never matches.
    const matches = line.matchAll(
      /expect(?:\s+(recommended|strict|project))?:\s*([\w@/-]+(?:\s*,\s*[\w@/-]+)*)/g
    )
    for (const match of matches) {
      const from = PRESETS.findIndex(
        (p) => p.name === (match[1] ?? "recommended")
      )
      // A wider preset inherits the narrower ones' findings; a narrower one
      // must stay clean of the wider ones'.
      if (from > depth) continue
      const rules = match[2]
        .split(",")
        .map((rule) => rule.trim())
        .filter(Boolean)
      const at = target(index)
      const declared = found.get(at) ?? new Set()
      for (const rule of rules) declared.add(rule)
      found.set(at, declared)
    }
  })
  return found
}

const failures = []
let checked = 0
let fixtures = 0

for (const [depth, preset] of PRESETS.entries()) {
  const eslint = new ESLint({
    cwd: TEST,
    overrideConfigFile: path.join(TEST, preset.config),
  })
  const results = await eslint.lintFiles([path.join(TEST, "*.tsx")])
  fixtures = results.length

  for (const result of results) {
    const expected = expectations(result.filePath, depth)
    const actual = new Map()
    for (const message of result.messages) {
      if (!actual.has(message.line)) actual.set(message.line, new Set())
      actual.get(message.line).add(message.ruleId)
    }
    const where = `${preset.name}/${path.basename(result.filePath)}`

    for (const [line, rules] of expected) {
      checked += rules.size
      const got = actual.get(line) ?? new Set()
      for (const rule of rules) {
        if (!got.has(rule))
          failures.push(
            `${where}:${line} expected ${rule}, got ${[...got].join(", ") || "nothing"}`
          )
      }
    }
    // Every reported rule must be declared, on a declared line as much as on a
    // clean one: a rule that widens its reach is as much a regression as one
    // that stops firing.
    for (const [line, rules] of actual) {
      const declared = expected.get(line) ?? new Set()
      for (const rule of rules) {
        if (!declared.has(rule))
          failures.push(`${where}:${line} unexpected ${rule}`)
      }
    }
  }
}

if (failures.length) {
  console.error(`[smoke] ${failures.length} mismatch(es):`)
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}
console.log(
  `[smoke] ${checked} guarded lines behave as declared across ${fixtures} fixtures × ${PRESETS.length} presets.`
)
