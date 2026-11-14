import { afterEach, describe, expect, it, vi } from "vitest"

import {
  addedIds,
  aggregate,
  allMatchingAfterViewChange,
  allMatchingValue,
  buildHeaderRows,
  clampPage,
  clearFilters,
  createColumns,
  createDataTableEngine,
  createDetailCache,
  createDefaultView,
  enterAllMatching,
  foldText,
  getColumnModel,
  getFormatter,
  getPageCount,
  layoutColumns,
  reconcileView,
  resetColumns,
  resolveLocale,
  resolvePageSize,
  selectAllIds,
  selectedCount,
  selectionState,
  setColumnHidden,
  setColumnOrder,
  setColumnPinned,
  setColumnWidth,
  setFilter,
  setGrouping,
  setSearch,
  setSelectedInAllMatching,
  setSorting,
  sameFilterValue,
  sameView,
  shouldResetPage,
  sortColumn,
  toggleIds,
  toggleSorting,
  viewMatchesChanged,
  type BodyRow,
  type DataTableColumn,
  type DataTableEngineInput,
  type DataTablePartialView,
  type DataTableView,
  type GroupRow,
  type ItemRow,
  type ViewCapabilities,
  withDetailRows,
} from "../internal/data-table/engine"
import { toCsv } from "../internal/data-table/engine/csv"
import {
  getRanks,
  hasRanks,
  naturalKey,
  sortRows,
} from "../internal/data-table/engine/sort"

type Well = {
  id: string
  name: string
  operator: string
  status: string | null
  oil: number | null
  spud: Date | string | null
  active: boolean | null
  children?: Array<Well>
}

const STATUS = [
  { value: "drilling", label: "Drilling" },
  { value: "producing", label: "Producing", variant: "success" as const },
  { value: "shut-in", label: "Shut in", variant: "warning" as const },
]

const definitions: Array<DataTableColumn<Well>> = [
  { id: "name", header: "Well" },
  { id: "operator", header: "Operator" },
  { id: "status", header: "Status", type: "options", options: STATUS },
  { id: "oil", header: "Oil (bbl/d)", type: "number" },
  { id: "spud", header: "Spud date", type: "date" },
  { id: "active", header: "Active", type: "boolean" },
]

const columns = createColumns<Well>(definitions)

const ALL: ViewCapabilities = {
  sortable: true,
  filterable: true,
  groupable: true,
}

function well(id: string, fields: Partial<Well> = {}): Well {
  return {
    id,
    name: `Well ${id}`,
    operator: "Equinor",
    status: "producing",
    oil: 100,
    spud: new Date(2024, 0, 15),
    active: true,
    ...fields,
  }
}

const wells: Array<Well> = [
  well("A-10", {
    operator: "Shell",
    oil: 300,
    status: "drilling",
    active: false,
  }),
  well("A-2", { operator: "Équinor", oil: null, spud: new Date(2023, 5, 1) }),
  well("B-1", { oil: 50, status: "shut-in", spud: null, active: null }),
  well("a-1", {
    operator: "Aker BP",
    oil: 1234.5,
    spud: "2022-03-04T12:00:00",
  }),
]

const defaults = createDefaultView(columns, undefined, ALL)

function view(partial: DataTablePartialView = {}): DataTableView {
  return reconcileView(columns, partial, defaults, ALL)
}

function run(
  input: Partial<DataTableEngineInput<Well>> = {},
  engine = createDataTableEngine<Well>()
) {
  return engine.run({ items: wells, columns, view: defaults, ...input })
}

const ids = (rows: ReadonlyArray<BodyRow<Well>>) => rows.map((row) => row.key)
const items = (rows: ReadonlyArray<BodyRow<Well>>) =>
  rows.filter((row): row is ItemRow<Well> => row.kind === "item")
const groups = (rows: ReadonlyArray<BodyRow<Well>>) =>
  rows.filter((row): row is GroupRow => row.kind === "group")

describe("createColumns", () => {
  it("resolves each type's defaults", () => {
    const model = getColumnModel(columns)
    const byId = (id: string) => model.byId.get(id)
    expect(model.leaves.map((leaf) => [leaf.id, leaf.align])).toEqual([
      ["name", "start"],
      ["operator", "start"],
      ["status", "start"],
      ["oil", "end"],
      ["spud", "start"],
      ["active", "center"],
    ])
    expect(byId("oil")?.aggregate).toBe("sum")
    expect(byId("active")?.aggregate).toBe("count")
    expect(byId("name")?.aggregate).toBeNull()
    expect(byId("spud")?.aggregate).toBeNull()
    expect(byId("name")?.type).toBe("text")
    expect(byId("status")?.options).toBe(STATUS)
    expect(byId("name")?.options).toEqual([])
  })

  it("keeps explicit settings over the defaults", () => {
    const model = getColumnModel(
      createColumns<Well>([
        {
          id: "oil",
          header: "Oil",
          type: "number",
          align: "start",
          aggregate: "avg",
        },
        { id: "name", header: "Name", sortable: false, filterable: false },
      ])
    )
    expect(model.byId.get("oil")).toMatchObject({
      align: "start",
      aggregate: "avg",
    })
    expect(model.byId.get("name")).toMatchObject({
      sortable: false,
      filterable: false,
      searchable: false,
      groupable: true,
    })
  })

  it("reads values by id, by key or with a function", () => {
    const model = getColumnModel(
      createColumns<Well>([
        { id: "name", header: "Name" },
        { id: "who", header: "Operator", accessor: "operator" },
        {
          id: "label",
          header: "Label",
          accessor: (w) => `${w.name} (${w.operator})`,
        },
      ])
    )
    const [name, who, label] = model.leaves
    expect(name.getValue(wells[0])).toBe("Well A-10")
    expect(who.getValue(wells[0])).toBe("Shell")
    expect(label.getValue(wells[0])).toBe("Well A-10 (Shell)")
  })

  it("throws for duplicate and empty ids and for empty groups", () => {
    expect(() =>
      createColumns([
        { id: "a", header: "A" },
        { id: "a", header: "Again" },
      ])
    ).toThrow(/"a" is used more than once/)
    expect(() =>
      createColumns([
        { id: "g", header: "G", columns: [{ id: "x", header: "X" }] },
        { id: "x", header: "X" },
      ])
    ).toThrow(/"x" is used more than once/)
    expect(() =>
      createColumns([
        { id: "g", header: "G", columns: [{ id: "g", header: "G" }] },
      ])
    ).toThrow(/"g" is used more than once/)
    expect(() => createColumns([{ id: "", header: "Nameless" }])).toThrow(
      /non-empty `id`.*Nameless/
    )
    expect(() =>
      createColumns([{ id: "g", header: "G", columns: [] }])
    ).toThrow(/"g" has no columns/)
  })

  it("picks the first rowHeader column, else the first leaf", () => {
    expect(getColumnModel(columns).rowHeader).toBe("name")
    const model = getColumnModel(
      createColumns<Well>([
        {
          id: "g",
          header: "G",
          columns: [{ id: "oil", header: "Oil", type: "number" }],
        },
        { id: "name", header: "Name", rowHeader: true },
        { id: "operator", header: "Operator", rowHeader: true },
      ])
    )
    expect(model.rowHeader).toBe("name")
    expect(
      model.leaves.filter((leaf) => leaf.rowHeader).map((leaf) => leaf.id)
    ).toEqual(["name"])
    expect(getColumnModel(createColumns([])).rowHeader).toBeUndefined()
  })

  it("records groups and the tree", () => {
    const model = getColumnModel(
      createColumns<Well>([
        { id: "name", header: "Name" },
        {
          id: "production",
          header: "Production",
          description: "Daily",
          columns: [
            { id: "oil", header: "Oil", type: "number" },
            {
              id: "rates",
              header: "Rates",
              columns: [{ id: "gas", header: "Gas" }],
            },
          ],
        },
      ])
    )
    expect(model.groups.get("production")).toMatchObject({
      header: "Production",
      description: "Daily",
      columns: ["oil", "gas"],
      groups: [],
    })
    expect(model.groups.get("rates")).toMatchObject({
      columns: ["gas"],
      groups: ["production"],
    })
    expect(model.byId.get("gas")?.groups).toEqual(["production", "rates"])
    expect(model.leaves.map((leaf) => leaf.index)).toEqual([0, 1, 2])
  })

  it("rejects columns that did not come from createColumns", () => {
    expect(() => getColumnModel({} as typeof columns)).toThrow(/createColumns/)
  })

  it("sorts options by their order, unknown values after them", () => {
    const status = getColumnModel(columns).byId.get("status")
    expect(status?.sortValue(well("x", { status: "shut-in" }))).toBe(2)
    expect(status?.sortValue(well("x", { status: "plugged" }))).toBe(3)
    expect(status?.sortValue(well("x", { status: null }))).toBeUndefined()
  })
})

describe("buildHeaderRows", () => {
  const grouped = createColumns<Well>([
    { id: "name", header: "Name" },
    {
      id: "production",
      header: "Production",
      columns: [
        { id: "oil", header: "Oil", type: "number" },
        {
          id: "rates",
          header: "Rates",
          columns: [
            { id: "gas", header: "Gas" },
            { id: "water", header: "Water" },
          ],
        },
      ],
    },
    { id: "operator", header: "Operator" },
    { id: "status", header: "Status" },
  ])
  const model = getColumnModel(grouped)
  const shape = (rows: ReturnType<typeof buildHeaderRows>) =>
    rows.map((row) =>
      row.cells.map((cell) => `${cell.kind}:${cell.id ?? "-"}:${cell.colSpan}`)
    )

  it("gives one row per level, leaves at the bottom, placeholders above", () => {
    const rows = buildHeaderRows(model, [
      "name",
      "oil",
      "gas",
      "water",
      "operator",
      "status",
    ])
    expect(rows.map((row) => row.level)).toEqual([0, 1, 2])
    expect(shape(rows)).toEqual([
      ["placeholder:-:1", "group:production:3", "placeholder:-:2"],
      [
        "placeholder:-:1",
        "placeholder:-:1",
        "group:rates:2",
        "placeholder:-:2",
      ],
      [
        "column:name:1",
        "column:oil:1",
        "column:gas:1",
        "column:water:1",
        "column:operator:1",
        "column:status:1",
      ],
    ])
    expect(rows[0].cells[1].columns).toEqual(["oil", "gas", "water"])
    // Keys are unique within a row.
    for (const row of rows)
      expect(new Set(row.cells.map((cell) => cell.key)).size).toBe(
        row.cells.length
      )
  })

  it("splits a group around columns moved between its own", () => {
    const rows = buildHeaderRows(model, ["oil", "name", "gas"])
    expect(shape(rows)[0]).toEqual([
      "group:production:1",
      "placeholder:-:1",
      "group:production:1",
    ])
  })

  it("shrinks to the levels of the columns shown", () => {
    expect(shape(buildHeaderRows(model, ["name", "operator"]))).toEqual([
      ["column:name:1", "column:operator:1"],
    ])
    expect(buildHeaderRows(model, [])).toEqual([])
    expect(buildHeaderRows(model, ["unknown"])).toEqual([])
  })
})

