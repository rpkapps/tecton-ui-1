import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Meter } from "@tecton/react/tecton/meter"

const segments = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>('[data-slot="meter-segment"]')
  )
const fills = (container: HTMLElement) =>
  segments(container).map(
    (s) => (s.firstElementChild as HTMLElement).style.width
  )

describe("Meter", () => {
  it("renders a meter with five segments by default", () => {
    const { container } = render(<Meter aria-label="Risk" value={50} />)
    const meter = screen.getByRole("meter", { name: "Risk" })
    expect(meter).toHaveAttribute("data-slot", "meter")
    expect(meter).toHaveAttribute("data-size", "md")
    expect(meter).toHaveAttribute("aria-valuenow", "50")
    expect(segments(container)).toHaveLength(5)
  })

  it("fills segments proportionally to the value", () => {
    const { container } = render(
      <Meter aria-label="m" value={50} segments={4} />
    )
    expect(fills(container)).toEqual(["100%", "100%", "0%", "0%"])
  })

  it("partially fills the segment the value falls into", () => {
    const { container } = render(
      <Meter aria-label="m" value={30} segments={4} />
    )
    // 30% of 4 segments = 1.2 segments
    const [a, b, c, d] = fills(container)
    expect(a).toBe("100%")
    expect(Number.parseFloat(b)).toBeCloseTo(20, 5)
    expect(c).toBe("0%")
    expect(d).toBe("0%")
  })

  it("renders a continuous bar with segments=1", () => {
    const { container } = render(
      <Meter aria-label="m" value={75} segments={1} />
    )
    expect(fills(container)).toEqual(["75%"])
  })

  it("clamps segments to at least one and floors fractions", () => {
    const { container, rerender } = render(
      <Meter aria-label="m" value={0} segments={0} />
    )
    expect(segments(container)).toHaveLength(1)
    rerender(<Meter aria-label="m" value={0} segments={3.9} />)
    expect(segments(container)).toHaveLength(3)
  })

  it("respects minValue and maxValue", () => {
    const { container } = render(
      <Meter
        aria-label="m"
        value={150}
        minValue={100}
        maxValue={200}
        segments={2}
      />
    )
    expect(fills(container)).toEqual(["100%", "0%"])
  })

  it("does not render the label row without label or value", () => {
    const { container } = render(<Meter aria-label="m" value={10} />)
    expect(container.querySelector('[data-slot="meter-label"]')).toBeNull()
    expect(container.querySelector('[data-slot="meter-value"]')).toBeNull()
  })

  it("renders the label and the formatted value", () => {
    const { container } = render(
      <Meter label="Complexity" value={40} showValue />
    )
    expect(
      container.querySelector('[data-slot="meter-label"]')
    ).toHaveTextContent("Complexity")
    expect(
      container.querySelector('[data-slot="meter-value"]')
    ).toHaveTextContent("40%")
    // The visible label names the meter.
    expect(
      screen.getByRole("meter", { name: "Complexity" })
    ).toBeInTheDocument()
  })

  it("prefers a custom valueLabel over the formatted value", () => {
    const { container } = render(
      <Meter aria-label="m" value={80} showValue valueLabel="High" />
    )
    expect(
      container.querySelector('[data-slot="meter-value"]')
    ).toHaveTextContent("High")
  })

  it.each([
    ["default", "bg-progress"],
    ["success", "bg-success"],
    ["warning", "bg-warning"],
    ["error", "bg-destructive"],
    ["info", "bg-info"],
    ["custom", "bg-(--meter-fill,var(--primary))"],
  ] as const)("color=%s", (color, cls) => {
    const { container } = render(
      <Meter aria-label="m" value={100} segments={1} color={color} />
    )
    expect(
      container.querySelector('[data-slot="meter-track"]')
    ).toHaveAttribute("data-color", color)
    expect(segments(container)[0].firstElementChild).toHaveClass(cls)
  })

  it.each([
    [0, "success"],
    [33, "success"],
    [34, "warning"],
    [66, "warning"],
    [67, "error"],
    [100, "error"],
  ])("color=auto picks from the value (%i → %s)", (value, expected) => {
    const { container } = render(
      <Meter aria-label="m" value={value} color="auto" />
    )
    expect(
      container.querySelector('[data-slot="meter-track"]')
    ).toHaveAttribute("data-color", expected)
  })

  it.each([
    ["sm", "[--meter-h:0.25rem]"],
    ["md", "[--meter-h:0.375rem]"],
    ["lg", "[--meter-h:0.625rem]"],
  ] as const)("size=%s", (size, cls) => {
    render(<Meter aria-label="m" value={1} size={size} />)
    const meter = screen.getByRole("meter")
    expect(meter).toHaveAttribute("data-size", size)
    expect(meter).toHaveClass(cls)
  })

  it("merges className", () => {
    render(<Meter aria-label="m" value={1} className="w-40" />)
    expect(screen.getByRole("meter")).toHaveClass("w-40", "flex")
  })
})
