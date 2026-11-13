/**
 * `DataTableSearch syntax="query"`, once its query layer has loaded (the
 * lazy loading itself is `data-table-power-search-lazy.test.tsx`): typed
 * terms become the view's filters and free words its search, the view
 * writes the query back, problems wait for a pause, the suggestions, the
 * help, the calendar, server mode, and the guards against the mirror and
 * the list drifting from the field and the field moving under the pointer.
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
import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from "vitest"

import {
  createColumns,
  DataTable,
  DataTableActiveFilters,
  DataTableContent,
  DataTableFilter,
  DataTableSearch,
  DataTableToolbar,
  type DataTableProps,
  type DataTableView,
} from "@tecton/react/data-table"
import { TectonProvider } from "@tecton/react/provider"

import { loadFeature } from "../internal/data-table/lazy"
import { columns, names, WELLS, type Well } from "./data-table-fixtures"

function Wells({
  items = WELLS.slice(0, 8),
  children,
  ...props
}: Partial<DataTableProps<Well>> & { children?: React.ReactNode }) {
  return (
    <DataTable items={items} columns={columns} filterable {...props}>
      <DataTableToolbar>
        <DataTableSearch syntax="query" />
        <DataTableFilter column="status" />
        <DataTableFilter column="depth" />
      </DataTableToolbar>
      <DataTableActiveFilters />
      <DataTableContent aria-label="Wells" />
      {children}
    </DataTable>
  )
}

const field = () => screen.getByRole("combobox", { name: "Search" })
const options = () =>
  screen.queryAllByRole("option").map((option) => option.textContent)
const chips = () =>
  Array.from(
    document.querySelectorAll('[data-slot="chip"]'),
    (chip) => chip.getAttribute("aria-label") ?? chip.textContent
  )
const mirror = () =>
  document.querySelector<HTMLElement>('[data-slot="data-table-query-mirror"]')!
const group = () =>
  document.querySelector<HTMLElement>(
    '[data-slot="data-table-search"] [data-slot="input-group"]'
  )!
const button = (slot: string) =>
  document.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!
const lastView = (spy: ReturnType<typeof vi.fn>) =>
  spy.mock.calls.at(-1)?.[0] as DataTableView

beforeAll(async () => {
  // The query layer and the date filter's calendar, loaded before the tests.
  await loadFeature("query")
  await loadFeature("dateInput")
}, 30_000)

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("DataTableSearch syntax=query: the query and the view", () => {
  it("turns typed terms into filters and free words into the search", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<Wells onViewChange={onViewChange} />)
    await user.click(field())
    await user.type(field(), "status:drilling well")
    expect(lastView(onViewChange).filters).toEqual({
      status: { type: "options", values: ["drilling"] },
    })
    expect(lastView(onViewChange).search).toBe("well")
    expect(names()).toEqual(
      WELLS.slice(0, 8)
        .filter((well) => well.status === "drilling")
        .map((well) => well.name)
    )
    // The same filter the filter button sets: its chip says so.
    expect(chips()).toContain("Status: Drilling")
  })

  it("reads > and < on a number as exclusive bounds", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<Wells onViewChange={onViewChange} />)
    await user.click(field())
    await user.type(field(), "depth:>2000")
    expect(lastView(onViewChange).filters.depth).toEqual({
      type: "number",
      min: 2000,
      minExclusive: true,
    })
    expect(chips()).toContain("Depth (m): > 2,000")
  })

  it("writes the query again from the view when a chip or a controlled view changes it, keeping the free words", async () => {
    const user = userEvent.setup({ delay: null })
    const { rerender } = render(
      <Wells
        view={{
          search: "well",
          filters: {
            status: { type: "options", values: ["drilling", "producing"] },
            depth: { type: "number", min: 1500 },
          },
        }}
      />
    )
    expect(field()).toHaveValue("status:drilling,producing depthm:>=1500 well")
    rerender(
      <Wells
        view={{
          search: "well",
          filters: { depth: { type: "number", max: 3000 } },
        }}
      />
    )
    expect(field()).toHaveValue("depthm:<=3000 well")
    // Uncontrolled: a chip removed.
    rerender(
      <Wells
        key="b"
        defaultView={{
          search: "gull",
          filters: { status: { type: "options", values: ["drilling"] } },
        }}
      />
    )
    expect(field()).toHaveValue("status:drilling gull")
    await user.click(
      screen.getByRole("button", { name: /Remove.*Status: Drilling/ })
    )
    expect(field()).toHaveValue("gull")
  })

  it("does not apply OR, NOT or a leading minus, and underlines them after a pause with their message", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<Wells onViewChange={onViewChange} />)
    await user.click(field())
    await user.type(field(), "status:drilling OR")
    expect(lastView(onViewChange).filters).toEqual({
      status: { type: "options", values: ["drilling"] },
    })
    expect(lastView(onViewChange).search).toBe("")
    // While typing, the term being typed is not marked yet.
    expect(
      document.querySelector('[data-slot="data-table-query-problem"]')
    ).toBeNull()
    await waitFor(
      () =>
        expect(
          document.querySelector('[data-slot="data-table-query-problem"]')
        ).toHaveTextContent("OR"),
      { timeout: 2000 }
    )
    // Atop the list, and in the field's description.
    expect(
      document.querySelector('[data-slot="data-table-query-problem-banner"]')
    ).toHaveTextContent("OR is not supported")
    const description = document.getElementById(
      field().getAttribute("aria-describedby")!
    )
    expect(description).toHaveTextContent("Filters: Status: Drilling.")
    expect(description).toHaveTextContent("1 problem: OR is not supported")
    await user.type(field(), " -gullfaks")
    expect(lastView(onViewChange).search).toBe("")
  })

  it("names an unknown column or value, with what was meant", async () => {
    const user = userEvent.setup({ delay: null })
    render(<Wells />)
    await user.click(field())
    await user.type(field(), "stauts:drilling status:driling ")
    const description = () =>
      document.getElementById(field().getAttribute("aria-describedby")!)
    expect(description()).toHaveTextContent(
      "No column is called “stauts”. Did you mean status?"
    )
    expect(description()).toHaveTextContent(
      "Status has no value “driling”. Did you mean drilling?"
    )
  })
})

describe("DataTableSearch syntax=query: suggestions", () => {
  it("offers the columns with their type, then a column's values with their rows; ↓ and Enter pick, Escape closes, then clears", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<Wells onViewChange={onViewChange} />)
    await user.click(field())
    expect(field()).toHaveAttribute("aria-expanded", "true")
    expect(options()).toEqual([
      "well:WellText",
      "field:FieldText",
      "status:StatusOptions",
      "depthm:Depth (m)Number",
      "spuddate:Spud dateDate",
      "active:ActiveYes or no",
    ])
    // Under them, the keys they take, and nothing else.
    expect(
      document.querySelector('[data-slot="data-table-query-keys"]')
    ).toHaveTextContent(/^↑↓Move↵SelectTabCompleteEscClose$/)
    await user.type(field(), "sta")
    expect(options()[0]).toBe("status:StatusOptions")
    // A free word: Enter is the search's, ↓ picks the column.
    await user.keyboard("{ArrowDown}{Enter}")
    expect(field()).toHaveValue("status:")
    // Counted over the rows, as the filter's popover counts them.
    const count = (status: string) =>
      String(WELLS.slice(0, 8).filter((well) => well.status === status).length)
    expect(options()).toEqual([
      `Producing${count("producing")}`,
      `Shut in${count("shut-in")}`,
      `Drilling${count("drilling")}`,
    ])
    // The highlight stays on the first row: the next one is Shut in.
    await user.keyboard("{ArrowDown}{Enter}")
    expect(field()).toHaveValue('status:"shut in" ')
    expect(lastView(onViewChange).filters.status).toEqual({
      type: "options",
      values: ["shut-in"],
    })
    // The term is complete: the list closes. ↓ opens it, Escape closes it,
    // and Escape again clears the field.
    expect(field()).toHaveAttribute("aria-expanded", "false")
    await user.keyboard("{ArrowDown}")
    expect(field()).toHaveAttribute("aria-expanded", "true")
    await user.keyboard("{Escape}")
    expect(field()).toHaveAttribute("aria-expanded", "false")
    expect(field()).toHaveValue('status:"shut in" ')
    await user.keyboard("{Escape}")
    expect(field()).toHaveValue("")
    expect(lastView(onViewChange).filters).toEqual({})
  })

  it("completes with Tab, and offers a number's comparisons with the data's range", async () => {
    const user = userEvent.setup({ delay: null })
    render(<Wells />)
    await user.click(field())
    await user.type(field(), "dep")
    await user.keyboard("{Tab}")
    expect(field()).toHaveValue("depthm:")
    expect(field()).toHaveFocus()
    const listbox = screen.getByRole("listbox")
    const depths = WELLS.slice(0, 8).map((well) => well.depth ?? 0)
    expect(listbox).toHaveTextContent(
      `${Math.min(...depths).toLocaleString("en-US")} to ${Math.max(...depths).toLocaleString("en-US")} here`
    )
    expect(options().slice(0, 5)).toEqual([
      ">More than",
      ">=At least",
      "<Less than",
      "<=At most",
      "..Between",
    ])
  })

  it("offers a date's presets, years and the calendar, which writes the days it picks", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<Wells onViewChange={onViewChange} />)
    await user.click(field())
    await user.type(field(), "spuddate:>")
    expect(options()[0]).toBe("Pick a day on the calendar")
    const calendar = await waitFor(() => {
      const element = document.querySelector<HTMLElement>(
        '[data-slot="data-table-query-calendar"]'
      )
      expect(element).toHaveTextContent("After the day you pick")
      expect(within(element!).getAllByRole("grid")).toHaveLength(1)
      return element!
    })
    await user.click(within(calendar).getAllByRole("button", { name: /15/ })[0])
    expect((field() as HTMLInputElement).value).toMatch(
      /^spuddate:>\d{4}-\d{2}-15 $/
    )
    expect(field()).toHaveFocus()
    expect(lastView(onViewChange).filters.spud).toMatchObject({ type: "date" })
    // A year: what it was read as, in the chip's words.
    await user.type(field(), "spuddate:2020")
    expect(
      document.querySelector('[data-slot="data-table-query-understood"]')
    ).toHaveTextContent("Spud date: Jan 1, 2020–Dec 31, 2020")
  })

  it("counts the options' own count in server mode, and sends the filters through onViewChange", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    const counted = createColumns<Well>([
      { id: "name", header: "Well" },
      {
        id: "status",
        header: "Status",
        type: "options",
        options: [
          { value: "producing", label: "Producing", count: 812 },
          { value: "drilling", label: "Drilling", count: 1204 },
        ],
      },
    ])
    render(
      <DataTable
        items={WELLS.slice(0, 3)}
        columns={counted}
        dataMode="server"
        rowCount={2016}
        filterable
        onViewChange={onViewChange}
      >
        <DataTableSearch syntax="query" />
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    await user.click(field())
    await user.type(field(), "status:")
    expect(options()).toEqual(["Producing812", "Drilling1,204", "noneNo value"])
    await user.type(field(), "drilling")
    await waitFor(() =>
      expect(lastView(onViewChange).filters).toEqual({
        status: { type: "options", values: ["drilling"] },
      })
    )
    // The rows are the server's: nothing filtered here.
    expect(names()).toHaveLength(3)
  })
})

describe("DataTableSearch syntax=query: the help", () => {
  it("lists the table's columns with examples; one chosen joins the query", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<Wells onViewChange={onViewChange} />)
    await user.click(screen.getByRole("button", { name: "Search syntax" }))
    const help = await screen.findByRole("dialog", { name: "Search syntax" })
    expect(help).toHaveTextContent('status:producing,"shut in"')
    expect(help).toHaveTextContent("Status is any of the values listed")
    expect(help).toHaveTextContent("active:yes")
    expect(help).toHaveTextContent(
      "well:, field:, status:, depthm:, spuddate:, active:"
    )
    await user.click(within(help).getByRole("button", { name: "active:yes" }))
    expect(field()).toHaveValue("active:yes ")
    expect(lastView(onViewChange).filters).toEqual({
      active: { type: "boolean", value: true },
    })
  })
})

describe("DataTableSearch syntax=query: the field stays put", () => {
  it("(a) copies the input's metrics to the mirror on every render, resize and font load, across the md breakpoint", async () => {
    const user = userEvent.setup({ delay: null })
    // The input is `text-base md:text-sm`: 16px below the breakpoint.
    let size = 16
    const real = window.getComputedStyle
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      (element, pseudo) => {
        const style = real(element, pseudo)
        if (!(element instanceof HTMLInputElement)) return style
        return new Proxy(style, {
          get(target, name) {
            if (name === "font") return `400 ${size}px / 24px Figtree`
            if (name === "letterSpacing") return size === 16 ? "0px" : "0.1px"
            if (name === "paddingInlineStart") return "6px"
            const value = Reflect.get(target, name)
            return typeof value === "function" ? value.bind(target) : value
          },
        })
      }
    )
    const fonts = new EventTarget()
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: fonts,
    })
    render(<Wells />)
    expect(mirror().style.font).toContain("16px")
    // The window widens past the breakpoint: the input is 14px now.
    size = 14
    act(() => {
      window.dispatchEvent(new Event("resize"))
    })
    expect(mirror().style.font).toContain("14px")
    expect(mirror().style.letterSpacing).toBe("0.1px")
    expect(mirror().parentElement!.style.insetInlineStart).toBe("6px")
    // And narrower again, on a render: no resize needed.
    size = 16
    await user.click(field())
    await user.type(field(), "a")
    expect(mirror().style.font).toContain("16px")
    // A web font arriving changes the metrics too.
    size = 15
    act(() => {
      fonts.dispatchEvent(new Event("loadingdone"))
    })
    expect(mirror().style.font).toContain("15px")
    delete (document as { fonts?: unknown }).fonts
  })

  it("(b) copies the field's width into the list from a ResizeObserver, with no transition", async () => {
    const observers: Array<(entries: Array<unknown>) => void> = []
    const noop = globalThis.ResizeObserver
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private callback: (entries: Array<unknown>) => void) {}
        observe() {
          observers.push(this.callback)
        }
        unobserve() {}
        disconnect() {}
      }
    )
    onTestFinished(() => {
      vi.stubGlobal("ResizeObserver", noop)
    })
    let width = 420
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        const w = this.matches('[data-slot="input-group"]') ? width : 0
        return {
          width: w,
          height: 30,
          top: 0,
          left: 0,
          right: w,
          bottom: 30,
          x: 0,
          y: 0,
          toJSON() {},
        }
      }
    )
    const user = userEvent.setup({ delay: null })
    render(<Wells />)
    await user.click(field())
    const popup = document.querySelector<HTMLElement>(
      '[data-slot="data-table-query-suggestions"]'
    )!
    expect(popup.style.getPropertyValue("--field-width")).toBe("420px")
    expect(popup.className).toContain("w-(--field-width,var(--anchor-width))")
    expect(popup.className).toContain("transition-none")
    // The field changes size (a window resize, the toolbar's layout): the
    // list follows in the same frame.
    width = 512
    act(() => observers.forEach((callback) => callback([])))
    expect(popup.style.getPropertyValue("--field-width")).toBe("512px")
  })

  it("(c) never changes the field's size as it is focused or its buttons pressed", async () => {
    const user = userEvent.setup({ delay: null })
    render(<Wells defaultView={{ search: "gull" }} />)
    const root = document.querySelector<HTMLElement>(
      '[data-slot="data-table-search"]'
    )!
    const classes = () => [
      root.className,
      group().className,
      root.parentElement!.getAttribute("style"),
    ]
    const idle = classes()
    // "?" on an unfocused field: the help opens, the field as it was.
    await user.click(screen.getByRole("button", { name: "Search syntax" }))
    await screen.findByRole("dialog", { name: "Search syntax" })
    expect(classes()).toEqual(idle)
    await user.keyboard("{Escape}")
    await user.click(field())
    expect(classes()).toEqual(idle)
    // The list is open: what is around the input is hidden from screen
    // readers meanwhile, so the buttons are found by their slots.
    await user.click(button("data-table-query-help"))
    expect(classes()).toEqual(idle)
    await user.keyboard("{Escape}")
    await user.click(button("data-table-query-clear"))
    expect(classes()).toEqual(idle)
    expect(field()).toHaveFocus()
  })
})

describe("DataTableSearch syntax=query: locale and direction", () => {
  it("speaks the provider's locale and reads its numbers, in RTL", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(
      <TectonProvider locale="de-DE" direction="rtl">
        <Wells onViewChange={onViewChange} />
      </TectonProvider>
    )
    const input = await screen.findByRole("combobox", { name: "Suchen" })
    expect(input).toHaveAttribute("placeholder", "Suchen oder filtern")
    await user.click(input)
    await user.type(input, "depthm:")
    await waitFor(() => expect(options()).toContain(">Mehr als"))
    // Numbers in German: a comma before the decimals, a dot between thousands.
    await user.type(input, ">=1.500,5")
    expect(lastView(onViewChange).filters.depth).toEqual({
      type: "number",
      min: 1500.5,
    })
    // The mirror takes the input's direction, as its other metrics.
    expect(
      document.querySelector<HTMLElement>(
        '[data-slot="data-table-query-mirror"]'
      )!.style.direction
    ).toBe(getComputedStyle(input).direction)
  })
})

it("fires no change for a search the view already has", () => {
  const onViewChange = vi.fn()
  render(<Wells defaultView={{ search: "well" }} onViewChange={onViewChange} />)
  fireEvent.focus(field())
  expect(onViewChange).not.toHaveBeenCalled()
})
