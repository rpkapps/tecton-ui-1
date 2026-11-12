/**
 * Date filters as calendar days, east of Greenwich (Oslo: UTC+1 in winter,
 * +2 in summer), where a column shown in UTC has its midnights at 01:00 or
 * 02:00 local. Node applies a change of `TZ` at once; each test file runs
 * in its own process, so no other file sees it.
 */
import * as React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterAll, describe, expect, it, vi } from "vitest"

import {
  DataTable,
  DataTableActiveFilters,
  DataTableContent,
  DataTableFilter,
} from "@tecton/react/tecton/data-table"

import {
  createColumns,
  createDataTableEngine,
  createDefaultView,
  reconcileView,
  type DataTableFilterValue,
} from "../internal/data-table/engine"

const zone = process.env.TZ
process.env.TZ = "Europe/Oslo"

afterAll(() => {
  process.env.TZ = zone
})

type Well = { id: string; name: string; spud: Date }

const wells: Array<Well> = [
  {
    id: "before",
    name: "Well A",
    spud: new Date(Date.UTC(2024, 1, 29, 23, 30)),
  },
  { id: "start", name: "Well B", spud: new Date(Date.UTC(2024, 2, 1, 0, 0)) },
  { id: "late", name: "Well C", spud: new Date(Date.UTC(2024, 2, 1, 23, 30)) },
  { id: "next", name: "Well D", spud: new Date(Date.UTC(2024, 2, 2, 0, 0)) },
]

const ALL = { sortable: true, filterable: true, groupable: true }

function matching(
  format: Intl.DateTimeFormatOptions,
  filter: Extract<DataTableFilterValue, { type: "date" }>
) {
  const columns = createColumns<Well>([
    { id: "name", header: "Well" },
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

describe("date filters east of UTC", () => {
  it("runs in a zone ahead of UTC", () => {
    expect(new Date(2024, 2, 1).getTimezoneOffset()).toBe(-60)
  })

  it("keep a day of a column shown in UTC whole, `to` its midnight there", () => {
    const day = new Date(Date.UTC(2024, 2, 1))
    // `from` === `to`: that one day, 23:30 UTC included (00:30 the next
    // day in Oslo), the next UTC midnight not.
    expect(
      matching(
        { dateStyle: "medium", timeZone: "UTC" },
        {
          type: "date",
          from: day,
          to: day,
        }
      )
    ).toEqual(["start", "late"])
  })

  it("keep a local day whole for a column in the local zone", () => {
    const day = new Date(2024, 2, 1)
    // Oslo's March 1: 23:00 UTC on Feb 29 to 23:00 UTC on March 1.
    expect(
      matching({ dateStyle: "medium" }, { type: "date", from: day, to: day })
    ).toEqual(["before", "start"])
  })

  it("keep a `to` that is not a midnight as the instant it is", () => {
    expect(
      matching(
        { dateStyle: "medium", timeZone: "UTC" },
        {
          type: "date",
          to: new Date(Date.UTC(2024, 2, 1, 12)),
        }
      )
    ).toEqual(["before", "start"])
  })
})

describe("DataTableFilter on a date column shown in UTC", () => {
  const columns = createColumns<Well>([
    { id: "name", header: "Well" },
    {
      id: "spud",
      header: "Spud",
      type: "date",
      format: { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" },
    },
  ])

  it("picks days that start at midnight in UTC, and shows them without a time", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    const day = new Date(Date.UTC(2024, 2, 1))
    render(
      <DataTable
        items={wells}
        columns={columns}
        filterable
        defaultView={{
          filters: { spud: { type: "date", from: day, to: day } },
        }}
        onViewChange={onViewChange}
      >
        <DataTableFilter column="spud" />
        <DataTableActiveFilters />
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    // One day: one date, no time, though the column shows times.
    const button = screen.getByRole("button", { name: "Filter by Spud" })
    expect(button).toHaveTextContent("Mar 1, 2024")
    expect(button).not.toHaveTextContent(/–|AM|PM/)
    expect(
      document
        .querySelector('[data-slot="chip"]')
        ?.getAttribute("aria-label") ??
        document.querySelector('[data-slot="chip"]')?.textContent
    ).toBe("Spud: Mar 1, 2024")
    const table = screen.getByRole("grid", { name: "Wells" })
    expect(within(table).getAllByRole("row").slice(1)).toHaveLength(2)
    // The calendar shows that day (in UTC, not Oslo's).
    await user.click(button)
    const grid = await screen.findByRole(
      "grid",
      { name: /March 2024/ },
      // The popover's and the calendar's code, loaded on demand.
      { timeout: 10_000 }
    )
    expect(
      within(grid).getByRole("button", { name: /March 1st.*selected/ })
    ).toBeInTheDocument()
    await user.click(within(grid).getByRole("button", { name: /March 5th/ }))
    await waitFor(() => expect(onViewChange).toHaveBeenCalled())
    const filter = onViewChange.mock.calls.at(-1)?.[0].filters.spud
    expect(filter.from.getTime()).toBe(Date.UTC(2024, 2, 1))
    expect(filter.to.getTime()).toBe(Date.UTC(2024, 2, 5))
    // The calendar's code loads on demand: slow under a full parallel run.
  }, 20_000)
})
