import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { TectonProvider } from "@tecton/react/tecton/provider"
import { TableColumnResizer } from "@tecton/react/tecton/table-column-resizer"

function Resizer(
  props: Partial<React.ComponentProps<typeof TableColumnResizer>>
) {
  const [width, setWidth] = React.useState(160)
  return (
    <TableColumnResizer
      label="Field"
      value={width}
      min={80}
      max={400}
      resetValue={160}
      {...props}
      onValueChange={(next, details) => {
        props.onValueChange?.(next, details)
        setWidth(next)
      }}
    />
  )
}

const separator = () => screen.getByRole("separator", { name: "Resize Field" })

describe("TableColumnResizer", () => {
  it("is a focusable separator with the column's width as its value", () => {
    render(<Resizer />)
    expect(separator()).toHaveAttribute("aria-orientation", "vertical")
    expect(separator()).toHaveAttribute("aria-valuenow", "160")
    expect(separator()).toHaveAttribute("aria-valuemin", "80")
    expect(separator()).toHaveAttribute("aria-valuemax", "400")
    expect(separator()).toHaveAttribute("tabindex", "0")
  })

  it("steps with the arrow keys, Shift, Home, End and Enter", async () => {
    const user = userEvent.setup()
    const onValueCommitted = vi.fn()
    render(<Resizer onValueCommitted={onValueCommitted} />)
    act(() => separator().focus())
    await user.keyboard("{ArrowRight}")
    expect(separator()).toHaveAttribute("aria-valuenow", "168")
    expect(onValueCommitted).toHaveBeenLastCalledWith(168, expect.anything())
    await user.keyboard("{ArrowLeft}{ArrowLeft}")
    expect(separator()).toHaveAttribute("aria-valuenow", "152")
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}")
    expect(separator()).toHaveAttribute("aria-valuenow", "184")
    await user.keyboard("{End}")
    expect(separator()).toHaveAttribute("aria-valuenow", "400")
    await user.keyboard("{ArrowRight}")
    expect(separator()).toHaveAttribute("aria-valuenow", "400")
    await user.keyboard("{Home}")
    expect(separator()).toHaveAttribute("aria-valuenow", "80")
    await user.keyboard("{Enter}")
    expect(separator()).toHaveAttribute("aria-valuenow", "160")
  })

  it("mirrors the arrow keys and the drag in right-to-left text", async () => {
    const user = userEvent.setup()
    render(
      <TectonProvider direction="rtl">
        <Resizer />
      </TectonProvider>
    )
    act(() => separator().focus())
    await user.keyboard("{ArrowLeft}")
    expect(separator()).toHaveAttribute("aria-valuenow", "168")
    fireEvent.pointerDown(separator(), {
      button: 0,
      pointerId: 1,
      clientX: 200,
      clientY: 10,
    })
    fireEvent.pointerMove(document, { pointerId: 1, clientX: 170, clientY: 10 })
    expect(separator()).toHaveAttribute("aria-valuenow", "198")
    fireEvent.pointerUp(document, { pointerId: 1, clientX: 170, clientY: 10 })
  })

  it("follows a drag, clamped, and commits on release", () => {
    const onValueChange = vi.fn()
    const onValueCommitted = vi.fn()
    render(
      <Resizer
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
      />
    )
    fireEvent.pointerDown(separator(), {
      button: 0,
      pointerId: 1,
      clientX: 160,
      clientY: 10,
    })
    fireEvent.pointerMove(document, { pointerId: 1, clientX: 200, clientY: 10 })
    expect(separator()).toHaveAttribute("aria-valuenow", "200")
    expect(separator()).toHaveAttribute("data-dragging", "")
    expect(onValueCommitted).not.toHaveBeenCalled()
    fireEvent.pointerMove(document, { pointerId: 1, clientX: 0, clientY: 10 })
    expect(separator()).toHaveAttribute("aria-valuenow", "80")
    fireEvent.pointerMove(document, { pointerId: 1, clientX: 180, clientY: 10 })
    fireEvent.pointerUp(document, { pointerId: 1, clientX: 180, clientY: 10 })
    expect(separator()).not.toHaveAttribute("data-dragging")
    expect(onValueCommitted).toHaveBeenCalledTimes(1)
    expect(onValueCommitted).toHaveBeenCalledWith(180, expect.anything())
    expect(onValueChange.mock.calls.at(-1)?.[1].reason).toBe("drag")
  })

  it("puts the width back when a drag is cancelled with Escape", () => {
    render(<Resizer />)
    fireEvent.pointerDown(separator(), {
      button: 0,
      pointerId: 1,
      clientX: 160,
      clientY: 10,
    })
    fireEvent.pointerMove(document, { pointerId: 1, clientX: 240, clientY: 10 })
    expect(separator()).toHaveAttribute("aria-valuenow", "240")
    fireEvent.keyDown(document, { key: "Escape" })
    expect(separator()).toHaveAttribute("aria-valuenow", "160")
  })

  it("resets on a double click, and keeps presses from the header", () => {
    const onHeaderClick = vi.fn()
    render(
      <div onClick={onHeaderClick}>
        <Resizer defaultValue={160} value={undefined} />
      </div>
    )
    act(() => separator().focus())
    fireEvent.keyDown(separator(), { key: "End" })
    expect(separator()).toHaveAttribute("aria-valuenow", "400")
    fireEvent.click(separator())
    fireEvent.doubleClick(separator())
    expect(separator()).toHaveAttribute("aria-valuenow", "160")
    expect(onHeaderClick).not.toHaveBeenCalled()
  })

  it("does nothing when disabled", () => {
    render(<Resizer disabled />)
    expect(separator()).not.toHaveAttribute("tabindex")
    expect(separator()).toHaveAttribute("aria-disabled", "true")
    fireEvent.keyDown(separator(), { key: "End" })
    expect(separator()).toHaveAttribute("aria-valuenow", "160")
  })

  it("shows a guide and the width while dragging, and only then", () => {
    render(<Resizer />)
    const guide = () =>
      document.querySelector('[data-slot="table-column-resizer-guide"]')
    const width = () =>
      document.querySelector('[data-slot="table-column-resizer-width"]')
    expect(guide()).toBeNull()
    fireEvent.pointerDown(separator(), {
      button: 0,
      pointerId: 1,
      clientX: 160,
      clientY: 10,
    })
    fireEvent.pointerMove(document, { pointerId: 1, clientX: 200, clientY: 10 })
    expect(guide()).toHaveAttribute("aria-hidden", "true")
    expect(width()).toHaveTextContent("200 px")
    fireEvent.pointerUp(document, { pointerId: 1, clientX: 200, clientY: 10 })
    expect(guide()).toBeNull()
    expect(width()).toBeNull()
  })
})
