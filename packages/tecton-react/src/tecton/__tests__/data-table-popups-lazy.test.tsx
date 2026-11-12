/**
 * The header menus and popovers, the resizer, the filter popover and the
 * row actions menu load on demand. Their buttons are plain buttons for
 * their whole life (never swapped for the popup's trigger), and a press
 * made before the code comes opens the popup once it is there, unless the
 * user moved on. Each module waits for the test to let it arrive; a
 * module, once loaded, stays loaded for the rest of the file, so the tests
 * run in order.
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

const gates = vi.hoisted(() => {
  const gate = () => {
    let open: () => void = () => {}
    const arrived = new Promise<void>((resolve) => {
      open = resolve
    })
    return { arrived, open: () => open(), requested: vi.fn() }
  }
  return {
    header: gate(),
    resizer: gate(),
    filters: gate(),
    rowActions: gate(),
  }
})
vi.mock("../internal/data-table/header-popups", async (importOriginal) => {
  gates.header.requested()
  await gates.header.arrived
  return importOriginal()
})
vi.mock("../table-column-resizer", async (importOriginal) => {
  gates.resizer.requested()
  await gates.resizer.arrived
  return importOriginal()
})
vi.mock("../internal/data-table/filter-popover", async (importOriginal) => {
  gates.filters.requested()
  await gates.filters.arrived
  return importOriginal()
})
vi.mock("../internal/data-table/row-actions-menu", async (importOriginal) => {
  gates.rowActions.requested()
  await gates.rowActions.arrived
  return importOriginal()
})

type Well = { id: string; name: string; field: string; depth: number }

const WELLS: Array<Well> = [
  { id: "a12", name: "34/10-A-12", field: "Gullfaks", depth: 3250 },
  { id: "d2", name: "34/7-D-2", field: "Snorre", depth: 2735 },
]

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
        <DropdownMenuItem>Open</DropdownMenuItem>
        <DropdownMenuItem>Archive</DropdownMenuItem>
      </DataTableRowActions>
    ),
  },
])

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
})

describe("DataTable popups on demand", () => {
  it("draws plain triggers, named as the popups' own, and loads nothing until idle time", async () => {
    let idle: Array<(deadline: IdleDeadline) => void> = []
    vi.stubGlobal(
      "requestIdleCallback",
      (task: (deadline: IdleDeadline) => void) => {
        idle.push(task)
        return idle.length
      }
    )
    vi.stubGlobal("cancelIdleCallback", () => {})
    const { unmount } = render(<Wells />)
    await settle()
    for (const gate of Object.values(gates))
      expect(gate.requested).not.toHaveBeenCalled()
    const menu = button("Field options")
    expect(menu).toHaveAttribute("aria-haspopup", "menu")
    expect(menu).toHaveAttribute("aria-expanded", "false")
    expect(menu).toHaveAttribute("data-slot", "data-table-column-menu")
    expect(button("About TD (m)")).toHaveAttribute("aria-haspopup", "dialog")
    expect(button("Filter by Field")).toHaveAttribute("aria-haspopup", "dialog")
    expect(rowActions()).toHaveAttribute("aria-haspopup", "menu")
    // The resizers' grips, drawn as the resizers will draw them.
    const grips = document.querySelectorAll(
      '[data-slot="data-table-resizer-placeholder"]'
    )
    expect(grips.length).toBeGreaterThan(0)
    for (const grip of grips) {
      expect(grip).toHaveAttribute("aria-hidden", "true")
      expect(grip.className).toContain(columnResizerClassName)
    }
    // Idle time: every one is asked for.
    const tasks = idle
    idle = []
    act(() =>
      tasks.forEach((task) =>
        task({ didTimeout: false, timeRemaining: () => 50 })
      )
    )
    await settle()
    for (const gate of Object.values(gates))
      expect(gate.requested).toHaveBeenCalledTimes(1)
    unmount()
  })

  it("opens a column menu pressed with Enter before it came, its first item active, on the same button", async () => {
    render(<Wells />)
    const menuButton = button("Field options")
    act(() => menuButton.focus())
    // Enter on a button: a click with no pointer.
    fireEvent.click(menuButton, { detail: 0 })
    await settle()
    expect(screen.queryByRole("menu")).toBeNull()
    expect(menuButton).toHaveAttribute("aria-expanded", "false")
    await act(async () => gates.header.open())
    const menu = await screen.findByRole("menu")
    await waitFor(() =>
      expect(document.activeElement).toBe(
        within(menu).getAllByRole("menuitem")[0]
      )
    )
    expect(button("Field options")).toBe(menuButton)
    expect(menuButton).toHaveAttribute("aria-expanded", "true")
    expect(menuButton).toHaveAttribute("aria-controls", menu.id)
    expect(menuButton).toHaveAttribute("data-popup-open")
    fireEvent.keyDown(document.activeElement!, { key: "Escape" })
    await waitFor(() => expect(menuButton).toHaveFocus())
    expect(menuButton).toHaveAttribute("aria-expanded", "false")
    // Down opens a menu too; held down, it opens it once.
    fireEvent.keyDown(menuButton, { key: "ArrowDown" })
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    fireEvent.keyDown(document.activeElement!, { key: "Escape" })
    await waitFor(() => expect(menuButton).toHaveFocus())
  })

  it("opens a filter clicked before its popover came; Down does not open it; a click on its button closes it", async () => {
    const user = userEvent.setup()
    render(<Wells />)
    const filter = button("Filter by Field")
    fireEvent.keyDown(filter, { key: "ArrowDown" })
    await user.click(filter)
    await settle()
    expect(screen.queryByRole("dialog")).toBeNull()
    await act(async () => gates.filters.open())
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Field")).toBeInTheDocument()
    expect(button("Filter by Field")).toBe(filter)
    expect(filter).toHaveAttribute("aria-expanded", "true")
    expect(filter).toHaveAttribute("aria-controls", dialog.id)
    // Its button again: closed, and not opened again by the same click.
    await user.click(filter)
    await settle()
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(filter).toHaveAttribute("aria-expanded", "false")
    // Down is the grid's, not a dialog's.
    fireEvent.keyDown(filter, { key: "ArrowDown" })
    await settle()
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("gives up a press when the user moves on before the menu came, and opens one clicked before it came", async () => {
    const user = userEvent.setup()
    render(
      <>
        <button type="button">Elsewhere</button>
        <Wells />
      </>
    )
    const actions = () => screen.getAllByRole("button", { name: "Row actions" })
    // The first row's: clicked, then a press elsewhere; clicked, then
    // Escape.
    await user.click(actions()[0])
    await user.click(button("Elsewhere"))
    await user.click(actions()[0])
    await user.keyboard("{Escape}")
    // A press dragged off the button and let go elsewhere: the menu's
    // press is its down, as a menu trigger's, given up by the next press
    // elsewhere.
    await user.pointer([
      { keys: "[MouseLeft>]", target: actions()[0] },
      { target: button("Elsewhere") },
      { keys: "[/MouseLeft]" },
    ])
    // The second row's: clicked, then the code comes.
    await user.click(actions()[1])
    expect(screen.queryByRole("menu")).toBeNull()
    await act(async () => gates.rowActions.open())
    const menu = await screen.findByRole("menu")
    expect(
      within(menu).getByRole("menuitem", { name: "Open" })
    ).toBeInTheDocument()
    expect(screen.getAllByRole("menu")).toHaveLength(1)
    expect(actions()[1]).toHaveAttribute("aria-expanded", "true")
    expect(actions()[0]).toHaveAttribute("aria-expanded", "false")
    // By a pointer: no item active.
    expect(menu.querySelector("[data-highlighted]")).toBeNull()
  })

  it("opens a description from the keyboard on its own button, Escape bringing focus back", async () => {
    render(<Wells />)
    const about = button("About TD (m)")
    act(() => about.focus())
    fireEvent.click(about, { detail: 0 })
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveTextContent("Total depth, measured along the hole.")
    expect(button("About TD (m)")).toBe(about)
    expect(about).toHaveAttribute("aria-expanded", "true")
    fireEvent.keyDown(document.activeElement!, { key: "Escape" })
    await waitFor(() => expect(about).toHaveFocus())
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("leaves a menu by Tab through its button, and a popover past its first or last control", async () => {
    render(<Wells />)
    const tab = (shiftKey = false) =>
      fireEvent.keyDown(document.activeElement!, { key: "Tab", shiftKey })
    // A menu: Tab closes it, focus on its button for the browser to move
    // on from (Shift+Tab: stays there).
    const menuButton = button("Field options")
    for (const shiftKey of [false, true]) {
      act(() => menuButton.focus())
      fireEvent.click(menuButton, { detail: 0 })
      const menu = await screen.findByRole("menu")
      await waitFor(() =>
        expect(menu.contains(document.activeElement)).toBe(true)
      )
      tab(shiftKey)
      await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
      expect(menuButton).toHaveFocus()
      expect(menuButton).toHaveAttribute("aria-expanded", "false")
    }
    // A popover: Shift+Tab before its first control goes back to the
    // button, open; Tab from there enters it again; Tab past the last
    // closes it, focus on the button.
    const filter = button("Filter by Field")
    act(() => filter.focus())
    fireEvent.click(filter, { detail: 0 })
    const dialog = await screen.findByRole("dialog")
    const field = await within(dialog).findByRole("textbox")
    act(() => field.focus())
    tab(true)
    expect(filter).toHaveFocus()
    expect(screen.getByRole("dialog")).toBe(dialog)
    tab()
    expect(field).toHaveFocus()
    const controls = within(dialog).queryAllByRole("button")
    act(() => (controls.at(-1) ?? field).focus())
    tab()
    expect(filter).toHaveFocus()
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("opens a loaded menu on the pointer's down, in the next frame, the click that ends the press keeping it open", async () => {
    render(<Wells />)
    const actions = rowActions()
    // Asked for on the pointer's down too.
    fireEvent.pointerDown(actions, { button: 0, pointerType: "mouse" })
    fireEvent.mouseDown(actions, { button: 0, detail: 1 })
    const menu = await screen.findByRole("menu")
    expect(actions).toHaveAttribute("aria-expanded", "true")
    fireEvent.mouseUp(actions, { button: 0, detail: 1 })
    fireEvent.click(actions, { button: 0, detail: 1 })
    await settle()
    expect(screen.getByRole("menu")).toBe(menu)
    // The next press on its button closes it.
    fireEvent.mouseDown(actions, { button: 0, detail: 1 })
    fireEvent.click(actions, { button: 0, detail: 1 })
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    expect(actions).toHaveAttribute("aria-expanded", "false")
    // A popover opens on the click, as a popover trigger's.
    const filter = button("Filter by Field")
    fireEvent.mouseDown(filter, { button: 0, detail: 1 })
    await settle()
    expect(screen.queryByRole("dialog")).toBeNull()
    fireEvent.click(filter, { button: 0, detail: 1 })
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
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
    await act(async () => gates.resizer.open())
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
