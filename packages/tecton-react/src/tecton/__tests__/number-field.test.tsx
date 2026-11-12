import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldScrubArea,
  NumberFieldSlider,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldUnit,
} from "@tecton/react/number-field"
import { TectonProvider } from "@tecton/react/provider"

type FieldProps = React.ComponentProps<typeof NumberField>

function Boxed(props: FieldProps) {
  return (
    <NumberField {...props}>
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput aria-label="Depth" />
        <NumberFieldUnit>ft</NumberFieldUnit>
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  )
}

function Slider(
  props: FieldProps & { pixelSensitivity?: number; width?: number }
) {
  const { pixelSensitivity, width, ...rest } = props
  return (
    <NumberField {...rest}>
      <NumberFieldSlider
        pixelSensitivity={pixelSensitivity}
        ref={(el) => {
          if (el && width !== undefined) {
            el.getBoundingClientRect = () =>
              ({ width, height: 32, left: 0, top: 0 }) as DOMRect
          }
        }}
      >
        <NumberFieldInput aria-label="Opacity" />
      </NumberFieldSlider>
    </NumberField>
  )
}

const slider = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="number-field-slider"]')!
const fill = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="number-field-slider-fill"]')

function drag(
  el: HTMLElement,
  moves: number[],
  init: { shiftKey?: boolean; altKey?: boolean } = {}
) {
  fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: 100 })
  for (const x of moves) {
    fireEvent.pointerMove(el, { pointerId: 1, clientX: x, ...init })
  }
}

