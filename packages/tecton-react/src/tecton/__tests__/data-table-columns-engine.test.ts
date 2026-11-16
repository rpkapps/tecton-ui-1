import { describe, expect, it } from "vitest"

import {
  createColumns,
  createDefaultView,
  getColumnModel,
  layoutColumns,
  orderSiblings,
  reconcileView,
  sizeColumns,
  siblingsInOrder,
  type DataTableView,
} from "../internal/data-table/engine/index"
import { columnWidth } from "../internal/data-table/engine/sizing"

type Well = { id: string }

const grouped = createColumns<Well>([
  { id: "name", header: "Well" },
  {
    id: "production",
    header: "Production",
    columns: [
      { id: "oil", header: "Oil", type: "number" },
      {
        id: "gases",
        header: "Gases",
        columns: [
          { id: "gas", header: "Gas", type: "number" },
          { id: "co2", header: "CO₂", type: "number" },
        ],
      },
      { id: "water", header: "Water", type: "number" },
    ],
  },
  { id: "operator", header: "Operator", rowHeader: true },
  { id: "status", header: "Status", width: 120, minWidth: 140 },
])
const model = getColumnModel(grouped)
const defaults = createDefaultView(grouped)
const ORDER = ["name", "oil", "gas", "co2", "water", "operator", "status"]

/** A view with the columns' pieces changed. */
function withColumns(columns: Partial<DataTableView["columns"]>) {
  return reconcileView(
    grouped,
    { columns: { ...defaults.columns, ...columns } },
    defaults
  )
}

describe("DataTable engine: column order", () => {
  it("lists a list's columns and groups in the view's order", () => {
    expect(siblingsInOrder(model, ORDER, null)).toEqual([
      "name",
      "production",
      "operator",
      "status",
    ])
    expect(siblingsInOrder(model, ORDER, "production")).toEqual([
      "oil",
      "gases",
      "water",
    ])
    const moved = ["operator", "name", "water", "co2", "gas", "oil", "status"]
    expect(siblingsInOrder(model, moved, "production")).toEqual([
      "water",
      "gases",
      "oil",
    ])
    expect(siblingsInOrder(model, moved, "gases")).toEqual(["co2", "gas"])
  })

  it("moves a group with its columns, and a column within its group", () => {
    expect(
      orderSiblings(model, ORDER, null, [
        "production",
        "name",
        "status",
        "operator",
      ])
    ).toEqual(["oil", "gas", "co2", "water", "name", "status", "operator"])
    expect(
      orderSiblings(model, ORDER, "production", ["water", "oil", "gases"])
    ).toEqual(["name", "water", "oil", "gas", "co2", "operator", "status"])
    // The other lists keep their order.
    const moved = ["status", "name", "oil", "co2", "gas", "water", "operator"]
    expect(orderSiblings(model, moved, "gases", ["gas", "co2"])).toEqual([
      "status",
      "name",
      "oil",
      "gas",
      "co2",
      "water",
      "operator",
    ])
  })

  it("names the next column shown the row header while its own is hidden", () => {
    const layout = (hidden: Array<string>) =>
      layoutColumns(grouped, withColumns({ hidden })).rowHeader
    expect(layout([])).toBe("operator")
    expect(layout(["operator"])).toBe("status")
    expect(layout(["operator", "status"])).toBe("water")
  })

  it("never shares a group's header between pinned and unpinned columns", () => {
    const layout = layoutColumns(
      grouped,
      withColumns({ pinned: { start: ["oil"], end: [] } })
    )
    expect(layout.columns.map((column) => column.id)).toEqual([
      "oil",
      "name",
      "gas",
      "co2",
      "water",
      "operator",
      "status",
    ])
    expect(
      layout.headerRows[0].cells.map((cell) => `${cell.id}:${cell.colSpan}`)
    ).toEqual(["production:1", "null:1", "production:3", "null:2"])
  })
})

