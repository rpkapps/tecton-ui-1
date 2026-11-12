import * as React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableGroupBy,
  DataTableSearch,
  DataTableToolbar,
  useDataTable,
  type DataTableContentProps,
  type DataTableProps,
} from "@tecton/react/data-table"
import { TectonProvider } from "@tecton/react/provider"

import {
  groupCellsOf,
  groupLabelWidth,
  shownClassName,
} from "../internal/data-table/cell"
import { getColumnModel } from "../internal/data-table/engine"
import { describeRow } from "../internal/data-table/row"
import * as announcer from "../internal/primitives/live-announcer"
import {
  columns,
  focused,
  press,
  row,
  WELLS,
  type Well,
} from "./data-table-fixtures"

function Wells({
  children,
  contentProps,
  ...props
}: Partial<DataTableProps<Well>> & {
  contentProps?: DataTableContentProps<Well>
}) {
  return (
    <DataTable items={WELLS} columns={columns} groupable {...props}>
      {children}
      <DataTableContent aria-label="Wells" {...contentProps} />
    </DataTable>
  )
}

/** The group rows' labels, top to bottom. */
const groups = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-slot="data-table-group-row"] th[scope="row"]:not([class*="hidden"])'
    ),
    (header) => header.querySelector(".truncate")?.textContent
  )
/** The group row of a label ("Field: Gullfaks"), its parts in spans. */
const group = (label: string) => {
  const found = [
    ...document.querySelectorAll<HTMLTableRowElement>(
      '[data-slot="data-table-group-row"]'
    ),
  ].filter((tr) =>
    [...tr.querySelectorAll("th .truncate")].some(
      (span) => span.textContent === label
    )
  )
  if (found.length !== 1)
    throw new Error(`${found.length} group rows labelled "${label}"`)
  return found[0]
}
const groupCheckbox = (label: string) =>
  group(label).querySelector<HTMLElement>(
    '[data-slot="data-table-group-checkbox"]'
  )!
/** The item rows' names, top to bottom. */
const items = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>(
      'tbody tr:not([data-slot="data-table-group-row"]) th[scope="row"]'
    ),
    (header) => header.textContent
  )

let api: ReturnType<typeof useDataTable<Well>> | undefined
function Probe() {
  api = useDataTable<Well>()
  return null
}

afterEach(() => {
  vi.restoreAllMocks()
  api = undefined
})

describe("DataTable grouping", () => {
  it("renders group rows as treegrid rows with a level, a place and an open state", () => {
    render(<Wells defaultView={{ grouping: ["field"] }} />)
    expect(screen.getByRole("treegrid", { name: "Wells" })).toBeInTheDocument()
    // Groups in the order of their values; open by default.
    expect(groups()).toEqual([
      "Field: Gullfaks",
      "Field: Snorre",
      "Field: Statfjord",
      "Field: Visund",
    ])
    const gullfaks = group("Field: Gullfaks")
    expect(gullfaks).toHaveAttribute("aria-level", "1")
    expect(gullfaks).toHaveAttribute("aria-expanded", "true")
    expect(gullfaks).toHaveAttribute("aria-posinset", "1")
    expect(gullfaks).toHaveAttribute("aria-setsize", "4")
    expect(gullfaks).not.toHaveAttribute("aria-selected")
    // Its number of rows; its items under it, one level down.
    expect(gullfaks).toHaveTextContent("6 rows")
    expect(row("Well 01")).toHaveAttribute("aria-level", "2")
    expect(row("Well 01")).toHaveAttribute("aria-posinset", "1")
    expect(row("Well 01")).toHaveAttribute("aria-setsize", "6")
    expect(items().slice(0, 6)).toEqual([
      "Well 01",
      "Well 05",
      "Well 09",
      "Well 13",
      "Well 17",
      "Well 21",
    ])
    // A row header in groups is indented a level, without a chevron's space.
    const header = row("Well 01").querySelector("th")!
    const indent = header.firstElementChild as HTMLElement
    expect(indent.style.paddingInlineStart).toBe("1.25rem")
    expect(indent.querySelector('[aria-hidden="true"]')).toBeNull()
  })

  it("nests groups by each grouping column, the outermost first", () => {
    render(<Wells defaultView={{ grouping: ["status", "field"] }} />)
    expect(groups().slice(0, 5)).toEqual([
      "Status: Producing",
      "Field: Gullfaks",
      "Field: Snorre",
      "Field: Statfjord",
      "Field: Visund",
    ])
    expect(group("Status: Producing")).toHaveAttribute("aria-level", "1")
    const nested = [
      ...document.querySelectorAll('[data-slot="data-table-group-row"]'),
    ][1]
    expect(nested).toHaveAttribute("aria-level", "2")
    expect(nested).toHaveAttribute("aria-setsize", "4")
    expect(row("Well 01")).toHaveAttribute("aria-level", "3")
    const label = nested.querySelector("th > div") as HTMLElement
    expect(label.style.paddingInlineStart).toBe("1.25rem")
  })

  it("sums the aggregate columns in each group row, as the column shows them", () => {
    const sums = createColumns<Well>([
      { id: "name", header: "Well" },
      { id: "field", header: "Field" },
      { id: "depth", header: "Depth (m)", type: "number" },
      { id: "active", header: "Active", type: "boolean" },
      {
        id: "spud",
        header: "Spud date",
        type: "date",
        aggregate: "max",
        format: { dateStyle: "medium", timeZone: "UTC" },
        renderAggregate: (value, { items }) => (
          <span data-testid="latest">
            {value instanceof Date ? value.toISOString().slice(0, 10) : ""}·
            {items.length}
          </span>
        ),
      },
    ])
    render(<Wells columns={sums} defaultView={{ grouping: ["field"] }} />)
    const gullfaks = WELLS.filter((well) => well.field === "Gullfaks")
    const cells = [...group("Field: Gullfaks").cells]
    // The label spans the columns before the first that sums.
    expect(cells[0]).toHaveAttribute("colspan", "2")
    expect(cells[1]).toHaveTextContent(
      gullfaks
        .reduce((sum, well) => sum + (well.depth ?? 0), 0)
        .toLocaleString("en-US")
    )
    expect(cells[1]).toHaveClass("text-end", "tabular-nums")
    // Booleans count their trues.
    expect(cells[2]).toHaveTextContent(
      String(gullfaks.filter((well) => well.active).length)
    )
    const latest = new Date(
      Math.max(...gullfaks.map((well) => well.spud!.getTime()))
    )
    expect(screen.getAllByTestId("latest")[0]).toHaveTextContent(
      `${latest.toISOString().slice(0, 10)}·6`
    )
  })

  it("groups rows without a value under one group, last", () => {
    const items = [
      ...WELLS.slice(0, 3),
      { ...WELLS[3], id: "x", name: "Well X", field: "" },
    ]
    render(<Wells items={items} defaultView={{ grouping: ["field"] }} />)
    expect(groups().at(-1)).toBe("Field: No value")
  })

  it("names a date group by its day in the column's time zone", () => {
    const zoned = createColumns<Well>([
      { id: "name", header: "Well" },
      {
        id: "spud",
        header: "Spud",
        type: "date",
        format: {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Tokyo",
        },
      },
    ])
    // 23:30 UTC on 1 March is 2 March in Tokyo; 14:00 UTC on 2 March too.
    const items = [
      { ...WELLS[0], spud: new Date(Date.UTC(2024, 2, 1, 23, 30)) },
      { ...WELLS[1], spud: new Date(Date.UTC(2024, 2, 2, 14)) },
      { ...WELLS[2], spud: new Date(Date.UTC(2024, 2, 1, 12)) },
    ]
    render(
      <Wells
        columns={zoned}
        items={items}
        defaultView={{ grouping: ["spud"] }}
      />
    )
    // The day alone: the format's time is left out.
    expect(groups()).toEqual(["Spud: Mar 1, 2024", "Spud: Mar 2, 2024"])
    expect(group("Spud: Mar 2, 2024")).toHaveTextContent("2 rows")
  })

  it("leaves out columns that opt out, and grouping in a table that is not groupable", () => {
    const optOut = createColumns<Well>([
      { id: "name", header: "Well" },
      { id: "field", header: "Field", groupable: false },
      { id: "status", header: "Status" },
    ])
    const onViewChange = vi.fn()
    const { unmount } = render(
      <Wells
        columns={optOut}
        view={{ grouping: ["field", "nothing", "status"] }}
        onViewChange={onViewChange}
      >
        <Probe />
      </Wells>
    )
    expect(api?.view.grouping).toEqual(["status"])
    unmount()
    render(
      <Wells groupable={false} defaultView={{ grouping: ["field"] }}>
        <Probe />
      </Wells>
    )
    expect(api?.view.grouping).toEqual([])
    expect(groups()).toEqual([])
  })

  it("orders groups by the grouping column's sort, and rows within them by the view's", () => {
    render(
      <Wells
        defaultView={{
          grouping: ["field"],
          sorting: [
            { column: "field", direction: "descending" },
            { column: "name", direction: "descending" },
          ],
        }}
      />
    )
    expect(groups()).toEqual([
      "Field: Visund",
      "Field: Statfjord",
      "Field: Snorre",
      "Field: Gullfaks",
    ])
    expect(items().slice(0, 3)).toEqual(["Well 20", "Well 16", "Well 12"])
  })

  it("counts and sums the rows the search keeps", () => {
    render(
      <Wells filterable defaultView={{ grouping: ["field"], search: "Well 1" }}>
        <DataTableToolbar>
          <DataTableSearch />
        </DataTableToolbar>
      </Wells>
    )
    // Wells 10–19: Gullfaks has 13 and 17.
    expect(group("Field: Gullfaks")).toHaveTextContent("2 rows")
    const depth = [WELLS[12], WELLS[16]].reduce(
      (sum, well) => sum + (well.depth ?? 0),
      0
    )
    expect(group("Field: Gullfaks")).toHaveTextContent(
      depth.toLocaleString("en-US")
    )
  })

  it("says a group row's count in the locale", () => {
    render(
      <TectonProvider locale="de-DE">
        <Wells defaultView={{ grouping: ["field"] }} />
      </TectonProvider>
    )
    expect(screen.getAllByText(/6 rows|6 Zeilen/).length).toBeGreaterThan(0)
  })
})