describe("format", () => {
  const model = getColumnModel(columns)
  const column = (id: string) =>
    model.byId.get(id) as NonNullable<ReturnType<typeof model.byId.get>>

  it("formats numbers in the locale and the column's format", () => {
    expect(getFormatter(model, "en-US").format(column("oil"), 1234.5)).toBe(
      "1,234.5"
    )
    expect(getFormatter(model, "de-DE").format(column("oil"), 1234.5)).toBe(
      "1.234,5"
    )
    expect(getFormatter(model, "ar-AE").format(column("oil"), 1234.5)).toBe(
      new Intl.NumberFormat("ar-AE").format(1234.5)
    )
    const money = getColumnModel(
      createColumns<Well>([
        {
          id: "oil",
          header: "Value",
          type: "number",
          format: { style: "currency", currency: "USD" },
        },
      ])
    )
    expect(getFormatter(money, "en-US").format(money.leaves[0], 12)).toBe(
      "$12.00"
    )
    expect(getFormatter(model, "en-US").format(column("oil"), null)).toBe("")
    expect(getFormatter(model, "en-US").format(column("oil"), "12")).toBe("12")
    expect(getFormatter(model, "en-US").format(column("oil"), "n/a")).toBe(
      "n/a"
    )
  })

  it("formats dates, medium by default, from dates, ISO strings and timestamps", () => {
    const date = new Date(2024, 0, 15)
    const medium = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
    }).format(date)
    const formatter = getFormatter(model, "en-US")
    expect(formatter.format(column("spud"), date)).toBe(medium)
    expect(formatter.format(column("spud"), date.getTime())).toBe(medium)
    expect(formatter.format(column("spud"), "2024-01-15T00:00:00")).toBe(medium)
    expect(formatter.format(column("spud"), "not a date")).toBe("")
    expect(formatter.format(column("spud"), new Date(NaN))).toBe("")
    expect(getFormatter(model, "de-DE").format(column("spud"), date)).toBe(
      "15.01.2024"
    )
    const custom = getColumnModel(
      createColumns<Well>([
        {
          id: "spud",
          header: "Spud",
          type: "date",
          format: { year: "numeric", month: "long" },
        },
      ])
    )
    expect(getFormatter(custom, "en-US").format(custom.leaves[0], date)).toBe(
      "January 2024"
    )
  })

  it("shows booleans with the labels and options by label", () => {
    const labels = { yes: "Ja", no: "Nein" }
    expect(
      getFormatter(model, "de-DE", labels).format(column("active"), true)
    ).toBe("Ja")
    expect(
      getFormatter(model, "de-DE", labels).format(column("active"), false)
    ).toBe("Nein")
    expect(getFormatter(model, "en-US").format(column("active"), true)).toBe(
      "Yes"
    )
    expect(getFormatter(model, "en-US").format(column("active"), null)).toBe("")
    expect(
      getFormatter(model, "en-US").format(column("status"), "shut-in")
    ).toBe("Shut in")
    expect(
      getFormatter(model, "en-US").format(column("status"), "plugged")
    ).toBe("plugged")
    expect(getFormatter(model, "en-US").text(column("name"), wells[0])).toBe(
      "Well A-10"
    )
  })

  it("keeps one formatter per model, locale and labels", () => {
    expect(getFormatter(model, "de-DE")).toBe(getFormatter(model, "de-DE"))
    expect(getFormatter(model, "de-DE")).not.toBe(getFormatter(model, "en-US"))
    expect(getFormatter(model, "de-DE", { yes: "Ja", no: "Nein" })).toBe(
      getFormatter(model, "de-DE", { yes: "Ja", no: "Nein" })
    )
  })

  it("falls back to en-US for an invalid locale", () => {
    expect(resolveLocale("not a locale!")).toBe("en-US")
    expect(resolveLocale(undefined)).toBe("en-US")
    expect(resolveLocale("de-de")).toBe("de-DE")
    expect(
      getFormatter(model, "not a locale!").format(column("oil"), 1234.5)
    ).toBe("1,234.5")
  })

  it("formats aggregates: counts as integers, the rest as the column", () => {
    const formatter = getFormatter(model, "de-DE")
    expect(formatter.formatAggregate(column("oil"), 1234.5)).toBe("1.234,5")
    expect(formatter.formatAggregate(column("oil"), 1234, "count")).toBe(
      "1.234"
    )
    expect(formatter.formatAggregate(column("active"), 3)).toBe("3")
    expect(
      formatter.formatAggregate(column("name"), 2.5, (values) => values.length)
    ).toBe("2,5")
    expect(
      formatter.formatAggregate(column("spud"), new Date(2024, 0, 15), "max")
    ).toBe("15.01.2024")
  })

  it("folds case, accents and Arabic digits for search", () => {
    expect(foldText("Équinor ÅSGARD")).toBe("equinor asgard")
    expect(foldText("Straße")).toBe("strasse")
    expect(foldText("IŞIK")).toBe(foldText("ışık"))
    expect(foldText("Ørsted")).toBe("orsted")
    expect(foldText("١٢٣ ۴")).toBe("123 4")
    expect(foldText("plain ascii 42")).toBe("plain ascii 42")
    expect(foldText("1\u202f234,5\u00a0€")).toBe("1 234,5 €")
  })
})

