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

import { DATE_INPUT } from "../internal/data-table/date-input"
import { loadFeature } from "../internal/data-table/lazy"
import { QUERY } from "../internal/data-table/search"
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
  await loadFeature(QUERY)
  await loadFeature(DATE_INPUT)
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
      ranges: [{ min: 2000, minExclusive: true }],
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
            depth: { type: "number", ranges: [{ min: 1500 }] },
          },
        }}
      />
    )
    expect(field()).toHaveValue("status:drilling,producing depthm:>=1500 well")
    rerender(
      <Wells
        view={{
          search: "well",
          filters: { depth: { type: "number", ranges: [{ max: 3000 }] } },
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
    // Atop the list, and in the field's description: what happened, and
    // what to type instead, with the table's own options column.
    const or =
      'OR isn\'t supported. Rows must match every term. To match one of several values of a column, list them with commas: status:producing,"shut in"'
    expect(
      document.querySelector('[data-slot="data-table-query-problem-banner"]')
    ).toHaveTextContent(or)
    const description = () =>
      document.getElementById(field().getAttribute("aria-describedby")!)
    expect(description()).toHaveTextContent("Filters: Status: Drilling.")
    expect(description()).toHaveTextContent(`1 problem: ${or}`)
    await user.type(field(), " -gullfaks NOT field:troll")
    expect(lastView(onViewChange).search).toBe("")
    await waitFor(() =>
      expect(description()).toHaveTextContent(
        'Excluding isn\'t supported, so this term is ignored. To search for the text itself, put it in quotes. To narrow the rows, filter for the values to keep instead: status:producing,"shut in"'
      )
    )
    // NOT takes the term after it out with it, as a minus does: never the
    // opposite of what was meant.
    expect(description()).toHaveTextContent("3 problems")
    expect(lastView(onViewChange).filters).toEqual({
      status: { type: "options", values: ["drilling"] },
    })
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
    // The term is complete: the list stays, with the next term's columns.
    // Escape closes it, ↓ opens it again, Escape closes it, and Escape
    // again clears the field.
    expect(field()).toHaveAttribute("aria-expanded", "true")
    expect(options()[0]).toBe("well:WellText")
    await user.keyboard("{Escape}")
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
    expect(options().slice(0, 6)).toEqual([
      "=Equal to",
      ">More than",
      ">=At least",
      "<Less than",
      "<=At most",
      "..Between",
    ])
  })

  it("opens as a press focuses the field, follows the caret the press places, and offers the next term after a complete one", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(
      <Wells
        onViewChange={onViewChange}
        defaultView={{
          filters: {
            depth: {
              type: "number",
              ranges: [{ min: 3000, minExclusive: true }],
            },
          },
        }}
      />
    )
    const text = "depthm:>3000"
    await waitFor(() => expect(field()).toHaveValue(text))
    // A press focuses the field before it places the caret: the list opens
    // at once (it is open the whole time the field has focus) and follows
    // the caret once the press places it.
    fireEvent.pointerDown(field(), { button: 0 })
    ;(field() as HTMLInputElement).setSelectionRange(0, 0)
    act(() => field().focus())
    expect(field()).toHaveFocus()
    expect(field()).toHaveAttribute("aria-expanded", "true")
    // The click, the caret at the end, after a complete term: the next
    // term's columns, as after a space.
    ;(field() as HTMLInputElement).setSelectionRange(text.length, text.length)
    fireEvent.click(field())
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    expect(options().some((option) => option.startsWith("status:"))).toBe(true)
    const status = screen
      .getAllByRole("option")
      .find((option) => option.textContent.startsWith("status:"))!
    await user.click(status)
    expect(field()).toHaveValue(`${text} status:`)
    expect(field()).toHaveFocus()
    // Focus from the keyboard opens the list at once.
    act(() => field().blur())
    act(() => field().focus())
    expect(screen.getByRole("listbox")).toBeInTheDocument()
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

/**
 * Every value `aria-expanded` has had on the field since the call, read
 * from the attribute's mutation records (each keeps the value it replaced),
 * then the current one.
 */
function watchExpanded() {
  const input = field()
  const seen: Array<string | null> = [input.getAttribute("aria-expanded")]
  const read = (records: Array<MutationRecord>) => {
    for (const record of records) seen.push(record.oldValue)
  }
  const observer = new MutationObserver(read)
  observer.observe(input, {
    attributes: true,
    attributeFilter: ["aria-expanded"],
    attributeOldValue: true,
  })
  onTestFinished(() => observer.disconnect())
  return () => {
    read(observer.takeRecords())
    return [...seen, input.getAttribute("aria-expanded")]
  }
}

/**
 * A press, its pointer down and up apart, rendered in between as a browser
 * paints them (a click's events would otherwise all come in one batch).
 */
async function press(
  user: ReturnType<typeof userEvent.setup>,
  target: Element
) {
  await user.pointer({ keys: "[MouseLeft>]", target })
  await act(async () => {})
  await user.pointer({ keys: "[/MouseLeft]", target })
}

describe("DataTableSearch syntax=query: a comma means any of", () => {
  function ListWells(props: Partial<DataTableProps<Well>>) {
    return (
      <DataTable
        items={WELLS.slice(0, 8)}
        columns={columns}
        filterable
        {...props}
      >
        <DataTableSearch syntax="query" />
        <DataTableFilter column="name" />
        <DataTableFilter column="depth" />
        <DataTableActiveFilters />
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
  }
  // Hidden from screen readers while the query's list is open.
  const filterButton = (columnName: string) =>
    document.querySelector<HTMLElement>(
      `[aria-label="Filter by ${columnName}"]`
    )!

  it("offers a text column's values after a comma, not the next term's columns, and matches either value picked", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<ListWells onViewChange={onViewChange} />)
    await user.click(field())
    await user.type(field(), "well:")
    expect(options()[0]).toBe("Well 011")
    await user.keyboard("{ArrowDown}{Enter}")
    expect(field()).toHaveValue(`well:"Well 01" `)
    // A comma after the pick's space continues the list.
    await user.type(field(), ",")
    expect(field()).toHaveValue(`well:"Well 01",`)
    expect(options()).not.toContain("well:WellText")
    expect(options()[0]).toBe("Well 021")
    expect(options()).not.toContain("Well 011")
    await user.keyboard("{ArrowDown}{Enter}")
    expect(field()).toHaveValue(`well:"Well 01","Well 02" `)
    expect(lastView(onViewChange).filters.name).toEqual({
      type: "text",
      values: ["Well 01", "Well 02"],
    })
    expect(names()).toEqual(["Well 01", "Well 02"])
    expect(filterButton("Well")).toHaveTextContent("Well 01, Well 02")
    expect(chips()).toContain("Well: Well 01, Well 02")
    // Typed by hand, an unquoted value and a comma: the column's values.
    await user.clear(field())
    await user.type(field(), "well:2/4-A-15,")
    expect(options()).not.toContain("well:WellText")
    expect(options()[0]).toBe("Well 011")
  })

  it("adds and removes a text filter's values in its popover, the query following", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<ListWells onViewChange={onViewChange} />)
    await user.click(filterButton("Well"))
    const input = screen.getByRole("textbox", { name: "Contains" })
    expect(input).toHaveAttribute("placeholder", "Add text…")
    // Typed text applies as it is typed; Enter makes it a chip.
    await user.type(input, "01")
    expect(names()).toEqual(["Well 01"])
    await user.keyboard("{Enter}")
    // A comma adds too.
    await user.type(input, "03,")
    expect(input).toHaveValue("")
    const group = screen.getByRole("grid", { name: "Contains any of" })
    expect(
      within(group)
        .getAllByRole("row")
        .map((chip) => chip.textContent)
    ).toEqual(["01", "03"])
    expect(lastView(onViewChange).filters.name).toEqual({
      type: "text",
      values: ["01", "03"],
    })
    expect(names()).toEqual(["Well 01", "Well 03"])
    expect(field()).toHaveValue("well:01,03")
    // "12 of 120 match", as typed.
    expect(
      document.querySelector('[data-slot="data-table-filter-matches"]')
    ).toHaveTextContent("2 of 8 match")
    // A chip's remove button.
    await user.click(within(group).getAllByRole("button")[0])
    expect(lastView(onViewChange).filters.name).toEqual({
      type: "text",
      values: ["03"],
    })
    expect(field()).toHaveValue("well:03")
    // Backspace in the empty field removes the last chip.
    await user.click(input)
    await user.keyboard("{Backspace}")
    expect(lastView(onViewChange).filters).toEqual({})
    expect(field()).toHaveValue("")
    expect(screen.queryByRole("grid", { name: "Contains any of" })).toBeNull()
    // The query's values become chips.
    await user.click(field())
    await user.type(field(), "well:05,06 ")
    await user.click(filterButton("Well"))
    expect(
      within(screen.getByRole("grid", { name: "Contains any of" }))
        .getAllByRole("row")
        .map((chip) => chip.textContent)
    ).toEqual(["05", "06"])
  })

  it("applies two ranges of a number column; its popover edits the first and says Clear removes the rest", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<ListWells onViewChange={onViewChange} />)
    await user.click(field())
    await user.type(field(), "depthm:<1500,>3000 ")
    expect(lastView(onViewChange).filters.depth).toEqual({
      type: "number",
      ranges: [
        { max: 1500, maxExclusive: true },
        { min: 3000, minExclusive: true },
      ],
    })
    // 1,000 and 1,397; 3,382 and 3,779.
    expect(names()).toEqual(["Well 01", "Well 02", "Well 07", "Well 08"])
    expect(chips()).toContain("Depth (m): < 1,500, > 3,000")
    await user.click(filterButton("Depth (m)"))
    expect(screen.getByRole("textbox", { name: "Min" })).toHaveValue("")
    expect(screen.getByRole("textbox", { name: "Max" })).toHaveValue("1,500")
    const note = document.querySelector(
      '[data-slot="data-table-filter-more-ranges"]'
    )
    expect(note).toHaveTextContent(
      "This filter has 1 more range. Clear removes it."
    )
    // The rows both ranges keep, of the 8.
    expect(
      document.querySelector('[data-slot="data-table-filter-matches"]')
    ).toHaveTextContent("4 of 8 match")
    // Editing the first range keeps the other.
    const max = screen.getByRole("textbox", { name: "Max" })
    await user.clear(max)
    await user.type(max, "1200{Enter}")
    expect(lastView(onViewChange).filters.depth).toEqual({
      type: "number",
      ranges: [{ max: 1200 }, { min: 3000, minExclusive: true }],
    })
    expect(field()).toHaveValue("depthm:<=1200,>3000")
    await user.click(screen.getByRole("button", { name: "Clear" }))
    expect(lastView(onViewChange).filters).toEqual({})
    expect(field()).toHaveValue("")
    expect(
      document.querySelector('[data-slot="data-table-filter-more-ranges"]')
    ).toBeNull()
  })
})

