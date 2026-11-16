/**
 * `DataTableToolbar` is Tecton's `Toolbar`: the table's parts in it are its
 * items, and go into its "More" menu as the row runs out of room, from
 * where they open their popup by the menu's button.
 */
import * as React from "react"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  DataTable,
  DataTableActionBar,
  DataTableColumnsMenu,
  DataTableContent,
  DataTableFilter,
  DataTableGroupBy,
  DataTableSearch,
  DataTableToolbar,
} from "@tecton/react/data-table"

import { checkbox, columns, WELLS } from "./data-table-fixtures"

/**
 * jsdom has no layout: the toolbar is as wide as a test makes it, each of
 * its items 100 px, the menu's button 32 px.
 */
const originalRect = Element.prototype.getBoundingClientRect
const OriginalResizeObserver = globalThis.ResizeObserver
const observers = new Set<TestObserver>()
class TestObserver {
  targets = new Set<Element>()
  constructor(private callback: ResizeObserverCallback) {
    observers.add(this)
  }
  observe(target: Element) {
    this.targets.add(target)
  }
  unobserve(target: Element) {
    this.targets.delete(target)
  }
  disconnect() {
    this.targets.clear()
    observers.delete(this)
  }
  takeRecords() {
    return []
  }
  report(target: Element, size: number) {
    const box = [{ inlineSize: size, blockSize: size }]
    this.callback(
      [
        {
          target,
          contentBoxSize: box,
          borderBoxSize: box,
        } as unknown as ResizeObserverEntry,
      ],
      this
    )
  }
}

let toolbarWidth = 1000
function widthOf(element: Element) {
  const slot = element.getAttribute("data-slot")
  if (element.hasAttribute("data-table-toolbar")) return toolbarWidth
  if (slot === "overflow-item") return 100
  if (slot === "overflow-menu") return 32
  return 0
}

function resize(width: number) {
  toolbarWidth = width
  const root = document.querySelector("[data-table-toolbar]")!
  act(() => {
    for (const observer of [...observers])
      if (observer.targets.has(root)) observer.report(root, width)
  })
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", TestObserver)
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const width = widthOf(this)
    return {
      width,
      height: 32,
      top: 0,
      left: 0,
      right: width,
      bottom: 32,
      x: 0,
      y: 0,
      toJSON() {},
    }
  }
})

afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect
  vi.unstubAllGlobals()
  observers.clear()
})

function Wells({ children }: { children?: React.ReactNode }) {
  return (
    <DataTable
      items={WELLS.slice(0, 6)}
      columns={columns}
      filterable
      groupable
      hideableColumns
      selectionMode="multiple"
    >
      <DataTableToolbar>
        <DataTableSearch />
        <DataTableFilter column="status" />
        <DataTableGroupBy />
        <DataTableColumnsMenu />
      </DataTableToolbar>
      {children}
      <DataTableContent aria-label="Wells" />
    </DataTable>
  )
}

const toolbar = () => screen.getByRole("toolbar", { name: "Table tools" })
const hidden = () =>
  [
    ...toolbar().querySelectorAll<HTMLElement>(
      ':scope > [data-slot="overflow-item"]'
    ),
  ].map((item) => item.hasAttribute("data-overflowing"))