describe("view", () => {
  it("compares views by value", () => {
    const base = createDefaultView(columns)
    const copy: DataTableView = JSON.parse(JSON.stringify(base))
    expect(sameView(base, copy)).toBe(true)
    expect(sameView(base, setSearch(base, "x"))).toBe(false)
    expect(sameView(base, setColumnWidth(base, "name", 120))).toBe(false)
    expect(
      sameView(setColumnWidth(base, "name", 120), {
        ...copy,
        columns: { ...copy.columns, widths: { name: 120 } },
      })
    ).toBe(true)
    expect(sameView(base, setColumnPinned(base, "name", "end"))).toBe(false)
    expect(
      sameView(
        base,
        setSorting(base, [{ column: "name", direction: "ascending" }])
      )
    ).toBe(false)
  })

  const grouped = createColumns<Well>([
    { id: "name", header: "Name" },
    {
      id: "production",
      header: "Production",
      columns: [
        {
          id: "oil",
          header: "Oil",
          type: "number",
          minWidth: 80,
          maxWidth: 300,
        },
        { id: "gas", header: "Gas", type: "number" },
      ],
    },
    {
      id: "status",
      header: "Status",
      type: "options",
      options: STATUS,
      groupable: false,
    },
    {
      id: "custom",
      header: "Custom",
      filter: (item, value) =>
        value.type === "custom" && item.name === value.value,
    },
    { id: "fixed", header: "Fixed", sortable: false, filterable: false },
  ])
  const groupedDefaults = createDefaultView(grouped, undefined, ALL)
  const reconcile = (partial: unknown, capabilities = ALL) =>
    reconcileView(
      grouped,
      partial as DataTablePartialView,
      groupedDefaults,
      capabilities
    )

  it("starts from empty defaults in definition order", () => {
    expect(groupedDefaults).toEqual({
      sorting: [],
      search: "",
      filters: {},
      grouping: [],
      columns: {
        order: ["name", "oil", "gas", "status", "custom", "fixed"],
        hidden: [],
        widths: {},
        pinned: { start: [], end: [] },
      },
    })
  })

  it("merges a deep partial defaultView", () => {
    const view = createDefaultView(
      grouped,
      {
        sorting: [{ column: "oil", direction: "descending" }],
        columns: { pinned: { start: ["name"] }, hidden: ["gas"] },
      },
      ALL
    )
    expect(view.sorting).toEqual([{ column: "oil", direction: "descending" }])
    expect(view.columns.pinned).toEqual({ start: ["name"], end: [] })
    expect(view.columns.hidden).toEqual(["gas"])
    expect(view.columns.order).toEqual(groupedDefaults.columns.order)
    expect(view.search).toBe("")
  })

  it("ignores unknown ids and places missing columns at their default position", () => {
    const view = reconcile({
      columns: {
        order: ["fixed", "ghost", "name", "fixed"],
        hidden: ["ghost", "gas", "gas"],
      },
    })
    expect(view.columns.order).toEqual([
      "fixed",
      "name",
      "oil",
      "gas",
      "status",
      "custom",
    ])
    expect(view.columns.hidden).toEqual(["gas"])
  })

  it("keeps a group's columns together", () => {
    const view = reconcile({
      columns: { order: ["oil", "name", "status", "gas"] },
    })
    expect(view.columns.order).toEqual([
      "oil",
      "gas",
      "name",
      "status",
      "custom",
      "fixed",
    ])
    const inside = reconcile({ columns: { order: ["gas", "oil", "name"] } })
    // The columns left out follow the one before them by default (status
    // after gas, custom after status...); the group then stays together.
    expect(inside.columns.order).toEqual([
      "gas",
      "oil",
      "status",
      "custom",
      "fixed",
      "name",
    ])
  })

  it("drops sorting on unknown, unsortable or repeated columns", () => {
    const view = reconcile({
      sorting: [
        { column: "oil", direction: "descending" },
        { column: "ghost", direction: "ascending" },
        { column: "fixed", direction: "ascending" },
        { column: "oil", direction: "ascending" },
        { column: "name", direction: "sideways" },
        null,
        { column: "gas", direction: "ascending" },
      ],
    })
    expect(view.sorting).toEqual([
      { column: "oil", direction: "descending" },
      { column: "gas", direction: "ascending" },
    ])
    expect(
      reconcile(
        { sorting: [{ column: "oil", direction: "ascending" }] },
        { ...ALL, sortable: false }
      ).sorting
    ).toEqual([])
  })

  it("drops filters the column cannot apply", () => {
    const view = reconcile({
      filters: {
        name: { type: "text", values: ["well"] },
        oil: { type: "text", values: ["12"] },
        gas: { type: "number", ranges: [{ min: Number.NaN, max: 5 }] },
        status: { type: "options", values: ["producing", 4] },
        fixed: { type: "text", values: ["x"] },
        ghost: { type: "text", values: ["x"] },
        custom: { type: "custom", value: "Well A-2" },
      },
    })
    expect(view.filters).toEqual({
      name: { type: "text", values: ["well"] },
      gas: { type: "number", ranges: [{ max: 5 }] },
      status: { type: "options", values: ["producing"] },
      custom: { type: "custom", value: "Well A-2" },
    })
  })

  it("keeps a number filter's exclusive flags only as true, with their bound", () => {
    const view = reconcile({
      filters: {
        oil: { type: "number", ranges: [{ min: 1, minExclusive: true }] },
        gas: {
          type: "number",
          ranges: [{ max: 5, minExclusive: true, maxExclusive: 1 }],
        },
        name: { type: "text", values: ["x"] },
      },
    })
    expect(view.filters.oil).toEqual({
      type: "number",
      ranges: [{ min: 1, minExclusive: true }],
    })
    expect(view.filters.gas).toEqual({ type: "number", ranges: [{ max: 5 }] })
    const kept = {
      type: "number" as const,
      ranges: [{ min: 1, maxExclusive: undefined }],
    }
    expect(reconcile({ filters: { oil: kept } }).filters.oil).toBe(kept)
  })

  it("compares number filters with their exclusive flags", () => {
    const a = { type: "number" as const, ranges: [{ min: 1 }] }
    expect(sameFilterValue(a, { type: "number", ranges: [{ min: 1 }] })).toBe(
      true
    )
    expect(
      sameFilterValue(a, {
        type: "number",
        ranges: [{ min: 1, minExclusive: true }],
      })
    ).toBe(false)
    expect(
      sameFilterValue(
        { type: "number", ranges: [{ max: 1, maxExclusive: true }] },
        { type: "number", ranges: [{ max: 1, maxExclusive: true }] }
      )
    ).toBe(true)
  })

  it("drops empty filters and custom ones without a filter function", () => {
    const view = reconcile({
      filters: {
        name: { type: "text", values: ["  "] },
        oil: { type: "number", ranges: [] },
        status: { type: "options", values: [] },
        gas: { type: "custom", value: 1 },
        custom: null,
      },
    })
    expect(view.filters).toEqual({})
  })

  it("reads date filters back from JSON", () => {
    const dated = createColumns<Well>([
      { id: "spud", header: "Spud", type: "date" },
    ])
    const dates = createDefaultView(dated, undefined, ALL)
    const restored = JSON.parse(
      JSON.stringify({
        filters: {
          spud: {
            type: "date",
            ranges: [{ from: new Date(2024, 0, 1), to: "garbage" }],
          },
        },
      })
    ) as DataTablePartialView
    const view = reconcileView(dated, restored, dates, ALL)
    const filter = view.filters.spud
    expect(filter.type === "date" && filter.ranges[0].from?.getTime()).toBe(
      new Date(2024, 0, 1).getTime()
    )
    expect(filter.type === "date" && filter.ranges[0].to).toBeUndefined()
  })

  it("applies nothing a feature that is off would", () => {
    const view = reconcile(
      {
        search: "well",
        filters: { name: { type: "text", values: ["well"] } },
        grouping: ["name"],
      },
      { sortable: true, filterable: false, groupable: false }
    )
    expect(view.search).toBe("")
    expect(view.filters).toEqual({})
    expect(view.grouping).toEqual([])
    expect(
      reconcile({ grouping: ["status", "name", "name", "ghost"] }).grouping
    ).toEqual(["name"])
  })

  it("clamps widths and pins a column to one side", () => {
    const view = reconcile({
      columns: {
        widths: {
          oil: 20,
          gas: 120,
          name: -4,
          ghost: 50,
          status: Number.POSITIVE_INFINITY,
        },
        pinned: { start: ["name", "ghost"], end: ["name", "fixed"] },
      },
    })
    expect(view.columns.widths).toEqual({ oil: 80, gas: 120 })
    expect(view.columns.pinned).toEqual({ start: ["name"], end: ["fixed"] })
    expect(
      reconcile({ columns: { widths: { oil: 900 } } }).columns.widths
    ).toEqual({ oil: 300 })
  })

  it("never throws on garbage", () => {
    const garbage = [
      null,
      undefined,
      {
        sorting: "oil",
        filters: 3,
        grouping: {},
        search: 5,
        columns: {
          order: null,
          hidden: "x",
          widths: null,
          pinned: { start: 1 },
        },
      },
      { filters: { name: "well" }, columns: null },
    ]
    for (const input of garbage) {
      const view = reconcile(input)
      expect(view.columns.order).toEqual(groupedDefaults.columns.order)
      expect(view.sorting).toEqual([])
      expect(view.filters).toEqual({})
    }
  })

  it("returns a valid view as it is", () => {
    const valid = reconcile({
      sorting: [{ column: "oil", direction: "ascending" }],
      filters: { name: { type: "text", values: ["a"] } },
      columns: {
        hidden: ["gas"],
        widths: { oil: 100 },
        pinned: { start: ["name"] },
      },
    })
    expect(reconcile(valid)).toBe(valid)
    expect(reconcileView(grouped, groupedDefaults, groupedDefaults, ALL)).toBe(
      groupedDefaults
    )
    const changed = reconcile({ ...valid, sorting: [] })
    expect(changed.filters).toBe(valid.filters)
    expect(changed.columns).toBe(valid.columns)
  })

  it("cycles a column's sort: ascending, descending, off", () => {
    let sorting = toggleSorting([], "oil")
    expect(sorting).toEqual([{ column: "oil", direction: "ascending" }])
    sorting = toggleSorting(sorting, "oil")
    expect(sorting).toEqual([{ column: "oil", direction: "descending" }])
    expect(toggleSorting(sorting, "oil")).toEqual([])
    expect(toggleSorting(sorting, "name")).toEqual([
      { column: "name", direction: "ascending" },
    ])
  })

  it("adds and cycles columns of a multi-sort with Shift", () => {
    let sorting = toggleSorting([], "oil")
    sorting = toggleSorting(sorting, "name", { multi: true })
    expect(sorting).toEqual([
      { column: "oil", direction: "ascending" },
      { column: "name", direction: "ascending" },
    ])
    sorting = toggleSorting(sorting, "oil", { multi: true })
    expect(sorting).toEqual([
      { column: "oil", direction: "descending" },
      { column: "name", direction: "ascending" },
    ])
    sorting = toggleSorting(sorting, "oil", { multi: true })
    expect(sorting).toEqual([{ column: "name", direction: "ascending" }])
    // A click without Shift makes the column the only sort.
    expect(toggleSorting(sorting, "name")).toEqual([
      { column: "name", direction: "descending" },
    ])
  })

  it("changes one piece at a time and keeps the view when nothing changes", () => {
    const base = groupedDefaults
    expect(sortColumn(base, "oil").sorting).toEqual([
      { column: "oil", direction: "ascending" },
    ])
    expect(setSorting(base, [])).toBe(base)
    expect(setSearch(base, "")).toBe(base)
    expect(setSearch(base, "well").search).toBe("well")

    const filtered = setFilter(base, "name", { type: "text", values: ["a"] })
    expect(filtered.filters).toEqual({ name: { type: "text", values: ["a"] } })
    expect(setFilter(filtered, "name", { type: "text", values: ["a"] })).toBe(
      filtered
    )
    expect(setFilter(filtered, "name", null).filters).toEqual({})
    expect(setFilter(base, "name", undefined)).toBe(base)

    const cleared = clearFilters(setSearch(filtered, "x"))
    expect([cleared.search, cleared.filters]).toEqual(["", {}])
    expect(clearFilters(base)).toBe(base)

    expect(setGrouping(base, ["name"]).grouping).toEqual(["name"])
    expect(setGrouping(base, [])).toBe(base)
    expect(setColumnOrder(base, base.columns.order)).toBe(base)
    // The columns an order leaves out follow, in their order.
    expect(setColumnOrder(base, ["gas"]).columns.order).toEqual([
      "gas",
      ...base.columns.order.filter((id) => id !== "gas"),
    ])

    const hidden = setColumnHidden(base, "gas", true)
    expect(hidden.columns.hidden).toEqual(["gas"])
    expect(setColumnHidden(hidden, "gas", true)).toBe(hidden)
    expect(setColumnHidden(hidden, "gas", false).columns.hidden).toEqual([])

    const wide = setColumnWidth(base, "oil", 200)
    expect(wide.columns.widths).toEqual({ oil: 200 })
    expect(setColumnWidth(wide, "oil", 200)).toBe(wide)
    expect(setColumnWidth(wide, "oil", null).columns.widths).toEqual({})
    expect(setColumnWidth(base, "oil", null)).toBe(base)

    const pinned = setColumnPinned(
      setColumnPinned(base, "name", "start"),
      "gas",
      "start"
    )
    expect(pinned.columns.pinned).toEqual({ start: ["name", "gas"], end: [] })
    const moved = setColumnPinned(pinned, "name", "end")
    expect(moved.columns.pinned).toEqual({ start: ["gas"], end: ["name"] })
    expect(setColumnPinned(moved, "name", "end")).toBe(moved)
    expect(setColumnPinned(moved, "name", null).columns.pinned).toEqual({
      start: ["gas"],
      end: [],
    })

    const reset = resetColumns(moved, base)
    expect(reset.columns).toBe(base.columns)
    expect(resetColumns(base, base)).toBe(base)
  })

  it("tells when the matching rows change and the page resets", () => {
    const base = groupedDefaults
    expect(viewMatchesChanged(base, setSearch(base, " "))).toBe(false)
    expect(viewMatchesChanged(base, setSearch(base, "a"))).toBe(true)
    expect(
      viewMatchesChanged(
        base,
        setFilter(base, "oil", { type: "number", ranges: [{ min: 1 }] })
      )
    ).toBe(true)
    expect(viewMatchesChanged(base, sortColumn(base, "oil"))).toBe(false)
    expect(shouldResetPage(base, sortColumn(base, "oil"))).toBe(true)
    expect(shouldResetPage(base, setGrouping(base, ["name"]))).toBe(true)
    expect(
      shouldResetPage(
        base,
        setFilter(base, "oil", { type: "number", ranges: [{ min: 1 }] })
      )
    ).toBe(true)
    expect(shouldResetPage(base, setColumnHidden(base, "gas", true))).toBe(
      false
    )
    expect(
      shouldResetPage(base, { ...base, filters: { ...base.filters } })
    ).toBe(false)
  })
})

