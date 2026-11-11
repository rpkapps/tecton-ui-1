/**
 * The engine's rows beyond the basics in `data-table-engine.test.ts`:
 * trees that load and filter, groups as ranges, facets, rows shared
 * between runs, continued pages, lookups for rows out of view, idle-time
 * preparation, CSV options.
 */
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  createDataTableEngine,
  createDefaultView,
  getColumnModel,
  getFormatter,
  layoutColumns,
  reconcileView,
  selectAllIds,
  viewMatchesChanged,
  type BodyRow,
  type DataTableColumn,
  type DataTableEngineInput,
  type DataTablePartialView,
  type DataTableView,
  type GroupRow,
  type ItemRow,
} from "../internal/data-table/engine"
import { toCsv } from "../internal/data-table/engine/csv"
import { createSearchIndex } from "../internal/data-table/engine/filter"
import { hasRanks, sortRows } from "../internal/data-table/engine/sort"

type Well = {
  id: string
  name: string
  operator: string
  status: string | null
  oil: number | null
  active: boolean | string | null
  children?: Array<Well>
}

const STATUS = [
  { value: "drilling", label: "Drilling" },
  { value: "producing", label: "Producing" },
  { value: "shut-in", label: "Shut in" },
]

const definitions: Array<DataTableColumn<Well>> = [
  { id: "name", header: "Well" },
  { id: "operator", header: "Operator" },
  { id: "status", header: "Status", type: "options", options: STATUS },
  { id: "oil", header: "Oil", type: "number" },
  { id: "active", header: "Active", type: "boolean" },
]
const columns = createColumns<Well>(definitions)
const ALL = { sortable: true, filterable: true, groupable: true }
const defaults = createDefaultView(columns, undefined, ALL)

function well(id: string, fields: Partial<Well> = {}): Well {
  return {
    id,
    name: `Well ${id}`,
    operator: "Equinor",
    status: "producing",
    oil: 100,
    active: true,
    ...fields,
  }
}

const fleet: Array<Well> = [
  well("1", { operator: "Shell", oil: 10, status: "producing" }),
  well("2", {
    operator: "Equinor",
    oil: 20,
    status: "drilling",
    active: false,
  }),
  well("3", { operator: "Shell", oil: null, status: "producing" }),
  well("4", { operator: "Aker BP", oil: 40, status: null, active: null }),
  well("5", { operator: "Equinor", oil: 5, status: "producing" }),
  well("6", { operator: "", oil: 7, status: "plugged" }),
]

function view(partial: DataTablePartialView = {}): DataTableView {
  return reconcileView(columns, partial, defaults, ALL)
}

function run(
  input: Partial<DataTableEngineInput<Well>> = {},
  engine = createDataTableEngine<Well>()
) {
  return engine.run({ items: fleet, columns, view: defaults, ...input })
}

const keys = (rows: ReadonlyArray<BodyRow<Well>>) => rows.map((row) => row.key)
const items = (rows: ReadonlyArray<BodyRow<Well>>) =>
  rows.filter((row): row is ItemRow<Well> => row.kind === "item")
const groups = (rows: ReadonlyArray<BodyRow<Well>>) =>
  rows.filter((row): row is GroupRow => row.kind === "group")

/**
 * Stubs `requestIdleCallback`; the returned function runs the callbacks
 * queued (and those they queue), each with a deadline of `steps` steps,
 * and returns how many ran.
 */
