/**
 * The header menus and popovers, the filter popover and the row actions
 * menu open by their own triggers, as the documented `DropdownMenu` and
 * `Popover` do: no code to wait for, the popup's content rendered only
 * while it is open. The resizer loads on demand: its grip is drawn until
 * it comes, and a drag started on the grip carries on with it.
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
import { afterEach, describe, expect, it, vi } from "vitest"

import { DropdownMenuItem } from "@tecton/react/components/dropdown-menu"
import {
  createColumns,
  DataTable,
  DataTableContent,
  DataTableFilter,
  DataTableRowActions,
} from "@tecton/react/tecton/data-table"

import { columnResizerClassName } from "../internal/column-resizer-style"

const gate = vi.hoisted(() => {
  let open: () => void = () => {}
  const arrived = new Promise<void>((resolve) => {
    open = resolve
  })
  return { arrived, open: () => open(), requested: vi.fn() }
})
vi.mock("../table-column-resizer", async (importOriginal) => {
  gate.requested()
  await gate.arrived
  return importOriginal()
})

type Well = { id: string; name: string; field: string; depth: number }

const WELLS: Array<Well> = [
  { id: "a12", name: "34/10-A-12", field: "Gullfaks", depth: 3250 },
  { id: "d2", name: "34/7-D-2", field: "Snorre", depth: 2735 },
]

const items = vi.fn()

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
  {
    id: "depth",
    header: "TD (m)",
    type: "number",
    description: "Total depth, measured along the hole.",
  },
  {
    id: "actions",
    header: "Actions",
    sortable: false,
    hideable: false,
    resizable: false,
    cell: () => (
      <DataTableRowActions>
        <Item>Open</Item>
        <Item>Archive</Item>
      </DataTableRowActions>
    ),
  },
])

/** A menu item that counts its renders. */
function Item({ children }: { children: string }) {
  items(children)
  return <DropdownMenuItem>{children}</DropdownMenuItem>
}

function Wells() {
  return (
    <DataTable
      items={WELLS}
      columns={columns}
      filterable
      hideableColumns
      resizableColumns
    >
      <DataTableFilter column="field" />
      <DataTableContent aria-label="Wells" />
    </DataTable>
  )
}

const settle = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 50)))
const button = (name: string) => screen.getByRole("button", { name })
const rowActions = () =>
  within(screen.getByRole("row", { name: /34\/10-A-12/ })).getByRole("button", {
    name: "Row actions",
  })

afterEach(() => {
  vi.unstubAllGlobals()
  items.mockClear()
})

