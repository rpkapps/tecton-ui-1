import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  ActionBar,
  ActionBarActions,
  ActionBarMessage,
  ActionBarSelection,
} from "@tecton/react/tecton/action-bar"

describe("ActionBar", () => {
  it("renders a region in the toolbar placement by default", () => {
    render(<ActionBar aria-label="Selection">x</ActionBar>)
    const bar = screen.getByRole("region", { name: "Selection" })
    expect(bar).toHaveAttribute("data-slot", "action-bar")
    expect(bar).toHaveAttribute("data-placement", "toolbar")
    expect(bar).toHaveClass("w-full", "bg-muted")
  })

  it("floats with placement=floating", () => {
    render(<ActionBar placement="floating">x</ActionBar>)
    const bar = screen.getByRole("region")
    expect(bar).toHaveAttribute("data-placement", "floating")
    expect(bar).toHaveClass("sticky", "bg-popover")
  })

  it("renders nothing when closed", () => {
    const { container } = render(<ActionBar open={false}>x</ActionBar>)
    expect(container).toBeEmptyDOMElement()
  })

  it("dismisses on Escape from inside the bar", () => {
    const onOpenChange = vi.fn()
    render(
      <ActionBar onOpenChange={onOpenChange}>
        <button>Delete</button>
      </ActionBar>
    )
    const button = screen.getByRole("button")
    button.focus()
    fireEvent.keyDown(button, { key: "Escape" })
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("ignores other keys and Escape that was already handled", () => {
    const onOpenChange = vi.fn()
    const onKeyDown = vi.fn((e: React.KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault()
    })
    render(
      <ActionBar onOpenChange={onOpenChange} onKeyDown={onKeyDown}>
        <button>Delete</button>
      </ActionBar>
    )
    const button = screen.getByRole("button")
    fireEvent.keyDown(button, { key: "Enter" })
    expect(onOpenChange).not.toHaveBeenCalled()
    fireEvent.keyDown(button, { key: "Escape" })
    expect(onKeyDown).toHaveBeenCalledTimes(2)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("merges className", () => {
    render(<ActionBar className="mt-2">x</ActionBar>)
    expect(screen.getByRole("region")).toHaveClass("mt-2", "flex")
  })
})

describe("ActionBarSelection", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // A live region that mounts together with its text is not announced: the
  // first selection, which is what mounts the bar, would be silent.
  it("mounts the live region empty and fills it after it is tracked", () => {
    vi.useFakeTimers()
    const { container, rerender } = render(
      <ActionBar>
        <ActionBarSelection count={1} total={40} />
      </ActionBar>
    )
    const region = container.querySelector('[aria-live="polite"]')!
    expect(region).toBeEmptyDOMElement()
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(region).toHaveTextContent("1 of 40 selected")

    rerender(
      <ActionBar>
        <ActionBarSelection count={2} total={40} />
      </ActionBar>
    )
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(container.querySelector('[aria-live="polite"]')).toBe(region)
    expect(region).toHaveTextContent("2 of 40 selected")
  })

  it("announces the count of the total", async () => {
    const { container } = render(<ActionBarSelection count={12} total={340} />)
    await waitFor(() =>
      expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
        "12 of 340 selected"
      )
    )
    expect(
      container.querySelector('[data-slot="action-bar-selection"]')
    ).toBeInTheDocument()
  })

  it("announces the bare count without a total", async () => {
    const { container } = render(<ActionBarSelection count={3} />)
    await waitFor(() =>
      expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
        "3 selected"
      )
    )
  })

  it("includes the noun label", async () => {
    const { container } = render(
      <ActionBarSelection count={2} total={9} label="wells" />
    )
    await waitFor(() =>
      expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
        "2 of 9 wells selected"
      )
    )
  })

  it("renders the compact forms hidden from assistive tech", () => {
    const { container } = render(<ActionBarSelection count={4} total={10} />)
    const visual = container.querySelector('[aria-hidden="true"]')
    expect(visual).toHaveTextContent("4 of 10 selected")
    expect(visual).toHaveTextContent("4 selected")
  })

  it("has no clear buttons without onClear", () => {
    render(<ActionBarSelection count={1} />)
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("renders a text and an icon clear button that both call onClear", async () => {
    const onClear = vi.fn()
    render(
      <ActionBarSelection
        count={1}
        onClear={onClear}
        clearLabel="Deselect all"
      />
    )
    await userEvent.click(screen.getByRole("button", { name: "Clear" }))
    await userEvent.click(screen.getByRole("button", { name: "Deselect all" }))
    expect(onClear).toHaveBeenCalledTimes(2)
  })

  it("defaults the icon button label", () => {
    render(<ActionBarSelection count={1} onClear={() => {}} />)
    expect(
      screen.getByRole("button", { name: "Clear selection" })
    ).toBeInTheDocument()
  })
})

describe("ActionBarMessage and ActionBarActions", () => {
  it("renders the message as a paragraph", () => {
    render(
      <ActionBarMessage className="x">
        You have unsaved changes
      </ActionBarMessage>
    )
    const p = screen.getByText("You have unsaved changes")
    expect(p.tagName).toBe("P")
    expect(p).toHaveAttribute("data-slot", "action-bar-message")
    expect(p).toHaveClass("x", "truncate")
  })

  it("renders the actions as a labelled toolbar", () => {
    render(
      <ActionBarActions>
        <button>Save</button>
      </ActionBarActions>
    )
    const toolbar = screen.getByRole("toolbar", { name: "Actions" })
    expect(toolbar).toHaveAttribute("data-slot", "action-bar-actions")
    expect(toolbar).toHaveAttribute("data-overflow-root")
    expect(toolbar).toContainElement(
      screen.getByRole("button", { name: "Save" })
    )
  })

  it("accepts a custom toolbar label and className", () => {
    render(<ActionBarActions aria-label="Bulk" className="x" />)
    expect(screen.getByRole("toolbar", { name: "Bulk" })).toHaveClass(
      "x",
      "ms-auto"
    )
  })
})
