import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ProjectTree } from "../blocks/dashboard-01/page"
import { Offline } from "../blocks/offline-01/page"
import { ServerError } from "../blocks/server-error-01/page"
import Sidebar03Page from "../blocks/sidebar-03/page"

describe("offline-01", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("recovers from a rejected retry", async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn().mockRejectedValue(new Error("network down"))
    render(<Offline onRetry={onRetry} />)
    await user.click(screen.getByRole("button", { name: "Retry now" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByRole("button", { name: "Retry now" })
    ).toBeEnabled()
    expect(screen.getByRole("status")).toHaveTextContent(/Still offline/)
  })

  it("says it is back online after a successful retry and stops counting", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onReconnect = vi.fn()
    const onRetry = vi.fn().mockResolvedValue(true)
    render(<Offline onRetry={onRetry} onReconnect={onReconnect} />)
    await user.click(screen.getByRole("button", { name: "Retry now" }))
    expect(
      await screen.findByRole("heading", { name: "You're back online." })
    ).toBeInTheDocument()
    expect(onReconnect).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/Retrying in/)).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(60_000))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("keeps the countdown out of the live region", () => {
    render(<Offline />)
    const countdown = screen.getByText(/Retrying in \d+ s/)
    expect(countdown).toHaveAttribute("aria-live", "off")
    expect(screen.getByRole("status")).not.toHaveTextContent(/Retrying in/)
  })

  it("retries at once when the browser reports it is online", async () => {
    const onRetry = vi.fn().mockResolvedValue(true)
    render(<Offline onRetry={onRetry} />)
    act(() => {
      window.dispatchEvent(new Event("online"))
    })
    expect(
      await screen.findByRole("heading", { name: "You're back online." })
    ).toBeInTheDocument()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe("server-error-01", () => {
  it("stays on the page when the retry rejects", async () => {
    const user = userEvent.setup()
    const unhandled = vi.fn()
    process.on("unhandledRejection", unhandled)
    try {
      render(<ServerError onRetry={() => Promise.reject(new Error("500"))} />)
      await user.click(screen.getByRole("button", { name: "Try again" }))
      expect(
        await screen.findByRole("button", { name: "Try again" })
      ).toBeEnabled()
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(unhandled).not.toHaveBeenCalled()
    } finally {
      process.off("unhandledRejection", unhandled)
    }
  })
})

/** The visibility toggle in the tree row labelled `label`. */
function toggleIn(label: string) {
  const row = screen.getByRole("row", { name: new RegExp(label) })
  return { row, toggle: within(row).getByRole("button", { name: /Hide|Show/ }) }
}

describe("tree visibility toggles", () => {
  it("sidebar-03: Hide becomes a pressed Show and dims the row", async () => {
    const user = userEvent.setup()
    render(<Sidebar03Page />)
    const { row, toggle } = toggleIn("34/10-A-12 H")
    expect(toggle).toHaveAccessibleName("Hide")
    expect(toggle).toHaveAttribute("aria-pressed", "false")
    await user.click(toggle)
    const after = toggleIn("34/10-A-12 H")
    expect(after.toggle).toHaveAccessibleName("Show")
    expect(after.toggle).toHaveAttribute("aria-pressed", "true")
    expect(after.row).toHaveAttribute("data-hidden", "true")
    expect(row).toBe(after.row)
    await user.click(after.toggle)
    expect(toggleIn("34/10-A-12 H").toggle).toHaveAccessibleName("Hide")
  })

  it("dashboard project tree: Hide becomes a pressed Show", async () => {
    const user = userEvent.setup()
    render(<ProjectTree />)
    const [firstItem] = screen
      .getAllByRole("row")
      .filter((row) => within(row).queryByRole("button", { name: "Hide" }))
    if (!firstItem) throw new Error("no item row")
    await user.click(within(firstItem).getByRole("button", { name: "Hide" }))
    const toggle = within(firstItem).getByRole("button", { name: "Show" })
    expect(toggle).toHaveAttribute("aria-pressed", "true")
  })
})
