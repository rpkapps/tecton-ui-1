import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  applyFilter,
  emptyFilter,
  wells,
  WellsListPage,
} from "../blocks/list-01/page"
import { SettingsPage } from "../blocks/settings-01/page"

describe("list-01", () => {
  it("filters by search text, field, type and status", () => {
    expect(applyFilter(wells, emptyFilter)).toHaveLength(wells.length)
    const [first] = wells
    if (!first) throw new Error("no wells")
    const byName = applyFilter(wells, { ...emptyFilter, query: first.name })
    expect(byName.map((well) => well.id)).toContain(first.id)
    const byField = applyFilter(wells, { ...emptyFilter, field: first.field })
    expect(byField.every((well) => well.field === first.field)).toBe(true)
    const byStatus = applyFilter(wells, {
      ...emptyFilter,
      statuses: [first.status],
    })
    expect(byStatus.every((well) => well.status === first.status)).toBe(true)
  })

  it("searches from the search box and clears back to all wells", async () => {
    const user = userEvent.setup()
    render(<WellsListPage />)
    expect(screen.getByText(`${wells.length} wells`)).toBeInTheDocument()
    await user.click(screen.getByRole("textbox", { name: "Search wells" }))
    await user.paste("no such well")
    expect(screen.getByText("No wells match")).toBeInTheDocument()
    await user.click(
      screen.getAllByRole("button", { name: "Clear filters" })[0]!
    )
    expect(screen.getByText(`${wells.length} wells`)).toBeInTheDocument()
  })

  it("filters by the well type picked in its select", async () => {
    const user = userEvent.setup()
    render(<WellsListPage />)
    const count = wells.filter((well) => well.type === "injector").length
    await user.click(screen.getByRole("button", { name: /Well type/ }))
    await user.click(screen.getByRole("option", { name: "Injector" }))
    expect(
      screen.getByText(`${count} ${count === 1 ? "well" : "wells"}`)
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Well type/ })).toHaveTextContent(
      "Injector"
    )
  })

  it("shows the empty state without data", () => {
    render(<WellsListPage empty />)
    expect(screen.getByText("No wells yet")).toBeInTheDocument()
    expect(
      screen.queryByRole("textbox", { name: "Search wells" })
    ).not.toBeInTheDocument()
  })
})

describe("settings-01", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("will not save a bio that is too long, and links the error to it", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SettingsPage onSave={onSave} />)
    const bio = screen.getByLabelText("Bio")
    await user.clear(bio)
    await user.click(bio)
    await user.paste("x".repeat(161))
    expect(bio).toHaveAccessibleDescription(/Keep it under 160 characters\./)
    const save = screen.getByRole("button", { name: "Save changes" })
    expect(save).toBeDisabled()

    await user.clear(bio)
    await user.paste("Short bio.")
    expect(save).toBeEnabled()
    await user.click(save)
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it("saves the role picked in its select", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SettingsPage onSave={onSave} />)
    const role = screen.getByRole("combobox", { name: "Role" })
    expect(role).toHaveTextContent("Subsurface lead")
    await user.click(role)
    await user.click(screen.getByRole("option", { name: "Drilling engineer" }))
    expect(role).toHaveTextContent("Drilling engineer")
    await user.click(screen.getByRole("button", { name: "Save changes" }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: expect.objectContaining({ role: "drilling-engineer" }),
      })
    )
  })

  it("uses h2 for the section titles under the page's h1", () => {
    render(<SettingsPage />)
    expect(
      screen.getByRole("heading", { level: 1, name: "Settings" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 2, name: "Identity" })
    ).toBeInTheDocument()
  })

  it("keeps the toast for 3 s after the latest save", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<SettingsPage />)
    const firstName = screen.getByLabelText("First name")
    const save = screen.getByRole("button", { name: "Save changes" })

    await user.type(firstName, "a")
    await user.click(save)
    expect(screen.getByText("Settings saved")).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(2000))

    await user.type(firstName, "b")
    await user.click(save)
    // The first save's timer would hide the toast here.
    act(() => vi.advanceTimersByTime(1500))
    expect(screen.getByText("Settings saved")).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.queryByText("Settings saved")).not.toBeInTheDocument()
  })

  it("clears the toast timer on unmount", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { unmount } = render(<SettingsPage />)
    await user.type(screen.getByLabelText("First name"), "a")
    await user.click(screen.getByRole("button", { name: "Save changes" }))
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
