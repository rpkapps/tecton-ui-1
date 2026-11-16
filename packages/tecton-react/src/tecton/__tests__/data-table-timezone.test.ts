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
          spud: {
            type: "date",
            ranges: [{ from: "2024-03-01", to: "2024-03-01" }],
          },
        },
      })
    ) as DataTablePartialView
    const view = reconcileView(columns, partial, defaults, ALL)
    const filter = view.filters.spud
    expect(filter.type === "date" && filter.ranges[0].from?.getTime()).toBe(
      new Date(2024, 2, 1).getTime()
    )
    const result = createDataTableEngine<Well>().run({
      items: wells,
      columns,
      view,
    })
    expect(result.matchingIds()).toEqual(["a", "c"])
  })

  it("filter by the day in the column's time zone, wherever the table runs", () => {
    const zoned = createColumns<Well>([
      { id: "id", header: "Well" },
      {
        id: "spud",
        header: "Spud",
        type: "date",
        format: { dateStyle: "medium", timeZone: "UTC" },
      },
    ])
    const items: Array<Well> = [
      { id: "a", spud: "2024-03-01T12:00:00Z" },
      { id: "b", spud: "2024-03-01T23:59:00Z" },
      { id: "c", spud: "2024-03-02T00:00:00Z" },
      { id: "d", spud: "2024-02-29T23:59:00Z" },
    ]
    const matching = () => {
      const view = reconcileView(
        zoned,
        {
          filters: {
            spud: {
              type: "date",
              ranges: [{ from: "2024-03-01", to: "2024-03-01" }],
            },
          },
        } as unknown as DataTablePartialView,
        createDefaultView(zoned, undefined, ALL),
        ALL
      )
      const filter = view.filters.spud
      return {
        from: filter.type === "date" && filter.ranges[0].from?.toISOString(),
        ids: createDataTableEngine<Well>()
          .run({ items, columns: zoned, view })
          .matchingIds(),
      }
    }
    // Node applies a change of `TZ` at once: the same view in four zones.
    try {
      for (const tz of [
        "UTC",
        "America/New_York",
        "Asia/Tokyo",
        "America/Los_Angeles",
      ]) {
        process.env.TZ = tz
        expect(matching(), tz).toEqual({
          from: "2024-03-01T00:00:00.000Z",
          ids: ["a", "b"],
        })
      }
    } finally {
      process.env.TZ = "America/Los_Angeles"
    }
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

  it("group by their day in the column's time zone, named by the day alone", () => {
    const zoned = createColumns<Well>([
      { id: "id", header: "Well" },
      {
        id: "spud",
        header: "Spud",
        type: "date",
        format: { dateStyle: "long", timeStyle: "short", timeZone: "UTC" },
      },
    ])
    const view = reconcileView(
      zoned,
      { grouping: ["spud"] },
      createDefaultView(zoned, undefined, ALL),
      ALL
    )
    const result = createDataTableEngine<Well>().run({
      items: [
        // 1 March in Los Angeles, 2 March in UTC.
        { id: "a", spud: "2024-03-01T20:00:00-08:00" },
        { id: "b", spud: "2024-03-02T10:00:00Z" },
        { id: "c", spud: "2024-03-01T10:00:00Z" },
      ],
      columns: zoned,
      view,
    })
    const groups = result.rows.filter(
      (row): row is GroupRow => row.kind === "group"
    )
    expect(groups.map((row) => [row.key, row.text, row.count])).toEqual([
      ["group:spud=2024-03-01", "March 1, 2024", 1],
      ["group:spud=2024-03-02", "March 2, 2024", 2],
    ])
    expect(result.textOf("group:spud=2024-03-02")).toBe("March 2, 2024")
  })

  it("group by the part of the day a format shows: a month and year", () => {
    const monthly = createColumns<Well>([
      { id: "id", header: "Well" },
      {
        id: "spud",
        header: "Spud",
        type: "date",
        format: { year: "numeric", month: "short", timeZone: "UTC" },
      },
    ])
    const view = reconcileView(
      monthly,
      { grouping: ["spud"] },
      createDefaultView(monthly, undefined, ALL),
      ALL
    )
    const result = createDataTableEngine<Well>().run({
      items: [
        { id: "a", spud: "2024-03-01T10:00:00Z" },
        { id: "b", spud: "2024-03-31T23:00:00Z" },
        // April in UTC, still March in Los Angeles.
        { id: "c", spud: "2024-04-01T02:00:00Z" },
      ],
      columns: monthly,
      view,
    })
    const groups = result.rows.filter(
      (row): row is GroupRow => row.kind === "group"
    )
    expect(groups.map((row) => [row.key, row.text, row.count])).toEqual([
      ["group:spud=2024-03", "Mar 2024", 2],
      ["group:spud=2024-04", "Apr 2024", 1],
    ])
  })

  it("order the groups of a format without the year by the calendar", () => {
    const run = (
      format: Intl.DateTimeFormatOptions,
      {
        direction,
        locale,
        spuds = [
          // February of an earlier year than January's: by the month.
          "2019-02-10T12:00:00Z",
          "2020-01-15T12:00:00Z",
          "2018-03-01T12:00:00Z",
          null,
        ],
      }: {
        direction?: "ascending" | "descending"
        locale?: string
        spuds?: Array<string | null>
      } = {}
    ) => {
      const dated = createColumns<Well>([
        { id: "id", header: "Well" },
        { id: "spud", header: "Spud", type: "date", format },
      ])
      const view = reconcileView(
        dated,
        {
          grouping: ["spud"],
          sorting: direction ? [{ column: "spud", direction }] : [],
        },
        createDefaultView(dated, undefined, ALL),
        ALL
      )
      return createDataTableEngine<Well>()
        .run({
          items: spuds.map((spud, i) => ({ id: String(i), spud })),
          columns: dated,
          view,
          locale,
        })
        .rows.filter((row): row is GroupRow => row.kind === "group")
        .map((row) => row.text)
    }
    const months = { month: "long", timeZone: "UTC" } as const
    expect(run(months)).toEqual(["January", "February", "March", ""])
    expect(run(months, { direction: "descending" })).toEqual([
      "March",
      "February",
      "January",
      "",
    ])
    // Weekdays from the locale's first day: Sunday 10 Feb, Wednesday 15
    // Jan, Thursday 1 Mar.
    const weekdays = { weekday: "long", timeZone: "UTC" } as const
    expect(run(weekdays, { locale: "en-US" })).toEqual([
      "Sunday",
      "Wednesday",
      "Thursday",
      "",
    ])
    expect(run(weekdays, { locale: "nb-NO" })).toEqual([
      "onsdag",
      "torsdag",
      "søndag",
      "",
    ])
  })

  it("order years before 1000, and before the era, as the calendar does", () => {
    const early = (format: Intl.DateTimeFormatOptions) =>
      createDataTableEngine<{ id: string; spud: Date }>()
        .run({
          items: [
            { id: "a", spud: new Date(Date.UTC(2019, 11, 1)) },
            { id: "b", spud: new Date(Date.UTC(999, 5, 1)) },
            { id: "c", spud: new Date(Date.UTC(-499, 5, 1)) },
            { id: "d", spud: new Date(Date.UTC(-399, 5, 1)) },
          ],
          columns: createColumns<{ id: string; spud: Date }>([
            { id: "id", header: "Well" },
            { id: "spud", header: "Spud", type: "date", format },
          ]),
          view: {
            ...createDefaultView(
              createColumns<{ id: string; spud: Date }>([
                { id: "id", header: "Well" },
              ]),
              undefined,
              ALL
            ),
            grouping: ["spud"],
          },
        })
        .rows.filter((row): row is GroupRow => row.kind === "group")
        .map((row) => row.text)
    // Whole days: by time.
    expect(
      early({
        year: "numeric",
        month: "short",
        day: "numeric",
        era: "short",
        timeZone: "UTC",
      })
    ).toEqual([
      "Jun 1, 500 BC",
      "Jun 1, 400 BC",
      "Jun 1, 999 AD",
      "Dec 1, 2019 AD",
    ])
    // A month and year: the years as numbers, before Christ backwards.
    expect(
      early({ year: "numeric", month: "short", era: "short", timeZone: "UTC" })
    ).toEqual(["Jun 500 BC", "Jun 400 BC", "Jun 999 AD", "Dec 2019 AD"])
    // Without the era, as shown: 400 BC reads as 400.
    expect(early({ year: "numeric", month: "short", timeZone: "UTC" })).toEqual(
      ["Jun 400", "Jun 500", "Jun 999", "Dec 2019"]
    )
  })

  it("name a group by the day of a format with no day of its own", () => {
    const timeOnly = createColumns<Well>([
      { id: "id", header: "Well" },
      {
        id: "spud",
        header: "Spud",
        type: "date",
        format: { timeStyle: "short" },
      },
    ])
    const model = getColumnModel(timeOnly)
    const spud = model.byId.get("spud") as NonNullable<
      ReturnType<typeof model.byId.get>
    >
    const formatter = getFormatter(model, "en-US")
    const item = { id: "a", spud: "2024-03-01T09:30:00" }
    expect(formatter.text(spud, item)).toBe("9:30 AM")
    expect(formatter.groupText(spud, item)).toBe("Mar 1, 2024")
  })
})