describe("DataTableSearch syntax=query: the list is open while the field has focus", () => {
  it("stays open through a press on the clear button, the field's icon or an underlined problem", async () => {
    const user = userEvent.setup({ delay: null })
    render(<Wells />)
    await user.click(field())
    await user.type(field(), "status:dri")
    expect(field()).toHaveAttribute("aria-expanded", "true")
    let expanded = watchExpanded()
    await press(user, button("data-table-query-clear"))
    expect(field()).toHaveValue("")
    expect(field()).toHaveFocus()
    // Never closed in between: the empty query's columns, at once.
    expect(expanded()).not.toContain("false")
    expect(options()[0]).toBe("well:WellText")
    // The search icon beside the input.
    expanded = watchExpanded()
    await press(
      user,
      group().querySelector<HTMLElement>('[data-slot="input-group-addon"]')!
    )
    expect(field()).toHaveFocus()
    expect(expanded()).not.toContain("false")
    // An underlined problem, once typing pauses.
    await user.type(field(), "status:qq")
    const problem = await waitFor(
      () => {
        const element = document.querySelector<HTMLElement>(
          '[data-slot="data-table-query-problem"]'
        )
        expect(element).not.toBeNull()
        return element!
      },
      { timeout: 2000 }
    )
    expanded = watchExpanded()
    await press(user, problem)
    expect(field()).toHaveFocus()
    expect(expanded()).not.toContain("false")
    expect(expanded().at(-1)).toBe("true")
  })

  it("stays open after a pick that completes a term and after Enter, and says what a term does when it has nothing to suggest", async () => {
    const user = userEvent.setup({ delay: null })
    const onViewChange = vi.fn()
    render(<Wells onViewChange={onViewChange} />)
    await user.click(field())
    const expanded = watchExpanded()
    await user.type(field(), "status:dri")
    await user.keyboard("{Enter}")
    expect(field()).toHaveValue("status:drilling ")
    // The next term's columns; nothing picked by a second Enter, which
    // applies the query.
    expect(options()[0]).toBe("well:WellText")
    await user.keyboard("{Enter}")
    expect(field()).toHaveValue("status:drilling ")
    expect(lastView(onViewChange).filters).toEqual({
      status: { type: "options", values: ["drilling"] },
    })
    // Free text that no value matches: one line instead of the rows, in a
    // polite status outside the listbox, never an option.
    await user.type(field(), "zzzz")
    expect(options()).toEqual([])
    const status = document.querySelector(
      '[data-slot="data-table-query-status"]'
    )!
    // Once typing pauses.
    await waitFor(
      () =>
        expect(status).toHaveTextContent("Searching all columns for “zzzz”"),
      { timeout: 2000 }
    )
    const region = status.closest('[role="status"]')!
    expect(region).toHaveAttribute("aria-live", "polite")
    expect(region.closest('[role="listbox"]')).toBeNull()
    // A complete filter term with nothing to offer at the caret: what it
    // filters, as its chip says.
    await user.clear(field())
    await user.type(field(), "depthm:>=1500")
    ;(field() as HTMLInputElement).setSelectionRange(11, 11)
    fireEvent.click(field())
    expect(options()).toEqual([])
    expect(
      document.querySelector('[data-slot="data-table-query-status"]')
    ).toHaveTextContent(/^Depth \(m\): ≥ 1,500$/)
    // Nothing to suggest: "No suggestions".
    await user.clear(field())
    await user.type(field(), "status:qq")
    expect(
      document.querySelector('[data-slot="data-table-query-status"]')
    ).toHaveTextContent(/^No suggestions$/)
    expect(expanded()).not.toContain("false")
  })

  it("closes on Escape until the user types, clicks in the field or presses ↓; Escape again clears", async () => {
    const user = userEvent.setup({ delay: null })
    render(<Wells />)
    await user.click(field())
    await user.type(field(), "active:yes ")
    expect(field()).toHaveAttribute("aria-expanded", "true")
    await user.keyboard("{Escape}")
    expect(field()).toHaveAttribute("aria-expanded", "false")
    await user.type(field(), "gull")
    expect(field()).toHaveAttribute("aria-expanded", "true")
    await user.keyboard("{Escape}")
    expect(field()).toHaveAttribute("aria-expanded", "false")
    await user.click(field())
    expect(field()).toHaveAttribute("aria-expanded", "true")
    await user.keyboard("{Escape}")
    await user.keyboard("{ArrowDown}")
    expect(field()).toHaveAttribute("aria-expanded", "true")
    await user.keyboard("{Escape}{Escape}")
    expect(field()).toHaveValue("")
    expect(field()).toHaveAttribute("aria-expanded", "false")
    expect(field()).toHaveFocus()
  })

  it("closes when focus leaves the field; Tab completes what is typed, else moves on", async () => {
    const user = userEvent.setup({ delay: null })
    render(
      <>
        <Wells />
        <button type="button" id="after">
          After
        </button>
      </>
    )
    await user.click(field())
    await user.type(field(), "sta")
    await user.keyboard("{Tab}")
    expect(field()).toHaveValue("status:")
    expect(field()).toHaveFocus()
    expect(field()).toHaveAttribute("aria-expanded", "true")
    // Nothing typed after a complete term: Tab leaves, and the list closes.
    await user.type(field(), "drilling ")
    await user.keyboard("{Tab}")
    expect(field()).not.toHaveFocus()
    expect(field()).toHaveAttribute("aria-expanded", "false")
    // A press elsewhere.
    await user.click(field())
    expect(field()).toHaveAttribute("aria-expanded", "true")
    // (Hidden from screen readers while the list is open, as all around it.)
    await user.click(document.getElementById("after")!)
    expect(field()).toHaveAttribute("aria-expanded", "false")
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
      active: { type: "boolean", values: [true] },
    })
  })

  it("adds an example on a press anywhere in its row; focus goes back to the field, its caret at the end and its list open", async () => {
    const user = userEvent.setup({ delay: null })
    render(<Wells />)
    await user.click(field())
    await user.type(field(), "gull")
    await user.click(button("data-table-query-help"))
    const help = await screen.findByRole("dialog", { name: "Search syntax" })
    // One button per row, described by what it finds.
    const example = within(help).getByRole("button", { name: "active:yes" })
    expect(example).toHaveAccessibleDescription("Active is yes or no")
    const row = example.closest("tr")!
    expect(row).toHaveAttribute("data-slot", "data-table-query-help-row")
    // The default cursor, as on every other button.
    expect(row.className).not.toContain("cursor-pointer")
    expect(example.className).not.toContain("cursor-pointer")
    expect(within(row).getAllByRole("button")).toHaveLength(1)
    // A press on the description, not the button.
    await user.click(within(row).getByText("Active is yes or no"))
    expect(field()).toHaveValue("gull active:yes ")
    await waitFor(() => expect(field()).toHaveFocus())
    const input = field() as HTMLInputElement
    expect(input.selectionStart).toBe(input.value.length)
    expect(field()).toHaveAttribute("aria-expanded", "true")
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
      ranges: [{ min: 1500.5 }],
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

describe("DataTableSearch syntax=query: the calendar and the list's line", () => {
  const calendar = () =>
    waitFor(() => {
      const element = document.querySelector<HTMLElement>(
        '[data-slot="data-table-query-calendar"]'
      )
      expect(within(element!).getAllByRole("grid")).toHaveLength(1)
      return element!
    })
  const selectedDays = (element: HTMLElement) =>
    Array.from(
      element.querySelectorAll(
        "[data-selected-single=true], [data-range-start=true], [data-range-end=true]"
      ),
      (day) => day.textContent
    )

  it("shows the day a comparison names: the last for <= and >, the first for >= and <", async () => {
    const user = userEvent.setup({ delay: null })
    render(<Wells />)
    await user.click(field())
    for (const [operator, day] of [
      ["<=", "30"],
      [">", "30"],
      [">=", "1"],
      ["<", "1"],
    ]) {
      await user.clear(field())
      await user.type(field(), `spuddate:${operator}2020-06`)
      const element = await calendar()
      await waitFor(() => expect(selectedDays(element)).toEqual([day]))
    }
  })

  it("reads a date with its own comma as one item, and a pick replaces all of it", async () => {
    const user = userEvent.setup({ delay: null })
    render(<Wells />)
    await user.click(field())
    await user.type(field(), "spuddate:jun 30, 2020")
    const element = await calendar()
    await waitFor(() => expect(selectedDays(element)).toEqual(["30"]))
    const fifteen = within(element).getAllByRole("button", { name: /15/ })[0]
    await user.click(fifteen)
    await user.click(
      within(await calendar()).getAllByRole("button", { name: /15/ })[0]
    )
    expect(field()).toHaveValue("spuddate:2020-06-15 ")
  })

  it("reads a term's problem as the list's line, and the search's line once typing pauses", async () => {
    const user = userEvent.setup({ delay: null })
    render(<Wells />)
    await user.click(field())
    const status = () =>
      document.querySelector('[data-slot="data-table-query-status"]')!
    await user.type(field(), "zzzz")
    expect(options()).toEqual([])
    // Not read out on every key: nothing until a pause.
    expect(status().textContent.trim()).toBe("")
    await waitFor(
      () =>
        expect(status()).toHaveTextContent("Searching all columns for “zzzz”"),
      { timeout: 2000 }
    )
    await user.clear(field())
    await user.type(field(), "depthm:abc")
    expect(options()).toEqual([])
    await waitFor(
      () => expect(status()).toHaveTextContent("“abc” is not a number."),
      { timeout: 2000 }
    )
    expect(status().closest('[role="status"]')).toHaveAttribute(
      "aria-live",
      "polite"
    )
  })
})
