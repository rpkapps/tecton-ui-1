import { describe, expect, it } from "vitest"

import { ariaRowCount } from "../internal/data-table/content-rows"
import type { BodyRow } from "../internal/data-table/engine/index"

const item = (id: string, continued = false) =>
  ({ kind: "item", id, key: id, continued }) as unknown as BodyRow<unknown>
const group = (key: string) =>
  ({ kind: "group", id: key, key }) as unknown as BodyRow<unknown>

/** A client table on pages of 10 of 23 rows, one header row. */
const PAGES = {
  failed: false,
  more: false,
  server: false,
  pagination: true,
  virtualized: false,
  headerRows: 1,
  footerRows: 0,
  matched: 23,
  allRows: 23,
  openOnPages: 0,
  bodyRows: Array.from({ length: 10 }, (_, i) => item(`w${i}`)),
  shown: 10,
}

describe("ariaRowCount", () => {
  it("counts every page's rows, the header's, the open detail rows and the totals row", () => {
    expect(ariaRowCount(PAGES)).toBe(24)
    expect(ariaRowCount({ ...PAGES, openOnPages: 2, footerRows: 1 })).toBe(27)
  })

  it("counts none in the error state", () => {
    expect(ariaRowCount({ ...PAGES, failed: true })).toBeUndefined()
    expect(
      ariaRowCount({ ...PAGES, failed: true, server: true, matched: 240 })
    ).toBeUndefined()
  })

  it("counts the server's rows and the loaded rows that are not items", () => {
    expect(
      ariaRowCount({
        ...PAGES,
        server: true,
        matched: 240,
        bodyRows: [group("g"), item("a"), item("b", true)],
        shown: 3,
      })
    ).toBe(1 + 240 + 2)
  })

  it("is unknown while more rows come and the server does not say how many", () => {
    const loaded = { ...PAGES, pagination: false, more: true }
    expect(ariaRowCount(loaded)).toBe(-1)
    // Known: the server's count, past the rows loaded.
    expect(
      ariaRowCount({ ...loaded, server: true, virtualized: true, matched: 240 })
    ).toBe(241)
  })

  it("leaves the count to every row there, or to a virtualized body, but with a totals row", () => {
    const all = { ...PAGES, pagination: false }
    expect(ariaRowCount(all)).toBeUndefined()
    expect(ariaRowCount({ ...all, virtualized: true })).toBeUndefined()
    expect(ariaRowCount({ ...all, virtualized: true, footerRows: 1 })).toBe(12)
  })
})
