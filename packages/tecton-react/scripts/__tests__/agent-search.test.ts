import { execFileSync, spawnSync } from "node:child_process"
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll, describe, expect, it } from "vitest"

import {
  compileSynonyms,
  loadIndex,
  resolveId,
  run,
  search,
  stem,
  tokenize,
} from "../../bin/tecton-lib.mjs"

const pkgRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
)
const bin = path.join(pkgRoot, "bin", "tecton.mjs")
const index = loadIndex()

type Query = { q: string; answers: Array<string>; kind: string }
type EvalSet = { file: string; use: "floor" | "report" }

function hitAt3(file: string) {
  const queries = JSON.parse(
    readFileSync(path.join(pkgRoot, "agent-eval", file), "utf8")
  ) as Array<Query>
  const hits = queries.filter((query) => {
    const ids = query.answers.map((answer) =>
      resolveId(index, answer.replace(/^topic:/, ""))
    )
    const top = search(index, query.q, { limit: 3 }).map(
      (result) => result.entry.id
    )
    return top.some((id) => ids.includes(id))
  })
  return hits.length / queries.length
}

const top = (query: string, limit = 3) =>
  search(index, query, { limit }).map((result) => result.entry.id)

/**
 * hit@3 floors for the sets agent-eval/sets.json marks `"use": "floor"`. Both
 * have been tuned against (agent-eval/README.md), so they catch regressions
 * but do not measure generalisation. Raise a floor when the ranking improves;
 * never give a `"report"` set one.
 */
const FLOORS: Record<string, number> = {
  "queries.heldout.json": 0.91,
  "queries.heldout-2.json": 0.88,
}

describe("tecton search", () => {
  const { sets } = JSON.parse(
    readFileSync(path.join(pkgRoot, "agent-eval", "sets.json"), "utf8")
  ) as { sets: Array<EvalSet> }

  it.each(sets.filter((set) => set.use === "floor"))(
    "holds $file above its floor",
    ({ file }) => {
      expect(FLOORS[file]).toBeTypeOf("number")
      expect(hitAt3(file)).toBeGreaterThanOrEqual(FLOORS[file])
    }
  )

  it("gives no report-only set a floor", () => {
    for (const set of sets) {
      expect(["floor", "report"]).toContain(set.use)
      if (set.use === "report") expect(FLOORS[set.file]).toBeUndefined()
    }
    for (const file of Object.keys(FLOORS)) {
      expect(sets.find((set) => set.file === file)?.use).toBe("floor")
    }
  })

  it("routes a notFor need to the component it points at", () => {
    // badge.md: "a transient confirmation → toast"; toast is documented by sonner.md
    const [first] = search(index, "transient confirmation")
    expect(first.entry.id).toBe("sonner")
  })

  it("expands the query vocabulary", () => {
    expect(top("modal", 1)).toEqual(["dialog"])
  })

  it("stems both sides", () => {
    expect(stem("resizable")).toBe(stem("resize"))
    expect(stem("wells")).toBe(stem("well"))
  })

  it("stems a plural before its -ing / -ed", () => {
    expect(stem("menus")).toBe(stem("menu"))
    expect(stem("warnings")).toBe(stem("warning"))
    expect(stem("headings")).toBe(stem("heading"))
    expect(stem("settings")).toBe(stem("setting"))
    expect(stem("boxes")).toBe(stem("box"))
    expect(stem("entries")).toBe(stem("entry"))
    // …and leaves what only looks like a suffix alone
    expect(stem("string")).toBe("string")
    expect(stem("class")).toBe("class")
    expect(stem("axis")).toBe("axis")
    expect(stem("scrolling")).toBe(stem("scroll"))
    expect(stem("menus")).not.toBe(stem("men"))
  })

  it("finds a plural query", () => {
    expect(top("menus")).toEqual(
      expect.arrayContaining([expect.stringMatching(/menu$/)])
    )
    expect(top("warnings").length).toBeGreaterThan(0)
    expect(top("headings").length).toBeGreaterThan(0)
  })

  it.each([
    ["ScrollArea", "scroll-area"],
    ["PageHeader", "page-header"],
    ["InputGroup", "input-group"],
    ["ColorSwatch", "color-swatch"],
    ["AppShell", "app-shell"],
    ["ToggleGroup", "toggle-group"],
    ["scroll area", "scroll-area"],
    ["SelectItem", "select"],
    ["toast", "sonner"],
  ])("ranks %s's component first", (query, id) => {
    expect(top(query, 1)).toEqual([id])
  })

  it("splits camelCase but keeps the identifier whole too", () => {
    expect(tokenize("ScrollArea")).toEqual(["scroll", "area", "scrollarea"])
    expect(tokenize("isSelected")).toContain("isselect")
    expect(tokenize("isSelected", { camel: false })).toEqual(["isselect"])
    // an identifier inside a sentence does not stop the rest being read
    expect(tokenize("wrap ScrollArea around it")).toEqual([
      "wrap",
      "scroll",
      "area",
      "scrollarea",
      "around",
    ])
  })

  it("boosts a component whose name the query spells out", () => {
    expect(top("button group for save and cancel", 1)).toEqual(["button-group"])
  })

  it("keeps page, show, display and user as words", () => {
    expect(tokenize("show the user a page display")).toEqual([
      "show",
      "user",
      "page",
      "display",
    ])
    expect(top("page header", 1)).toEqual(["page-header"])
    expect(top("user avatar", 1)).toEqual(["avatar"])
  })

  it("drops apostrophe scraps and 1-letter words", () => {
    expect(tokenize("the engineer's avatar")).toEqual(["engineer", "avatar"])
    expect(tokenize("don't, can't, won't, doesn't, isn't")).toEqual([])
    expect(tokenize("they're x y")).toEqual([])
    expect(tokenize("a b c")).toEqual([])
  })

  it("fires a phrase synonym only on the whole phrase", () => {
    const rules = compileSynonyms({ "pin code": ["otp"], modal: ["dialog"] })
    expect(rules).toEqual([
      { key: "pin code", words: ["pin", "code"], targets: ["otp"] },
      { key: "modal", words: ["modal"], targets: ["dialog"] },
    ])
    expect(top("pin code", 1)).toEqual(["input-otp"])
    expect(top("progress ring", 1)).toEqual(["circular-progress"])
    expect(top("split view")).toContain("resizable")
  })

  // Single words that used to expand into the wrong component.
  it.each([
    ["design tokens", "theming", "chip"],
    ["focus ring", undefined, "circular-progress"],
    ["color palette", undefined, "command"],
    ["split button", "button-group", "resizable"],
    ["rules", "rules", "separator"],
  ])("does not hijack %s", (query, want, notFirst) => {
    const [first] = top(query, 1)
    if (want) expect(first).toBe(want)
    expect(first).not.toBe(notFirst)
  })

  it("keeps pin a column away from the OTP input", () => {
    expect(top("pin a column")).not.toContain("input-otp")
  })
})