describe("DataTable group rows: opening and closing", () => {
  it("opens and closes a group with a click on its row", () => {
    render(<Wells defaultView={{ grouping: ["field"] }} />)
    fireEvent.click(group("Field: Gullfaks"))
    expect(group("Field: Gullfaks")).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("Well 01")).toBeNull()
    expect(
      group("Field: Gullfaks").querySelector(
        '[data-slot="data-table-group-chevron"] svg'
      )
    ).not.toHaveClass("rotate-90")
    fireEvent.click(group("Field: Gullfaks"))
    expect(screen.getByText("Well 01")).toBeInTheDocument()
  })

  it("opens or closes on every click of a quick series, selecting no text", () => {
    render(<Wells defaultView={{ grouping: ["field"] }} />)
    const expanded = () =>
      group("Field: Gullfaks").getAttribute("aria-expanded")
    const states = [1, 2, 3].map((detail) => {
      // The first press may start a selection; the next ones may not.
      const pressed = fireEvent.mouseDown(group("Field: Gullfaks"), { detail })
      expect(pressed).toBe(detail === 1)
      fireEvent.click(group("Field: Gullfaks"), { detail })
      return expanded()
    })
    expect(states).toEqual(["false", "true", "false"])
  })

  it("opens and closes with Right / Left and Enter, and Left goes from a row to its group", () => {
    render(<Wells defaultView={{ grouping: ["field"] }} />)
    act(() => row("Well 05").focus())
    press("ArrowLeft")
    expect(focused()).toBe(group("Field: Gullfaks"))
    press("ArrowLeft")
    expect(group("Field: Gullfaks")).toHaveAttribute("aria-expanded", "false")
    expect(focused()).toBe(group("Field: Gullfaks"))
    press("ArrowRight")
    expect(group("Field: Gullfaks")).toHaveAttribute("aria-expanded", "true")
    press("Enter")
    expect(group("Field: Gullfaks")).toHaveAttribute("aria-expanded", "false")
    press("Enter")
    expect(group("Field: Gullfaks")).toHaveAttribute("aria-expanded", "true")
    // Open: Right goes into the row's first cell.
    press("ArrowRight")
    expect(focused()).toBe(group("Field: Gullfaks").cells[0])
  })

  it("mirrors Right and Left right to left", () => {
    render(
      <TectonProvider direction="rtl">
        <Wells defaultView={{ grouping: ["field"] }} />
      </TectonProvider>
    )
    act(() => group("Field: Gullfaks").focus())
    press("ArrowRight")
    expect(group("Field: Gullfaks")).toHaveAttribute("aria-expanded", "false")
    press("ArrowLeft")
    expect(group("Field: Gullfaks")).toHaveAttribute("aria-expanded", "true")
    expect(
      group("Field: Gullfaks").querySelector(
        '[data-slot="data-table-group-chevron"] svg'
      )
    ).toHaveClass("rtl:-scale-x-100", "rtl:-rotate-90")
  })

  it("expands and collapses every group through useDataTable", () => {
    render(
      <Wells defaultView={{ grouping: ["status", "field"] }}>
        <Probe />
      </Wells>
    )
    act(() => api?.collapseAllGroups())
    expect(groups()).toEqual([
      "Status: Producing",
      "Status: Shut in",
      "Status: Drilling",
    ])
    // Nested groups closed too: opening one shows its groups, closed.
    fireEvent.click(group("Status: Producing"))
    expect(group("Field: Gullfaks")).toHaveAttribute("aria-expanded", "false")
    act(() => api?.expandAllGroups())
    expect(row("Well 01")).toBeInTheDocument()
  })

  it("opens every group again for a new grouping", () => {
    render(
      <Wells defaultView={{ grouping: ["field"] }}>
        <Probe />
      </Wells>
    )
    fireEvent.click(group("Field: Gullfaks"))
    act(() => api?.setGrouping(["status"]))
    act(() => api?.setGrouping(["field"]))
    expect(group("Field: Gullfaks")).toHaveAttribute("aria-expanded", "true")
  })

  it("keeps the expanded rows apart from the open groups", () => {
    const onExpandedChange = vi.fn()
    render(
      <Wells
        defaultView={{ grouping: ["field"] }}
        onExpandedChange={onExpandedChange}
      >
        <Probe />
      </Wells>
    )
    fireEvent.click(group("Field: Gullfaks"))
    act(() => api?.collapseAllGroups())
    expect(onExpandedChange).not.toHaveBeenCalled()
    expect(api?.expanded).toEqual([])
  })

  it("moves focus to the group row that closed over the focused row", () => {
    render(
      <Wells defaultView={{ grouping: ["status", "field"] }}>
        <Probe />
      </Wells>
    )
    act(() => row("Well 05").focus())
    expect(focused()).toBe(row("Well 05"))
    act(() => api?.collapseAllGroups())
    // The outermost group that closed, not the row now in its place.
    expect(focused()).toBe(group("Status: Shut in"))
    expect(group("Status: Shut in")).toHaveAttribute("tabindex", "0")
  })

  it("makes the closed group the tab stop when focus is elsewhere", () => {
    render(
      <>
        <button type="button">Outside</button>
        <Wells defaultView={{ grouping: ["field"] }}>
          <Probe />
        </Wells>
      </>
    )
    act(() => row("Well 09").focus())
    act(() => screen.getByRole("button", { name: "Outside" }).focus())
    act(() => api?.collapseAllGroups())
    expect(group("Field: Gullfaks")).toHaveAttribute("tabindex", "0")
    expect(focused()).toBe(screen.getByRole("button", { name: "Outside" }))
  })
})

