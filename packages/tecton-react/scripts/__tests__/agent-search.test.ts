import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

// @ts-expect-error — plain-Node CLI without type declarations
import { loadIndex, resolveId, run, search, stem } from "../../bin/tecton.mjs"

const pkgRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
)
const index = loadIndex()

type Query = { q: string; answers: string[]; kind: string }

function hitAt3(file: string) {
  const queries = JSON.parse(
    readFileSync(path.join(pkgRoot, "agent-eval", file), "utf8")
  ) as Query[]
  const hits = queries.filter((query) => {
    const ids = query.answers.map((answer) =>
      resolveId(index, answer.replace(/^topic:/, ""))
    )
    const top = search(index, query.q, { limit: 3 }).map(
      (result: { entry: { id: string } }) => result.entry.id
    )
    return top.some((id: string) => ids.includes(id))
  })
  return hits.length / queries.length
}

describe("tecton search", () => {
  // Written by agents that saw only the component names, never the guidelines.
  // Raise the floors when the ranking improves; a drop means a regression.
  it("finds the right component in the top 3 for the held-out queries", () => {
    expect(hitAt3("queries.heldout.json")).toBeGreaterThanOrEqual(0.9)
    expect(hitAt3("queries.heldout-2.json")).toBeGreaterThanOrEqual(0.84)
  })

  it("routes a notFor need to the component it points at", () => {
    // badge.md: "a transient confirmation → toast"; toast is documented by sonner.md
    const [first] = search(index, "transient confirmation")
    expect(first.entry.id).toBe("sonner")
  })

  it("expands the query vocabulary", () => {
    const top = search(index, "modal", { limit: 1 })[0]
    expect(top.entry.id).toBe("dialog")
  })

  it("stems both sides", () => {
    expect(stem("resizable")).toBe(stem("resize"))
    expect(stem("wells")).toBe(stem("well"))
  })
})

describe("tecton docs", () => {
  it("accepts an id, a component or any export", () => {
    expect(resolveId(index, "alert-dialog")).toBe("alert-dialog")
    expect(resolveId(index, "AlertDialogAction")).toBe("alert-dialog")
    expect(resolveId(index, "toast")).toBe("sonner")
  })

  it("prints several guidelines and suggests on a miss", () => {
    const ok = run(["docs", "select,combobox"], index)
    expect(ok.code).toBe(0)
    expect(ok.out).toContain("# Select — @tecton/react/components/select")
    expect(ok.out).toContain("# Combobox")
    const miss = run(["docs", "dropdwn"], index)
    expect(miss.code).toBe(1)
    expect(miss.out).toMatch(/No entry "dropdwn"/)
  })

  it("serves the rules topic", () => {
    expect(run(["rules"], index).out).toContain("Before you finish")
  })
})