describe("tecton docs", () => {
  it("accepts an id, a component or any export", () => {
    expect(resolveId(index, "alert-dialog")).toBe("alert-dialog")
    expect(resolveId(index, "AlertDialogAction")).toBe("alert-dialog")
    expect(resolveId(index, "toast")).toBe("sonner")
  })

  it("accepts a module path or a docs URL", () => {
    expect(resolveId(index, "@tecton/react/components/select")).toBe("select")
    expect(resolveId(index, "/docs/components/select/")).toBe("select")
    expect(
      resolveId(index, "https://tecton.example/docs/tecton/chip#usage")
    ).toBe("chip")
    expect(resolveId(index, "/docs/components/select?tab=code")).toBe("select")
    expect(resolveId(index, "/docs/components/nothing-here/")).toBeNull()
  })

  it("prints several guidelines and suggests on a miss", () => {
    const ok = run(["docs", "select,combobox"], index)
    expect(ok.code).toBe(0)
    expect(ok.err).toBe("")
    expect(ok.out).toContain("# Select — @tecton/react/components/select")
    expect(ok.out).toContain("# Combobox")
    const miss = run(["docs", "dropdwn"], index)
    expect(miss.code).toBe(1)
    expect(miss.out).toBe("")
    expect(miss.err).toMatch(/No entry "dropdwn"\. Did you mean: dropdown-menu/)
  })

  it("prints the hits and reports the misses on stderr", () => {
    const mixed = run(["docs", "chip", "chp", "sheeet"], index)
    expect(mixed.code).toBe(1)
    expect(mixed.out).toContain("# Chip")
    expect(mixed.err).toMatch(/No entry "chp"\. Did you mean: chip/)
    expect(mixed.err).toMatch(/No entry "sheeet"\. Did you mean: sheet/)
  })

  it("prints JSON with --json", () => {
    const result = run(["docs", "select", "--json"], index)
    expect(result.code).toBe(0)
    const [doc] = JSON.parse(result.out)
    expect(doc).toMatchObject({ id: "select", name: "Select" })
    expect(doc.markdown).toContain("## Use it when")
  })

  it("ends a page with the family checklist items that concern it", () => {
    const chip = run(["docs", "chip"], index).out
    expect(chip).toContain("## Before you finish")
    expect(chip).toContain("`ChipGroup > ChipList`")
    // labels checklist items about Kbd name no Chip export, so they stay on kbd's page
    expect(chip).not.toContain("KbdGroup")
    expect(run(["docs", "kbd"], index).out).toContain("KbdGroup")
  })

  it("serves the rules topic", () => {
    expect(run(["rules"], index).out).toContain("Before you finish")
  })

  it("teaches Select's value / onValueChange, not React Aria's selectedKey", () => {
    for (const id of ["conventions", "rules"]) {
      const doc = run(["docs", id], index).out
      expect(doc).not.toMatch(
        /<Select\b[^>]*\b(selectedKey|onSelectionChange|onChange)=/
      )
    }
    expect(run(["docs", "select"], index).out).toMatch(
      /<Select items=\{datums\} value=\{datum\} onValueChange=\{setDatum\}>/
    )
  })
})

