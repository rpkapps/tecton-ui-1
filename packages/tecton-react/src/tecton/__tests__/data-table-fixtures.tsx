/** Wells and helpers shared by the DataTable component tests. */
import { act, fireEvent, screen } from "@testing-library/react"
import { vi } from "vitest"

import { createColumns } from "@tecton/react/data-table"

type Well = {
  id: string
  name: string
  field: string
  status: "producing" | "shut-in" | "drilling"
  depth: number | null
  spud: Date | null
  active: boolean | null
}

const FIELDS = ["Gullfaks", "Statfjord", "Snorre", "Visund"]
const STATUSES = ["producing", "shut-in", "drilling"] as const

/** 23 wells: three pages of 10, five of 5. */
const WELLS: Array<Well> = Array.from({ length: 23 }, (_, i) => ({
  id: `w${i + 1}`,
  name: `Well ${String(i + 1).padStart(2, "0")}`,
  field: FIELDS[i % FIELDS.length],
  status: STATUSES[i % STATUSES.length],
  depth: 1000 + ((i * 397) % 3000),
  spud: new Date(Date.UTC(2020, i % 12, 1 + (i % 27))),
  active: i % 2 === 0,
}))

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "field", header: "Field" },
  {
    id: "status",
    header: "Status",
    type: "options",
    options: [
      { value: "producing", label: "Producing", variant: "success" },
      { value: "shut-in", label: "Shut in", variant: "warning" },
      { value: "drilling", label: "Drilling", variant: "info" },
    ],
  },
  { id: "depth", header: "Depth (m)", type: "number" },
  {
    id: "spud",
    header: "Spud date",
    type: "date",
    format: { dateStyle: "medium", timeZone: "UTC" },
  },
  { id: "active", header: "Active", type: "boolean" },
])

const row = (name: string) =>
  screen.getByText(name).closest("tr") as HTMLTableRowElement
const cell = (text: string) =>
  screen.getByText(text).closest("td, th") as HTMLTableCellElement
const focused = () => document.activeElement as HTMLElement
const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(focused(), { key, ...init })
/** The row headers' text, top to bottom: the body's order. */
const names = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('tbody th[scope="row"]'),
    (header) => header.textContent
  )
const checkbox = (name: string) =>
  screen.getByRole("checkbox", { name: `Select ${name}` })
const focusRow = (name: string) => act(() => row(name).focus())

/** Rows one height in a view of 400 px, for a virtualized body. */
function layout({ row: height = 40, view = 400 } = {}) {
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(view)
  const original = Element.prototype.getBoundingClientRect
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      const box = (top: number, size: number) =>
        ({
          top,
          bottom: top + size,
          height: size,
          left: 0,
          right: 400,
          width: 400,
          x: 0,
          y: top,
          toJSON() {},
        }) as DOMRect
      const index = (this as HTMLElement).dataset.index
      if (this.tagName === "THEAD" || this.tagName === "TABLE")
        return box(0, height)
      if (this.tagName === "TH" && !this.closest("tbody")) return box(0, height)
      if (this.tagName === "TR" && index !== undefined)
        return box(height + Number(index) * height, height)
      return original.call(this)
    }
  )
}

/** Lets the table's container scroll, as a laid-out one does. */
function scrollable() {
  const container = document.querySelector<HTMLElement>(
    '[data-slot="table-container"]'
  )!
  let top = 0
  Object.defineProperty(container, "scrollTop", {
    configurable: true,
    get: () => top,
    set: (value: number) => {
      top = value
    },
  })
}

export {
  cell,
  checkbox,
  columns,
  focused,
  focusRow,
  layout,
  names,
  press,
  row,
  scrollable,
  WELLS,
}
export type { Well }