describe("DataTable group selection", () => {
  it("selects and clears a group's rows with its checkbox, indeterminate while some are", () => {
    const onValueChange = vi.fn()
    render(
      <Wells
        selectionMode="multiple"
        defaultView={{ grouping: ["field"] }}
        onValueChange={onValueChange}
      />
    )
    const box = groupCheckbox("Field: Gullfaks")
    expect(box).toHaveAttribute("aria-checked", "false")
    expect(box).toHaveAccessibleName(/^Select Field: Gullfaks/)
    fireEvent.click(box)
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["w1", "w5", "w9", "w13", "w17", "w21"],
      expect.objectContaining({ reason: "item-press", allMatching: null })
    )
    expect(groupCheckbox("Field: Gullfaks")).toHaveAttribute(
      "aria-checked",
      "true"
    )
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Well 05" }))
    expect(groupCheckbox("Field: Gullfaks")).toHaveAttribute(
      "aria-checked",
      "mixed"
    )
    // Some selected: the checkbox selects the rest.
    fireEvent.click(groupCheckbox("Field: Gullfaks"))
    expect(groupCheckbox("Field: Gullfaks")).toHaveAttribute(
      "aria-checked",
      "true"
    )
    fireEvent.click(groupCheckbox("Field: Gullfaks"))
    expect(onValueChange).toHaveBeenLastCalledWith([], expect.anything())
  })

  it("selects a group with Space on its row", () => {
    const onValueChange = vi.fn()
    render(
      <Wells
        selectionMode="multiple"
        defaultView={{ grouping: ["status", "field"] }}
        onValueChange={onValueChange}
      />
    )
    act(() => group("Status: Drilling").focus())
    press(" ")
    const [value, details] = onValueChange.mock.calls.at(-1)!
    // Its rows in the order shown: by field within the group.
    expect([...value].sort()).toEqual(
      WELLS.filter((well) => well.status === "drilling")
        .map((well) => well.id)
        .sort()
    )
    expect(value.slice(0, 2)).toEqual(["w9", "w21"])
    expect(details.reason).toBe("keyboard")
  })

  it("leaves out disabled rows, whichever disabledBehavior", () => {
    for (const disabledBehavior of ["all", "selection"] as const) {
      const onValueChange = vi.fn()
      const { unmount } = render(
        <Wells
          selectionMode="multiple"
          disabledBehavior={disabledBehavior}
          isItemDisabled={(well) => well.id === "w5"}
          defaultView={{ grouping: ["field"] }}
          onValueChange={onValueChange}
        />
      )
      fireEvent.click(groupCheckbox("Field: Gullfaks"))
      expect(onValueChange.mock.calls[0][0]).toEqual([
        "w1",
        "w9",
        "w13",
        "w17",
        "w21",
      ])
      // Every row that can be selected is: checked.
      expect(groupCheckbox("Field: Gullfaks")).toHaveAttribute(
        "aria-checked",
        "true"
      )
      unmount()
    }
  })

  it("disables a group's checkbox when none of its rows can be selected", () => {
    render(
      <Wells
        selectionMode="multiple"
        isItemDisabled={(well) => well.field === "Snorre"}
        defaultView={{ grouping: ["field"] }}
      />
    )
    expect(groupCheckbox("Field: Snorre")).toHaveAttribute(
      "aria-disabled",
      "true"
    )
  })

  it("has no group checkbox with single selection", () => {
    render(
      <Wells selectionMode="single" defaultView={{ grouping: ["field"] }} />
    )
    expect(
      document.querySelector('[data-slot="data-table-group-checkbox"]')
    ).toBeNull()
    // The selection column keeps its cell; the label spans Well to Status.
    const cells = [...group("Field: Gullfaks").cells]
    expect(cells).toHaveLength(5)
    expect(cells[0]).toBeEmptyDOMElement()
    expect(cells[1]).toHaveAttribute("colspan", "3")
  })

  it("excepts a group's rows deselected while every matching row is (server mode)", () => {
    const onValueChange = vi.fn()
    render(
      <Wells
        dataMode="server"
        rowCount={500}
        selectionMode="multiple"
        defaultView={{ grouping: ["field"] }}
        onValueChange={onValueChange}
      >
        <Probe />
      </Wells>
    )
    act(() => api?.selectAllMatching())
    expect(groupCheckbox("Field: Gullfaks")).toHaveAttribute(
      "aria-checked",
      "true"
    )
    fireEvent.click(groupCheckbox("Field: Gullfaks"))
    const [value, details] = onValueChange.mock.calls.at(-1)!
    expect(value).not.toContain("w1")
    expect(details.allMatching.except).toEqual([
      "w1",
      "w5",
      "w9",
      "w13",
      "w17",
      "w21",
    ])
    expect(api?.allMatching).not.toBeNull()
    fireEvent.click(groupCheckbox("Field: Gullfaks"))
    expect(onValueChange.mock.calls.at(-1)![1].allMatching.except).toEqual([])
  })
})