describe("DataTable popups", () => {
  it("draws the popups' own triggers, closed, and renders no popup content until one opens", async () => {
    render(<Wells />)
    await settle()
    const menu = button("Field options")
    expect(menu).toHaveAttribute("aria-haspopup", "menu")
    expect(menu).toHaveAttribute("aria-expanded", "false")
    expect(menu).toHaveAttribute("data-slot", "data-table-column-menu")
    expect(button("About TD (m)")).toHaveAttribute("aria-expanded", "false")
    expect(button("Filter by Field")).toHaveAttribute("aria-haspopup", "dialog")
    expect(rowActions()).toHaveAttribute("aria-haspopup", "menu")
    // No menu items rendered for the rows' closed menus.
    expect(items).not.toHaveBeenCalled()
    // The resizers' grips, drawn as the resizers will draw them.
    const grips = document.querySelectorAll(
      '[data-slot="data-table-resizer-placeholder"]'
    )
    expect(grips.length).toBeGreaterThan(0)
    for (const grip of grips) {
      expect(grip).toHaveAttribute("aria-hidden", "true")
      expect(grip.className).toContain(columnResizerClassName)
    }
  })

  it("opens a column menu with Enter, its first item active; Escape brings focus back; Down opens it too", async () => {
    const user = userEvent.setup()
    render(<Wells />)
    const menuButton = button("Field options")
    act(() => menuButton.focus())
    await user.keyboard("{Enter}")
    const menu = await screen.findByRole("menu")
    await waitFor(() =>
      expect(document.activeElement).toBe(
        within(menu).getAllByRole("menuitem")[0]
      )
    )
    expect(menuButton).toHaveAttribute("aria-expanded", "true")
    expect(menuButton).toHaveAttribute("data-popup-open")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(menuButton).toHaveFocus())
    expect(menuButton).toHaveAttribute("aria-expanded", "false")
    fireEvent.keyDown(menuButton, { key: "ArrowDown" })
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(menuButton).toHaveFocus())
  })

  it("keeps the page as it is under an open menu: no backdrop, no scroll lock", async () => {
    const user = userEvent.setup()
    render(<Wells />)
    const html = document.documentElement
    const before = html.getAttribute("style")
    for (const open of [() => button("Field options"), rowActions]) {
      await user.click(open())
      expect(await screen.findByRole("menu")).toBeInTheDocument()
      await settle()
      // A modal menu's backdrop, over the page.
      expect(
        document.querySelector('[role="presentation"][data-base-ui-inert]')
      ).toBeNull()
      expect(html.getAttribute("style")).toBe(before)
      await user.keyboard("{Escape}")
      await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    }
  })

  it("lets a press outside an open menu close it and do what it pressed, focus staying there", async () => {
    const user = userEvent.setup()
    render(<Wells />)
    const menuButton = button("Field options")
    await user.click(menuButton)
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    // Another popup's button: the menu closes, the filter opens and keeps
    // focus.
    await user.click(button("Filter by Field"))
    const dialog = await screen.findByRole("dialog")
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    await settle()
    expect(menuButton).not.toHaveFocus()
    expect(
      dialog.contains(document.activeElement) ||
        document.activeElement === button("Filter by Field")
    ).toBe(true)
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    // Another column's menu: it opens at once, with focus.
    await user.click(menuButton)
    await screen.findByRole("menu")
    await user.click(button("TD (m) options"))
    await waitFor(() =>
      expect(button("TD (m) options")).toHaveAttribute("aria-expanded", "true")
    )
    expect(menuButton).toHaveAttribute("aria-expanded", "false")
    await settle()
    expect(screen.getAllByRole("menu")).toHaveLength(1)
    expect(screen.getByRole("menu").contains(document.activeElement)).toBe(true)
    // Another row's actions: that row's menu opens.
    await user.keyboard("{Escape}")
    const actions = () => screen.getAllByRole("button", { name: "Row actions" })
    await user.click(actions()[0])
    await screen.findByRole("menu")
    await user.click(actions()[1])
    await waitFor(() =>
      expect(actions()[1]).toHaveAttribute("aria-expanded", "true")
    )
    expect(actions()[0]).toHaveAttribute("aria-expanded", "false")
  })

  it("opens a filter on the click; a click on its button closes it; Down does not open it", async () => {
    const user = userEvent.setup()
    render(<Wells />)
    const filter = button("Filter by Field")
    await user.click(filter)
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Field")).toBeInTheDocument()
    expect(filter).toHaveAttribute("aria-expanded", "true")
    await user.click(filter)
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(filter).toHaveAttribute("aria-expanded", "false")
    fireEvent.keyDown(filter, { key: "ArrowDown" })
    await settle()
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("opens one row's menu at a time, by a pointer with no item active", async () => {
    const user = userEvent.setup()
    render(<Wells />)
    const actions = () => screen.getAllByRole("button", { name: "Row actions" })
    await user.click(actions()[1])
    const menu = await screen.findByRole("menu")
    expect(
      within(menu).getByRole("menuitem", { name: "Open" })
    ).toBeInTheDocument()
    expect(screen.getAllByRole("menu")).toHaveLength(1)
    expect(actions()[1]).toHaveAttribute("aria-expanded", "true")
    expect(actions()[0]).toHaveAttribute("aria-expanded", "false")
    expect(menu.querySelector("[data-highlighted]")).toBeNull()
  })

  it("opens a description from the keyboard, Escape bringing focus back", async () => {
    const user = userEvent.setup()
    render(<Wells />)
    const about = button("About TD (m)")
    act(() => about.focus())
    await user.keyboard("{Enter}")
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveTextContent("Total depth, measured along the hole.")
    expect(about).toHaveAttribute("aria-expanded", "true")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(about).toHaveFocus())
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("keeps Up for the grid on a row's menu button, and Down for its menu", async () => {
    const user = userEvent.setup()
    render(<Wells />)
    const second = screen.getAllByRole("button", { name: "Row actions" })[1]
    act(() => second.focus())
    fireEvent.keyDown(second, { key: "ArrowUp" })
    await settle()
    expect(screen.queryByRole("menu")).toBeNull()
    expect(second).not.toHaveFocus()
    act(() => second.focus())
    fireEvent.keyDown(second, { key: "ArrowDown" })
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(second).toHaveFocus())
  })

  it("opens a menu on the pointer's down, the click that ends the press keeping it open", async () => {
    render(<Wells />)
    const actions = rowActions()
    fireEvent.pointerDown(actions, { button: 0, pointerType: "mouse" })
    fireEvent.mouseDown(actions, { button: 0, detail: 1 })
    const menu = await screen.findByRole("menu")
    expect(actions).toHaveAttribute("aria-expanded", "true")
    fireEvent.pointerUp(actions, { button: 0, pointerType: "mouse" })
    fireEvent.mouseUp(actions, { button: 0, detail: 1 })
    fireEvent.click(actions, { button: 0, detail: 1 })
    await settle()
    expect(screen.getByRole("menu")).toBe(menu)
  })

  it("puts the resizer where its grip was, carrying on a drag started on the grip", async () => {
    // What jsdom lacks of pointer events, for the press handed on.
    vi.stubGlobal(
      "PointerEvent",
      class extends MouseEvent {
        pointerId: number
        pointerType: string
        isPrimary: boolean
        constructor(type: string, init: PointerEventInit = {}) {
          super(type, init)
          this.pointerId = init.pointerId ?? 0
          this.pointerType = init.pointerType ?? "mouse"
          this.isPrimary = init.isPrimary ?? true
        }
      }
    )
    render(<Wells />)
    const grip = document.querySelector<HTMLElement>(
      '[data-slot="data-table-resizer-placeholder"]'
    )!
    const className = grip.className
    const header = grip.closest("th")!
    fireEvent.pointerDown(grip, {
      button: 0,
      pointerId: 7,
      pointerType: "mouse",
      clientX: 100,
    })
    await act(async () => gate.open())
    await waitFor(() =>
      expect(
        header.querySelector('[data-slot="table-column-resizer"]')
      ).not.toBeNull()
    )
    const resizer = header.querySelector<HTMLElement>(
      '[data-slot="table-column-resizer"]'
    )!
    expect(resizer.className).toBe(className)
    expect(
      header.querySelector('[data-slot="data-table-resizer-placeholder"]')
    ).toBeNull()
    // Still held: the drag goes on with the resizer.
    fireEvent.pointerMove(document, { pointerId: 7, clientX: 140 })
    await waitFor(() => expect(resizer).toHaveAttribute("data-dragging"))
    fireEvent.pointerUp(document, { pointerId: 7, clientX: 140 })
    await waitFor(() => expect(resizer).not.toHaveAttribute("data-dragging"))
  })
})
