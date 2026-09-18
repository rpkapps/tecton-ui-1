/**
 * Asserts the shipped preset reports exactly what the fixtures declare.
 *
 * Every fixture line that should be reported carries `// expect: <rules>`;
 * every other line must come back clean. Both directions matter: a guardrail
 * that fires on `w-full` would be turned off by the first team that hits it.
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

/** `// expect: a, b` -> Map<lineNumber, Set<rule>> */
function expectations(file) {
  const found = new Map()
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, index) => {
      // Rule ids contain "/", so the charset must allow it — and must be tight
      // enough that the prose "expect:" in this file's own docblock never matches.
      const match = /expect:\s*([\w@/-]+(?:\s*,\s*[\w@/-]+)*)/.exec(line)
      if (!match) return
      found.set(
        index + 1,
        new Set(
          match[1]
            .split(",")
            .map((rule) => rule.trim())
            .filter(Boolean)
        )
      )
    })
  return found
}

const eslint = new ESLint({ cwd: TEST })
const results = await eslint.lintFiles([path.join(TEST, "*.tsx")])

const failures = []
for (const result of results) {
  const expected = expectations(result.filePath)
  const actual = new Map()
  for (const message of result.messages) {
    if (!actual.has(message.line)) actual.set(message.line, new Set())
    actual.get(message.line).add(message.ruleId)
  }
  const name = path.basename(result.filePath)

  for (const [line, rules] of expected) {
    const got = actual.get(line) ?? new Set()
    for (const rule of rules) {
      if (!got.has(rule)) failures.push(`${name}:${line} expected ${rule}, got ${[...got].join(", ") || "nothing"}`)
    }
  }
  for (const [line, rules] of actual) {
    if (expected.has(line)) continue
    failures.push(`${name}:${line} unexpected ${[...rules].join(", ")}`)
  }
}

const checked = [...results].reduce((total, r) => total + expectations(r.filePath).size, 0)
if (failures.length) {
  console.error(`[smoke] ${failures.length} mismatch(es):`)
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}
console.log(`[smoke] ${checked} guarded lines behave as declared across ${results.length} fixtures.`)
