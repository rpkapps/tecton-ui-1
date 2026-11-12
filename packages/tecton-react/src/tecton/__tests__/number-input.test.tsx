import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Field, FieldError, FieldLabel } from "@tecton/react/components/field"
import { NumberInput } from "@tecton/react/tecton/number-input"
import { TectonProvider } from "@tecton/react/tecton/provider"

/** A NumberInput labelled "Depth", in an en-US provider. */
function Depth(props: React.ComponentProps<typeof NumberInput>) {
  return (
    <TectonProvider locale="en-US">
      <label htmlFor="depth">Depth</label>
      <NumberInput id="depth" {...props} />
    </TectonProvider>
  )
}

const input = () => screen.getByRole("textbox", { name: "Depth" })
const increase = () => screen.getByRole("button", { name: "Increase" })
const decrease = () => screen.getByRole("button", { name: "Decrease" })

describe("NumberInput", () => {
  it("is a text field with its two steppers at the end, in one group", () => {
    render(<Depth />)
    const field = input()
    expect(field).toHaveAttribute("type", "text")
    expect(field).toHaveAttribute("data-slot", "number-input-input")
    const group = field.closest('[data-slot="number-input-group"]')!
    expect(group).toHaveAttribute("data-variant", "outline")
    expect(group).toHaveClass("h-8", "rounded-md", "border-input")
    const buttons = group.querySelectorAll("button")
    expect([...buttons].map((button) => button.dataset.slot)).toEqual([
      "number-input-decrement",
      "number-input-increment",
    ])
    // Steppers are out of the tab order: the keys step in the field.
    for (const button of buttons) {
      expect(button).toHaveAttribute("tabindex", "-1")
      expect(button).toHaveAttribute("aria-controls", "depth")
      expect(button).toHaveClass("text-ghost-foreground", "size-6")
    }
    // No native spin buttons: the visible field is a text input.
    expect(
      document.querySelectorAll('input[type="number"]:not([aria-hidden])')
    ).toHaveLength(0)
  })

  it("names the steppers Increase and Decrease, in the provider's locale", async () => {
    const { unmount } = render(<Depth />)
    expect(increase()).toBeInTheDocument()
    expect(decrease()).toBeInTheDocument()
    unmount()
    render(
      <TectonProvider locale="de-DE">
        <NumberInput aria-label="Tiefe" />
      </TectonProvider>
    )
    expect(
      await screen.findByRole("button", { name: "Erhöhen" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Verringern" })).toBeVisible()
  })

  it("reports what is typed as a number, and null when emptied", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Depth onValueChange={onValueChange} />)
    await user.type(input(), "1234.5")
    expect(onValueChange).toHaveBeenLastCalledWith(
      1234.5,
      expect.objectContaining({ reason: "input-change" })
    )
    // Letters are not taken.
    await user.type(input(), "m")
    expect(input()).toHaveValue("1234.5")
    // Formatted when it loses focus.
    await user.tab()
    expect(input()).toHaveValue("1,234.5")
    await user.clear(input())
    expect(onValueChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ reason: "input-clear" })
    )
  })

  it("parses and formats in the provider's locale", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <TectonProvider locale="de-DE">
        <NumberInput aria-label="Tiefe" onValueChange={onValueChange} />
      </TectonProvider>
    )
    const field = screen.getByRole("textbox", { name: "Tiefe" })
    await user.type(field, "1234,5")
    expect(onValueChange).toHaveBeenLastCalledWith(1234.5, expect.anything())
    await user.tab()
    expect(field).toHaveValue("1.234,5")
  })

  it("shows units through format", async () => {
    const user = userEvent.setup()
    render(
      <Depth
        defaultValue={2450}
        format={{ style: "unit", unit: "meter", maximumFractionDigits: 1 }}
      />
    )
    expect(input()).toHaveValue("2,450 m")
    await user.click(increase())
    expect(input()).toHaveValue("2,451 m")
  })

  it("clamps typed values to min and max, unless allowOutOfRange", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { unmount } = render(
      <Depth min={0} max={100} onValueChange={onValueChange} />
    )
    await user.type(input(), "250")
    expect(onValueChange).toHaveBeenLastCalledWith(100, expect.anything())
    await user.tab()
    expect(input()).toHaveValue("100")
    unmount()
    onValueChange.mockClear()
    render(
      <Depth min={0} max={100} allowOutOfRange onValueChange={onValueChange} />
    )
    await user.type(input(), "250")
    expect(onValueChange).toHaveBeenLastCalledWith(250, expect.anything())
    // Stepping still clamps.
    await user.keyboard("{ArrowUp}")
    expect(onValueChange).toHaveBeenLastCalledWith(100, expect.anything())
  })

  it("steps with the buttons, within min and max", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Depth
        defaultValue={8}
        min={0}
        max={10}
        step={2}
        onValueChange={onValueChange}
      />
    )
    await user.click(increase())
    expect(input()).toHaveValue("10")
    expect(onValueChange).toHaveBeenLastCalledWith(
      10,
      expect.objectContaining({ reason: "increment-press" })
    )
    // At the bound the button is unavailable.
    expect(increase()).toHaveAttribute("data-disabled")
    expect(decrease()).not.toHaveAttribute("data-disabled")
    await user.click(decrease())
    await user.click(decrease())
    expect(input()).toHaveValue("6")
    expect(onValueChange).toHaveBeenLastCalledWith(
      6,
      expect.objectContaining({ reason: "decrement-press" })
    )
  })

  it("steps with the arrow keys, by largeStep with Shift, and goes to min and max with Home and End", async () => {
    const user = userEvent.setup()
    render(<Depth defaultValue={50} min={0} max={1000} largeStep={100} />)
    await user.click(input())
    await user.keyboard("{ArrowUp}")
    expect(input()).toHaveValue("51")
    await user.keyboard("{ArrowDown}{ArrowDown}")
    expect(input()).toHaveValue("49")
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}")
    expect(input()).toHaveValue("149")
    await user.keyboard("{End}")
    expect(input()).toHaveValue("1,000")
    await user.keyboard("{Home}")
    expect(input()).toHaveValue("0")
  })

  it("is uncontrolled with defaultValue, and controlled with value", async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = React.useState<number | null>(5)
      return (
        <>
          <Depth value={value} onValueChange={setValue} />
          <output>{value === null ? "empty" : value}</output>
          <button type="button" onClick={() => setValue(42)}>
            Set
          </button>
        </>
      )
    }
    render(<Controlled />)
    expect(input()).toHaveValue("5")
    await user.click(increase())
    expect(screen.getByRole("status")).toHaveTextContent("6")
    await user.click(screen.getByRole("button", { name: "Set" }))
    expect(input()).toHaveValue("42")
    await user.clear(input())
    expect(screen.getByRole("status")).toHaveTextContent("empty")
  })

  it("keeps a controlled value that the owner does not change", async () => {
    const user = userEvent.setup()
    render(<Depth value={3} onValueChange={() => {}} />)
    await user.click(increase())
    expect(input()).toHaveValue("3")
  })

  it("starts empty with defaultValue null, and submits its value under name", () => {
    render(
      <form data-testid="form">
        <Depth name="depth" defaultValue={null} placeholder="m" />
      </form>
    )
    expect(input()).toHaveValue("")
    expect(input()).toHaveAttribute("placeholder", "m")
    // A step from empty starts at 0 (or the bound nearest it).
    fireEvent.click(increase())
    expect(input()).toHaveValue("0")
    const data = new FormData(screen.getByTestId<HTMLFormElement>("form"))
    expect(data.get("depth")).toBe("0")
  })

  it("takes its label, description and error from Field", () => {
    render(
      <TectonProvider locale="en-US">
        <Field data-invalid>
          <FieldLabel htmlFor="td">TD (m)</FieldLabel>
          <NumberInput
            id="td"
            defaultValue={-5}
            aria-invalid
            aria-describedby="td-error"
          />
          <FieldError id="td-error">Enter a depth of 0 or more</FieldError>
        </Field>
      </TectonProvider>
    )
    const field = screen.getByRole("textbox", { name: "TD (m)" })
    expect(field).toHaveAttribute("aria-invalid", "true")
    expect(field).toHaveAccessibleDescription("Enter a depth of 0 or more")
    // The invalid look is the group's: its border and ring.
    expect(field.closest('[data-slot="number-input-group"]')).toHaveClass(
      "has-[[data-slot][aria-invalid=true]]:border-destructive"
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a depth of 0 or more"
    )
  })

  it("does nothing while disabled, and hides the steppers while read-only", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { unmount } = render(
      <Depth defaultValue={4} disabled onValueChange={onValueChange} />
    )
    expect(input()).toBeDisabled()
    expect(input().closest('[data-slot="number-input-group"]')).toHaveAttribute(
      "data-disabled"
    )
    expect(increase()).toHaveAttribute("data-disabled")
    fireEvent.click(increase())
    fireEvent.keyDown(input(), { key: "ArrowUp" })
    expect(input()).toHaveValue("4")
    expect(onValueChange).not.toHaveBeenCalled()
    unmount()
    render(<Depth defaultValue={4} readOnly onValueChange={onValueChange} />)
    expect(input()).toHaveAttribute("readonly")
    await user.click(input())
    await user.keyboard("{ArrowUp}")
    expect(input()).toHaveValue("4")
    expect(increase()).toHaveClass("data-readonly:hidden")
    expect(increase()).toHaveAttribute("data-readonly")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("passes ref, key handlers and className to their elements", async () => {
    const user = userEvent.setup()
    const ref = React.createRef<HTMLInputElement>()
    const onKeyDown = vi.fn()
    render(<Depth ref={ref} onKeyDown={onKeyDown} className="w-24" />)
    expect(ref.current).toBe(input())
    expect(input().closest('[data-slot="number-input"]')).toHaveClass("w-24")
    await user.type(input(), "7{Enter}")
    expect(onKeyDown).toHaveBeenLastCalledWith(
      expect.objectContaining({ key: "Enter" })
    )
    await waitFor(() => expect(input()).toHaveValue("7"))
  })
})