describe("layoutColumns", () => {
  it("orders pinned columns first and last, by the view's order", () => {
    const v = view({
      columns: {
        order: ["oil", "status", "name", "operator", "spud", "active"],
        hidden: ["spud"],
        pinned: { start: ["name", "oil"], end: ["status"] },
        widths: { oil: 140 },
      },
    })
    const layout = layoutColumns(columns, v)
    expect(layout.columns.map((column) => column.id)).toEqual([
      "oil",
      "name",
      "operator",
      "active",
      "status",
    ])
    expect([layout.pinnedStart, layout.pinnedEnd]).toEqual([2, 1])
    expect(layout.hidden.map((column) => column.id)).toEqual(["spud"])
    expect(layout.width("oil")).toBe(140)
    expect(layout.width("name")).toBeUndefined()
    expect(layout.headerRows).toHaveLength(1)
    expect(layoutColumns(columns, v)).toBe(layout)
  })

  it("moves the row header to the first shown column when it is hidden", () => {
    expect(layoutColumns(columns, defaults).rowHeader).toBe("name")
    expect(
      layoutColumns(columns, view({ columns: { hidden: ["name"] } })).rowHeader
    ).toBe("operator")
    // Never every column: the first in the order stays, and names the rows.
    expect(
      layoutColumns(
        columns,
        view({ columns: { hidden: definitions.map((d) => d.id) } })
      ).rowHeader
    ).toBe(definitions[0].id)
  })
})

describe("engine: sorting", () => {
  const sorted = (
    sorting: DataTableView["sorting"],
    input: Partial<DataTableEngineInput<Well>> = {}
  ) => ids(run({ view: view({ sorting }), ...input }).rows)

  it("keeps the data order without sorting", () => {
    expect(sorted([])).toEqual(["A-10", "A-2", "B-1", "a-1"])
  })

  it("sorts text naturally and case-insensitively", () => {
    expect(sorted([{ column: "name", direction: "ascending" }])).toEqual([
      "a-1",
      "A-2",
      "A-10",
      "B-1",
    ])
    expect(sorted([{ column: "name", direction: "descending" }])).toEqual([
      "B-1",
      "A-10",
      "A-2",
      "a-1",
    ])
  })

  it("sorts numbers, with no value last in either direction", () => {
    expect(sorted([{ column: "oil", direction: "ascending" }])).toEqual([
      "B-1",
      "A-10",
      "a-1",
      "A-2",
    ])
    expect(sorted([{ column: "oil", direction: "descending" }])).toEqual([
      "a-1",
      "A-10",
      "B-1",
      "A-2",
    ])
  })

  it("sorts dates chronologically, ISO strings included", () => {
    expect(sorted([{ column: "spud", direction: "ascending" }])).toEqual([
      "a-1",
      "A-2",
      "A-10",
      "B-1",
    ])
    expect(sorted([{ column: "spud", direction: "descending" }])).toEqual([
      "A-10",
      "A-2",
      "a-1",
      "B-1",
    ])
  })

  it("sorts booleans false before true and options by their order", () => {
    expect(sorted([{ column: "active", direction: "ascending" }])).toEqual([
      "A-10",
      "A-2",
      "a-1",
      "B-1",
    ])
    expect(sorted([{ column: "status", direction: "ascending" }])).toEqual([
      "A-10",
      "A-2",
      "a-1",
      "B-1",
    ])
    expect(sorted([{ column: "status", direction: "descending" }])).toEqual([
      "B-1",
      "A-2",
      "a-1",
      "A-10",
    ])
  })

  it("sorts by several columns, the first deciding", () => {
    expect(
      sorted([
        { column: "status", direction: "ascending" },
        { column: "oil", direction: "descending" },
      ])
    ).toEqual(["A-10", "a-1", "A-2", "B-1"])
  })

  it("uses a column's compare in place of its type's order", () => {
    const byLength = createColumns<Well>([
      {
        id: "name",
        header: "Name",
        compare: (a, b) => a.operator.length - b.operator.length,
      },
    ])
    const engine = createDataTableEngine<Well>()
    const result = engine.run({
      items: wells,
      columns: byLength,
      view: {
        ...createDefaultView(byLength),
        sorting: [{ column: "name", direction: "ascending" }],
      },
    })
    expect(ids(result.rows)).toEqual(["A-10", "A-2", "B-1", "a-1"])
    const descending = engine.run({
      items: wells,
      columns: byLength,
      view: {
        ...createDefaultView(byLength),
        sorting: [{ column: "name", direction: "descending" }],
      },
    })
    // Equal operators (Équinor, Equinor) keep their order.
    expect(ids(descending.rows)).toEqual(["A-2", "B-1", "a-1", "A-10"])
  })

  it("does not sort while the root is not sortable, or for an unreconciled view", () => {
    expect(
      sorted([{ column: "oil", direction: "ascending" }], { sortable: false })
    ).toEqual(["A-10", "A-2", "B-1", "a-1"])
    const result = run({
      view: {
        ...defaults,
        sorting: [{ column: "ghost", direction: "ascending" }],
      },
    })
    expect(ids(result.rows)).toEqual(["A-10", "A-2", "B-1", "a-1"])
  })

  it("orders natural keys digits-first and by number", () => {
    const keys = ["a10", "ab", "a2", "a", "a02b", "b", "A1"].map(
      (text) => [text, naturalKey(text)] as const
    )
    keys.sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0))
    expect(keys.map(([text]) => text)).toEqual([
      "a",
      "A1",
      "a2",
      "a02b",
      "a10",
      "ab",
      "b",
    ])
  })
})

describe("engine: memoization", () => {
  it("returns the same model while nothing changes", () => {
    const engine = createDataTableEngine<Well>()
    const v = view({
      sorting: [{ column: "oil", direction: "ascending" }],
      filters: { name: { type: "text", values: ["well"] } },
    })
    const first = run({ view: v }, engine)
    expect(run({ view: v }, engine)).toBe(first)
    // An equal view made anew, and new inline functions, redo nothing.
    const copy = JSON.parse(JSON.stringify(v)) as DataTableView
    expect(
      run(
        { view: copy, itemToId: (w) => w.id, isItemDisabled: () => false },
        engine
      )
    ).toBe(first)
    expect(
      run({ view: v, pagination: { page: 1, pageSize: 2 } }, engine)
    ).not.toBe(first)
  })

  it("keeps the rows when only the page changes", () => {
    const engine = createDataTableEngine<Well>()
    const first = run({ pagination: { page: 1, pageSize: 2 } }, engine)
    const second = run({ pagination: { page: 2, pageSize: 2 } }, engine)
    expect(second.allRows).toBe(first.allRows)
    expect(ids(second.rows)).toEqual(["B-1", "a-1"])
  })

  it("rebuilds for new items, columns or locale", () => {
    const engine = createDataTableEngine<Well>()
    const first = run({}, engine)
    expect(run({ items: [...wells] }, engine)).not.toBe(first)
    const next = run({ items: [...wells, well("C-1")] }, engine)
    expect(next.itemCount).toBe(5)
    const other = createColumns<Well>(definitions)
    expect(
      run(
        { items: wells, columns: other, view: createDefaultView(other) },
        engine
      ).itemCount
    ).toBe(4)
  })
})