describe("DataTable grouping with other features", () => {
  it("counts group rows in a page, and repeats a group continued from the page before", () => {
    render(
      <Wells
        pagination
        defaultPageSize={5}
        defaultPage={2}
        defaultView={{ grouping: ["field"] }}
      />
    )
    // Page 1: Gullfaks and 4 of its rows; page 2 goes on with it, then
    // Snorre's row and 2 of its rows.
    const rows = [...document.querySelectorAll("tbody tr")]
    expect(rows).toHaveLength(6)
    expect(rows[0]).toHaveAttribute("data-slot", "data-table-group-row")
    expect(rows[0]).toHaveTextContent("Field: Gullfaks")
    expect(rows[3]).toHaveTextContent("Field: Snorre")
    expect(items()).toEqual(["Well 17", "Well 21", "Well 03", "Well 07"])
  })

  it("hides the rows' drag handles while grouped", () => {
    render(<Wells reorderableRows defaultView={{ grouping: ["field"] }} />)
    expect(
      document.querySelector('[data-slot="data-table-row-handle"]')
    ).toBeNull()
  })

  it("exports the items in the groups' order, without group rows", async () => {
    render(
      <Wells defaultView={{ grouping: ["field"] }}>
        <Probe />
      </Wells>
    )
    const csv = await api!.exportCsv({ columns: "visible" })
    const lines = csv.trim().split(/\r?\n/)
    expect(lines).toHaveLength(24)
    expect(lines[1].startsWith("Well 01,Gullfaks")).toBe(true)
    expect(lines[2].startsWith("Well 05,Gullfaks")).toBe(true)
  })

  it("keeps a detail row under its row in a group", () => {
    render(
      <Wells
        defaultView={{ grouping: ["field"] }}
        defaultExpanded={["w1"]}
        contentProps={{
          renderDetail: (well: Well) => `Detail of ${well.name}`,
        }}
      />
    )
    const detail = screen.getByText("Detail of Well 01").closest("tr")!
    expect(detail).toHaveAttribute("aria-level", "3")
    expect(row("Well 01")).toHaveAttribute("aria-expanded", "true")
    fireEvent.click(group("Field: Gullfaks"))
    expect(screen.queryByText("Detail of Well 01")).toBeNull()
  })

  it("draws pinned group cells on the row's own fill", () => {
    render(
      <Wells
        pinnableColumns
        defaultView={{
          grouping: ["field"],
          columns: { pinned: { start: ["name"], end: ["active"] } },
        }}
      />
    )
    const cells = [...group("Field: Gullfaks").cells]
    expect(group("Field: Gullfaks")).toHaveClass("bg-table-header")
    expect(cells[0]).toHaveClass("sticky", "bg-inherit")
    expect(cells.at(-1)).toHaveClass("sticky", "bg-inherit")
    // The label stays within the pinned columns.
    expect(cells[0]).not.toHaveAttribute("colspan")
    // The pinned edges' divider and shadow, the label's content unclipped
    // (its band bridging the start's divider while it runs on past it).
    expect(cells[0]).toHaveClass("border-e", "border-e-transparent")
    expect(cells[0]).not.toHaveClass("overflow-clip")
    expect(cells.at(-1)).toHaveClass("border-s", "border-s-border")
  })

  it("draws the pinned columns' dividers through a detail row, under its content", () => {
    render(
      <Wells
        pinnableColumns
        defaultExpanded={["w1"]}
        defaultView={{
          columns: { pinned: { start: ["name"], end: ["active"] } },
        }}
        contentProps={{
          renderDetail: (well: Well) => `Detail of ${well.name}`,
        }}
      />
    )
    const content = screen.getByText("Detail of Well 01")
    expect(content).toHaveClass("relative")
    const lines = [...content.parentElement!.querySelectorAll("[aria-hidden]")]
    expect(lines.map((line) => line.className)).toEqual([
      expect.stringContaining(
        "start-[calc(var(--data-table-pinned-start)-1px)]"
      ),
      expect.stringContaining("end-[calc(var(--data-table-pinned-end)-1px)]"),
    ])
  })

  it("gives the label a second cell below the breakpoint of a first column hidden there", () => {
    const narrow = createColumns<Well>([
      { id: "name", header: "Well", hideBelow: "md" },
      { id: "field", header: "Field" },
      { id: "depth", header: "Depth", type: "number" },
    ])
    render(<Wells columns={narrow} defaultView={{ grouping: ["field"] }} />)
    const gullfaks = group("Field: Gullfaks")
    const cells = [...gullfaks.cells]
    expect(cells[0]).toHaveClass("hidden", "md:table-cell")
    expect(cells[0]).toHaveAttribute("colspan", "2")
    expect(cells[1]).toHaveClass("md:hidden")
    expect(cells[1]).not.toHaveAttribute("colspan")
    expect(cells[2]).toHaveClass("text-end")
  })
})

