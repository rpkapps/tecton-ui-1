/**
 * Group rows (`groupable`): their fill, no stripes while grouped, and
 * sticky group rows (`sticky-groups.ts`): the cells' classes and offsets
 * per level, the measured levels and the push, and a virtualized body
 * keeping the group row of the row at the top rendered.
 */
import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  DataTable,
  DataTableContent,
  type DataTableContentProps,
  type DataTablePartialView,
  type DataTableProps,
} from "@tecton/react/data-table"

import type { BodyRow } from "../internal/data-table/engine/index"
import { stickyRowsOf } from "../internal/data-table/sticky-groups"
import {
  columns,
  layout,
  scrollable,
  WELLS,
  type Well,
} from "./data-table-fixtures"

afterEach(() => {
  vi.restoreAllMocks()
})

function Wells({
  contentProps,
  ...props
}: Partial<DataTableProps<Well>> & {
  contentProps?: DataTableContentProps<Well>
}) {
  return (
    <DataTable items={WELLS} columns={columns} groupable {...props}>
      <DataTableContent aria-label="Wells" {...contentProps} />
    </DataTable>
  )
}

/** The group row whose label reads `label` ("Field: Gullfaks"). */
const group = (label: string) => {
  const found = [
    ...document.querySelectorAll<HTMLTableRowElement>(
      '[data-slot="data-table-group-row"]'
    ),
  ].filter((tr) => tr.querySelector("th")?.textContent.startsWith(label))
  if (found.length !== 1)
    throw new Error(`${found.length} group rows labelled "${label}"`)
  return found[0]
}
const container = () =>
  document.querySelector<HTMLElement>('[data-slot="table-container"]')!
const push = (row: HTMLElement) =>
  row.style.getPropertyValue("--data-table-group-push")

describe("DataTable group rows' fill and stripes", () => {
  it("fills a group row with the stripes' surface", () => {
    render(<Wells defaultView={{ grouping: ["field"] }} />)
    const row = group("Field: Gullfaks")
    expect(row).toHaveClass("bg-surface-alt", "font-medium")
    expect(row.className).not.toContain("color-mix")
  })

  it("draws no stripes while rows are grouped, and draws them again once they are not", () => {
    function Controlled({ grouping }: { grouping: Array<string> }) {
      const [view, setView] = React.useState<DataTablePartialView>({
        grouping,
      })
      React.useEffect(() => setView({ grouping }), [grouping])
      return <Wells striped view={view} onViewChange={setView} />
    }
    const { rerender } = render(<Controlled grouping={["field"]} />)
    const table = screen.getByRole("treegrid")
    expect(table).not.toHaveAttribute("data-striped")
    rerender(<Controlled grouping={[]} />)
    expect(screen.getByRole("grid")).toHaveAttribute("data-striped", "")
    rerender(<Controlled grouping={["status"]} />)
    expect(screen.getByRole("treegrid")).not.toHaveAttribute("data-striped")
  })
})