describe("DataTableToolbar", () => {
  it("is a toolbar whose parts go into its menu as room runs out, the search last", () => {
    render(<Wells />)
    expect(toolbar()).toHaveAttribute("data-slot", "toolbar")
    // The search, the filter, Group by and Columns: each an item.
    expect(hidden()).toEqual([false, false, false, false])
    resize(250)
    // Columns and Group by go first; the search stays.
    expect(hidden()).toEqual([false, false, true, true])
    resize(100)
    expect(hidden()).toEqual([false, true, true, true])
    expect(
      within(toolbar()).getByRole("searchbox", { name: "Search" })
    ).toBeInTheDocument()
  })

  it("opens a part's popup from its menu item, by the menu's button", async () => {
    const user = userEvent.setup()
    render(<Wells />)
    resize(100)
    const more = within(toolbar()).getByRole("button", {
      name: "More actions",
    })
    await user.click(more)
    const menu = await screen.findByRole("menu")
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent)
    ).toEqual(["Filter by Status", "Group by", "Columns"])
    await user.click(within(menu).getByRole("menuitem", { name: "Columns" }))
    // The columns menu, by the More button; focus back to it as it closes.
    const columnsMenu = await screen.findByRole("menu")
    expect(
      within(columnsMenu).getByRole("menuitemcheckbox", { name: "Well" })
    ).toBeInTheDocument()
    fireEvent.keyDown(document.activeElement!, { key: "Escape" })
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    await waitFor(() => expect(more).toHaveFocus())
    // The filter's popover, the same way.
    await user.click(more)
    await user.click(
      within(await screen.findByRole("menu")).getByRole("menuitem", {
        name: "Filter by Status",
      })
    )
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getAllByRole("checkbox").length).toBeGreaterThan(0)
  })

  it("moves a part's open popup to its own button as the part comes back into the row and the More button goes", async () => {
    const user = userEvent.setup()
    render(<Wells />)
    resize(100)
    await user.click(
      within(toolbar()).getByRole("button", { name: "More actions" })
    )
    await user.click(
      within(await screen.findByRole("menu")).getByRole("menuitem", {
        name: "Filter by Status",
      })
    )
    const dialog = await screen.findByRole("dialog")
    // Room for every part: the More button goes, the filter is in the row.
    resize(1000)
    expect(hidden()).toEqual([false, false, false, false])
    expect(
      within(toolbar()).queryByRole("button", { name: "More actions" })
    ).toBeNull()
    expect(screen.getByRole("dialog")).toBe(dialog)
    // Placed by the filter's button now: focus goes back to it, not to the
    // More button that is gone.
    fireEvent.keyDown(document.activeElement!, { key: "Escape" })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    await waitFor(() =>
      expect(
        within(toolbar()).getByRole("button", { name: "Filter by Status" })
      ).toHaveFocus()
    )
  })
})

describe("DataTableFilter and DataTableGroupBy", () => {
  it("show their choice the same way: a full-height separator, then a secondary badge", () => {
    render(
      <DataTable
        items={WELLS.slice(0, 6)}
        columns={columns}
        filterable
        groupable
        defaultView={{
          grouping: ["field"],
          filters: { status: { type: "options", values: ["producing"] } },
        }}
      >
        <DataTableFilter column="status" />
        <DataTableGroupBy />
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    for (const slot of ["data-table-filter", "data-table-group-by"]) {
      const button = document.querySelector(`[data-slot="${slot}"]`)!
      const separator = button.querySelector('[data-slot="separator"]')
      expect(separator).toHaveAttribute("data-orientation", "vertical")
      // Full height: no height of its own, stretched by the button.
      expect(separator?.className).not.toMatch(/\bh-\d/)
      const badge = button.querySelector(
        '[data-slot="data-table-trigger-summary"]'
      )
      expect(badge).toHaveClass("rounded-sm", "px-1", "font-normal")
      expect(badge).toHaveAttribute("data-variant", "secondary")
      expect(button).toHaveAttribute("aria-describedby", badge?.id)
    }
  })
})

describe("DataTableActionBar", () => {
  it("shows while rows are selected, passing its props to the ActionBar, and Escape clears", async () => {
    render(
      <Wells>
        <DataTableActionBar placement="floating" data-testid="bar">
          <button type="button">Shut in</button>
        </DataTableActionBar>
      </Wells>
    )
    expect(screen.queryByTestId("bar")).toBeNull()
    fireEvent.click(checkbox("Well 01"))
    const bar = screen.getByTestId("bar")
    expect(bar).toHaveAttribute("data-placement", "floating")
    expect(bar).toHaveAttribute("role", "region")
    expect(bar).toHaveAccessibleName("Selected rows")
    expect(
      within(bar).getByRole("toolbar", {
        name: "Actions for the selected rows",
      })
    ).toContainElement(within(bar).getByRole("button", { name: "Shut in" }))
    act(() => within(bar).getByRole("button", { name: "Shut in" }).focus())
    fireEvent.keyDown(document.activeElement!, { key: "Escape" })
    expect(screen.queryByTestId("bar")).toBeNull()
    expect(checkbox("Well 01")).toHaveAttribute("aria-checked", "false")
  })
})
