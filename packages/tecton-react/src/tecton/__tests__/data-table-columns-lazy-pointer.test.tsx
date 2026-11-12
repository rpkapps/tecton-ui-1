import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/data-table"

/** The column drag and drop's code arrives when the test lets it. */
const chunk = vi.hoisted(() => {
  let open: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    open = resolve
  })
  return { gate, open: () => open() }
})
vi.mock("../internal/data-table/column-reorder", async (importOriginal) => {
  await chunk.gate
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
  { id: "depth", header: "TD (m)", type: "number" },
])

/** Header cells 100 px wide, side by side. */
const originalRect = Element.prototype.getBoundingClientRect
beforeEach(() => {
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const at =
      this.tagName === "TH"
        ? [...this.parentElement!.children].indexOf(this)
        : 0
    const left = this.tagName === "TH" ? at * 100 : 0
    const width = this.tagName === "TH" ? 100 : 300
    return {
      left,
      right: left + width,
      width,
      top: 0,
      bottom: 40,
      height: 40,
      x: left,
      y: 0,
      toJSON() {},
    }
  }
})
afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect
})

const header = (name: string) => screen.getByRole("columnheader", { name })
const press = (x: number) =>
  fireEvent.pointerDown(header("Well"), {
    button: 0,
    pointerId: 1,
    pointerType: "mouse",
    clientX: x,
    clientY: 10,
  })

describe("DataTable column reordering on demand, by pointer", () => {
  it("drags from a press made before the code came while the pointer is down, and not from one let go", async () => {
    const onViewChange = vi.fn()
    render(
      <DataTable
        items={WELLS}
        columns={columns}
        reorderableColumns
        onViewChange={onViewChange}
      >
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    // Let go before the code has come: a click, no drag.
    press(50)
    fireEvent.pointerUp(document, { pointerId: 1, clientX: 50, clientY: 10 })
    // Held down while it comes: the drag starts.
    press(50)
    await act(async () => chunk.open())
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="data-table-column-drop-indicator"]')
      ).not.toBeNull()
    )
    fireEvent.pointerMove(document, { pointerId: 1, clientX: 280, clientY: 10 })
    expect(header("Well")).toHaveAttribute("data-dragging")
    fireEvent.pointerUp(document, { pointerId: 1, clientX: 280, clientY: 10 })
    expect(onViewChange).toHaveBeenCalledTimes(1)
    expect(onViewChange.mock.calls[0][0].columns.order).toEqual([
      "field",
      "depth",
      "name",
    ])
  })
})