describe("engine: search", () => {
  const search = (
    query: string,
    input: Partial<DataTableEngineInput<Well>> = {}
  ) => ids(run({ view: view({ search: query }), ...input }).rows)

  it("matches any shown column's text, ignoring case and accents", () => {
    expect(search("equinor")).toEqual(["A-2", "B-1"])
    expect(search("ÉQUI")).toEqual(["A-2", "B-1"])
    expect(search("  shell ")).toEqual(["A-10"])
    expect(search("well a-")).toEqual(["A-10", "A-2", "a-1"])
    expect(search("nothing like it")).toEqual([])
    expect(search("   ")).toEqual(["A-10", "A-2", "B-1", "a-1"])
  })

  it("matches options by label and numbers and dates as formatted", () => {
    expect(search("shut in")).toEqual(["B-1"])
    expect(search("1,234.5")).toEqual(["a-1"])
    expect(search("1.234,5", { locale: "de-DE" })).toEqual(["a-1"])
    expect(search("jun 1, 2023")).toEqual(["A-2"])
  })

  it("matches Arabic-Indic digits typed as ASCII ones", () => {
    // ar-EG writes 1234.5 with Arabic-Indic digits: ١٬٢٣٤٫٥.
    expect(new Intl.NumberFormat("ar-EG").format(1234.5)).toMatch(
      /^[\u0660-\u0669]/
    )
    expect(
      ids(run({ view: view({ search: "234" }), locale: "ar-EG" }).rows)
    ).toEqual(["a-1"])
    expect(
      ids(
        run({ view: view({ search: "\u0662\u0663\u0664" }), locale: "ar-EG" })
          .rows
      )
    ).toEqual(["a-1"])
  })

  it("does not search hidden, boolean or unfilterable columns", () => {
    expect(
      search("shell", {
        view: view({ search: "shell", columns: { hidden: ["operator"] } }),
      })
    ).toEqual([])
    expect(search("yes")).toEqual([])
    const unfilterable = createColumns<Well>([
      { id: "name", header: "Name" },
      { id: "operator", header: "Operator", filterable: false },
    ])
    const result = createDataTableEngine<Well>().run({
      items: wells,
      columns: unfilterable,
      view: reconcileView(
        unfilterable,
        { search: "shell" },
        createDefaultView(unfilterable),
        ALL
      ),
    })
    expect(result.rows).toEqual([])
  })

  it("reports filtering and counts", () => {
    const result = run({ view: view({ search: "equinor" }) })
    expect(result.filtering).toBe(true)
    expect([result.itemCount, result.matchingCount, result.rowCount]).toEqual([
      4, 2, 2,
    ])
    expect(run().filtering).toBe(false)
  })
})

describe("engine: filters", () => {
  const filter = (filters: DataTableView["filters"]) =>
    ids(run({ view: view({ filters }) }).rows)

  it("filters text by contains", () => {
    expect(filter({ operator: { type: "text", values: ["equi"] } })).toEqual([
      "A-2",
      "B-1",
    ])
  })

  it("matches any item of a filter's list", () => {
    // Text: contains any of them, folded alike.
    expect(
      filter({ operator: { type: "text", values: ["EQUI", "shell"] } })
    ).toEqual(["A-10", "A-2", "B-1"])
    expect(
      filter({ operator: { type: "text", values: ["equi", "  "] } })
    ).toEqual(["A-2", "B-1"])
    // Numbers and dates: within any range.
    expect(
      filter({
        oil: {
          type: "number",
          ranges: [{ max: 50, maxExclusive: true }, { min: 301 }],
        },
      })
    ).toEqual(["a-1"])
    expect(
      filter({
        oil: { type: "number", ranges: [{ max: 50 }, { min: 301 }] },
      })
    ).toEqual(["B-1", "a-1"])
    expect(
      filter({
        spud: {
          type: "date",
          ranges: [
            { to: new Date(2022, 2, 4) },
            { from: new Date(2023, 5, 1), to: new Date(2023, 5, 1) },
          ],
        },
      })
    ).toEqual(["A-2", "a-1"])
    // Yes or no: every row with a value.
    expect(
      filter({ active: { type: "boolean", values: [true, false] } })
    ).toEqual(["A-10", "A-2", "a-1"])
  })

  it("filters numbers by an inclusive range, without empty values", () => {
    expect(
      filter({ oil: { type: "number", ranges: [{ min: 50, max: 300 }] } })
    ).toEqual(["A-10", "B-1"])
    expect(filter({ oil: { type: "number", ranges: [{ min: 301 }] } })).toEqual(
      ["a-1"]
    )
    expect(filter({ oil: { type: "number", ranges: [{ max: 50 }] } })).toEqual([
      "B-1",
    ])
  })

  it("leaves an exclusive bound's own number out", () => {
    expect(
      filter({
        oil: { type: "number", ranges: [{ min: 50, minExclusive: true }] },
      })
    ).not.toContain("B-1")
    expect(
      filter({
        oil: {
          type: "number",
          ranges: [{ min: 50, max: 300, minExclusive: true }],
        },
      })
    ).toEqual(["A-10"])
    expect(
      filter({
        oil: {
          type: "number",
          ranges: [{ min: 50, max: 300, maxExclusive: true }],
        },
      })
    ).toEqual(["B-1"])
    expect(
      filter({
        oil: { type: "number", ranges: [{ max: 50, maxExclusive: true }] },
      })
    ).toEqual([])
  })

  it("filters dates by range, a midnight `to` taking in its day", () => {
    expect(
      filter({
        spud: { type: "date", ranges: [{ from: new Date(2023, 0, 1) }] },
      })
    ).toEqual(["A-10", "A-2"])
    expect(
      filter({ spud: { type: "date", ranges: [{ to: new Date(2022, 2, 4) }] } })
    ).toEqual(["a-1"])
    expect(
      filter({
        spud: { type: "date", ranges: [{ to: new Date(2022, 2, 4, 11) }] },
      })
    ).toEqual([])
    expect(
      filter({
        spud: {
          type: "date",
          ranges: [{ from: new Date(2023, 5, 1), to: new Date(2023, 5, 1) }],
        },
      })
    ).toEqual(["A-2"])
  })

  it("filters booleans, leaving out rows with no value, and options by value", () => {
    expect(filter({ active: { type: "boolean", values: [true] } })).toEqual([
      "A-2",
      "a-1",
    ])
    // B-1 has no value: neither Yes nor No.
    expect(filter({ active: { type: "boolean", values: [false] } })).toEqual([
      "A-10",
    ])
    expect(
      filter({ status: { type: "options", values: ["drilling", "shut-in"] } })
    ).toEqual(["A-10", "B-1"])
  })

  it("combines filters and search", () => {
    const result = run({
      view: view({
        search: "well",
        filters: {
          status: { type: "options", values: ["producing"] },
          oil: { type: "number", ranges: [{ min: 1 }] },
        },
      }),
    })
    expect(ids(result.rows)).toEqual(["a-1"])
  })

  it("uses a column's filter function for any filter value", () => {
    const custom = createColumns<Well>([
      { id: "name", header: "Name" },
      {
        id: "heavy",
        header: "Heavy",
        type: "number",
        accessor: "oil",
        filter: (item, value) =>
          value.type === "custom" && (item.oil ?? 0) > Number(value.value),
      },
    ])
    const v = reconcileView(
      custom,
      { filters: { heavy: { type: "custom", value: 200 } } },
      createDefaultView(custom),
      ALL
    )
    const result = createDataTableEngine<Well>().run({
      items: wells,
      columns: custom,
      view: v,
    })
    expect(ids(result.rows)).toEqual(["A-10", "a-1"])
  })
})

describe("engine: tree", () => {
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
    well("field-2", { name: "Oseberg", children: [] }),
    well("field-3", {
      name: "Snorre",
      children: [well("s-1", { name: "Snorre A", operator: "Shell" })],
    }),
  ]
  const runTree = (input: Partial<DataTableEngineInput<Well>> = {}) =>
    run({ items: tree, itemToChildren: (w) => w.children, ...input })

  it("shows children of expanded rows only", () => {
    expect(ids(runTree().rows)).toEqual(["field-1", "field-2", "field-3"])
    const result = runTree({ expanded: ["field-1", "t-1"] })
    expect(ids(result.rows)).toEqual([
      "field-1",
      "t-2",
      "t-1",
      "t-1-l",
      "field-2",
      "field-3",
    ])
    const lateral = items(result.rows).find((row) => row.id === "t-1-l")
    expect(lateral).toMatchObject({
      depth: 2,
      parentId: "t-1",
      posinset: 1,
      setsize: 1,
      hasChildren: false,
      expandable: false,
    })
    expect(items(result.rows)[0]).toMatchObject({
      depth: 0,
      parentId: null,
      posinset: 1,
      setsize: 3,
      expanded: true,
      hasChildren: true,
    })
    // An expanded row without children is not expanded.
    expect(items(runTree({ expanded: ["field-2"] }).rows)[1]).toMatchObject({
      expandable: false,
      expanded: false,
    })
    // An expanded child of a collapsed parent stays out of view.
    expect(ids(runTree({ expanded: new Set(["t-1"]) }).rows)).toEqual([
      "field-1",
      "field-2",
      "field-3",
    ])
  })

  it("sorts each level within its parent", () => {
    const result = runTree({
      expanded: ["field-1"],
      view: view({ sorting: [{ column: "name", direction: "ascending" }] }),
    })
    expect(ids(result.rows)).toEqual([
      "field-2",
      "field-3",
      "field-1",
      "t-1",
      "t-2",
    ])
  })

  it("keeps the ancestors of matches, shown expanded", () => {
    const result = runTree({ view: view({ search: "lateral" }) })
    expect(ids(result.rows)).toEqual(["field-1", "t-1", "t-1-l"])
    // Shown expanded for the match below them.
    expect(
      items(result.rows)
        .filter((row) => row.expanded)
        .map((row) => row.id)
    ).toEqual(["field-1", "t-1"])
    // The ancestors are context: shown, but not matches.
    expect(result.matchingIds()).toEqual(["t-1-l"])
    expect(result.matchingCount).toBe(1)
    expect(items(result.rows).map((row) => row.context)).toEqual([
      true,
      true,
      false,
    ])
    expect(items(result.rows)[1]).toMatchObject({ posinset: 1, setsize: 1 })
    const shell = runTree({
      view: view({
        filters: { operator: { type: "text", values: ["shell"] } },
      }),
    })
    expect(ids(shell.rows)).toEqual(["field-3", "s-1"])
    expect(shell.matchingIds()).toEqual(["s-1"])
    expect(items(runTree().rows).some((row) => row.expanded)).toBe(false)
  })

  it("counts a filtered tree's matches as it filters, not on every run", () => {
    const engine = createDataTableEngine<Well>()
    const input = {
      items: tree,
      itemToChildren: (w: Well) => w.children,
      view: view({ search: "lateral" }),
    }
    expect(run(input, engine).matchingCount).toBe(1)
    // A run that only opens a row reads no row's flags again.
    const reduce = vi.spyOn(Uint8Array.prototype, "reduce")
    const opened = run({ ...input, expanded: ["t-1-l"] }, engine)
    expect(opened.matchingCount).toBe(1)
    expect(reduce).not.toHaveBeenCalled()
    reduce.mockRestore()
  })

  it("flattens deep trees", () => {
    let leaf = well("level-60")
    for (let level = 59; level >= 0; level--)
      leaf = well(`level-${level}`, { children: [leaf] })
    const expanded = Array.from({ length: 61 }, (_, i) => `level-${i}`)
    const result = run({
      items: [leaf],
      itemToChildren: (w) => w.children,
      expanded,
    })
    expect(result.rows).toHaveLength(61)
    expect(result.rows[60]).toMatchObject({
      id: "level-60",
      depth: 60,
      parentId: "level-59",
    })
    expect(result.itemCount).toBe(61)
    const found = run({
      items: [leaf],
      itemToChildren: (w) => w.children,
      view: view({ search: "level-60" }),
    })
    expect(found.rows).toHaveLength(61)
  })

  it("ignores grouping in a tree", () => {
    const result = runTree({
      view: view({ grouping: ["operator"] }),
      expanded: ["field-3"],
    })
    expect(ids(result.rows)).toEqual(["field-1", "field-2", "field-3", "s-1"])
    expect(result.groupKeys()).toEqual([])
  })

  it("lists all items depth first and finds any of them", () => {
    const result = runTree()
    expect(result.allItems().map((w) => w.id)).toEqual([
      "field-1",
      "t-2",
      "t-1",
      "t-1-l",
      "field-2",
      "field-3",
      "s-1",
    ])
    expect(result.item("t-1-l")?.name).toBe("Lateral")
    expect(result.indexOf("t-1-l")).toBe(-1)
    expect(result.indexOf("field-3")).toBe(2)
  })
})