describe("tecton search output", () => {
  it("prints each result's import line", () => {
    const result = run(["search", "ScrollArea"], index)
    expect(result.code).toBe(0)
    expect(result.out).toMatch(
      /^1\. scroll-area — ScrollArea — ≈\S+ tok\n {3}import \{ ScrollArea[^}]*\} from "@tecton\/react\/components\/scroll-area"$/m
    )
  })

  it.each([
    [["--limit", "2"], 2],
    [["--limit=2"], 2],
    [[], 5],
  ])("takes --limit as %j", (flags, count) => {
    const result = run(["search", "dialog", ...flags, "--json"], index)
    expect(result.code).toBe(0)
    expect(JSON.parse(result.out)).toHaveLength(count)
  })

  it.each([["abc"], ["-1"], ["0"], ["2.5"], ["=3"]])(
    "rejects --limit %s",
    (value) => {
      const result = run(["search", "dialog", "--limit", value], index)
      expect(result.code).toBe(1)
      expect(result.out).toBe("")
      expect(result.err).toMatch(/--limit/)
    }
  )

  it("sends usage errors to stderr with exit code 1", () => {
    for (const argv of [
      ["search"],
      ["search", "dialog", "--limit"],
      ["search", "dialog", "--nope"],
      ["docs"],
      ["frobnicate"],
      ["list", "--limit", "3"],
    ]) {
      const result = run(argv, index)
      expect(result.code, argv.join(" ")).toBe(1)
      expect(result.out, argv.join(" ")).toBe("")
      expect(result.err, argv.join(" ")).not.toBe("")
    }
  })

  it("rejects an unknown family and lists the real ones", () => {
    const result = run(["list", "--family", "bogus"], index)
    expect(result.code).toBe(1)
    expect(result.err).toMatch(/no family "bogus"\. Families: .*selection/)
    const selection = run(["list", "--family", "selection", "--json"], index)
    expect(selection.code).toBe(0)
    expect(
      JSON.parse(selection.out).map((entry: { id: string }) => entry.id)
    ).toContain("select")
  })
})

describe("the tecton executable", () => {
  const scratch = mkdtempSync(path.join(tmpdir(), "tecton-bin-"))
  afterAll(() => rmSync(scratch, { recursive: true, force: true }))

  it("prints when reached through a symlink under --preserve-symlinks-main", () => {
    const link = path.join(scratch, "tecton")
    symlinkSync(bin, link)
    const out = execFileSync(
      process.execPath,
      ["--preserve-symlinks-main", link, "search", "ScrollArea"],
      { encoding: "utf8" }
    )
    expect(out).toContain("1. scroll-area")
  })

  it("answers --help without an index, and fails a search on stderr", () => {
    const copy = path.join(scratch, "pkg", "bin")
    mkdirSync(copy, { recursive: true })
    for (const file of ["tecton.mjs", "tecton-lib.mjs"]) {
      copyFileSync(path.join(pkgRoot, "bin", file), path.join(copy, file))
    }
    const help = spawnSync(
      process.execPath,
      [path.join(copy, "tecton.mjs"), "--help"],
      {
        encoding: "utf8",
      }
    )
    expect(help.status).toBe(0)
    expect(help.stdout).toContain("tecton search")
    const searchResult = spawnSync(
      process.execPath,
      [path.join(copy, "tecton.mjs"), "search", "dialog"],
      { encoding: "utf8" }
    )
    expect(searchResult.status).toBe(1)
    expect(searchResult.stdout).toBe("")
    expect(searchResult.stderr).toMatch(/index\.json is missing/)
  })

  it("exits 1 with the message on stderr for an unknown id", () => {
    const result = spawnSync(process.execPath, [bin, "docs", "dropdwn"], {
      encoding: "utf8",
    })
    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toMatch(/No entry "dropdwn"/)
  })
})