describe("DataTable engine: column sizing", () => {
  it("takes the view's width, the column's own, or its content's, within its bounds", () => {
    const layout = layoutColumns(
      grouped,
      withColumns({ widths: { oil: 90, status: 100 } })
    )
    const byId = (id: string) => model.byId.get(id)!
    expect(columnWidth(byId("oil"), layout, {})).toBe(90)
    // The view's width is clamped when reconciled, the column's own here.
    expect(columnWidth(byId("status"), layout, {})).toBe(140)
    expect(columnWidth(byId("gas"), layout, { gas: 73 })).toBe(73)
    // Measured content: at least 48 px, at most 400 px; unmeasured: 150.
    expect(columnWidth(byId("gas"), layout, { gas: 12 })).toBe(48)
    expect(columnWidth(byId("gas"), layout, { gas: 900 })).toBe(400)
    expect(columnWidth(byId("gas"), layout, {})).toBe(150)
    expect(columnWidth(byId("gas"), layout, { gas: 0 })).toBe(150)
  })

  it("stacks pinned columns from their edges, the selection column first", () => {
    const layout = layoutColumns(
      grouped,
      withColumns({ pinned: { start: ["operator"], end: ["name", "status"] } })
    )
    expect(layout.columns.map((column) => column.id)).toEqual([
      "operator",
      "oil",
      "gas",
      "co2",
      "water",
      "name",
      "status",
    ])
    const widths = new Map(
      layout.columns.map((column, index) => [column, 100 + index])
    )
    const sizing = sizeColumns(layout, {
      widthOf: (column) => widths.get(column)!,
      selection: 32,
    })
    expect(sizing.widths).toEqual([100, 101, 102, 103, 104, 105, 106])
    // The last column not pinned takes the space left.
    expect(sizing.filler).toBe(4)
    expect(sizing.selectionPinned).toBe(true)
    expect(sizing.offsets).toEqual([
      32,
      undefined,
      undefined,
      undefined,
      undefined,
      106,
      0,
    ])
    expect(sizing.start).toBe(132)
    expect(sizing.end).toBe(211)
    expect(sizing.total).toBe(32 + 721)
  })

  it("keeps the selection column unpinned while nothing is pinned at the start", () => {
    const layout = layoutColumns(
      grouped,
      withColumns({ pinned: { start: [], end: ["status"] } })
    )
    const sizing = sizeColumns(layout, { widthOf: () => 100, selection: 32 })
    expect(sizing.selectionPinned).toBe(false)
    expect(sizing.start).toBe(0)
    expect(sizing.filler).toBe(5)
  })

  it("never stretches a column with a maxWidth: the one before it, else none", () => {
    const bounded = createColumns<Well>([
      { id: "a", header: "A" },
      { id: "b", header: "B" },
      { id: "c", header: "C", maxWidth: 200 },
    ])
    const layout = layoutColumns(bounded, createDefaultView(bounded))
    const sizing = sizeColumns(layout, {
      widthOf: () => 100,
      selection: undefined,
    })
    expect(sizing.filler).toBe(1)
    const all = createColumns<Well>([
      { id: "a", header: "A", maxWidth: 300 },
      { id: "b", header: "B", maxWidth: 300 },
    ])
    expect(
      sizeColumns(layoutColumns(all, createDefaultView(all)), {
        widthOf: () => 100,
        selection: undefined,
      }).filler
    ).toBe(-1)
  })

  it("bounds widths by a column's own maxWidth only, and at least 48 px", () => {
    const view = withColumns({ widths: { gas: 1500, oil: 20 } })
    expect(view.columns.widths).toEqual({ gas: 1500, oil: 48 })
    const capped = createColumns<Well>([
      { id: "a", header: "A", maxWidth: 300 },
    ])
    expect(
      reconcileView(
        capped,
        { columns: { widths: { a: 900 } } },
        createDefaultView(capped)
      ).columns.widths
    ).toEqual({ a: 300 })
  })
})
