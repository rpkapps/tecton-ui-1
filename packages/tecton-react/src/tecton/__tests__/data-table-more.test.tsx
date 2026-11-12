import * as React from "react"
import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  DataTable,
  DataTableContent,
  useDataTable,
  type DataTableProps,
} from "@tecton/react/data-table"

import { columns, layout, WELLS, type Well } from "./data-table-fixtures"

/** The observers made, and a way to say their target came into range. */
const observers: Array<{
  root: Element | Document | null
  rootMargin: string
  targets: Array<Element>
  callback: IntersectionObserverCallback
  disconnected: boolean
}> = []

beforeEach(() => {
  observers.length = 0
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      entry: (typeof observers)[number]
      constructor(
        callback: IntersectionObserverCallback,
        options: IntersectionObserverInit = {}
      ) {
        this.entry = {
          root: options.root ?? null,
          rootMargin: options.rootMargin ?? "",
          targets: [],
          callback,
          disconnected: false,
        }
        observers.push(this.entry)
      }
      observe(target: Element) {
        this.entry.targets.push(target)
      }
      unobserve() {}
      disconnect() {
        this.entry.disconnected = true
      }
      takeRecords() {
        return []
      }
    }
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/** The live observer's target comes within range (or leaves it). */
function intersect(isIntersecting = true) {
  const live = observers.filter((observer) => !observer.disconnected)
  for (const observer of live)
    act(() =>
      observer.callback(
        observer.targets.map(
          (target) => ({ isIntersecting, target }) as IntersectionObserverEntry
        ),
        {} as IntersectionObserver
      )
    )
}

function Wells({
  virtualized = false,
  ...props
}: Partial<DataTableProps<Well>> & { virtualized?: boolean }) {
  return (
    <DataTable items={WELLS.slice(0, 10)} columns={columns} {...props}>
      <DataTableContent aria-label="Wells" virtualized={virtualized} />
    </DataTable>
  )
}

const loadingRows = () =>
  document.querySelectorAll(
    '[data-slot="data-table-loading-more"] > [data-slot="data-table-loading-row"]'
  )

describe("DataTable load more", () => {
  it("shows loading rows after the last row, hidden from screen readers and out of the grid's rows", () => {
    render(<Wells hasMore onLoadMore={() => {}} />)
    expect(loadingRows()).toHaveLength(3)
    expect(
      document.querySelector('[data-slot="data-table-loading-more"]')
    ).toHaveAttribute("aria-hidden", "true")
    // The total is not known yet.
    expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "-1")
  })

  it("calls onLoadMore once as the loading rows come within two views of the page, not again until the items change", () => {
    const onLoadMore = vi.fn()
    const { rerender } = render(<Wells hasMore onLoadMore={onLoadMore} />)
    const observer = observers.at(-1)!
    expect(observer.root).toBeNull()
    expect(observer.rootMargin).toBe("0px 0px 200% 0px")
    intersect()
    intersect(false)
    intersect()
    expect(onLoadMore).toHaveBeenCalledTimes(1)
    // A render with the same items: still one call.
    rerender(<Wells hasMore onLoadMore={onLoadMore} loading />)
    intersect()
    expect(onLoadMore).toHaveBeenCalledTimes(1)
    // More rows came.
    rerender(
      <Wells hasMore onLoadMore={onLoadMore} items={WELLS.slice(0, 20)} />
    )
    intersect()
    expect(onLoadMore).toHaveBeenCalledTimes(2)
    // None to come: no loading rows, no more calls.
    rerender(<Wells hasMore={false} onLoadMore={onLoadMore} items={WELLS} />)
    expect(loadingRows()).toHaveLength(0)
    intersect()
    expect(onLoadMore).toHaveBeenCalledTimes(2)
  })

  it("asks again once the items are other ones, a load ends or the view changes", async () => {
    const user = userEvent.setup()
    const onLoadMore = vi.fn()
    const first = WELLS.slice(0, 10)
    const { rerender } = render(
      <Wells hasMore onLoadMore={onLoadMore} items={first} sortable />
    )
    intersect()
    expect(onLoadMore).toHaveBeenCalledTimes(1)
    // Other items, as many (a refresh): the end may be in view again.
    rerender(
      <Wells hasMore onLoadMore={onLoadMore} items={[...first]} sortable />
    )
    intersect()
    expect(onLoadMore).toHaveBeenCalledTimes(2)
    // A load that brought nothing ends.
    rerender(
      <Wells hasMore onLoadMore={onLoadMore} items={first} sortable loading />
    )
    intersect()
    expect(onLoadMore).toHaveBeenCalledTimes(2)
    rerender(<Wells hasMore onLoadMore={onLoadMore} items={first} sortable />)
    intersect()
    expect(onLoadMore).toHaveBeenCalledTimes(3)
    // The view changes (a sort).
    await user.click(screen.getByRole("button", { name: "Depth (m)" }))
    intersect()
    expect(onLoadMore).toHaveBeenCalledTimes(4)
  })

  it("asks for nothing, with no loading rows, while the user searches or filters items it has", () => {
    const onLoadMore = vi.fn()
    const filtered = {
      filters: { status: { type: "options" as const, values: ["producing"] } },
    }
    const { rerender } = render(
      <Wells
        hasMore
        onLoadMore={onLoadMore}
        filterable
        defaultView={filtered}
      />
    )
    expect(loadingRows()).toHaveLength(0)
    intersect()
    expect(onLoadMore).not.toHaveBeenCalled()
    // In server mode the server filters: more can come.
    rerender(
      <Wells
        hasMore
        onLoadMore={onLoadMore}
        filterable
        dataMode="server"
        defaultView={filtered}
      />
    )
    expect(loadingRows()).toHaveLength(3)
  })

  it("shows the error after the rows, with Retry, in place of the loading rows", async () => {
    const user = userEvent.setup()
    const onLoadMore = vi.fn()
    const onRetry = vi.fn()
    render(
      <Wells
        hasMore
        onLoadMore={onLoadMore}
        error="The next wells did not load."
        onRetry={onRetry}
      />
    )
    expect(loadingRows()).toHaveLength(0)
    // The rows stay.
    expect(screen.getByText("Well 10")).toBeInTheDocument()
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("The next wells did not load.")
    expect(alert.closest("tr")).toHaveAttribute(
      "data-slot",
      "data-table-more-error"
    )
    intersect()
    expect(onLoadMore).not.toHaveBeenCalled()
    await user.click(within(alert).getByRole("button", { name: "Retry" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("watches the nearest ancestor that clips the rows vertically, not the page, when it scrolls in a pane", () => {
    const { unmount } = render(
      <div data-testid="pane" style={{ overflowY: "auto", maxHeight: 300 }}>
        <div>
          <Wells hasMore onLoadMore={() => {}} />
        </div>
      </div>
    )
    expect(observers.at(-1)?.root).toBe(screen.getByTestId("pane"))
    unmount()
    // A pane of a fixed height, its content taller.
    const taller = (element: HTMLDivElement | null) => {
      if (!element) return
      Object.defineProperty(element, "scrollHeight", { value: 900 })
      Object.defineProperty(element, "clientHeight", { value: 300 })
    }
    render(
      <div
        ref={taller}
        data-testid="fixed"
        style={{ overflowY: "auto", height: 300 }}
      >
        <Wells hasMore onLoadMore={() => {}} />
      </div>
    )
    expect(observers.at(-1)?.root).toBe(screen.getByTestId("fixed"))
  })

  it("watches the page when only the table's own frame scrolls (sideways), growing with its rows", () => {
    // The frame's `overflow-x: auto` makes its `overflow-y` auto too.
    const style = window.getComputedStyle
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      const computed = style(element)
      if (!(element as HTMLElement).matches('[data-slot="table-container"]'))
        return computed
      return {
        ...computed,
        overflowY: "auto",
        maxHeight: "none",
      }
    })
    render(<Wells hasMore onLoadMore={() => {}} />)
    expect(observers.at(-1)?.root).toBeNull()
  })

  it("watches the table's own scroll area when virtualized", () => {
    layout()
    render(
      <div style={{ height: 400 }}>
        <Wells hasMore onLoadMore={() => {}} virtualized />
      </div>
    )
    const container = document.querySelector('[data-slot="table-container"]')
    expect(observers.at(-1)?.root).toBe(container)
    // The loading rows follow the windowed rows, outside the body that
    // windows them.
    expect(loadingRows()).toHaveLength(3)
  })

  it("is busy while more rows load, with the loading rows and not the bar", () => {
    render(<Wells hasMore loading onLoadMore={() => {}} />)
    expect(screen.getByRole("grid")).toHaveAttribute("aria-busy", "true")
    expect(
      document.querySelector('[data-slot="data-table-progress"]')
    ).toBeNull()
  })

  it("is off with pages, with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<Wells hasMore pagination onLoadMore={() => {}} />)
    expect(loadingRows()).toHaveLength(0)
    expect(warn).toHaveBeenCalledWith(
      "DataTable: `hasMore` is off with `pagination`: pages are loaded a page at a time (`onPageChange`), not as the user scrolls."
    )
  })
})

describe('DataTable load more with "Show more" (loadMore="button")', () => {
  const band = () =>
    document.querySelector<HTMLElement>('[data-slot="data-table-show-more"]')
  const showMore = () => screen.getByRole("button", { name: "Show more" })
  // The table's live region (the spinner is a status too).
  const status = () =>
    document.querySelector('[data-slot="data-table-content"] > [role="status"]')

  it("shows the band after the last row, with no loading rows and no observer", () => {
    render(<Wells hasMore loadMore="button" onLoadMore={() => {}} />)
    expect(loadingRows()).toHaveLength(0)
    expect(observers).toHaveLength(0)
    const row = band()!
    // After the last row, in the place of the loading rows; not hidden.
    expect(row.parentElement).toHaveAttribute(
      "data-slot",
      "data-table-loading-more"
    )
    expect(row.parentElement).not.toHaveAttribute("aria-hidden")
    expect(
      row.parentElement?.previousElementSibling?.lastElementChild
    ).toHaveTextContent("Well 10")
    expect(within(row).getByRole("button", { name: "Show more" })).toBe(
      showMore()
    )
    // No total known: the rows shown.
    expect(row).toHaveTextContent("Showing 10 rows")
  })

  it("counts the rows shown of the server's rowCount, formatted", () => {
    render(
      <Wells
        hasMore
        loadMore="button"
        onLoadMore={() => {}}
        dataMode="server"
        rowCount={1500}
      />
    )
    expect(band()).toHaveTextContent("Showing 10 of 1,500")
  })

  it("calls onLoadMore once per press, and is disabled with a spinner while the rows load", async () => {
    const user = userEvent.setup()
    const onLoadMore = vi.fn()
    const { rerender } = render(
      <Wells hasMore loadMore="button" onLoadMore={onLoadMore} />
    )
    await user.click(showMore())
    expect(onLoadMore).toHaveBeenCalledTimes(1)
    rerender(
      <Wells hasMore loadMore="button" onLoadMore={onLoadMore} loading />
    )
    expect(showMore()).toHaveAttribute("aria-disabled", "true")
    expect(
      showMore().querySelector('[data-slot="spinner"]')
    ).toBeInTheDocument()
    // The band stays: no loading rows, no bar, the table busy.
    expect(loadingRows()).toHaveLength(0)
    expect(
      document.querySelector('[data-slot="data-table-progress"]')
    ).toBeNull()
    expect(screen.getByRole("grid")).toHaveAttribute("aria-busy", "true")
    await user.click(showMore())
    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it("keeps focus on the button through a load, and says how many rows came", async () => {
    const user = userEvent.setup()
    const onLoadMore = vi.fn()
    const { rerender } = render(
      <Wells hasMore loadMore="button" onLoadMore={onLoadMore} />
    )
    await user.click(showMore())
    rerender(
      <Wells hasMore loadMore="button" onLoadMore={onLoadMore} loading />
    )
    expect(showMore()).toHaveFocus()
    expect(status()).toHaveTextContent("Loading")
    rerender(
      <Wells
        hasMore
        loadMore="button"
        onLoadMore={onLoadMore}
        items={WELLS.slice(0, 20)}
      />
    )
    expect(showMore()).toHaveFocus()
    expect(band()).toHaveTextContent("Showing 20 rows")
    expect(status()).toHaveTextContent("Loaded 10 more rows")
    // Enter on the focused button asks again.
    await user.keyboard("{Enter}")
    expect(onLoadMore).toHaveBeenCalledTimes(2)
  })

  it("moves focus to the first new row once there are no more", async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <Wells hasMore loadMore="button" onLoadMore={() => {}} />
    )
    await user.click(showMore())
    rerender(<Wells hasMore loadMore="button" onLoadMore={() => {}} loading />)
    rerender(
      <Wells
        hasMore={false}
        loadMore="button"
        onLoadMore={() => {}}
        items={WELLS.slice(0, 13)}
      />
    )
    expect(band()).toBeNull()
    expect(screen.getByRole("row", { name: /Well 11/ })).toHaveFocus()
    expect(status()).toHaveTextContent("Loaded 3 more rows")
  })

  it("is not there without more rows", () => {
    render(<Wells hasMore={false} loadMore="button" onLoadMore={() => {}} />)
    expect(band()).toBeNull()
    expect(screen.queryByRole("button", { name: "Show more" })).toBeNull()
  })

  it("shows the error in its place, with Retry, and keeps focus there", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const props = {
      hasMore: true,
      loadMore: "button" as const,
      onLoadMore: () => {},
      onRetry,
    }
    const { rerender } = render(<Wells {...props} />)
    await user.click(showMore())
    rerender(<Wells {...props} loading />)
    rerender(<Wells {...props} error="The next wells did not load." />)
    expect(band()).toBeNull()
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("The next wells did not load.")
    const retry = within(alert).getByRole("button", { name: "Retry" })
    expect(retry).toHaveFocus()
    await user.click(retry)
    expect(onRetry).toHaveBeenCalledTimes(1)
    // The retry loads: "Show more" again, focused, spinning.
    rerender(<Wells {...props} loading />)
    expect(showMore()).toHaveFocus()
    expect(showMore()).toHaveAttribute("aria-disabled", "true")
  })

  it("follows the windowed rows of a virtualized table", () => {
    layout()
    render(
      <div style={{ height: 400 }}>
        <Wells
          hasMore
          loadMore="button"
          onLoadMore={() => {}}
          items={WELLS}
          virtualized
        />
      </div>
    )
    expect(observers).toHaveLength(0)
    const row = band()!
    expect(row.parentElement?.previousElementSibling).toHaveAttribute(
      "data-slot",
      "table-body"
    )
    expect(row).toHaveTextContent("Showing 23 rows")
  })

  it("loads a virtualized table's first rows outside the body of its rows, which measures the rows when they come", () => {
    layout()
    const { rerender } = render(
      <div style={{ height: 400 }}>
        <Wells items={[]} loading dataMode="server" virtualized />
      </div>
    )
    const skeletons = document.querySelectorAll(
      '[data-slot="data-table-loading-row"]'
    )
    expect(skeletons).toHaveLength(5)
    expect(skeletons[0].parentElement).toHaveAttribute(
      "data-slot",
      "data-table-loading-rows"
    )
    // Not rows of the virtualized body: its columns and rows' height are
    // measured from the rows.
    expect(document.querySelector("tr[data-index]")).toBeNull()
    expect(document.querySelector("colgroup")).toBeNull()
    rerender(
      <div style={{ height: 400 }}>
        <Wells items={WELLS} dataMode="server" virtualized />
      </div>
    )
    expect(document.querySelector("tr[data-index]")).toBeInTheDocument()
  })

  it("comes before the totals row", () => {
    render(
      <DataTable
        items={WELLS.slice(0, 10)}
        columns={columns}
        hasMore
        loadMore="button"
        onLoadMore={() => {}}
      >
        <DataTableContent aria-label="Wells" totals />
      </DataTable>
    )
    expect(band()?.parentElement?.nextElementSibling).toHaveAttribute(
      "data-slot",
      "data-table-totals"
    )
  })
})

describe("useDataTable exportCsv", () => {
  it("exports the rows matching the filters, or the selected ones, in the view's order", async () => {
    let api: ReturnType<typeof useDataTable<Well>> | undefined
    function Probe() {
      api = useDataTable<Well>()
      return null
    }
    render(
      <DataTable
        items={WELLS.slice(0, 6)}
        columns={columns}
        filterable
        selectionMode="multiple"
        defaultValue={["w2", "w1", "w4"]}
        defaultView={{
          filters: { status: { type: "options", values: ["producing"] } },
          sorting: [{ column: "name", direction: "descending" }],
          columns: { hidden: ["spud", "active", "depth"] },
        }}
      >
        <DataTableContent aria-label="Wells" />
        <Probe />
      </DataTable>
    )
    const filtered = await api!.exportCsv()
    expect(filtered).toBe(
      "Well,Field,Status\r\nWell 04,Visund,Producing\r\nWell 01,Gullfaks,Producing\r\n"
    )
    const selected = await api!.exportCsv({ rows: "selected", header: false })
    // The selected rows the view matches first, in its order, then the rest.
    expect(selected).toBe(
      "Well 04,Visund,Producing\r\nWell 01,Gullfaks,Producing\r\nWell 02,Statfjord,Shut in\r\n"
    )
    const all = await api!.exportCsv({ columns: "all", bom: true })
    expect(
      all.startsWith("﻿Well,Field,Status,Depth (m),Spud date,Active")
    ).toBe(true)
  })

  it("exports the page's rows, without the detail rows open on it", async () => {
    let api: ReturnType<typeof useDataTable<Well>> | undefined
    function Probe() {
      api = useDataTable<Well>()
      return null
    }
    render(
      <DataTable
        items={WELLS.slice(0, 6)}
        columns={columns}
        pagination
        defaultPageSize={3}
        defaultExpanded={["w1", "w3"]}
        defaultView={{ columns: { hidden: ["spud", "active", "depth"] } }}
      >
        <DataTableContent
          aria-label="Wells"
          renderDetail={(well: Well) => <p>Logs of {well.name}</p>}
        />
        <Probe />
      </DataTable>
    )
    expect(screen.getByText("Logs of Well 01")).toBeInTheDocument()
    expect(await api!.exportCsv({ rows: "page" })).toBe(
      "Well,Field,Status\r\nWell 01,Gullfaks,Producing\r\nWell 02,Statfjord,Shut in\r\nWell 03,Snorre,Drilling\r\n"
    )
  })
})