describe("groupCellsOf", () => {
  type Row = { a: string; b: string; c: number; d: string }
  const leaves = (columns: Parameters<typeof createColumns<Row>>[0]) =>
    getColumnModel(createColumns<Row>(columns)).leaves
  const pin = { side: "start", offset: "0px" } as const
  /** Each cell as `label:<column>x<span>` or `<column>`, with the tiers it shows at. */
  const layout = (cells: ReturnType<typeof groupCellsOf>) =>
    cells.cells.map(
      (cell) =>
        `${cell.kind === "label" ? `label:${cell.column}x${cell.span}${cell.subtotal ? "+sum" : ""}` : cell.column}@${cell.shown.map(Number).join("")}`
    )

  it("spans the first columns that sum nothing, pinned alike", () => {
    const columns = leaves([
      { id: "a", header: "A" },
      { id: "b", header: "B" },
      { id: "c", header: "C", type: "number" },
      { id: "d", header: "D" },
    ])
    expect(layout(groupCellsOf(columns, []))).toEqual([
      "label:0x2@1",
      "2@1",
      "3@1",
    ])
    expect(layout(groupCellsOf(columns, [pin]))).toEqual([
      "label:0x1@1",
      "1@1",
      "2@1",
      "3@1",
    ])
  })

  it("starts at the first column that sums nothing, those before it with their subtotals", () => {
    const columns = leaves([
      { id: "c", header: "C", type: "number" },
      { id: "a", header: "A" },
      { id: "b", header: "B" },
    ])
    expect(layout(groupCellsOf(columns, []))).toEqual(["0@1", "label:1x2@1"])
  })

  it("puts the label and the subtotal in the first cell when every column sums", () => {
    const columns = leaves([
      { id: "c", header: "C", type: "number" },
      { id: "a", header: "A", aggregate: "count" },
    ])
    expect(layout(groupCellsOf(columns, []))).toEqual([
      "label:0x1+sum@1",
      "1@1",
    ])
  })

  it("moves the label where a column is hidden below a breakpoint", () => {
    // The first two hidden below md: below it, the label is in the column
    // that sums, with its subtotal.
    expect(
      layout(
        groupCellsOf(
          leaves([
            { id: "a", header: "A", hideBelow: "md" },
            { id: "b", header: "B", hideBelow: "md" },
            { id: "c", header: "C", type: "number" },
          ]),
          []
        )
      )
    ).toEqual(["label:0x2@01", "label:2x1+sum@10", "2@01"])
    // The first hidden, the second sums: below md the label is in the
    // third, the subtotal in its own cell.
    expect(
      layout(
        groupCellsOf(
          leaves([
            { id: "a", header: "A", hideBelow: "md" },
            { id: "c", header: "C", type: "number" },
            { id: "b", header: "B" },
          ]),
          []
        )
      )
    ).toEqual(["label:0x1@01", "1@11", "label:2x1@10", "2@01"])
  })

  it("writes the display of a cell for the widths it shows at", () => {
    expect(shownClassName(["base", "md"], [false, true])).toBe(
      "hidden md:table-cell"
    )
    expect(shownClassName(["base", "sm", "lg"], [true, false, true])).toBe(
      "sm:hidden lg:table-cell"
    )
    expect(shownClassName(["base", "md"], [true, true])).toBeUndefined()
  })

  it("lets a pinned label in the first column run over the empty columns after it", () => {
    const columns = leaves([
      { id: "a", header: "A" },
      { id: "b", header: "B" },
      { id: "d", header: "D", hideBelow: "md" },
      { id: "c", header: "C", type: "number" },
    ])
    const cells = groupCellsOf(columns, [pin])
    // Up to the column that sums (one hidden takes no room).
    expect(cells.reach).toBe(3)
    expect(
      cells.cells.find((cell) => cell.kind === "label" && cell.reach)
    ).toBeDefined()
    expect(groupLabelWidth(cells, [140, 120, 0, 90])).toEqual({
      "--data-table-group-label": "260px",
    })
    // Not past a column that sums, nor before the widths are measured.
    const summed = groupCellsOf([columns[0], columns[3]], [pin])
    expect(summed.reach).toBe(0)
    expect(groupLabelWidth(summed, [140, 90])).toBeUndefined()
    expect(groupLabelWidth(cells, undefined)).toBeUndefined()
    // Nor when the first column sums: the label is not there.
    expect(groupCellsOf([columns[3], columns[0]], [pin]).reach).toBe(0)
  })
})

describe("DataTable column menu grouping", () => {
  it("groups by a column and ungroups from its header's menu", async () => {
    const user = userEvent.setup()
    const say = vi.spyOn(announcer, "announce")
    render(
      <Wells>
        <Probe />
      </Wells>
    )
    await user.click(screen.getByRole("button", { name: "Field options" }))
    await user.click(
      await screen.findByRole("menuitem", { name: "Group by column" })
    )
    expect(api?.view.grouping).toEqual(["field"])
    expect(say).toHaveBeenLastCalledWith("Grouped by Field")
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    await user.click(screen.getByRole("button", { name: "Status options" }))
    await user.click(
      await screen.findByRole("menuitem", { name: "Group by column" })
    )
    expect(api?.view.grouping).toEqual(["field", "status"])
    expect(say).toHaveBeenLastCalledWith("Grouped by Field and Status")
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    await user.click(screen.getByRole("button", { name: "Field options" }))
    await user.click(
      await screen.findByRole("menuitem", { name: "Ungroup column" })
    )
    expect(api?.view.grouping).toEqual(["status"])
  })

  it("has no grouping items without groupable, or for a column that opts out", async () => {
    const user = userEvent.setup()
    const optOut = createColumns<Well>([
      { id: "name", header: "Well" },
      { id: "field", header: "Field", groupable: false },
    ])
    const { unmount } = render(<Wells columns={optOut} hideableColumns />)
    await user.click(screen.getByRole("button", { name: "Field options" }))
    await screen.findByRole("menuitem", { name: "Hide column" })
    expect(
      screen.queryByRole("menuitem", { name: "Group by column" })
    ).toBeNull()
    unmount()
    render(<Wells groupable={false} />)
    expect(screen.queryByRole("button", { name: "Field options" })).toBeNull()
  })
})

describe("DataTableGroupBy", () => {
  it("renders nothing and warns without groupable", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <Wells groupable={false}>
        <DataTableGroupBy />
      </Wells>
    )
    expect(screen.queryByRole("button", { name: /Group by/ })).toBeNull()
    expect(String(warn.mock.calls[0][0])).toContain(
      "DataTableGroupBy renders nothing: `groupable` is off"
    )
  })

  it("is a plain button until its menu's code is asked for", () => {
    render(
      <Wells>
        <DataTableGroupBy />
      </Wells>
    )
    const button = screen.getByRole("button", { name: "Group by" })
    expect(button).toHaveAttribute("aria-haspopup", "menu")
    expect(button).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("menu")).toBeNull()
  })

  it("chooses and orders the grouping columns", async () => {
    const user = userEvent.setup()
    const say = vi.spyOn(announcer, "announce")
    render(
      <Wells>
        <DataTableGroupBy />
        <Probe />
      </Wells>
    )
    await user.click(screen.getByRole("button", { name: "Group by" }))
    const menu = await screen.findByRole("menu")
    expect(menu).toHaveAccessibleName("Group by")
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Field" }))
    expect(api?.view.grouping).toEqual(["field"])
    // The menu stays open for the next column.
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Status" }))
    expect(api?.view.grouping).toEqual(["field", "status"])
    expect(say).toHaveBeenLastCalledWith("Grouped by Field and Status")
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Status" })
    ).toHaveAttribute("aria-checked", "true")
    // The button shows the grouping.
    expect(
      screen.getByRole("button", { name: "Group by" })
    ).toHaveAccessibleDescription("Field, Status")
    // Status first: moved a level up, the menu staying open.
    await user.click(screen.getByRole("menuitem", { name: "Move Status up" }))
    expect(api?.view.grouping).toEqual(["status", "field"])
    expect(
      screen.getByRole("menuitem", { name: "Move Field up" })
    ).toBeVisible()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    await user.click(screen.getByRole("button", { name: "Group by" }))
    await user.click(
      await screen.findByRole("menuitem", { name: "Collapse all groups" })
    )
    expect(groups()).toEqual([
      "Status: Producing",
      "Status: Shut in",
      "Status: Drilling",
    ])
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    await user.click(screen.getByRole("button", { name: "Group by" }))
    await user.click(
      await screen.findByRole("menuitem", { name: "Ungroup all" })
    )
    expect(api?.view.grouping).toEqual([])
    expect(say).toHaveBeenLastCalledWith("Rows no longer grouped")
    // Focus back on the button.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Group by" })).toHaveFocus()
    )
  })

  it("reports the grouping through onViewChange with the reason group, and can be cancelled", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn((_view, details) => details.cancel())
    render(
      <Wells onViewChange={onViewChange}>
        <DataTableGroupBy />
        <Probe />
      </Wells>
    )
    await user.click(screen.getByRole("button", { name: "Group by" }))
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: "Field" })
    )
    expect(onViewChange).toHaveBeenCalledWith(
      expect.objectContaining({ grouping: ["field"] }),
      expect.objectContaining({ reason: "group" })
    )
    expect(api?.view.grouping).toEqual([])
  })
})