function stubIdle(steps = 1_000) {
  const callbacks: Array<(deadline: IdleDeadline) => void> = []
  vi.stubGlobal(
    "requestIdleCallback",
    (callback: (deadline: IdleDeadline) => void) => callbacks.push(callback)
  )
  return () => {
    let runs = 0
    while (callbacks.length) {
      runs++
      let left = steps
      ;(callbacks.shift() as (deadline: IdleDeadline) => void)({
        didTimeout: false,
        timeRemaining: () => (left-- > 0 ? 10 : 0),
      })
    }
    return runs
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("trees", () => {
  const tree: Array<Well> = [
    well("field-1", {
      name: "Troll",
      children: [
        well("t-2", { name: "Troll B", oil: 20 }),
        well("t-1", {
          name: "Troll A",
          oil: 10,
          children: [well("t-1-l", { name: "Lateral", oil: 5 })],
        }),
      ],
    }),
    well("field-2", { name: "Oseberg", oil: 1, children: [] }),
  ]
  const runTree = (input: Partial<DataTableEngineInput<Well>> = {}) =>
    run({ items: tree, itemToChildren: (w) => w.children, ...input })

  it("shows children loaded after expanding, for the same items", () => {
    const loaded = new Map<string, Array<Well>>()
    const lazy = [well("f", { name: "Field" })]
    const engine = createDataTableEngine<Well>()
    const input = {
      items: lazy,
      itemToChildren: (w: Well) => loaded.get(w.id),
      dataMode: "server" as const,
      expanded: ["f"],
    }
    const first = run(input, engine)
    expect(items(first.rows)[0]).toMatchObject({
      expanded: true,
      loading: true,
    })
    expect(run(input, engine)).toBe(first)
    loaded.set("f", [well("f-1")])
    const second = run(input, engine)
    expect(keys(second.rows)).toEqual(["f", "f-1"])
    expect(items(second.rows)[0]).toMatchObject({
      loading: false,
      hasChildren: true,
    })
  })

  it("keeps a match's whole subtree, following the expanded state", () => {
    const search = view({ search: "troll a" })
    const collapsed = runTree({ view: search })
    expect(keys(collapsed.rows)).toEqual(["field-1", "t-1"])
    expect(items(collapsed.rows)[1]).toMatchObject({
      hasChildren: true,
      expanded: false,
      context: false,
    })
    const open = runTree({ view: search, expanded: ["t-1"] })
    expect(keys(open.rows)).toEqual(["field-1", "t-1", "t-1-l"])
    // Under a match is not context: it matches with its parent.
    expect(items(open.rows).map((row) => row.context)).toEqual([
      true,
      false,
      false,
    ])
    expect(open.matchingIds()).toEqual(["t-1", "t-1-l"])
    expect([...open.expandedByFilter()]).toEqual(["field-1"])
  })

  it("leaves context rows out of select all and totals; totals sum leaves", () => {
    const result = runTree({ view: view({ search: "lateral" }) })
    expect(selectAllIds(result)).toEqual(["t-1-l"])
    expect(result.totals()).toMatchObject({ count: 1 })
    expect(result.totals().aggregates.oil).toBe(5)
    expect(result.filteredItems().map((w) => w.id)).toEqual(["t-1-l"])
    // Unfiltered, the leaves: t-2, the lateral, the empty field.
    expect(runTree().totals().aggregates.oil).toBe(26)
  })

  it("shows rows with children expanded while a server search is on", () => {
    const result = runTree({ dataMode: "server", view: view({ search: "x" }) })
    expect(keys(result.rows)).toEqual([
      "field-1",
      "t-2",
      "t-1",
      "t-1-l",
      "field-2",
    ])
    expect(keys(runTree({ dataMode: "server" }).rows)).toEqual([
      "field-1",
      "field-2",
    ])
  })
})

describe("sorting details", () => {
  const names = (list: Array<string>, descending = false, id = "name") => {
    const data = list.map((name, i) =>
      well(String(i), { name, operator: name })
    )
    const model = getColumnModel(columns)
    const column = model.byId.get(id) as NonNullable<
      ReturnType<typeof model.byId.get>
    >
    return Array.from(
      sortRows(data, Uint32Array.from(data.keys()), [{ column, descending }]),
      (row) => data[row].name
    )
  }

  it("ignores accents", () => {
    expect(
      names(["Zeta", "Ölund", "Ärzte", "Émile", "Alpha", "Eve", "Oslo"])
    ).toEqual(["Alpha", "Ärzte", "Émile", "Eve", "Ölund", "Oslo", "Zeta"])
  })

  it("puts empty text last in either direction", () => {
    expect(names(["b", "", "a"])).toEqual(["a", "b", ""])
    expect(names(["b", "", "a"], true)).toEqual(["b", "a", ""])
  })

  it("puts empty values last with a column's compare, descending too", () => {
    const byLength = createColumns<Well>([
      {
        id: "oil",
        header: "Oil",
        type: "number",
        compare: (a, b) => (a.oil ?? 0) - (b.oil ?? 0),
      },
    ])
    const column = getColumnModel(byLength).leaves[0]
    const data = [
      well("a", { oil: 2 }),
      well("b", { oil: null }),
      well("c", { oil: 5 }),
    ]
    const order = (descending: boolean) =>
      Array.from(
        sortRows(data, Uint32Array.of(0, 1, 2), [{ column, descending }]),
        (row) => data[row].id
      )
    expect(order(false)).toEqual(["a", "c", "b"])
    expect(order(true)).toEqual(["c", "a", "b"])
  })

  it("puts the empty group last", () => {
    const result = run({ view: view({ grouping: ["operator"] }) })
    expect(groups(result.rows).map((row) => row.text)).toEqual([
      "Aker BP",
      "Equinor",
      "Shell",
      "",
    ])
    const descending = run({
      view: view({
        grouping: ["operator"],
        sorting: [{ column: "operator", direction: "descending" }],
      }),
    })
    expect(groups(descending.rows).map((row) => row.text)).toEqual([
      "Shell",
      "Equinor",
      "Aker BP",
      "",
    ])
  })
})

describe("booleans", () => {
  it("read the strings true and false", () => {
    const model = getColumnModel(columns)
    const active = model.byId.get("active") as NonNullable<
      ReturnType<typeof model.byId.get>
    >
    const formatter = getFormatter(model, "en-US")
    expect(formatter.format(active, "false")).toBe("No")
    expect(formatter.format(active, " TRUE ")).toBe("Yes")
    const data = [well("x", { active: "false" }), well("y", { active: "true" })]
    const result = run({
      items: data,
      view: view({ filters: { active: { type: "boolean", value: false } } }),
    })
    expect(keys(result.rows)).toEqual(["x"])
  })
})

describe("facets", () => {
  it("count the rows matching everything but the column's own filter", () => {
    const result = run({
      view: view({
        filters: {
          status: { type: "options", values: ["producing"] },
          oil: { type: "number", min: 6 },
        },
      }),
    })
    // Oil ≥ 6: wells 1, 2, 4, 6.
    expect([...result.facets("status")]).toEqual([
      ["drilling", 1],
      ["producing", 1],
      ["shut-in", 0],
      ["plugged", 1],
    ])
    // Producing and oil ≥ 6: well 1 only.
    expect([...result.facets("operator")]).toEqual([["Shell", 1]])
    expect(result.facets("status")).toBe(result.facets("status"))
    expect(result.facets("ghost").size).toBe(0)
  })

  it("count booleans by their text, with the search", () => {
    const result = run({ view: view({ search: "equinor" }) })
    expect([...result.facets("active")]).toEqual([
      ["No", 1],
      ["Yes", 1],
    ])
  })

  it("count the loaded rows in server mode", () => {
    const result = run({ dataMode: "server", view: view({ search: "shell" }) })
    expect(result.facets("status").get("producing")).toBe(3)
  })
})

describe("groups", () => {
  const nested = view({ grouping: ["status", "operator"] })

  it("are ranges of one sorted array, nested", () => {
    const result = run({
      view: {
        ...nested,
        sorting: [{ column: "oil", direction: "descending" }],
      },
    })
    const producing = groups(result.rows).find(
      (row) => row.key === "group:status=producing"
    ) as GroupRow
    expect(producing).toMatchObject({ depth: 0, count: 3, text: "Producing" })
    expect(result.groupIds(producing.key)).toEqual(["5", "1", "3"])
    expect(result.groupIds("group:status=producing/operator=Shell")).toEqual([
      "1",
      "3",
    ])
    expect(result.matchingIds()).toEqual(["2", "5", "1", "3", "6", "4"])
    expect(result.groupKeys()).toHaveLength(9)
  })

  it("key groups by value, whatever the locale", () => {
    const engine = createDataTableEngine<Well>()
    const key = "group:status=producing"
    const english = run({ view: nested, collapsedGroups: [key] }, engine)
    const german = run(
      { view: nested, collapsedGroups: [key], locale: "de-DE" },
      engine
    )
    expect(groups(english.rows).find((row) => row.key === key)?.open).toBe(
      false
    )
    expect(groups(german.rows).find((row) => row.key === key)?.open).toBe(false)
    const numbers = run({ view: view({ grouping: ["oil"] }), locale: "de-DE" })
    expect(groups(numbers.rows).map((row) => row.key)).toContain("group:oil=10")
  })

  it("rebuild only the rows that change when one opens or closes", () => {
    const engine = createDataTableEngine<Well>()
    const open = run({ view: nested }, engine)
    const closed = run(
      { view: nested, collapsedGroups: ["group:status=producing"] },
      engine
    )
    const drilling = open.rows[0]
    expect(closed.rows[0]).toBe(drilling)
    expect(
      closed.rows.find((row) => row.key === "group:status=producing")
    ).not.toBe(open.rows.find((row) => row.key === "group:status=producing"))
    const reopened = run({ view: nested }, engine)
    expect(reopened.rows.find((row) => row.key === "2")).toBe(
      open.rows.find((row) => row.key === "2")
    )
  })
})

describe("shared rows", () => {
  it("keep the same objects across sorts in a flat list, without posinset", () => {
    const engine = createDataTableEngine<Well>()
    const before = run({}, engine)
    const after = run(
      { view: view({ sorting: [{ column: "oil", direction: "ascending" }] }) },
      engine
    )
    expect(after.rows).not.toEqual(before.rows)
    for (const row of after.rows) expect(before.rows).toContain(row)
    expect(items(before.rows)[0]).not.toHaveProperty("posinset")
  })

  it("redo nothing for an equal expanded list made anew", () => {
    const engine = createDataTableEngine<Well>()
    const first = run({ detail: true, expanded: ["1", "2"] }, engine)
    expect(run({ detail: true, expanded: ["2", "1"] }, engine)).toBe(first)
    const changed = run({ detail: true, expanded: ["1"] }, engine)
    expect(changed.rows[0]).toBe(first.rows[0])
    expect(changed.rows[1]).toBe(first.rows[1])
  })

  it("follow a new items array for items that stayed", () => {
    const engine = createDataTableEngine<Well>()
    const first = run({}, engine)
    const next = run({ items: [...fleet, well("7")] }, engine)
    expect(next.rows[0]).toBe(first.rows[0])
    expect(next.rows).toHaveLength(7)
  })
})

describe("pages", () => {
  it("repeat the groups a page starts in, as continued rows", () => {
    const result = run({
      view: view({ grouping: ["status", "operator"] }),
      pagination: { page: 2, pageSize: 4 },
    })
    // Page 1 ends with the producing group's row; page 2 starts inside it.
    expect(keys(result.rows)).toEqual([
      "group:status=producing",
      "group:status=producing/operator=Equinor",
      "5",
      "group:status=producing/operator=Shell",
      "1",
    ])
    expect(groups(result.rows)[0].continued).toBe(true)
    expect(result.rows[1]).not.toHaveProperty("continued")
    expect(result.pageItems().map((w) => w.id)).toEqual(["5", "1"])
    expect(result.displayRowCount).toBe(15)
    expect(result.rowCount).toBe(6)
  })

  it("repeat the parents a tree page starts below", () => {
    const tree = [
      well("p", { children: [well("c1"), well("c2"), well("c3")] }),
      well("q"),
    ]
    const result = run({
      items: tree,
      itemToChildren: (w) => w.children,
      expanded: ["p"],
      pagination: { page: 2, pageSize: 2 },
    })
    expect(keys(result.rows)).toEqual(["p", "c2", "c3"])
    expect(items(result.rows)[0].continued).toBe(true)
    expect(result.pageCount).toBe(3)
  })
})

describe("lookups", () => {
  it("find rows out of view and give their text", () => {
    const result = run({
      view: view({ grouping: ["operator"] }),
      pagination: { page: 1, pageSize: 2 },
    })
    expect(result.indexOf("5")).toBe(-1)
    expect(result.indexOfRow("5")).toBeGreaterThan(1)
    expect(result.indexOfRow("ghost")).toBe(-1)
    expect(result.textOf("5")).toBe("Well 5")
    expect(result.textOf("group:operator=Shell")).toBe("Shell")
    expect(result.textOf("ghost")).toBe("")
    const hidden = run({ view: view({ columns: { hidden: ["name"] } }) })
    expect(hidden.textOf("1")).toBe("Shell")
  })

  it("report duplicate and missing ids", () => {
    const result = run({
      items: [
        well("a"),
        well("a"),
        { ...well("b"), id: undefined as unknown as string },
      ],
    })
    expect(result.idIssues).toEqual({ duplicateIds: ["a"], missingIds: 1 })
    expect(run().idIssues).toEqual({ duplicateIds: [], missingIds: 0 })
  })

  it("count rows the way the page parts need", () => {
    const result = run({
      view: view({ grouping: ["operator"], search: "shell" }),
    })
    expect([
      result.rowCount,
      result.matchingCount,
      result.displayRowCount,
    ]).toEqual([2, 2, 3])
    expect(run({ dataMode: "server", rowCount: 500 }).rowCount).toBe(500)
  })
})

describe("view changes", () => {
  it("count hidden columns while searching as a change of the matches", () => {
    const searching = view({ search: "shell" })
    const hidden = view({ search: "shell", columns: { hidden: ["operator"] } })
    expect(viewMatchesChanged(searching, hidden)).toBe(true)
    expect(
      viewMatchesChanged(defaults, view({ columns: { hidden: ["operator"] } }))
    ).toBe(false)
  })
})

describe("layout cache", () => {
  it("keeps each table's layout when tables share columns", () => {
    const a = view({ columns: { hidden: ["oil"] } })
    const b = view({ columns: { hidden: ["name"] } })
    const first = layoutColumns(columns, a)
    layoutColumns(columns, b)
    expect(layoutColumns(columns, a)).toBe(first)
  })
})

describe("idle time", () => {
  it("ranks in slices that respect the deadline", () => {
    const flush = stubIdle(3)
    const data = Array.from({ length: 20_000 }, (_, i) =>
      well(String(i), { name: `Well ${i % 977}` })
    )
    const model = getColumnModel(columns)
    createDataTableEngine<Well>().run({ items: data, columns, view: defaults })
    expect(flush()).toBeGreaterThan(5)
    expect(model.leaves.every((column) => hasRanks(data, column))).toBe(true)
  })

  it("ranks columns made anew later", () => {
    const flush = stubIdle()
    const data = fleet.slice()
    const engine = createDataTableEngine<Well>()
    engine.run({ items: data, columns, view: defaults })
    flush()
    const again = createColumns<Well>(definitions)
    engine.run({ items: data, columns: again, view: createDefaultView(again) })
    expect(hasRanks(data, getColumnModel(again).leaves[0])).toBe(false)
    flush()
    expect(hasRanks(data, getColumnModel(again).leaves[0])).toBe(true)
  })

  it("builds the search index ahead while the table is filterable", () => {
    const flush = stubIdle()
    run({ sortable: false, filterable: true })
    expect(flush()).toBeGreaterThan(0)
    const model = getColumnModel(columns)
    const index = createSearchIndex(fleet, getFormatter(model, "en-US"))
    const name = model.leaves[0]
    const task = index.task(name)
    while (!task.done()) task.step()
    expect(index.texts(name).offsets).toHaveLength(fleet.length + 1)
    expect(index.texts(name).text.split("\u0000", 2)[0]).toBe("well 1")
  })
})

describe("toCsv options", () => {
  const model = getColumnModel(columns)
  const formatter = getFormatter(model, "en-US")
  const [name, , , oil] = model.leaves

  it("quotes an empty field alone in its record", () => {
    expect(
      toCsv([well("x", { name: "" })], [name], formatter, { header: false })
    ).toBe('""\r\n')
  })

  it("starts with a byte order mark on request", () => {
    expect(toCsv([], [name], formatter, { bom: true })).toBe("﻿Well\r\n")
  })

  it("defuses formulas in text cells, never in number cells", () => {
    const data = [
      well("a", { name: "=SUM(A1)", oil: -5 }),
      well("b", { name: "+1", oil: 3 }),
      well("c", { name: "@cmd", oil: 1 }),
      well("d", { name: "\tTab", oil: 1 }),
    ]
    expect(toCsv(data, [name, oil], formatter, { header: false })).toBe(
      ["'=SUM(A1),-5", "'+1,3", "'@cmd,1", "'\tTab,1", ""].join("\r\n")
    )
    expect(
      toCsv(data.slice(0, 1), [name], formatter, {
        header: false,
        escapeFormulas: false,
      })
    ).toBe("=SUM(A1)\r\n")
  })
})

describe("rows hidden by a search", () => {
  const many = Array.from({ length: 12 }, (_, i) =>
    well(`w${i}`, { name: `Well ${i}`, operator: i % 2 ? "Shell" : "Equinor" })
  )
  const searching = view({ search: "shell" })
  const row = (result: ReturnType<typeof run>, id: string) =>
    items(result.rows).find((r) => r.id === id)

  it("come back collapsed when collapsed while hidden", () => {
    const engine = createDataTableEngine<Well>()
    const base = { items: many, detail: true }
    run({ ...base, expanded: ["w4"] }, engine)
    run({ ...base, expanded: ["w4"], view: searching }, engine)
    run({ ...base, expanded: [], view: searching }, engine)
    const back = run({ ...base, expanded: [] }, engine)
    expect(row(back, "w4")?.expanded).toBe(false)
    expect(keys(back.rows)).not.toContain("detail:w4")
  })

  it("come back disabled when disabled while hidden", () => {
    const engine = createDataTableEngine<Well>()
    run({ items: many }, engine)
    run({ items: many, view: searching }, engine)
    const disable = (w: Well) => w.id === "w4"
    run({ items: many, view: searching, isItemDisabled: disable }, engine)
    const back = run({ items: many, isItemDisabled: disable }, engine)
    expect(row(back, "w4")?.disabled).toBe(true)
    expect(back.isDisabled("w4")).toBe(true)
  })

  it("match a fresh build after any changes, searches in between", () => {
    // mulberry32: the same steps on every run.
    let state = 20261111
    const random = () => {
      state = (state + 0x6d2b79f5) | 0
      let t = Math.imul(state ^ (state >>> 15), 1 | state)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    const pick = <TValue>(list: ReadonlyArray<TValue>) =>
      list[Math.floor(random() * list.length)]
    const ids = many.map((w) => w.id)
    const subset = () => ids.filter(() => random() < 0.3)
    const engine = createDataTableEngine<Well>()
    const input: Partial<DataTableEngineInput<Well>> = {
      items: many,
      detail: true,
    }
    for (let step = 0; step < 600; step++) {
      switch (
        pick(["search", "search", "expanded", "disabled", "sort", "detail"])
      ) {
        case "search":
          input.view = view({
            search: pick(["", "", "shell", "equinor", "well 1"]),
          })
          break
        case "expanded":
          input.expanded = subset()
          break
        case "disabled": {
          const off = new Set(subset())
          input.isItemDisabled = (w) => off.has(w.id)
          break
        }
        case "sort":
          input.view = {
            ...(input.view ?? defaults),
            sorting: [
              {
                column: pick(["name", "oil", "operator"]),
                direction: pick(["ascending", "descending"] as const),
              },
            ],
          }
          break
        case "detail":
          input.detail = random() < 0.7
          break
      }
      const incremental = run(input, engine)
      const fresh = run(input)
      expect(incremental.rows).toEqual(fresh.rows)
    }
  })
})

describe("select all while searching a tree", () => {
  it("counts a match's subtree, and leaves context ancestors out, everywhere alike", () => {
    const tree: Array<Well> = [
      well("field", {
        name: "Troll",
        oil: 1,
        children: [
          well("t-a", {
            name: "Troll A",
            oil: 10,
            children: [well("t-a-1", { name: "Lateral", oil: 5 })],
          }),
          well("t-b", { name: "Other", oil: 20 }),
        ],
      }),
    ]
    const result = run({
      items: tree,
      itemToChildren: (w) => w.children,
      view: view({ search: "troll a" }),
    })
    const results = ["t-a", "t-a-1"]
    expect(selectAllIds(result)).toEqual(results)
    expect(result.matchingIds()).toEqual(results)
    expect(result.matchingCount).toBe(2)
    expect(result.filteredItems().map((w) => w.id)).toEqual(results)
    // Totals sum the result leaves: the lateral.
    expect(result.totals().items.map((w) => w.id)).toEqual(["t-a-1"])
    expect(items(result.rows).find((r) => r.id === "field")?.context).toBe(true)
  })
})

describe("number groups", () => {
  it("group by the precision shown, whatever the locale", () => {
    const rounded = createColumns<Well>([
      {
        id: "oil",
        header: "Oil",
        type: "number",
        format: { maximumFractionDigits: 0 },
      },
    ])
    const data = [
      well("a", { oil: 1.2 }),
      well("b", { oil: 1.4 }),
      well("c", { oil: 1234.6 }),
    ]
    const grouped = (locale: string) =>
      createDataTableEngine<Well>()
        .run({
          items: data,
          columns: rounded,
          locale,
          view: reconcileView(
            rounded,
            { grouping: ["oil"] },
            createDefaultView(rounded, undefined, ALL),
            ALL
          ),
        })
        .rows.filter((row): row is GroupRow => row.kind === "group")
        .map((row) => [row.key, row.text, row.count])
    expect(grouped("en-US")).toEqual([
      ["group:oil=1", "1", 2],
      ["group:oil=1235", "1,235", 1],
    ])
    expect(grouped("de-DE")).toEqual([
      ["group:oil=1", "1", 2],
      ["group:oil=1235", "1.235", 1],
    ])
  })
})

describe("CSV formulas", () => {
  it("defuse a number column's text that is not a number, and headers", () => {
    const risky = createColumns<Well>([
      {
        id: "oil",
        header: "=Oil",
        type: "number",
        accessor: (w) => w.oil ?? w.name,
      },
    ])
    const model = getColumnModel(risky)
    const data = [
      well("a", { oil: null, name: '=HYPERLINK("x")' }),
      well("b", { oil: -5 }),
    ]
    expect(toCsv(data, model.leaves, getFormatter(model, "en-US"))).toBe(
      ["'=Oil", '"\'=HYPERLINK(""x"")"', "-5", ""].join("\r\n")
    )
  })
})