describe("NumberField", () => {
  it("renders the parts with their slots", () => {
    const { container } = render(<Boxed defaultValue={5} />)
    const input = screen.getByRole("textbox", { name: "Depth" })
    expect(input).toHaveValue("5")
    expect(input).toHaveAttribute("data-slot", "number-field-input")
    for (const slot of [
      "number-field",
      "number-field-group",
      "number-field-unit",
      "number-field-increment",
      "number-field-decrement",
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull()
    }
    expect(screen.getByRole("button", { name: "Increase" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Decrease" })).toBeVisible()
  })

  it("puts minus before the input and plus after it", () => {
    const { container } = render(<Boxed defaultValue={5} />)
    const slots = [
      ...container.querySelector('[data-slot="number-field-group"]')!.children,
    ].map((el) => el.getAttribute("data-slot"))
    expect(slots).toEqual([
      "number-field-decrement",
      "number-field-input",
      "number-field-unit",
      "number-field-increment",
    ])
    expect(screen.getByRole("button", { name: "Decrease" })).toContainHTML(
      "lucide-minus"
    )
    expect(screen.getByRole("button", { name: "Increase" })).toContainHTML(
      "lucide-plus"
    )
  })

  it("describes the input with the unit", () => {
    render(<Boxed defaultValue={5} />)
    const input = screen.getByRole("textbox", { name: "Depth" })
    expect(input).toHaveAccessibleDescription("ft")
  })

  it("steps with the buttons and clamps to min and max", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Boxed
        defaultValue={9}
        min={0}
        max={10}
        step={1}
        onValueChange={onValueChange}
      />
    )
    const input = screen.getByRole("textbox", { name: "Depth" })
    await user.click(screen.getByRole("button", { name: "Increase" }))
    expect(input).toHaveValue("10")
    expect(onValueChange).toHaveBeenLastCalledWith(10, expect.anything())
    await user.click(screen.getByRole("button", { name: "Increase" }))
    expect(input).toHaveValue("10")
    await user.click(screen.getByRole("button", { name: "Decrease" }))
    expect(input).toHaveValue("9")
  })

  it("steps with the arrow keys, Shift for largeStep", async () => {
    const user = userEvent.setup()
    render(<Boxed defaultValue={0} largeStep={10} />)
    const input = screen.getByRole("textbox", { name: "Depth" })
    await user.click(input)
    await user.keyboard("{ArrowUp}")
    expect(input).toHaveValue("1")
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}")
    expect(input).toHaveValue("11")
    await user.keyboard("{ArrowDown}")
    expect(input).toHaveValue("10")
  })

  it("steps with the wheel only while the input is focused", () => {
    render(<Boxed defaultValue={0} />)
    const input = screen.getByRole("textbox", { name: "Depth" })
    fireEvent.wheel(input, { deltaY: -100 })
    expect(input).toHaveValue("0")
    act(() => input.focus())
    fireEvent.wheel(input, { deltaY: -100 })
    expect(input).toHaveValue("1")
    fireEvent.wheel(input, { deltaY: 100 })
    expect(input).toHaveValue("0")
  })

  it("turns wheel stepping off with allowWheelScrub={false}", () => {
    render(<Boxed defaultValue={0} allowWheelScrub={false} />)
    const input = screen.getByRole("textbox", { name: "Depth" })
    act(() => input.focus())
    fireEvent.wheel(input, { deltaY: -100 })
    expect(input).toHaveValue("0")
  })

  it("reports null when the input is cleared", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Boxed defaultValue={3} onValueChange={onValueChange} />)
    const input = screen.getByRole("textbox", { name: "Depth" })
    await user.clear(input)
    expect(onValueChange).toHaveBeenLastCalledWith(null, expect.anything())
    expect(input).toHaveValue("")
  })

  it("is controlled through value and onValueChange", async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = React.useState<number | null>(2)
      return (
        <>
          <Boxed value={value} onValueChange={setValue} />
          <output>{String(value)}</output>
        </>
      )
    }
    render(<Controlled />)
    await user.click(screen.getByRole("button", { name: "Increase" }))
    expect(screen.getByRole("status")).toHaveTextContent("3")
  })

  it("formats with format options", () => {
    render(
      <Boxed
        defaultValue={0.25}
        format={{ style: "percent", maximumFractionDigits: 1 }}
      />
    )
    expect(screen.getByRole("textbox", { name: "Depth" })).toHaveValue("25%")
  })

  it("formats in the TectonProvider locale", () => {
    render(
      <TectonProvider locale="de-DE">
        <Boxed defaultValue={1234.5} />
      </TectonProvider>
    )
    expect(screen.getByRole("textbox", { name: "Depth" })).toHaveValue(
      "1.234,5"
    )
  })

  it("disables the input and the minus and plus buttons", () => {
    const { container } = render(<Boxed defaultValue={1} disabled />)
    expect(screen.getByRole("textbox", { name: "Depth" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Increase" })).toBeDisabled()
    expect(
      container.querySelector('[data-slot="number-field-group"]')
    ).toHaveAttribute("data-disabled")
  })

  it("sets the group variant", () => {
    const { container } = render(
      <NumberField>
        <NumberFieldGroup variant="filled">
          <NumberFieldInput aria-label="x" />
        </NumberFieldGroup>
      </NumberField>
    )
    expect(
      container.querySelector('[data-slot="number-field-group"]')
    ).toHaveAttribute("data-variant", "filled")
  })

  it("renders a scrub area", () => {
    const { container } = render(
      <NumberField defaultValue={1}>
        <NumberFieldScrubArea>
          <label>Depth</label>
        </NumberFieldScrubArea>
        <NumberFieldGroup>
          <NumberFieldInput />
        </NumberFieldGroup>
      </NumberField>
    )
    expect(
      container.querySelector('[data-slot="number-field-scrub-area"]')
    ).toHaveTextContent("Depth")
  })

  it("throws when a part is used outside NumberField", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<NumberFieldUnit>ft</NumberFieldUnit>)).toThrow(
      /within a NumberField/
    )
    vi.restoreAllMocks()
  })
})

