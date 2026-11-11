/**
 * Date-only values west of Greenwich, where reading "2024-03-01" as UTC
 * midnight would show February 29. Node applies a change of `TZ` at once;
 * each test file runs in its own process, so no other file sees it.
 */
import { afterAll, describe, expect, it } from "vitest"

import {
  createColumns,
  createDataTableEngine,
  createDefaultView,
  getColumnModel,
  getFormatter,
  reconcileView,
  type DataTablePartialView,
  type GroupRow,
} from "../internal/data-table/engine"
import { toDate, toTime } from "../internal/data-table/engine/values"

const zone = process.env.TZ
process.env.TZ = "America/Los_Angeles"

afterAll(() => {
  process.env.TZ = zone
})

type Well = { id: string; spud: string | null }

const columns = createColumns<Well>([
  { id: "id", header: "Well" },
  { id: "spud", header: "Spud", type: "date" },
])
const ALL = { sortable: true, filterable: true, groupable: true }
const defaults = createDefaultView(columns, undefined, ALL)
const wells: Array<Well> = [
  { id: "a", spud: "2024-03-01" },
  { id: "b", spud: "2024-02-29" },
  { id: "c", spud: "2024-03-01T23:30:00" },
  { id: "d", spud: "2024-02-30" },
]

describe("date-only strings west of UTC", () => {
  it("runs in a zone behind UTC", () => {
    expect(new Date(2024, 2, 1).getTimezoneOffset()).toBeGreaterThan(0)
  })

  it("are local midnight, and impossible days are no value", () => {
    expect(toTime("2024-03-01")).toBe(new Date(2024, 2, 1).getTime())
    expect(toDate("2024-03-01")?.getDate()).toBe(1)
    expect(toTime("2024-02-30")).toBeUndefined()
    expect(toTime("2024-03-01T12:00:00Z")).toBe(Date.UTC(2024, 2, 1, 12))
  })

  it("show their own day", () => {
    const model = getColumnModel(columns)
    const spud = model.byId.get("spud") as NonNullable<
      ReturnType<typeof model.byId.get>
    >
    expect(getFormatter(model, "en-US").format(spud, "2024-03-01")).toBe(
      "Mar 1, 2024"
    )
  })

  it("filter by their own day, from a view read back from JSON", () => {
    const partial = JSON.parse(
      JSON.stringify({
        filters: {
          spud: { type: "date", from: "2024-03-01", to: "2024-03-01" },
        },
      })
    ) as DataTablePartialView
    const view = reconcileView(columns, partial, defaults, ALL)
    const filter = view.filters.spud
    expect(filter.type === "date" && filter.from?.getTime()).toBe(
      new Date(2024, 2, 1).getTime()
    )
    const result = createDataTableEngine<Well>().run({
      items: wells,
      columns,
      view,
    })
    expect(result.matchingIds()).toEqual(["a", "c"])
  })

  it("group by their own day", () => {
    const view = reconcileView(columns, { grouping: ["spud"] }, defaults, ALL)
    const result = createDataTableEngine<Well>().run({
      items: wells,
      columns,
      view,
    })
    const groups = result.rows.filter(
      (row): row is GroupRow => row.kind === "group"
    )
    expect(groups.map((row) => [row.key, row.count])).toEqual([
      ["group:spud=2024-02-29", 1],
      ["group:spud=2024-03-01", 2],
      ["group:spud=", 1],
    ])
  })
})
