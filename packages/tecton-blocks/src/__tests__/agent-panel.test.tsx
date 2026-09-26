import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AiAgentPanel } from "../blocks/ai-agent-panel/page"
import type { AgentMessage } from "../blocks/ai-agent-panel/page"
import DashboardPage from "../blocks/dashboard-01/page"

const reply = /I'll look into/

const withActions: AgentMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content: ["Two options."],
    actions: [
      { id: "a1", label: "Run option A" },
      { id: "a2", label: "Run option B" },
    ],
  },
]

describe("ai-agent-panel", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function setup(messages: AgentMessage[] = withActions) {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<AiAgentPanel initialMessages={messages} />)
    return user
  }

  it("replies after a send", async () => {
    const user = setup()
    await user.click(screen.getByRole("button", { name: "Run option A" }))
    expect(screen.queryByText(reply)).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByText(reply)).toBeInTheDocument()
  })

  it("disables the other chips while a reply is pending", async () => {
    const user = setup()
    await user.click(screen.getByRole("button", { name: "Run option A" }))
    expect(screen.getByRole("button", { name: "Run option B" })).toBeDisabled()
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByRole("button", { name: "Run option B" })).toBeEnabled()
  })

  it("Stop cancels the pending reply", async () => {
    const user = setup()
    await user.click(screen.getByRole("button", { name: "Run option A" }))
    await user.click(screen.getByRole("button", { name: /stop/i }))
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.queryByText(reply)).not.toBeInTheDocument()
  })

  it("Clear history cancels the pending reply", async () => {
    const user = setup()
    await user.click(screen.getByRole("button", { name: "Run option A" }))
    await user.click(screen.getByRole("button", { name: "More options" }))
    await user.click(
      await screen.findByRole("menuitem", { name: "Clear history" })
    )
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.queryByText(reply)).not.toBeInTheDocument()
    expect(screen.queryByText("Two options.")).not.toBeInTheDocument()
  })

  it("unmounting cancels the pending reply", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { unmount } = render(<AiAgentPanel initialMessages={withActions} />)
    await user.click(screen.getByRole("button", { name: "Run option A" }))
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe("dashboard-01 agent below 1280px", () => {
  it(
    "opens the agent in a sheet and keeps the chat when it closes",
    { timeout: 30000 },
    async () => {
      const user = userEvent.setup()
      render(<DashboardPage />)
      await user.click(screen.getByRole("button", { name: "Open agent" }))
      const sheet = await screen.findByRole("dialog", { name: "AI Agent" })
      const composer = within(sheet).getByRole("textbox")
      await user.type(composer, "Compare casing options{Enter}")
      expect(
        within(sheet).getByText("Compare casing options")
      ).toBeInTheDocument()

      await user.click(
        within(sheet).getByRole("button", { name: "Close panel" })
      )
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Open agent" }))
      const reopened = await screen.findByRole("dialog", { name: "AI Agent" })
      expect(
        within(reopened).getByText("Compare casing options")
      ).toBeInTheDocument()
    }
  )
})
