/**
 * DataTable's development warnings (`warnings.ts`): each call tests
 * `process.env.NODE_ENV` itself, in a `try`, so that a bundler drops the
 * warnings from a production build, a development build says them, and a
 * page with no bundler and no `process` neither warns nor throws.
 */
import { render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/data-table"

import { createWarnings } from "../internal/data-table/warnings"

type Well = { id: string; name: string }

const columns = createColumns<Well>([{ id: "name", header: "Well" }])
const ITEMS: Array<Well> = [{ id: "a", name: "A-1" }]

const table = (
  <DataTable items={ITEMS} columns={columns} pagination hasMore>
    <DataTableContent aria-label="Wells" />
  </DataTable>
)

const saved = globalThis.process

afterEach(() => {
  globalThis.process = saved
  vi.restoreAllMocks()
})

describe("DataTable development warnings", () => {
  it("are said in development", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { unmount } = render(table)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("`hasMore` is off with `pagination`")
    )
    unmount()
  })

  it("are not said, and nothing throws, without `process`", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    // The root alone (its parts render library components, which read
    // `process` themselves), as on a page that loads the modules with no
    // bundler: its warnings' effects run.
    Reflect.deleteProperty(globalThis, "process")
    expect(typeof process).toBe("undefined")
    let unmount = () => {}
    try {
      expect(() => {
        ;({ unmount } = render(
          <DataTable items={ITEMS} columns={columns} pagination hasMore />
        ))
      }).not.toThrow()
      expect(() => createWarnings()("key", "message")).not.toThrow()
    } finally {
      globalThis.process = saved
    }
    expect(warn).not.toHaveBeenCalled()
    unmount()
  })

  it("are not said in production", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.stubEnv("NODE_ENV", "production")
    try {
      const { unmount } = render(table)
      createWarnings()("key", "message")
      unmount()
    } finally {
      vi.unstubAllEnvs()
    }
    expect(warn).not.toHaveBeenCalled()
  })
})