describe("engine: grouping", () => {
  const fleet: Array<Well> = [
    well("1", {
      operator: "Shell",
      oil: 10,
      status: "producing",
      active: true,
    }),
    well("2", {
      operator: "Equinor",
      oil: 20,
      status: "drilling",
      active: false,
    }),
    well("3", {
      operator: "Shell",
      oil: null,
      status: "producing",
      active: true,
    }),
    well("4", { operator: "Aker BP", oil: 40, status: null, active: null }),
    well("5", {
      operator: "Equinor",
      oil: 5,
      status: "producing",
      active: true,
    }),
  ]
  const grouped = (
    partial: DataTablePartialView,
    input: Partial<DataTableEngineInput<Well>> = {}
  ) => run({ items: fleet, view: view(partial), ...input })

  it("puts group rows before their rows, ordered by the column", () => {
    const result = grouped({ grouping: ["operator"] })
    expect(
      groups(result.rows).map((row) => [
        row.text,
        row.count,
        result.groupIds(row.key),
      ])
    ).toEqual([
      ["Aker BP", 1, ["4"]],
      ["Equinor", 2, ["2", "5"]],
      ["Shell", 2, ["1", "3"]],
    ])
    expect(ids(result.rows)).toEqual([
      "group:operator=Aker%20BP",
      "4",
      "group:operator=Equinor",
      "2",
      "5",
      "group:operator=Shell",
      "1",
      "3",
    ])
    expect(groups(result.rows)[1]).toMatchObject({
      depth: 0,
      posinset: 2,
      setsize: 3,
      column: "operator",
      value: "Equinor",
      open: true,
      parentId: null,
    })
    expect(items(result.rows)[1]).toMatchObject({
      depth: 1,
      parentId: "group:operator=Equinor",
      posinset: 1,
      setsize: 2,
    })
  })

  it("orders groups by the sorted direction, rows within by the sort, empty last", () => {
    const result = grouped({
      grouping: ["status"],
      sorting: [
        { column: "status", direction: "descending" },
        { column: "oil", direction: "descending" },
      ],
    })
    expect(groups(result.rows).map((row) => row.text)).toEqual([
      "Producing",
      "Drilling",
      "",
    ])
    expect(ids(result.rows).filter((key) => !key.startsWith("group:"))).toEqual(
      ["1", "5", "3", "2", "4"]
    )
  })

  it('sorts and groups an option `""` as a value when an option has it', () => {
    const blank = createColumns<Well>([
      { id: "name", header: "Well" },
      {
        id: "status",
        header: "Status",
        type: "options",
        options: [
          { value: "producing", label: "Producing" },
          { value: "", label: "Unassigned" },
        ],
      },
    ])
    const list = [
      well("1", { status: null }),
      well("2", { status: "" }),
      well("3", { status: "producing" }),
    ]
    const own = (partial: DataTablePartialView) =>
      createDataTableEngine<Well>().run({
        items: list,
        columns: blank,
        view: reconcileView(
          blank,
          partial,
          createDefaultView(blank, undefined, ALL),
          ALL
        ),
      })
    // In the options' order, no value last.
    const sorted = own({
      sorting: [{ column: "status", direction: "ascending" }],
    })
    expect(ids(sorted.rows)).toEqual(["3", "2", "1"])
    const result = own({ grouping: ["status"] })
    expect(groups(result.rows).map((row) => [row.text, row.count])).toEqual([
      ["Producing", 1],
      ["Unassigned", 1],
      ["", 1],
    ])
  })

  it("nests groups by each grouping column", () => {
    const result = grouped({ grouping: ["status", "operator"] })
    expect(
      groups(result.rows).map((row) => `${row.depth}:${row.text}`)
    ).toEqual([
      "0:Drilling",
      "1:Equinor",
      "0:Producing",
      "1:Equinor",
      "1:Shell",
      "0:",
      "1:Aker BP",
    ])
    const producing = groups(result.rows)[2]
    expect(producing.count).toBe(3)
    const shell = groups(result.rows)[4]
    expect(shell).toMatchObject({
      parentId: producing.key,
      posinset: 2,
      setsize: 2,
    })
    expect(items(result.rows).find((row) => row.id === "1")).toMatchObject({
      depth: 2,
      parentId: shell.key,
    })
  })

  it("computes subtotals with the columns' aggregates", () => {
    const result = grouped({ grouping: ["operator"] })
    const shell = groups(result.rows)[2]
    expect(result.groupAggregates(shell.key)).toEqual({ oil: 10, active: 2 })
    expect(result.groupAggregates(shell.key)).toBe(
      result.groupAggregates(shell.key)
    )
    expect(result.groupIds(shell.key)).toEqual(["1", "3"])
    expect(result.groupItems(shell.key).map((w) => w.id)).toEqual(["1", "3"])
    expect(result.groupIds("group:nothing")).toEqual([])
    expect(result.groupAggregates("group:nothing")).toEqual({
      oil: null,
      active: 0,
    })
  })

  it("keeps closed groups' rows out, and lists every key for collapse all", () => {
    const keys = grouped({ grouping: ["status", "operator"] }).groupKeys()
    expect(keys).toHaveLength(7)
    const producing = keys.find((key) =>
      key.endsWith("status=producing")
    ) as string
    const result = grouped(
      { grouping: ["status", "operator"] },
      { collapsedGroups: [producing] }
    )
    expect(groups(result.rows).find((row) => row.key === producing)?.open).toBe(
      false
    )
    expect(ids(result.rows)).not.toContain("1")
    expect(result.groupKeys()).toEqual(keys)
    const all = grouped(
      { grouping: ["status", "operator"] },
      { collapsedGroups: new Set(keys) }
    )
    expect(all.rows.map((row) => row.kind)).toEqual(["group", "group", "group"])
  })

  it("searches within groups", () => {
    const result = grouped({ grouping: ["operator"], search: "shell" })
    expect(ids(result.rows)).toEqual(["group:operator=Shell", "1", "3"])
  })

  it("groups the rows of server mode in the order they come", () => {
    const result = grouped({ grouping: ["operator"] }, { dataMode: "server" })
    expect(groups(result.rows).map((row) => row.text)).toEqual([
      "Shell",
      "Equinor",
      "Aker BP",
    ])
    expect(result.groupAggregates(groups(result.rows)[0].key).oil).toBe(10)
  })
})

describe("aggregate", () => {
  const model = getColumnModel(columns)
  const oil = model.byId.get("oil") as NonNullable<
    ReturnType<typeof model.byId.get>
  >
  const spud = model.byId.get("spud") as typeof oil
  const active = model.byId.get("active") as typeof oil
  const status = model.byId.get("status") as typeof oil

  it("sums, averages and bounds numbers, skipping empty values", () => {
    expect(aggregate(oil, wells, "sum")).toBe(1584.5)
    expect(aggregate(oil, wells, "avg")).toBeCloseTo(528.1667, 3)
    expect(aggregate(oil, wells, "min")).toBe(50)
    expect(aggregate(oil, wells, "max")).toBe(1234.5)
    expect(aggregate(oil, [], "sum")).toBeNull()
    expect(aggregate(oil, [well("x", { oil: null })], "avg")).toBeNull()
  })

  it("bounds dates as dates", () => {
    expect(aggregate(spud, wells, "min")).toEqual(
      new Date("2022-03-04T12:00:00")
    )
    expect(aggregate(spud, wells, "max")).toEqual(new Date(2024, 0, 15))
  })

  it("counts values that are there, and distinct ones", () => {
    expect(aggregate(active, wells, "count")).toBe(2)
    expect(aggregate(status, wells, "count")).toBe(4)
    expect(aggregate(status, wells, "countDistinct")).toBe(3)
    expect(aggregate(active, wells, "countDistinct")).toBe(2)
    expect(aggregate(spud, [...wells, well("y")], "countDistinct")).toBe(3)
  })

  it("counts a boolean column's trues as its cells read them", () => {
    const lenient = [
      "false",
      "true",
      0,
      1,
      " FALSE ",
    ] as unknown as Array<boolean>
    expect(
      aggregate(
        active,
        lenient.map((value, i) => well(`x${i}`, { active: value })),
        "count"
      )
    ).toBe(2)
  })

  it('counts an option `""` as a value when an option has it', () => {
    const blank = createColumns<Well>([
      {
        id: "status",
        header: "Status",
        type: "options",
        options: [
          { value: "", label: "Unassigned" },
          { value: "producing", label: "Producing" },
        ],
      },
    ])
    const column = getColumnModel(blank).byId.get("status") as typeof oil
    const list = [
      well("x", { status: "" }),
      well("y", { status: "producing" }),
      well("z", { status: null }),
    ]
    expect(aggregate(column, list, "count")).toBe(2)
    expect(aggregate(column, list, "countDistinct")).toBe(2)
    // Without such an option, "" is no value.
    expect(aggregate(status, list, "count")).toBe(1)
  })

  it("calls an aggregate function with the values and items", () => {
    const result = aggregate(
      oil,
      wells,
      (values, list) => `${values.length}/${list.length}`
    )
    expect(result).toBe("4/4")
    expect(
      aggregate(getColumnModel(columns).byId.get("name") as typeof oil, wells)
    ).toBeNull()
  })
})

