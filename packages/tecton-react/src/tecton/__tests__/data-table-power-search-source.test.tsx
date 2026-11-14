/**
 * The power search's query source lives as long as the rows it counts: the
 * engine's search parts are new on every run (every keystroke that reaches
 * the view), the source and its caches are not.
 */
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"

import {
  DataTable,
  DataTableContent,
  DataTableSearch,
} from "@tecton/react/data-table"

import type * as Source from "../internal/data-table/engine/query/source"
import { loadFeature } from "../internal/data-table/lazy"
import { QUERY } from "../internal/data-table/search"
import { columns, WELLS } from "./data-table-fixtures"

const made = vi.hoisted(() => vi.fn())
vi.mock(
  "../internal/data-table/engine/query/source",
  async (importOriginal) => {
    const original = await importOriginal<typeof Source>()
    return {
      ...original,
      createQuerySource: (
        ...args: Parameters<typeof original.createQuerySource>
      ) => {
        made()
        return original.createQuerySource(...args)
      },
    }
  }
)

beforeAll(async () => {
  await loadFeature(QUERY)
}, 30_000)

describe("DataTableSearch syntax=query: the query source", () => {
  it("is made once for the rows, not on every keystroke", async () => {
    const user = userEvent.setup({ delay: null })
    const { rerender } = render(
      <DataTable items={WELLS} columns={columns} filterable>
        <DataTableSearch syntax="query" />
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    const field = screen.getByRole("combobox", { name: "Search" })
    await user.click(field)
    await user.type(field, "status:drilling gull")
    expect(made).toHaveBeenCalledTimes(1)
    // Other rows: another source.
    rerender(
      <DataTable items={WELLS.slice(0, 5)} columns={columns} filterable>
        <DataTableSearch syntax="query" />
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    await user.type(field, "f")
    expect(made).toHaveBeenCalledTimes(2)
  })
})
