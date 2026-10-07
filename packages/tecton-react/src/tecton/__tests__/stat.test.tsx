import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  Stat,
  StatDelta,
  StatGroup,
  StatHelp,
  StatLabel,
  StatValue,
} from "@tecton/react/tecton/stat"

describe("Stat", () => {
  it("renders the parts with their slots and default variants", () => {
    const { container } = render(
      <StatGroup>
        <Stat>
          <StatLabel>Production</StatLabel>
          <StatValue unit="bbl/d">1,240</StatValue>
          <StatDelta trend="up">+4%</StatDelta>
          <StatHelp>vs last week</StatHelp>
        </Stat>
      </StatGroup>
    )
    expect(
      container.querySelector('[data-slot="stat-group"]')
    ).toBeInTheDocument()
    const stat = container.querySelector('[data-slot="stat"]')
    expect(stat).toHaveAttribute("data-size", "md")
    expect(screen.getByText("Production")).toHaveAttribute(
      "data-slot",
      "stat-label"
    )
    expect(screen.getByText("1,240")).toHaveAttribute("data-slot", "stat-value")
    expect(screen.getByText("bbl/d")).toHaveAttribute("data-slot", "stat-unit")
    expect(screen.getByText("vs last week")).toHaveAttribute(
      "data-slot",
      "stat-help"
    )
  })

  it("applies size and align variants", () => {
    const { container } = render(<Stat size="lg" align="end" />)
    const stat = container.querySelector('[data-slot="stat"]')
    expect(stat).toHaveAttribute("data-size", "lg")
    expect(stat).toHaveClass("[--stat-value:1.75rem]", "items-end", "text-end")
  })

  it("omits the unit element when no unit is given", () => {
    const { container } = render(<StatValue>42</StatValue>)
    expect(container.querySelector('[data-slot="stat-unit"]')).toBeNull()
  })

  it.each([
    ["up", "text-success"],
    ["down", "text-destructive"],
    ["flat", "text-muted-foreground"],
  ] as const)("StatDelta trend=%s sets data-trend and colour", (trend, cls) => {
    const { container } = render(<StatDelta trend={trend}>x</StatDelta>)
    const delta = container.querySelector('[data-slot="stat-delta"]')
    expect(delta).toHaveAttribute("data-trend", trend)
    expect(delta).toHaveClass(cls)
    expect(delta?.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  it("defaults StatDelta to flat", () => {
    const { container } = render(<StatDelta>0</StatDelta>)
    const delta = container.querySelector('[data-slot="stat-delta"]')
    expect(delta).toHaveAttribute("data-trend", "flat")
    expect(delta).toHaveAttribute("data-tone", "neutral")
  })

  // CAPEX going down is good news: the arrow points down, the colour is green.
  it("colours StatDelta by tone independently of the direction", () => {
    const { container } = render(
      <>
        <StatDelta trend="down" tone="positive">
          -4%
        </StatDelta>
        <StatDelta trend="up" tone="negative">
          +2 d
        </StatDelta>
        <StatDelta trend="up" tone="neutral">
          +1
        </StatDelta>
      </>
    )
    const [capex, downtime, neutral] = container.querySelectorAll(
      '[data-slot="stat-delta"]'
    )
    expect(capex).toHaveAttribute("data-trend", "down")
    expect(capex).toHaveAttribute("data-tone", "positive")
    expect(capex).toHaveClass("text-success")
    expect(capex).not.toHaveClass("text-destructive")
    expect(capex.querySelector("svg")).toHaveClass("lucide-trending-down")

    expect(downtime).toHaveClass("text-destructive")
    expect(downtime.querySelector("svg")).toHaveClass("lucide-trending-up")
    expect(neutral).toHaveClass("text-muted-foreground")
  })

  it("merges className on every part", () => {
    const { container } = render(
      <Stat className="a">
        <StatLabel className="b" />
        <StatValue className="c" />
        <StatHelp className="d" />
      </Stat>
    )
    expect(container.querySelector('[data-slot="stat"]')).toHaveClass("a")
    expect(container.querySelector('[data-slot="stat-label"]')).toHaveClass("b")
    expect(container.querySelector('[data-slot="stat-value"]')).toHaveClass("c")
    expect(container.querySelector('[data-slot="stat-help"]')).toHaveClass("d")
  })
})