describe("DataTable grouping, server rendered", () => {
  it("renders the group rows on the server and hydrates without a mismatch", async () => {
    const tree = (
      <Wells
        selectionMode="multiple"
        defaultView={{ grouping: ["status", "field"] }}
      >
        <DataTableGroupBy />
      </Wells>
    )
    const html = renderToString(tree)
    expect(html).toContain("Status: Producing")
    expect(html).toContain('data-slot="data-table-group-checkbox"')
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const recoverable = vi.fn()
    const container = document.createElement("div")
    container.innerHTML = html
    document.body.append(container)
    const root = await act(async () =>
      hydrateRoot(container, tree, { onRecoverableError: recoverable })
    )
    expect(recoverable).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    act(() => root.unmount())
    container.remove()
  })
})

describe("DataTable grouping: review fixes", () => {
  const highlighted = () =>
    document.querySelector<HTMLElement>('[role="menu"] [data-highlighted]')

  it("keeps focus and highlight together on a move item, with 2 and 3 levels", async () => {
    const user = userEvent.setup()
    render(
      <Wells defaultView={{ grouping: ["field", "status", "spud"] }}>
        <DataTableGroupBy />
        <Probe />
      </Wells>
    )
    await user.click(screen.getByRole("button", { name: "Group by" }))
    await screen.findByRole("menu")
    const say = vi.spyOn(announcer, "announce")
    // The last level's item, from the keyboard.
    act(() =>
      screen.getByRole("menuitem", { name: "Move Spud date up" }).focus()
    )
    await user.keyboard("{Enter}")
    expect(api?.view.grouping).toEqual(["field", "spud", "status"])
    expect(say).toHaveBeenLastCalledWith(
      "Grouped by Field, Spud date, and Status"
    )
    // Spud date's own item now, one place up: focused and highlighted.
    const item = screen.getByRole("menuitem", { name: "Move Spud date up" })
    expect(item).toHaveFocus()
    expect(highlighted()).toBe(item)
    // Again: Spud date goes on up, to the top.
    await user.keyboard("{Enter}")
    expect(api?.view.grouping).toEqual(["spud", "field", "status"])
    expect(document.activeElement).toBe(highlighted())
    expect(highlighted()).toHaveAccessibleName("Move Field up")
    // A pointer press on the last item: Status's item follows it.
    await user.click(screen.getByRole("menuitem", { name: "Move Status up" }))
    expect(api?.view.grouping).toEqual(["spud", "status", "field"])
    expect(document.activeElement).toBe(highlighted())
    expect(highlighted()).toHaveAccessibleName("Move Status up")
  })

  it("keeps the one move item focused with 2 levels", async () => {
    const user = userEvent.setup()
    render(
      <Wells defaultView={{ grouping: ["field", "status"] }}>
        <DataTableGroupBy />
        <Probe />
      </Wells>
    )
    await user.click(screen.getByRole("button", { name: "Group by" }))
    await screen.findByRole("menu")
    act(() => screen.getByRole("menuitem", { name: "Move Status up" }).focus())
    await user.keyboard("{Enter}")
    expect(api?.view.grouping).toEqual(["status", "field"])
    const item = screen.getByRole("menuitem", { name: "Move Field up" })
    expect(item).toHaveFocus()
    expect(highlighted()).toBe(item)
  })

  it("goes to the page that holds a group's row when it closes from a page after", () => {
    const onPageChange = vi.fn()
    render(
      <Wells
        pagination
        defaultPageSize={5}
        defaultPage={2}
        onPageChange={onPageChange}
        defaultView={{ grouping: ["field"] }}
      >
        <Probe />
      </Wells>
    )
    // Page 2 starts with Gullfaks' row, repeated from page 1.
    const repeated = document.querySelector<HTMLTableRowElement>("tbody tr")!
    act(() => repeated.focus())
    press("ArrowLeft")
    expect(api?.page).toBe(1)
    expect(onPageChange).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ reason: "group" })
    )
    expect(focused()).toBe(group("Field: Gullfaks"))
    expect(group("Field: Gullfaks")).toHaveAttribute("aria-expanded", "false")
  })

  it("puts the label in the first column that sums nothing, and keeps every subtotal", () => {
    const summed = createColumns<Well>([
      { id: "depth", header: "Depth (m)", type: "number" },
      { id: "name", header: "Well" },
      { id: "field", header: "Field" },
      { id: "active", header: "Active", type: "boolean" },
    ])
    render(
      <Wells columns={summed} defaultView={{ grouping: ["field"] }}>
        <Probe />
      </Wells>
    )
    const gullfaks = WELLS.filter((well) => well.field === "Gullfaks")
    const depth = gullfaks
      .reduce((sum, well) => sum + (well.depth ?? 0), 0)
      .toLocaleString("en-US")
    const cells = () =>
      [...group("Field: Gullfaks").cells].map((cell) => {
        // What it draws: its hidden name left out.
        const drawn = cell.cloneNode(true) as HTMLElement
        for (const hidden of drawn.querySelectorAll("[hidden]")) hidden.remove()
        return `${cell.tagName}${cell.colSpan > 1 ? `x${cell.colSpan}` : ""}:${drawn.textContent}`
      })
    expect(cells()).toEqual([
      `TD:${depth}`,
      "THx2:Field: Gullfaks6 rows",
      `TD:${gullfaks.filter((well) => well.active).length}`,
    ])
    // Reordered: the label where the first column without a sum is.
    act(() => api?.setColumnOrder(["name", "depth", "field", "active"]))
    expect(cells()).toEqual([
      "TH:Field: Gullfaks6 rows",
      `TD:${depth}`,
      "TD:",
      `TD:${gullfaks.filter((well) => well.active).length}`,
    ])
    // Every column shown sums: the label and the first subtotal share a cell.
    act(() => {
      api?.setColumnHidden("name", true)
      api?.setColumnHidden("field", true)
    })
    expect(cells()).toEqual([
      `TH:Field: Gullfaks6 rows${depth}`,
      `TD:${gullfaks.filter((well) => well.active).length}`,
    ])
  })

  it("sends focus from a detail row in a closing group to the group's row", () => {
    render(
      <Wells
        defaultExpanded={["w5"]}
        defaultView={{ grouping: ["field"] }}
        contentProps={{
          renderDetail: (well: Well) => `Detail of ${well.name}`,
        }}
      >
        <Probe />
      </Wells>
    )
    const detail = screen.getByText("Detail of Well 05").closest("tr")!
    act(() => detail.focus())
    act(() => api?.collapseAllGroups())
    expect(focused()).toBe(group("Field: Gullfaks"))
  })

  it("closes every group of a grouping set in the same handler", () => {
    render(
      <Wells>
        <Probe />
      </Wells>
    )
    act(() => {
      api?.setGrouping(["field"])
      api?.collapseAllGroups()
    })
    expect(
      [...document.querySelectorAll('[data-slot="data-table-group-row"]')].map(
        (row) => row.getAttribute("aria-expanded")
      )
    ).toEqual(["false", "false", "false", "false"])
    // And opens every group of the next one.
    act(() => {
      api?.setGrouping(["status"])
      api?.expandAllGroups()
    })
    expect(group("Status: Producing")).toHaveAttribute("aria-expanded", "true")
  })

  it("renders nothing for collapse all without a grouping", () => {
    let renders = 0
    function Count() {
      renders++
      return <Probe />
    }
    render(
      <Wells>
        <Count />
      </Wells>
    )
    const before = renders
    act(() => api?.collapseAllGroups())
    act(() => api?.expandAllGroups())
    expect(renders).toBe(before)
  })

  it("says whether every group can be opened or closed", async () => {
    render(
      <Wells defaultView={{ grouping: ["field"] }}>
        <Probe />
      </Wells>
    )
    expect(api?.canExpandAllGroups).toBe(false)
    expect(api?.canCollapseAllGroups).toBe(true)
    act(() => api?.collapseAllGroups())
    expect(api?.canExpandAllGroups).toBe(true)
    expect(api?.canCollapseAllGroups).toBe(false)
    fireEvent.click(group("Field: Gullfaks"))
    expect(api?.canExpandAllGroups).toBe(true)
    expect(api?.canCollapseAllGroups).toBe(true)
    // The menu's items follow them.
    const user = userEvent.setup()
    act(() => api?.expandAllGroups())
    render(
      <Wells defaultView={{ grouping: ["field"] }}>
        <DataTableGroupBy />
      </Wells>
    )
    await user.click(screen.getByRole("button", { name: "Group by" }))
    await screen.findByRole("menu")
    expect(
      screen.getByRole("menuitem", { name: "Expand all groups" })
    ).toHaveAttribute("aria-disabled", "true")
    await user.click(
      screen.getByRole("menuitem", { name: "Collapse all groups" })
    )
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    await user.click(screen.getByRole("button", { name: "Group by" }))
    await screen.findByRole("menu")
    expect(
      screen.getByRole("menuitem", { name: "Collapse all groups" })
    ).toHaveAttribute("aria-disabled", "true")
  })

  it("describes a group row out of view by the label it shows", () => {
    const shared = {
      groupLabel: () => ({
        text: "Field: Gullfaks",
        before: "Field: ",
        value: "Gullfaks",
        after: "",
      }),
    } as unknown as Parameters<typeof describeRow>[1]
    const row = { kind: "group", key: "g", depth: 0 } as Parameters<
      typeof describeRow
    >[0]
    expect(describeRow(row, shared).textValue).toBe("Field: Gullfaks")
  })

  it("names a group row with its count, after a pause", () => {
    render(<Wells defaultView={{ grouping: ["field"] }} />)
    expect(group("Field: Gullfaks").querySelector("th")).toHaveAccessibleName(
      "Field: Gullfaks, 6 rows"
    )
  })

  it("gives server pages' rows their places after the pages before, group rows counted", () => {
    render(
      <Wells
        items={WELLS.slice(0, 10)}
        dataMode="server"
        rowCount={100}
        pagination
        defaultPage={3}
        defaultView={{ grouping: ["field"] }}
      />
    )
    const table = screen.getByRole("treegrid")
    const rows = [...document.querySelectorAll("tbody tr")]
    // 1 header row, 20 rows on pages 1 and 2.
    expect(rows[0]).toHaveAttribute("aria-rowindex", "22")
    const last = Number(rows.at(-1)?.getAttribute("aria-rowindex"))
    // 10 items and 4 group rows on this page; the count holds them.
    expect(last).toBe(22 + 13)
    expect(Number(table.getAttribute("aria-rowcount"))).toBe(1 + 100 + 4)
    expect(last).toBeLessThanOrEqual(
      Number(table.getAttribute("aria-rowcount"))
    )
  })
})

