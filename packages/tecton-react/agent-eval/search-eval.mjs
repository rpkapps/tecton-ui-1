#!/usr/bin/env node
/**
 * Retrieval accuracy of `tecton search` on a labelled query set.
 *
 *   node agent-eval/search-eval.mjs [queries.json] [--misses]
 *
 * Each query has 1–3 accepted ids; a hit@k means any accepted id is in the top k.
 * Runs the shipped ranking next to three ablations so each part earns its keep:
 *   names only     — match the query against ids and export names (a grep)
 *   − routed needs — drop the notFor needs indexed under the component they point at
 *   − synonyms     — drop the query vocabulary from guidelines/synonyms.json
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { loadIndex, resolveId, search } from "../bin/tecton.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const file =
  args.find((arg) => !arg.startsWith("--")) ??
  path.join(here, "queries.heldout.json")
const showMisses = args.includes("--misses")
const queries = JSON.parse(readFileSync(file, "utf8"))
const index = loadIndex()

const accepted = (answers) =>
  answers
    .map((answer) => resolveId(index, answer.replace(/^topic:/, "")))
    .filter(Boolean)

const FULL = { names: 3, routed: 2, useWhen: 1.5, do: 0.6 }
const methods = {
  "names only": {
    weights: { names: 1, routed: 0, useWhen: 0, do: 0 },
    synonyms: false,
  },
  "− routed needs": { weights: { ...FULL, routed: 0 }, synonyms: true },
  "− synonyms": { weights: FULL, synonyms: false },
  "tecton search": { weights: FULL, synonyms: true },
}

function evaluate(options) {
  const rows = queries.map((query) => {
    const ids = accepted(query.answers)
    const ranked = search(index, query.q, { limit: 10, ...options }).map(
      ({ entry }) => entry.id
    )
    const rank = ranked.findIndex((id) => ids.includes(id)) + 1
    return { ...query, ids, ranked, rank }
  })
  const summarize = (subset) => ({
    n: subset.length,
    hit1: subset.filter((row) => row.rank === 1).length / subset.length,
    hit3:
      subset.filter((row) => row.rank >= 1 && row.rank <= 3).length /
      subset.length,
    hit5:
      subset.filter((row) => row.rank >= 1 && row.rank <= 5).length /
      subset.length,
    mrr:
      subset.reduce((sum, row) => sum + (row.rank ? 1 / row.rank : 0), 0) /
      subset.length,
  })
  const kinds = [...new Set(queries.map((query) => query.kind))]
  return {
    rows,
    all: summarize(rows),
    byKind: Object.fromEntries(
      kinds.map((kind) => [
        kind,
        summarize(rows.filter((row) => row.kind === kind)),
      ])
    ),
  }
}

const pct = (value) => `${(value * 100).toFixed(0)}%`.padStart(5)
console.log(`${queries.length} queries from ${path.basename(file)}\n`)
console.log("method           hit@1 hit@3 hit@5   MRR")
const results = {}
for (const [name, options] of Object.entries(methods)) {
  const result = evaluate(options)
  results[name] = result
  const { all } = result
  console.log(
    `${name.padEnd(16)} ${pct(all.hit1)} ${pct(all.hit3)} ${pct(all.hit5)}  ${all.mrr.toFixed(2)}`
  )
}

const main = results["tecton search"]
console.log("\ntecton search by kind   n hit@1 hit@3 hit@5")
for (const [kind, summary] of Object.entries(main.byKind)) {
  console.log(
    `${kind.padEnd(20)} ${String(summary.n).padStart(4)} ${pct(summary.hit1)} ${pct(summary.hit3)} ${pct(summary.hit5)}`
  )
}

if (showMisses) {
  console.log("\nnot in the top 3:")
  for (const row of main.rows.filter((row) => !row.rank || row.rank > 3)) {
    console.log(
      `  [${row.kind}] "${row.q}" → want ${row.ids.join("|")}; got ${row.ranked.slice(0, 3).join(", ")}${row.rank ? ` (rank ${row.rank})` : " (not in top 10)"}`
    )
  }
}