describe("NumberFieldSlider", () => {
  it("fills to the value's share of min..max", () => {
    const { container } = render(
      <Slider defaultValue={0.25} min={0} max={1} step={0.01} />
    )
    expect(fill(container)).toHaveStyle({ width: "25%" })
  })

  it("has no fill without both bounds", () => {
    const { container } = render(<Slider defaultValue={3} />)
    expect(fill(container)).toBeNull()
  })

  it("scrubs by step per pixelSensitivity when unbounded", () => {
    const onValueChange = vi.fn()
    const { container } = render(
      <Slider
        defaultValue={10}
        pixelSensitivity={2}
        onValueChange={onValueChange}
      />
    )
    // 4 px of threshold, then 10 px = 5 steps
    drag(slider(container), [104, 114])
    expect(screen.getByRole("textbox")).toHaveValue("15")
    expect(onValueChange).toHaveBeenLastCalledWith(
      15,
      expect.objectContaining({ reason: "scrub", direction: 1 })
    )
    expect(slider(container)).toHaveAttribute("data-scrubbing")
  })

  it("needs a longer move to start a drag with a finger", () => {
    const { container } = render(<Slider defaultValue={10} />)
    const el = slider(container)
    fireEvent.pointerDown(el, {
      pointerId: 1,
      pointerType: "touch",
      button: 0,
      clientX: 100,
    })
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 106 })
    expect(el).not.toHaveAttribute("data-scrubbing")
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 108 })
    expect(el).toHaveAttribute("data-scrubbing")
  })

  it("ignores a second finger while dragging", () => {
    const { container } = render(<Slider defaultValue={10} />)
    const el = slider(container)
    drag(el, [104, 114])
    fireEvent.pointerDown(el, { pointerId: 2, button: 0, clientX: 300 })
    fireEvent.pointerMove(el, { pointerId: 2, clientX: 400 })
    expect(screen.getByRole("textbox")).toHaveValue("15")
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 124 })
    expect(screen.getByRole("textbox")).toHaveValue("20")
  })

  it("commits and stops when the browser takes the touch to scroll", () => {
    const onValueCommitted = vi.fn()
    const { container } = render(
      <Slider defaultValue={10} onValueCommitted={onValueCommitted} />
    )
    const el = slider(container)
    drag(el, [104, 114])
    fireEvent.pointerCancel(el, { pointerId: 1 })
    expect(onValueCommitted).toHaveBeenCalledWith(15, expect.anything())
    expect(el).not.toHaveAttribute("data-scrubbing")
    expect(screen.getByRole("textbox")).not.toHaveFocus()
  })

  it("does not re-render for pointer moves that leave the value unchanged", () => {
    let commits = 0
    const { container } = render(
      <React.Profiler id="nf" onRender={() => commits++}>
        <Slider defaultValue={0.5} min={0} max={1} step={0.1} width={200} />
      </React.Profiler>
    )
    // Past the threshold: one commit for data-scrubbing.
    drag(slider(container), [104])
    commits = 0
    // 20 px = one step: these 9 moves stay on 0.5.
    for (let x = 105; x < 114; x++) {
      fireEvent.pointerMove(slider(container), { pointerId: 1, clientX: x })
    }
    expect(commits).toBe(0)
    fireEvent.pointerMove(slider(container), { pointerId: 1, clientX: 124 })
    expect(screen.getByRole("textbox")).toHaveValue("0.6")
    // Ours, plus the input-text sync the field does in a layout effect.
    expect(commits).toBeLessThanOrEqual(2)
  })

  it("maps the box width to the range when bounded, and clamps", () => {
    const { container } = render(
      <Slider defaultValue={0.5} min={0} max={1} step={0.01} width={200} />
    )
    drag(slider(container), [104, 154])
    expect(screen.getByRole("textbox")).toHaveValue("0.75")
    expect(fill(container)).toHaveStyle({ width: "75%" })
    fireEvent.pointerMove(slider(container), { pointerId: 1, clientX: 900 })
    expect(screen.getByRole("textbox")).toHaveValue("1")
    // Coming back responds at once instead of after the overshoot.
    fireEvent.pointerMove(slider(container), { pointerId: 1, clientX: 880 })
    expect(screen.getByRole("textbox")).toHaveValue("0.9")
  })

  it("uses largeStep with Shift and smallStep with Alt", () => {
    const { container } = render(
      <Slider
        defaultValue={0}
        pixelSensitivity={1}
        largeStep={10}
        smallStep={0.1}
      />
    )
    drag(slider(container), [104, 106], { shiftKey: true })
    expect(screen.getByRole("textbox")).toHaveValue("20")
    fireEvent.pointerMove(slider(container), {
      pointerId: 1,
      clientX: 107,
      altKey: true,
    })
    expect(screen.getByRole("textbox")).toHaveValue("20.1")
  })

  it("mirrors the drag direction in RTL", () => {
    const { container } = render(
      <TectonProvider direction="rtl">
        <Slider defaultValue={10} pixelSensitivity={1} />
      </TectonProvider>
    )
    drag(slider(container), [104, 109])
    expect(screen.getByRole("textbox")).toHaveValue("5")
  })

  it("commits on release", () => {
    const onValueCommitted = vi.fn()
    const { container } = render(
      <Slider
        defaultValue={0}
        pixelSensitivity={1}
        onValueCommitted={onValueCommitted}
      />
    )
    drag(slider(container), [104, 107])
    fireEvent.pointerUp(slider(container), { pointerId: 1, clientX: 107 })
    expect(onValueCommitted).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ reason: "scrub" })
    )
    expect(slider(container)).not.toHaveAttribute("data-scrubbing")
  })

  it("restores the start value on Escape", () => {
    const { container } = render(
      <Slider defaultValue={4} pixelSensitivity={1} />
    )
    drag(slider(container), [104, 110])
    expect(screen.getByRole("textbox")).toHaveValue("10")
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" })
    })
    expect(screen.getByRole("textbox")).toHaveValue("4")
    fireEvent.pointerMove(slider(container), { pointerId: 1, clientX: 150 })
    expect(screen.getByRole("textbox")).toHaveValue("4")
  })

  it("edits as text after a click without a drag", () => {
    const { container } = render(<Slider defaultValue={4} />)
    fireEvent.pointerDown(slider(container), {
      pointerId: 1,
      button: 0,
      clientX: 100,
    })
    fireEvent.pointerMove(slider(container), { pointerId: 1, clientX: 101 })
    fireEvent.pointerUp(slider(container), { pointerId: 1, clientX: 101 })
    const input = screen.getByRole("textbox")
    expect(input).toHaveFocus()
    expect(input).toHaveValue("4")
  })

  it("scrubs from the focused input after a drag, and keeps the caret on a click", async () => {
    const user = userEvent.setup()
    const onValueCommitted = vi.fn()
    render(
      <Slider
        defaultValue={4}
        pixelSensitivity={1}
        onValueCommitted={onValueCommitted}
      />
    )
    const input = screen.getByRole("textbox")
    await user.click(input)
    await user.clear(input)
    await user.type(input, "20")

    fireEvent.pointerDown(input, { pointerId: 1, button: 0, clientX: 100 })
    fireEvent.pointerMove(input, { pointerId: 1, clientX: 101 })
    fireEvent.pointerUp(input, { pointerId: 1, clientX: 101 })
    expect(input).toHaveFocus()
    expect(input).toHaveValue("20")

    fireEvent.pointerDown(input, { pointerId: 2, button: 0, clientX: 100 })
    fireEvent.pointerMove(input, { pointerId: 2, clientX: 104 })
    expect(input).not.toHaveFocus()
    fireEvent.pointerMove(input, { pointerId: 2, clientX: 107 })
    expect(input).toHaveValue("23")
    fireEvent.pointerUp(input, { pointerId: 2, clientX: 107 })
    expect(onValueCommitted).toHaveBeenLastCalledWith(
      23,
      expect.objectContaining({ reason: "scrub" })
    )
  })

  it("ignores drags when read-only or disabled", () => {
    const first = render(
      <Slider defaultValue={4} readOnly pixelSensitivity={1} />
    )
    drag(slider(first.container), [104, 120])
    expect(screen.getByRole("textbox")).toHaveValue("4")
    first.unmount()
    const second = render(
      <Slider defaultValue={4} disabled pixelSensitivity={1} />
    )
    drag(slider(second.container), [104, 120])
    expect(screen.getByRole("textbox")).toHaveValue("4")
  })
})