describe("DataTable sticky group rows", () => {
  it("sticks the header and every cell of a group row, each level at its own place", () => {
    render(
      <Wells
        selectionMode="multiple"
        pinnableColumns
        defaultView={{
          grouping: ["field", "status"],
          columns: { pinned: { start: ["name"], end: [] } },
        }}
      />
    )
    expect(document.querySelector("thead")).toHaveClass(
      "sticky",
      "top-0",
      "z-10"
    )
    const field = group("Field: Gullfaks")
    // Its first status group.
    const status = field.nextElementSibling as HTMLTableRowElement
    expect(field).toHaveAttribute("aria-level", "1")
    expect(status).toHaveAttribute("aria-level", "2")
    for (const [row, depth, scrolled, pinned] of [
      [field, 0, "z-[7]", "z-[8]"],
      [status, 1, "z-[5]", "z-[6]"],
    ] as const) {
      const cells = [...row.cells]
      for (const cell of cells) {
        expect(cell).toHaveClass("sticky", "bg-inherit")
        expect(cell.style.top).toBe(`var(--data-table-group-top-${depth},0px)`)
        expect(cell.style.scrollMarginTop).toBe(cell.style.top)
        expect(cell.className).toContain(
          "[translate:0_var(--data-table-group-push,0px)]"
        )
      }
      // The selection and label cells are pinned at the start: sideways too,
      // over the scrolled ones.
      const [selection, label, ...rest] = cells
      for (const cell of [selection, label]) {
        expect(cell).toHaveClass(pinned)
        expect(cell.style.insetInlineStart).not.toBe("")
      }
      for (const cell of rest) {
        expect(cell).toHaveClass(scrolled)
        expect(cell.style.insetInlineStart).toBe("")
      }
      // Scrolled to, the row rests where it sticks.
      expect(row.style.scrollMarginTop).toBe(
        `var(--data-table-group-top-${depth},0px)`
      )
    }
    // The item rows rest under every level; the borders are the cells'.
    const table = screen.getByRole("treegrid")
    expect(table).toHaveClass(
      "border-separate",
      "[&>tbody>tr]:scroll-mt-(--data-table-group-clear)",
      "[&>tbody>tr>*]:scroll-mt-(--data-table-group-clear)"
    )
  })

  it("measures where each level sticks and pushes a row up as the next comes", () => {
    // Every row 49 px under a header of 48, from the top of the table.
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(
      function (this: HTMLElement) {
        return this.tagName === "THEAD" ? 48 : this.tagName === "TR" ? 49 : 0
      }
    )
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(
      function (this: HTMLElement) {
        if (this.tagName !== "TR" || !this.closest("tbody")) return 0
        const rows = [...this.closest("tbody")!.rows]
        return 48 + rows.indexOf(this as HTMLTableRowElement) * 49
      }
    )
    render(<Wells defaultView={{ grouping: ["field", "status"] }} />)
    scrollable()
    const frame = container()
    expect(frame.style.getPropertyValue("--data-table-group-top-0")).toBe(
      "48px"
    )
    expect(frame.style.getPropertyValue("--data-table-group-top-1")).toBe(
      "97px"
    )
    expect(frame.style.getPropertyValue("--data-table-group-clear")).toBe(
      "146px"
    )
    const rows = [...document.querySelectorAll("tbody")[0].rows]
    const at = (row: HTMLElement) => 48 + rows.indexOf(row as never) * 49
    const gullfaks = group("Field: Gullfaks")
    const next = group("Field: Snorre")
    // The first status group of Gullfaks, and the one after it.
    const first = rows.find(
      (row) =>
        row.dataset.slot === "data-table-group-row" &&
        row.getAttribute("aria-level") === "2"
    )!
    const second = rows.find(
      (row) =>
        row !== first &&
        rows.indexOf(row) < rows.indexOf(next) &&
        row.dataset.slot === "data-table-group-row" &&
        row.getAttribute("aria-level") === "2"
    )!
    const scrollTo = (top: number) =>
      act(() => {
        frame.scrollTop = top
        fireEvent.scroll(frame)
      })
    // Nothing comes near: nothing is pushed.
    scrollTo(0)
    for (const row of [gullfaks, first, second, next])
      expect(push(row)).toBe("")
    // The second status group 20 px into the first's place (97 to 146):
    // the first goes up by as much; the field stays.
    scrollTo(at(second) - 146 + 20)
    expect(push(first)).toBe("-20px")
    expect(push(gullfaks)).toBe("")
    // The next field 10 px into Gullfaks's place (48 to 97): Gullfaks goes
    // up by 10 px, and the status group stuck under it with it, pushed by
    // the row it sits above.
    scrollTo(at(next) - 97 + 10)
    expect(push(gullfaks)).toBe("-10px")
    expect(Number.parseFloat(push(second))).toBeLessThanOrEqual(-10)
    // Scrolled back up, nothing is pushed.
    scrollTo(0)
    for (const row of [gullfaks, first, second, next])
      expect(push(row)).toBe("")
  })

  it("clears its variables once rows are no longer grouped", () => {
    function Controlled({ grouping }: { grouping: Array<string> }) {
      return <Wells view={{ grouping }} />
    }
    const { rerender } = render(<Controlled grouping={["field"]} />)
    expect(
      container().style.getPropertyValue("--data-table-group-top-0")
    ).not.toBe("")
    rerender(<Controlled grouping={[]} />)
    expect(container().style.getPropertyValue("--data-table-group-top-0")).toBe(
      ""
    )
  })
})

describe("DataTable sticky group rows, virtualized", () => {
  /** 200 wells in four fields of 50, by field. */
  const MANY: Array<Well> = Array.from({ length: 200 }, (_, i) => ({
    ...WELLS[i % WELLS.length],
    id: `m${i + 1}`,
    name: `Well ${String(i + 1).padStart(3, "0")}`,
    field: ["Gullfaks", "Snorre", "Statfjord", "Visund"][Math.floor(i / 50)],
  }))
  const indexOf = (row: HTMLElement) => Number(row.dataset.index)

  it("keeps the group row of the row at the top rendered, in its place, however far its rows scroll", () => {
    layout()
    render(
      <Wells
        items={MANY}
        defaultView={{ grouping: ["field"] }}
        contentProps={{ virtualized: true }}
      />
    )
    scrollable()
    const frame = container()
    const scrollTo = (top: number) =>
      act(() => {
        frame.scrollTop = top
        fireEvent.scroll(frame)
      })
    // Rows of 40 px: row 40 of Gullfaks's 50 at the top, far past its group
    // row and the rows rendered beyond the view.
    scrollTo(40 * 40)
    const rendered = [
      ...document.querySelectorAll<HTMLElement>("tbody tr[data-index]"),
    ]
    const items = rendered.filter(
      (row) => row.dataset.slot !== "data-table-group-row"
    )
    expect(indexOf(items[0])).toBeGreaterThan(20)
    const gullfaks = group("Field: Gullfaks")
    expect(indexOf(gullfaks)).toBe(0)
    // In its place: a spacer stands for the rows between it and the view.
    expect(gullfaks.nextElementSibling).toHaveAttribute(
      "data-slot",
      "table-virtual-spacer"
    )
    // Into Statfjord's rows (row 51 is Snorre's group row, 102 Statfjord's):
    // Statfjord's group row stays, Gullfaks's goes.
    scrollTo(130 * 40)
    expect(indexOf(group("Field: Statfjord"))).toBe(102)
    expect(() => group("Field: Gullfaks")).toThrow()
  })

  it("gives the body the group rows over each row", () => {
    const rows = [
      { kind: "group", depth: 0 },
      { kind: "group", depth: 1 },
      { kind: "item", depth: 2 },
      { kind: "item", depth: 2 },
      { kind: "group", depth: 1 },
      { kind: "item", depth: 2 },
      { kind: "group", depth: 0 },
      { kind: "item", depth: 1 },
    ] as unknown as ReadonlyArray<BodyRow<unknown>>
    const of = stickyRowsOf(rows)
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(of)).toEqual([
      [0],
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 4],
      [0, 4],
      [6],
      [6],
    ])
  })
})
