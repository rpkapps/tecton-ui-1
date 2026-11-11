/**
 * Ctrl / Cmd + C before cell selection's code has loaded (§7): the copy is
 * not lost. The key begins a Clipboard API write in its own moment, its
 * content a promise that the code fulfils once it is there; and the
 * table's first focus asks for the code.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/tecton/data-table"

import * as announcer from "../internal/primitives/live-announcer"

/** The cell selection's code arrives when the test lets it. */
const chunk = vi.hoisted(() => {
  let open: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    open = resolve
  })
  return { gate, open: () => open(), requested: vi.fn() }
})
vi.mock(
  "../internal/data-table/cell-selection/index",
  async (importOriginal) => {
    chunk.requested()
    await chunk.gate
    return importOriginal()
  }
)

type Well = { id: string; name: string; depth: number }

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "depth", header: "Depth", type: "number" },
])

/** A `ClipboardItem` whose items are read back as the browser would. */
class FakeClipboardItem {
  constructor(readonly items: Record<string, Promise<Blob>>) {}
}

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, "clipboard")
})

describe("DataTable copy before its code has loaded", () => {
  it("asks for the code on the table's first focus, and writes a copy begun before it came", async () => {
    vi.stubGlobal("requestIdleCallback", () => 1)
    vi.stubGlobal("cancelIdleCallback", () => {})
    vi.stubGlobal("ClipboardItem", FakeClipboardItem)
    const say = vi.spyOn(announcer, "announce")
    const write = vi.fn((_: Array<FakeClipboardItem>) => Promise.resolve())
    // The second copy's write is refused (no permission, say).
    write
      .mockImplementationOnce(() => Promise.resolve())
      .mockImplementationOnce(() => Promise.reject(new Error("Denied")))
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { write, writeText: vi.fn() },
    })
    const { unmount } = render(
      <DataTable
        items={[
          { id: "a", name: "A-1", depth: 1200 },
          { id: "b", name: "B-2", depth: 1800 },
        ]}
        columns={columns}
        cellSelectionMode="range"
      >
        <DataTableContent aria-label="Wells" />
      </DataTable>
    )
    expect(chunk.requested).not.toHaveBeenCalled()
    const stop = screen
      .getByRole("grid")
      .querySelector<HTMLElement>('[tabindex="0"]')!
    act(() => stop.focus())
    await waitFor(() => expect(chunk.requested).toHaveBeenCalled())
    // Down to B-2, then Ctrl + C: the write begins now, in the key's moment.
    fireEvent.keyDown(stop, { key: "ArrowDown", shiftKey: true })
    fireEvent.keyDown(document.activeElement!, { key: "c", ctrlKey: true })
    fireEvent.keyDown(document.activeElement!, { key: "c", ctrlKey: true })
    expect(write).toHaveBeenCalledTimes(2)
    const [[item]] = write.mock.calls[0]
    await act(async () => chunk.open())
    const text = await (await item.items["text/plain"]).text()
    expect(text).toBe("A-1\r\nB-2")
    const html = await (await item.items["text/html"]).text()
    expect(html).toContain("<td class=t>B-2</td>")
    // Said as the browser wrote it: copied, then not.
    await waitFor(() =>
      expect(say).toHaveBeenCalledWith(
        "The cells could not be copied to the clipboard"
      )
    )
    const said = say.mock.calls.map(([text]) => text)
    expect(said).toContain("Copied 2 cells")
    expect(said.filter((text) => text === "Copied 2 cells")).toHaveLength(1)
    unmount()
  })
})
