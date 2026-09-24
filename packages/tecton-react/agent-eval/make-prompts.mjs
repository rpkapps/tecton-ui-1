#!/usr/bin/env node
/**
 * Writes one prompt per (condition, task) for the end-to-end eval.
 *
 *   node agent-eval/make-prompts.mjs <out-dir> <bin-dir>
 *
 * <bin-dir> holds the `intent` and `tecton` commands the agents may run;
 * <out-dir>/prompts/<condition>-<task>.md are the prompts and
 * <out-dir>/runs/<condition>/<file> is where each agent writes its answer.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const [outDir, binDir] = process.argv.slice(2).map((arg) => path.resolve(arg))
const read = (file) => readFileSync(path.join(here, file), "utf8").trim()
const { tasks } = JSON.parse(read("tasks.json"))
const skill = readFileSync(
  path.join(here, "..", "skills", "tecton", "SKILL.md"),
  "utf8"
)
  .replace(/^---\n[\s\S]*?\n---\n/, "")
  .trim()
const fill = (text, values) =>
  text.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "")

mkdirSync(path.join(outDir, "prompts"), { recursive: true })
for (const condition of ["none", "intent", "cli"]) {
  mkdirSync(path.join(outDir, "runs", condition), { recursive: true })
  const source = fill(read(`conditions/${condition}.md`), {
    bin: binDir,
    skill,
  })
  for (const task of tasks) {
    const prompt = fill(read("conditions/common.md"), {
      task: task.prompt,
      out: path.join(outDir, "runs", condition, task.file),
      source,
    })
    writeFileSync(
      path.join(outDir, "prompts", `${condition}-${task.id}.md`),
      `${prompt}\n`
    )
  }
}
console.log(
  `wrote ${tasks.length * 3} prompts to ${path.join(outDir, "prompts")}`
)