describe("engine: detail rows, pagination, totals", () => {
  it("follows an expanded row with its detail row", () => {
    const result = run()
    const rows = withDetailRows(
      result.rows,
      new Set(["A-2"]),
      createDetailCache()
    )
    expect(ids(rows)).toEqual(["A-10", "A-2", "detail:A-2", "B-1", "a-1"])
    expect(rows[1]).toMatchObject({ expandable: true, expanded: true })
    expect(rows[0]).toMatchObject({ expandable: true, expanded: false })
    expect(rows[2]).toMatchObject({ kind: "detail", id: "A-2", depth: 0 })
  })

  it("keeps a detail row's and an unchanged row's objects", () => {
    const cache = createDetailCache<Well>()
    const result = run()
    const first = withDetailRows(result.rows, new Set(["A-2"]), cache)
    const again = withDetailRows(result.rows, new Set(["A-2", "B-1"]), cache)
    expect(again[0]).toBe(first[0])
    expect(again[1]).toBe(first[1])
    expect(again[2]).toBe(first[2])
    expect(again[3]).not.toBe(first[3])
  })

  it("does not run again to open a flat list's detail row", () => {
    const engine = createDataTableEngine<Well>()
    const first = run({}, engine)
    expect(run({ expanded: ["A-2"] }, engine)).toBe(first)
  })

  it("pages rows", () => {
    const result = run({ pagination: { page: 1, pageSize: 2 } })
    expect(ids(result.rows)).toEqual(["A-10", "A-2"])
    expect([
      result.page,
      result.pageCount,
      result.displayRowCount,
      result.pageSize,
    ]).toEqual([1, 2, 4, 2])
    const second = run({ pagination: { page: 2, pageSize: 2 } })
    expect(ids(second.rows)).toEqual(["B-1", "a-1"])
    expect(second.pageItems().map((w) => w.id)).toEqual(["B-1", "a-1"])
    expect(second.indexOf("B-1")).toBe(0)
  })

  it("clamps the page and counts one page for no rows", () => {
    expect(run({ pagination: { page: 9, pageSize: 3 } }).page).toBe(2)
    expect(run({ pagination: { page: -2, pageSize: 3 } }).page).toBe(1)
    const empty = run({ items: [], pagination: { page: 3, pageSize: 10 } })
    expect([empty.page, empty.pageCount, empty.rows.length]).toEqual([1, 1, 0])
    expect(run({ pagination: { page: 1, pageSize: 0 } }).pageSize).toBe(10)
  })

  it("has page helpers", () => {
    expect(getPageCount(0, 10)).toBe(1)
    expect(getPageCount(101, 10)).toBe(11)
    expect(clampPage(Number.NaN, 4)).toBe(1)
    expect(clampPage(2.7, 4)).toBe(2)
    expect(clampPage(5, 0)).toBe(1)
    expect(resolvePageSize(20.5)).toBe(20)
    expect(resolvePageSize(undefined)).toBe(10)
  })

  it("totals the matching items", () => {
    const totals = run({ view: view({ search: "equinor" }) }).totals()
    expect(totals).toMatchObject({ kind: "totals", key: "totals", count: 2 })
    expect(totals.aggregates).toEqual({ oil: 50, active: 1 })
    expect(run().totals().aggregates.oil).toBe(1584.5)
  })
})

describe("engine: data and lookups", () => {
  it("handles empty data", () => {
    const result = run({
      items: [],
      view: view({ search: "x", grouping: ["operator"] }),
    })
    expect(result.rows).toEqual([])
    expect(result.matchingIds()).toEqual([])
    expect(result.totals().aggregates).toEqual({ oil: null, active: 0 })
    expect(result.groupKeys()).toEqual([])
  })

  it("handles no columns", () => {
    const none = createColumns<Well>([])
    const result = createDataTableEngine<Well>().run({
      items: wells,
      columns: none,
      view: reconcileView(
        none,
        { search: "well" },
        createDefaultView(none),
        ALL
      ),
    })
    expect(result.rows).toEqual([])
  })

  it("reads ids with itemToId, String(item.id) by default", () => {
    expect(run().matchingIds()).toEqual(["A-10", "A-2", "B-1", "a-1"])
    const result = run({ itemToId: (w) => `well:${w.id}` })
    expect(result.item("well:B-1")?.name).toBe("Well B-1")
    expect(result.item("B-1")).toBeUndefined()
    const anonymous = createDataTableEngine<{ name: string }>().run({
      items: [{ name: "x" }],
      columns: createColumns<{ name: string }>([
        { id: "name", header: "Name" },
      ]),
      view: createDefaultView(
        createColumns<{ name: string }>([{ id: "name", header: "Name" }])
      ),
    })
    expect(anonymous.matchingIds()).toEqual(["undefined"])
  })

  it("keeps going with duplicate item ids", () => {
    const result = run({ items: [well("x"), well("x", { name: "Other" })] })
    expect(result.rows).toHaveLength(2)
    expect(result.itemCount).toBe(2)
  })

  it("tells disabled items, through the latest isItemDisabled", () => {
    const engine = createDataTableEngine<Well>()
    const result = run({ isItemDisabled: (w) => w.active === false }, engine)
    expect(result.isDisabled("A-10")).toBe(true)
    expect(result.isDisabled("A-2")).toBe(false)
    expect(result.isDisabled("ghost")).toBe(false)
    expect(items(result.rows).map((row) => row.disabled)).toEqual([
      true,
      false,
      false,
      false,
    ])
    // Other answers make another model; the same answers keep it.
    expect(run({ isItemDisabled: (w) => w.active === false }, engine)).toBe(
      result
    )
    const all = run({ isItemDisabled: () => true }, engine)
    expect(all).not.toBe(result)
    expect(all.isDisabled("A-2")).toBe(true)
    expect(selectAllIds(all)).toEqual([])
  })

  it("asks the same isItemDisabled again only for other items", () => {
    const engine = createDataTableEngine<Well>()
    const isItemDisabled = vi.fn((w: Well) => w.active === false)
    run({ isItemDisabled }, engine)
    const asked = isItemDisabled.mock.calls.length
    expect(asked).toBeGreaterThan(0)
    run({ isItemDisabled, pagination: { page: 1, pageSize: 2 } }, engine)
    run({ isItemDisabled, expanded: ["A-2"] }, engine)
    expect(isItemDisabled).toHaveBeenCalledTimes(asked)
  })

  it("lists matching and filtered items in display order", () => {
    const result = run({
      view: view({
        sorting: [{ column: "name", direction: "ascending" }],
        search: "a-",
      }),
    })
    expect(result.matchingIds()).toEqual(["a-1", "A-2", "A-10"])
    expect(result.filteredItems().map((w) => w.id)).toEqual([
      "a-1",
      "A-2",
      "A-10",
    ])
    expect(result.allItems()).toHaveLength(4)
  })
})

describe("engine: server mode", () => {
  const server = (input: Partial<DataTableEngineInput<Well>> = {}) =>
    run({ dataMode: "server", ...input })

  it("does not search, filter, sort or page", () => {
    const result = server({
      view: view({
        search: "shell",
        filters: { oil: { type: "number", ranges: [{ min: 1000 }] } },
        sorting: [{ column: "name", direction: "ascending" }],
      }),
      pagination: { page: 3, pageSize: 2 },
      rowCount: 40,
    })
    expect(ids(result.rows)).toEqual(["A-10", "A-2", "B-1", "a-1"])
    expect(result.filtering).toBe(false)
    expect([result.page, result.pageCount, result.rowCount]).toEqual([
      3, 20, 40,
    ])
    expect(server({ pagination: { page: 3, pageSize: 2 } }).rowCount).toBe(4)
  })

  it("expands rows whose children are not loaded yet", () => {
    const tree = [
      well("f", { children: undefined }),
      well("g", { children: [] }),
      well("h", { children: [well("h-1")] }),
    ]
    const result = server({
      items: tree,
      itemToChildren: (w) => w.children,
      expanded: ["f", "h"],
    })
    expect(
      items(result.rows).map((row) => [
        row.id,
        row.expandable,
        row.expanded,
        row.loading,
      ])
    ).toEqual([
      ["f", true, true, true],
      ["g", false, false, false],
      ["h", true, true, false],
      ["h-1", true, false, false],
    ])
  })

  it("counts a loaded subtree as a load, not as rows added, at every level", () => {
    const tree = (children: Array<Well> | undefined) => [
      well("p", { children }),
      well("q", { children: [] }),
    ]
    const input = {
      itemToChildren: (w: Well) => w.children,
      expanded: ["p"],
    }
    const before = server({ ...input, items: tree(undefined) })
    const loaded = server({
      ...input,
      items: tree([
        well("c", { children: [well("g", { children: [well("gg")] })] }),
      ]),
    })
    expect(addedIds(before, loaded)).toEqual([])
    // A row added beside loaded ones, and a new subtree, are additions.
    const more = server({
      ...input,
      items: [
        ...tree([
          well("c", { children: [well("g", { children: [well("gg")] })] }),
          well("d"),
        ]),
        well("r", { children: [well("r-1")] }),
      ],
    })
    expect(addedIds(loaded, more)).toEqual(["d", "r", "r-1"])
  })
})

