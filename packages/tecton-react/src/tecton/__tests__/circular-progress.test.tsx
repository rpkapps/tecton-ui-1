import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CircularProgress } from "@tecton/react/tecton/circular-progress"

const CIRCUMFERENCE = 2 * Math.PI * 20

const arc = (container: HTMLElement) => container.querySelectorAll("circle")[1]

describe("CircularProgress", () => {
  it("renders a determinate progressbar", () => {
    const { container } = render(
      <CircularProgress aria-label="Upload" value={40} />
    )
    const bar = screen.getByRole("progressbar", { name: "Upload" })
    expect(bar).toHaveAttribute("aria-valuenow", "40")
    expect(bar).toHaveAttribute("data-slot", "circular-progress")
    expect(bar).toHaveAttribute("data-size", "md")
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true"
    )
    expect(container.querySelector("svg")).not.toHaveClass("animate-spin")
  })

  it("sets the dash offset from the percentage", () => {
    const { container, rerender } = render(
      <CircularProgress aria-label="p" value={0} />
    )
    expect(
      Number(arc(container).getAttribute("stroke-dashoffset"))
    ).toBeCloseTo(CIRCUMFERENCE)
    rerender(<CircularProgress aria-label="p" value={100} />)
    expect(
      Number(arc(container).getAttribute("stroke-dashoffset"))
    ).toBeCloseTo(0)
    rerender(<CircularProgress aria-label="p" value={25} />)
    expect(
      Number(arc(container).getAttribute("stroke-dashoffset"))
    ).toBeCloseTo(CIRCUMFERENCE * 0.75)
  })

  it("spins with a quarter arc when indeterminate", () => {
    const { container } = render(
      <CircularProgress aria-label="p" value={null} />
    )
    expect(container.querySelector("svg")).toHaveClass("animate-spin")
    expect(
      Number(arc(container).getAttribute("stroke-dashoffset"))
    ).toBeCloseTo(CIRCUMFERENCE * 0.75)
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow")
  })

  it("slows the spin instead of running it at full speed under reduced motion", () => {
    const { container } = render(
      <CircularProgress aria-label="p" value={null} />
    )
    expect(container.querySelector("svg")).toHaveClass(
      "motion-reduce:animate-[spin_3s_linear_infinite]"
    )
  })

  // The ring is drawn in a 48-unit viewBox, so the stroke is in those units:
  // each size's value is its intended screen width scaled up by 48/diameter.
  it.each([
    ["xs", 16, 2.5],
    ["sm", 24, 3],
    ["md", 40, 3.5],
    ["lg", 64, 4],
    ["xl", 96, 5],
  ] as const)(
    "size=%s draws a stroke of the intended screen width",
    (size, diameter, px) => {
      render(<CircularProgress aria-label="p" value={50} size={size} />)
      const bar = screen.getByRole("progressbar")
      const stroke = bar.className.match(/\[--stroke:([\d.]+)px\]/)
      expect(stroke).not.toBeNull()
      expect((Number(stroke![1]) * diameter) / 48).toBeCloseTo(px, 1)
      for (const circle of bar.querySelectorAll("circle")) {
        expect(circle.style.strokeWidth).toBe("var(--stroke)")
      }
    }
  )

  it("does not show a value by default", () => {
    const { container } = render(<CircularProgress aria-label="p" value={50} />)
    expect(
      container.querySelector('[data-slot="circular-progress-value"]')
    ).toBeNull()
  })

  it("shows the formatted value with showValue", () => {
    const { container } = render(
      <CircularProgress aria-label="p" value={50} showValue />
    )
    expect(
      container.querySelector('[data-slot="circular-progress-value"]')
    ).toHaveTextContent("50%")
  })

  it("hides showValue while indeterminate", () => {
    const { container } = render(
      <CircularProgress aria-label="p" value={null} showValue />
    )
    expect(
      container.querySelector('[data-slot="circular-progress-value"]')
    ).toBeNull()
  })

  it("renders custom centre content over showValue", () => {
    const { container } = render(
      <CircularProgress aria-label="p" value={50} showValue>
        3/6
      </CircularProgress>
    )
    expect(
      container.querySelector('[data-slot="circular-progress-value"]')
    ).toHaveTextContent("3/6")
  })

  it.each([
    ["xs", "size-4"],
    ["sm", "size-6"],
    ["md", "size-10"],
    ["lg", "size-16"],
    ["xl", "size-24"],
  ] as const)("size=%s", (size, cls) => {
    render(<CircularProgress aria-label="p" value={1} size={size} />)
    const bar = screen.getByRole("progressbar")
    expect(bar).toHaveAttribute("data-size", size)
    expect(bar).toHaveClass(cls)
  })

  it.each([
    ["default", "text-progress"],
    ["foreground", "text-foreground"],
    ["success", "text-success"],
    ["warning", "text-warning"],
    ["error", "text-destructive"],
    ["info", "text-info"],
  ] as const)("color=%s", (color, cls) => {
    render(<CircularProgress aria-label="p" value={1} color={color} />)
    expect(screen.getByRole("progressbar")).toHaveClass(cls)
  })

  it("merges className", () => {
    render(<CircularProgress aria-label="p" value={1} className="m-2" />)
    expect(screen.getByRole("progressbar")).toHaveClass("m-2", "relative")
  })
})
