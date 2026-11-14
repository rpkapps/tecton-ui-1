/**
 * Date filters on a day whose midnight the zone skips: in Santiago, summer
 * time starts at 00:00 on 6 September 2026, the clocks going to 01:00, so
 * the day begins at 01:00 (04:00 UTC). Run in that zone, for the local
 * path; Node applies a change of `TZ` at once, and each test file runs in
 * its own process.
 */
import { afterAll, describe, expect, it } from "vitest"

import {
  createColumns,
  createDataTableEngine,
  createDefaultView,
  reconcileView,
  type DataTableFilterValue,
} from "../internal/data-table/engine"
import { dayOf, startOfDay } from "../internal/data-table/engine/values"

const zone = process.env.TZ
process.env.TZ = "America/Santiago"

afterAll(() => {
  process.env.TZ = zone
})

const DAY_START = Date.UTC(2026, 8, 6, 4) // 01:00 -03
type Well = { id: string; spud: Date }
const wells: Array<Well> = [
  // 23:59 on the 5th (-04).
  { id: "before", spud: new Date(Date.UTC(2026, 8, 6, 3, 59)) },
  { id: "first", spud: new Date(DAY_START) },
  { id: "late", spud: new Date(Date.UTC(2026, 8, 7, 2, 59)) }, // 23:59 -03
  { id: "next", spud: new Date(Date.UTC(2026, 8, 7, 3)) }, // 00:00 on the 7th
]
const ALL = { sortable: true, filterable: true, groupable: true }

function matching(
  format: Intl.DateTimeFormatOptions,
  filter: Extract<DataTableFilterValue, { type: "date" }>
) {
  const columns = createColumns<Well>([
    { id: "id", header: "Well" },
    { id: "spud", header: "Spud", type: "date", format },
  ])
  const defaults = createDefaultView(columns, undefined, ALL)
  const view = reconcileView(
    columns,
    { filters: { spud: filter } },
    defaults,
    ALL
  )
  return createDataTableEngine<Well>()
    .run({ items: wells, columns, view })
    .matchingIds()
}

describe("a day without a midnight (America/Santiago, 2026-09-06)", () => {
  it("begins at the jump, in the zone and locally", () => {
    const zoned = startOfDay(2026, 8, 6, "America/Santiago")
    expect(zoned.getTime()).toBe(DAY_START)
    expect(startOfDay(2026, 8, 6).getTime()).toBe(DAY_START)
    for (const timeZone of ["America/Santiago", undefined]) {
      expect(dayOf(new Date(DAY_START), timeZone)).toMatchObject({
        day: 6,
        midnight: true,
      })
      expect(dayOf(new Date(DAY_START - 1), timeZone).day).toBe(5)
      // 02:00 that day is no start of a day.
      expect(dayOf(new Date(DAY_START + 3_600_000), timeZone).midnight).toBe(
        false
      )
    }
  })

  it("is kept whole by a filter of that one day, in the column's zone and in the local zone", () => {
    const day = new Date(DAY_START)
    const filter = { type: "date" as const, ranges: [{ from: day, to: day }] }
    expect(
      matching({ dateStyle: "medium", timeZone: "America/Santiago" }, filter)
    ).toEqual(["first", "late"])
    expect(matching({ dateStyle: "medium" }, filter)).toEqual(["first", "late"])
  })

  it("keeps a `to` that is not the day's first instant as the instant it is", () => {
    expect(
      matching(
        { dateStyle: "medium", timeZone: "America/Santiago" },
        { type: "date", ranges: [{ to: new Date(DAY_START + 3_600_000) }] }
      )
    ).toEqual(["before", "first"])
  })
})
