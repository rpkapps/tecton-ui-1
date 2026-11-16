import { act } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { hydrateRoot } from "react-dom/client"
import { describe, expect, it, vi } from "vitest"

import {
  createColumns,
  DataTable,
  DataTableContent,
} from "@tecton/react/data-table"

import {
  DRAG_AND_DROP,
  loadFeature,
  useFeature,
} from "../internal/data-table/lazy"

/** What a part renders with a feature: the server's markup until hydrated. */
function Probe() {
  const { module } = useFeature(DRAG_AND_DROP, true)
  return <span>{module ? "loaded" : "pending"}</span>
}

type Well = { id: string; name: string; depth: number }

const columns = createColumns<Well>([
  { id: "name", header: "Well" },
  { id: "depth", header: "TD (m)", type: "number" },
])

function Wells() {
  return (
    <DataTable
      items={[{ id: "a12", name: "34/10-A-12", depth: 3250 }]}
      columns={columns}
      reorderableColumns
    >
      <DataTableContent aria-label="Wells" />
    </DataTable>
  )
}

describe("DataTable on demand, server rendered", () => {
  it("renders a feature as the server did while hydrating, then with its module", async () => {
    const html = renderToString(<Probe />)
    expect(html).toContain("pending")
    await loadFeature(DRAG_AND_DROP)
    const recoverable = vi.fn()
    const container = document.createElement("div")
    container.innerHTML = html
    document.body.append(container)
    const root = await act(async () =>
      hydrateRoot(container, <Probe />, { onRecoverableError: recoverable })
    )
    expect(recoverable).not.toHaveBeenCalled()
    expect(container).toHaveTextContent("loaded")
    act(() => root.unmount())
    container.remove()
  })

  it("hydrates without a mismatch while another table has loaded the drag and drop", async () => {
    const html = renderToString(<Wells />)
    await loadFeature(DRAG_AND_DROP)
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const recoverable = vi.fn()
    const container = document.createElement("div")
    container.innerHTML = html
    document.body.append(container)
    const root = await act(async () =>
      hydrateRoot(container, <Wells />, { onRecoverableError: recoverable })
    )
    expect(recoverable).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    // Once hydrated, the loaded code is used.
    expect(
      container.querySelector('[data-slot="data-table-column-drop-indicator"]')
    ).not.toBeNull()
    act(() => root.unmount())
    container.remove()
  })
})
