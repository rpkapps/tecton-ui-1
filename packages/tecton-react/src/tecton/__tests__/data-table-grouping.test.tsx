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
} from "@tecton/react/tecton/data-table"
import { TectonProvider } from "@tecton/react/tecton/provider"

import { groupCellsOf, groupLabelWidth } from "../internal/data-table/cell"
import { getColumnModel } from "../internal/data-table/engine"
import { loadFeature } from "../internal/data-table/lazy"
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
const group = (label: string) =>
  screen.getByText(label).closest("tr") as HTMLTableRowElement
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
    expect(groups().at(-1)).toBe("Field: (Empty)")
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
    // The second click of a double click does nothing more.
    fireEvent.click(group("Field: Gullfaks"), { detail: 2 })
    expect(group("Field: Gullfaks")).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(group("Field: Gullfaks"))
    expect(screen.getByText("Well 01")).toBeInTheDocument()
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
  })

  it("gives the label a second cell below the breakpoint of a first column hidden there", () => {
    const narrow = createColumns<Well>([
      { id: "name", header: "Well", hideBelow: "md" },
      { id: "field", header: "Field" },
      { id: "depth", header: "Depth", type: "number" },
    ])
    render(<Wells columns={narrow} defaultView={{ grouping: ["field"] }} />)
    const gullfaks = screen.getAllByText("Field: Gullfaks")[0].closest("tr")!
    const cells = [...gullfaks.cells]
    expect(cells[0]).toHaveClass("hidden", "md:table-cell")
    expect(cells[0]).toHaveAttribute("colspan", "2")
    expect(cells[1]).toHaveClass("md:hidden")
    expect(cells[1]).not.toHaveAttribute("colspan")
    expect(cells[2]).toHaveClass("text-end")
  })
})

describe("groupCellsOf", () => {
  const model = getColumnModel(
    createColumns<Well>([
      { id: "name", header: "Well" },
      { id: "field", header: "Field" },
      { id: "status", header: "Status", hideBelow: "md" },
      { id: "depth", header: "Depth", type: "number" },
    ])
  )
  const pin = { side: "start", offset: "0px" } as const

  it("spans the first columns that sum nothing, pinned alike", () => {
    expect(groupCellsOf(model.leaves, [])).toEqual({
      span: 2,
      below: null,
      reach: 2,
    })
    expect(groupCellsOf(model.leaves, [pin]).span).toBe(1)
  })

  it("lets a pinned label run over the empty columns after it", () => {
    const cells = groupCellsOf(model.leaves, [pin])
    // Up to the column hidden below a breakpoint.
    expect(cells.reach).toBe(2)
    expect(groupLabelWidth(cells, [140, 120, 100, 90])).toEqual({
      "--data-table-group-label": "260px",
    })
    // Not past a column that sums, nor before the widths are measured.
    const summed = groupCellsOf([model.leaves[0], model.leaves[3]], [pin])
    expect(summed.reach).toBe(1)
    expect(groupLabelWidth(summed, [140, 90])).toBeUndefined()
    expect(groupLabelWidth(cells, undefined)).toBeUndefined()
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
    await user.click(await screen.findByRole("menuitem", { name: "Ungroup" }))
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
    await loadFeature("groupBy")
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
    await loadFeature("groupBy")
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
    // Loaded by another table meanwhile: still the server's markup first.
    await loadFeature("groupBy")
    await loadFeature("headerPopups")
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