describe("DataTable grouping: second review", () => {
  it("leaves a page change to the grid when the focused group row only left the page", () => {
    const onPageChange = vi.fn()
    render(
      <Wells
        pagination
        defaultPageSize={5}
        defaultPage={2}
        onPageChange={(page, details) => onPageChange(page, details.reason)}
        defaultView={{ grouping: ["field"] }}
      >
        <Probe />
      </Wells>
    )
    act(() => group("Field: Snorre").focus())
    act(() => api?.setPage(5))
    expect(onPageChange.mock.calls).toEqual([[5, "none"]])
    expect(api?.page).toBe(5)
  })

  it("leaves rows clamped by new items to the grid, closed groups too", () => {
    const onPageChange = vi.fn()
    const { rerender } = render(
      <Wells
        pagination
        defaultPageSize={5}
        defaultPage={4}
        onPageChange={(page, details) => onPageChange(page, details.reason)}
        defaultView={{ grouping: ["field"] }}
      >
        <Probe />
      </Wells>
    )
    act(() => api?.collapseAllGroups())
    act(() => api?.expandAllGroups())
    act(() => api?.setPage(4))
    const focusedRow = document.querySelector<HTMLElement>("tbody tr")!
    act(() => focusedRow.focus())
    onPageChange.mockClear()
    rerender(
      <Wells
        items={WELLS.slice(0, 6)}
        pagination
        defaultPageSize={5}
        defaultPage={4}
        onPageChange={(page, details) => onPageChange(page, details.reason)}
        defaultView={{ grouping: ["field"] }}
      >
        <Probe />
      </Wells>
    )
    expect(onPageChange.mock.calls.map(([, reason]) => reason)).not.toContain(
      "group"
    )
  })

  it("drops the focus it was to restore when a controlled page keeps its own", () => {
    function Controlled() {
      const [page, setPage] = React.useState(2)
      return (
        <>
          <button type="button" onClick={() => setPage(1)}>
            First
          </button>
          <Wells
            pagination
            defaultPageSize={5}
            page={page}
            onPageChange={(next, details) => {
              if (details.reason !== "group") setPage(next)
            }}
            defaultView={{ grouping: ["field"] }}
          >
            <Probe />
          </Wells>
        </>
      )
    }
    render(<Controlled />)
    // Page 2 starts with Gullfaks' row repeated: closing it asks for page 1.
    act(() => document.querySelector<HTMLElement>("tbody tr")!.focus())
    press("ArrowLeft")
    expect(api?.page).toBe(2)
    // Later, page 1 from outside the table: focus stays outside.
    const first = screen.getByRole("button", { name: "First" })
    act(() => first.focus())
    fireEvent.click(first)
    expect(api?.page).toBe(1)
    expect(focused()).toBe(first)
  })

  it("names a label cell with the subtotal it holds", () => {
    const summed = createColumns<Well>([
      { id: "depth", header: "Depth (m)", type: "number" },
      { id: "active", header: "Active", type: "boolean" },
    ])
    render(<Wells columns={summed} defaultView={{ grouping: ["active"] }} />)
    const inactive = WELLS.filter((well) => !well.active)
    const depth = inactive
      .reduce((sum, well) => sum + (well.depth ?? 0), 0)
      .toLocaleString("en-US")
    const header = group("Active: No").querySelector("th")!
    expect(header).toHaveAccessibleName(
      `Active: No, ${inactive.length} rows, ${depth}`
    )
    // The subtotal is drawn in the cell too.
    expect(header.textContent).toContain(depth)
  })

  it("marks the scroll container scrolled sideways, which the label's selectors reach", () => {
    const sized = createColumns<Well>([
      { id: "name", header: "Well", width: 140 },
      { id: "field", header: "Field", width: 120 },
      { id: "status", header: "Status", width: 120 },
      { id: "depth", header: "Depth (m)", type: "number", width: 100 },
    ])
    render(
      <Wells
        columns={sized}
        pinnableColumns
        defaultView={{
          grouping: ["field"],
          columns: { pinned: { start: ["name"], end: [] } },
        }}
      />
    )
    const container = document.querySelector<HTMLElement>(
      '[data-slot="table-container"]'
    )!
    let left = 0
    Object.defineProperty(container, "scrollLeft", {
      configurable: true,
      get: () => left,
    })
    const label = group("Field: Gullfaks").querySelector("th > div")!
    expect(label.className).toContain("w-max")
    // The group's band bridges the pinned columns' divider while the label
    // runs on past it, and draws it once scrolled.
    expect(label.parentElement).toHaveClass(
      "border-e-transparent",
      "[[data-group-label-clipped]>table>tbody>tr>&]:border-e-border"
    )
    left = 80
    fireEvent.scroll(container)
    expect(container).toHaveAttribute("data-group-label-clipped")
    // The structure the label's variants are written against.
    expect(
      label.matches("[data-group-label-clipped]>table>tbody>tr>th>div")
    ).toBe(true)
    expect(
      label.parentElement!.matches(
        "[data-group-label-clipped]>table>tbody>tr>th"
      )
    ).toBe(true)
    const prefix = label.querySelector(".truncate > span")!
    expect(prefix).toHaveTextContent("Field:")
    expect(
      prefix.matches(
        "[data-group-label-clipped]>table>tbody>tr>th>div>span>span"
      )
    ).toBe(true)
    left = 0
    fireEvent.scroll(container)
    expect(container).not.toHaveAttribute("data-group-label-clipped")
  })
})