describe("selection", () => {
  const disabled = (w: Well) => w.active === false

  it("selects every matching row that is not disabled", () => {
    const result = run({
      isItemDisabled: disabled,
      view: view({ search: "well" }),
      pagination: { page: 1, pageSize: 2 },
    })
    expect(selectAllIds(result)).toEqual(["A-2", "B-1", "a-1"])
  })

  it("tells a checkbox's state over ids", () => {
    expect(selectionState([], ["a", "b"])).toBe("none")
    expect(selectionState(["a"], ["a", "b"])).toBe("some")
    expect(selectionState(new Set(["b", "a", "c"]), ["a", "b"])).toBe("all")
    expect(selectionState(["a"], [])).toBe("none")
  })

  it("toggles a set of ids", () => {
    expect(toggleIds(["x", "a"], ["a", "b"])).toEqual(["x", "a", "b"])
    expect(toggleIds(new Set(["x", "a", "b"]), ["a", "b"])).toEqual(["x"])
  })

  it("selects a group's selectable rows", () => {
    const result = run({
      isItemDisabled: disabled,
      view: view({ grouping: ["operator"] }),
    })
    const shell = groups(result.rows).find(
      (row) => row.text === "Shell"
    ) as GroupRow
    // What its checkbox selects: none, every row of it disabled.
    expect(result.groupSelectableIds(shell.key)).toEqual([])
    const equinor = groups(result.rows).find(
      (row) => row.text === "Equinor"
    ) as GroupRow
    expect(result.groupSelectableIds(equinor.key)).toEqual(["B-1"])
    // A group's checkbox over them: none selected, then all.
    const ids = result.groupSelectableIds(equinor.key)
    expect(selectionState([], ids)).toBe("none")
    expect(selectionState(toggleIds([], ids), ids)).toBe("all")
  })

  it("selects all matching in server mode, with exceptions", () => {
    const result = run({
      dataMode: "server",
      isItemDisabled: disabled,
      rowCount: 1000,
    })
    const entered = enterAllMatching(result)
    expect(entered).toEqual({
      value: ["A-2", "B-1", "a-1"],
      allMatching: { except: [] },
    })
    const deselected = setSelectedInAllMatching(
      entered.value,
      entered.allMatching,
      "B-1",
      false
    )
    expect(deselected).toEqual({
      value: ["A-2", "a-1"],
      allMatching: { except: ["B-1"] },
    })
    expect(
      selectedCount(deselected.value, deselected.allMatching, result.rowCount)
    ).toBe(999)
    const reselected = setSelectedInAllMatching(
      deselected.value,
      deselected.allMatching,
      "B-1",
      true
    )
    expect(reselected).toEqual({
      value: ["A-2", "a-1", "B-1"],
      allMatching: { except: [] },
    })
    expect(allMatchingValue(result, deselected.allMatching)).toEqual([
      "A-2",
      "a-1",
    ])
    expect(selectedCount(["a", "b"], null, 1000)).toBe(2)
  })

  it("leaves all matching when search or filters change", () => {
    const allMatching = { except: [] }
    expect(
      allMatchingAfterViewChange(
        defaults,
        sortColumn(defaults, "oil"),
        allMatching
      )
    ).toBe(allMatching)
    expect(
      allMatchingAfterViewChange(
        defaults,
        setSearch(defaults, "x"),
        allMatching
      )
    ).toBeNull()
    expect(
      allMatchingAfterViewChange(
        defaults,
        setFilter(defaults, "oil", { type: "number", ranges: [{ min: 1 }] }),
        allMatching
      )
    ).toBeNull()
    expect(
      allMatchingAfterViewChange(defaults, setSearch(defaults, "x"), null)
    ).toBeNull()
  })
})

describe("toCsv", () => {
  const model = getColumnModel(columns)

  it("writes RFC 4180 records of display text", () => {
    const tricky = [
      well("1", {
        name: 'Say "hi"',
        operator: "Aker, BP",
        oil: 1234.5,
        spud: new Date(2024, 0, 15),
        active: true,
      }),
      well("2", {
        name: "Two\nlines",
        operator: "Shell",
        oil: null,
        spud: null,
        active: false,
        status: "shut-in",
      }),
    ]
    const csv = toCsv(tricky, model.leaves, getFormatter(model, "en-US"))
    expect(csv).toBe(
      [
        "Well,Operator,Status,Oil (bbl/d),Spud date,Active",
        '"Say ""hi""","Aker, BP",Producing,"1,234.5","Jan 15, 2024",Yes',
        '"Two\nlines",Shell,Shut in,,,No',
        "",
      ].join("\r\n")
    )
  })

  it("formats in the locale, and leaves out the header on request", () => {
    const csv = toCsv(
      [wells[3]],
      [model.byId.get("oil"), model.byId.get("active")].flatMap((c) => c ?? []),
      getFormatter(model, "de-DE", { yes: "Ja", no: "Nein" }),
      { header: false }
    )
    expect(csv).toBe('"1.234,5",Ja\r\n')
    expect(toCsv([], [], getFormatter(model, "en-US"), { header: false })).toBe(
      ""
    )
  })
})

/**
 * Stubs `requestIdleCallback`; the returned function runs the callbacks
 * queued (and those they queue), each with a deadline of `steps` steps.
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

describe("sort", () => {
  const model = getColumnModel(columns)
  const column = (id: string) =>
    model.byId.get(id) as NonNullable<ReturnType<typeof model.byId.get>>
  const all = Uint32Array.from(wells.keys())

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("ranks equal values alike and no value last", () => {
    const items = [
      well("1", { name: "a1" }),
      well("2", { name: "A1" }),
      well("3", { name: "a01" }),
      well("4", { name: null as unknown as string }),
    ]
    const { ranks, none } = getRanks(items, column("name"))
    // The same key ("a1"), so the texts themselves decide: A1, a01, a1.
    expect(Array.from(ranks)).toEqual([2, 0, 1, 3])
    expect(none).toBe(3)
    expect(getRanks(items, column("name"))).toBe(
      getRanks(items, column("name"))
    )
    // Equal rows keep their order in either direction.
    const same = [
      well("1", { name: "x" }),
      well("2", { name: "x" }),
      well("3", { name: "x" }),
    ]
    const rows = Uint32Array.from([0, 1, 2])
    for (const descending of [false, true])
      expect(
        Array.from(
          sortRows(same, rows, [{ column: column("name"), descending }])
        )
      ).toEqual([0, 1, 2])
  })

  it("sorts a subset by passes from the last to the first", () => {
    const rows = Uint32Array.from([3, 2, 1, 0])
    const sorted = sortRows(wells, rows, [
      { column: column("operator"), descending: false },
      { column: column("oil"), descending: true },
    ])
    // Équinor sorts with Equinor (accents ignored), after it (by its text).
    expect(Array.from(sorted, (row) => wells[row].id)).toEqual([
      "a-1",
      "B-1",
      "A-2",
      "A-10",
    ])
    expect(sortRows(wells, rows, [])).toBe(rows)
    expect(
      sortRows(wells, Uint32Array.of(2), [
        { column: column("oil"), descending: false },
      ])
    ).toEqual(Uint32Array.of(2))
    expect(
      Array.from(
        sortRows(wells, all, [{ column: column("spud"), descending: true }])
      )
    ).toEqual([0, 1, 3, 2])
  })

  it("warms the sortable columns' ranks in idle time", () => {
    const flush = stubIdle()
    const items = wells.slice()
    const partly = createColumns<Well>([
      { id: "name", header: "Name" },
      { id: "oil", header: "Oil", type: "number" },
      { id: "operator", header: "Operator", sortable: false },
    ])
    const partlyModel = getColumnModel(partly)
    createDataTableEngine<Well>().run({
      items,
      columns: partly,
      view: createDefaultView(partly),
    })
    expect(hasRanks(items, partlyModel.leaves[0])).toBe(false)
    flush()
    expect(partlyModel.leaves.map((leaf) => hasRanks(items, leaf))).toEqual([
      true,
      true,
      false,
    ])
  })

  it("prepares nothing when the table does not sort or filter", () => {
    const callbacks: Array<unknown> = []
    vi.stubGlobal("requestIdleCallback", (callback: unknown) =>
      callbacks.push(callback)
    )
    const items = wells.slice()
    run({ items, sortable: false })
    run({ items: wells.slice(), dataMode: "server" })
    expect(callbacks).toEqual([])
  })
})

describe("engine: search and number columns", () => {
  const priced = createColumns<Well>([
    { id: "name", header: "Name" },
    { id: "oil", header: "Oil", type: "number" },
    {
      id: "value",
      header: "Value",
      type: "number",
      accessor: "oil",
      format: { style: "currency", currency: "EUR", currencyDisplay: "code" },
    },
  ])
  const search = (query: string) =>
    ids(
      createDataTableEngine<Well>().run({
        items: wells,
        columns: priced,
        view: reconcileView(
          priced,
          { search: query },
          createDefaultView(priced),
          ALL
        ),
      }).rows
    )

  it("still finds numbers by digits, and formats that write letters by letters", () => {
    expect(search("300")).toEqual(["A-10"])
    expect(search("eur 1,234")).toEqual(["a-1"])
    expect(search("1,234.5 x")).toEqual([])
  })

  it("finds the text a number column shows as it is", () => {
    const plain = createColumns<Well>([
      { id: "name", header: "Name" },
      { id: "oil", header: "Oil", type: "number" },
    ])
    const shown = (query: string, oil: unknown) =>
      ids(
        createDataTableEngine<Well>().run({
          items: [well("x", { oil: oil as number }), well("y", { oil: 5 })],
          columns: plain,
          view: reconcileView(
            plain,
            { search: query },
            createDefaultView(plain),
            ALL
          ),
        }).rows
      )
    expect(shown("n/a", "N/A")).toEqual(["x"])
    expect(shown("pending", "Pending")).toEqual(["x"])
    // Words still skip a column of numbers alone.
    expect(shown("n/a", 7)).toEqual([])
  })
})