describe("DataTable grouping: third review", () => {
  it("names a group's checkbox by its label cell, as an item row's by its row header", () => {
    render(
      <Wells selectionMode="multiple" defaultView={{ grouping: ["field"] }} />
    )
    const header = group("Field: Gullfaks").querySelector("th")!
    const box = groupCheckbox("Field: Gullfaks")
    expect(box.getAttribute("aria-labelledby")?.split(" ")).toContain(header.id)
    expect(box).toHaveAccessibleName("Select Field: Gullfaks, 6 rows")
    expect(header).toHaveAccessibleName("Field: Gullfaks, 6 rows")
  })

  it("names a group's checkbox once, subtotal included, when every column sums", () => {
    const summed = createColumns<Well>([
      { id: "depth", header: "Depth (m)", type: "number" },
      { id: "active", header: "Active", type: "boolean" },
    ])
    render(
      <Wells
        columns={summed}
        selectionMode="multiple"
        defaultView={{ grouping: ["active"] }}
      />
    )
    const inactive = WELLS.filter((well) => !well.active)
    const depth = inactive
      .reduce((sum, well) => sum + (well.depth ?? 0), 0)
      .toLocaleString("en-US")
    const name = `Active: No, ${inactive.length} rows, ${depth}`
    expect(group("Active: No").querySelector("th")).toHaveAccessibleName(name)
    expect(groupCheckbox("Active: No")).toHaveAccessibleName(`Select ${name}`)
  })

  it("names a cell whose subtotal renderAggregate draws through the drawn subtotal", () => {
    const drawn = createColumns<Well>([
      {
        id: "depth",
        header: "Depth (m)",
        type: "number",
        renderAggregate: (value) => <strong>{String(value)} m</strong>,
      },
      { id: "active", header: "Active", type: "boolean" },
    ])
    render(<Wells columns={drawn} defaultView={{ grouping: ["active"] }} />)
    const inactive = WELLS.filter((well) => !well.active)
    const depth = inactive.reduce((sum, well) => sum + (well.depth ?? 0), 0)
    expect(group("Active: No").querySelector("th")).toHaveAccessibleName(
      `Active: No, ${inactive.length} rows, ${depth} m`
    )
  })

  it("moves focus after a move only when the owner takes it", async () => {
    const user = userEvent.setup()
    let setView: (view: { grouping: Array<string> }) => void = () => {}
    function Controlled() {
      const [view, set] = React.useState({
        grouping: ["field", "status", "spud"],
      })
      setView = set
      // Keeps its own view: the menu's moves are ignored.
      return (
        <Wells view={view}>
          <DataTableGroupBy />
        </Wells>
      )
    }
    render(<Controlled />)
    await user.click(screen.getByRole("button", { name: "Group by" }))
    await screen.findByRole("menu")
    const item = screen.getByRole("menuitem", { name: "Move Spud date up" })
    act(() => item.focus())
    await user.keyboard("{Enter}")
    expect(item).toHaveFocus()
    // Later, the owner moves Spud date up itself: focus stays.
    act(() => setView({ grouping: ["field", "spud", "status"] }))
    expect(
      screen.getByRole("menuitem", { name: "Move Status up" })
    ).toHaveFocus()
  })

  it("does not take focus back into the table once it was moved out", () => {
    function Controlled() {
      const [page, setPage] = React.useState(2)
      return (
        <>
          <button type="button" onClick={() => setPage(1)}>
            First
          </button>
          <Wells
            pagination
            defaultPageSize={5}
            page={page}
            onPageChange={(next, details) => {
              if (details.reason !== "group") setPage(next)
            }}
            defaultView={{ grouping: ["field"] }}
          >
            <Probe />
          </Wells>
        </>
      )
    }
    render(<Controlled />)
    act(() => document.querySelector<HTMLElement>("tbody tr")!.focus())
    press("ArrowLeft")
    // Focus out of the table to the page, then page 1 from a script.
    act(() => (document.activeElement as HTMLElement).blur())
    expect(focused()).toBe(document.body)
    fireEvent.click(screen.getByRole("button", { name: "First" }))
    expect(api?.page).toBe(1)
    expect(focused()).toBe(document.body)
  })
})
