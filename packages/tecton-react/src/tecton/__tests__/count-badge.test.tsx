import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CountBadge } from "@tecton/react/tecton/count-badge"

const badge = (container: HTMLElement) =>
  container.querySelector('[data-slot="count-badge"]')

describe("CountBadge", () => {
  it("wraps its child in an anchor and shows the count", () => {
    const { container } = render(
      <CountBadge count={5}>
        <button>Inbox</button>
      </CountBadge>
    )
    const anchor = container.querySelector('[data-slot="count-badge-anchor"]')
    expect(anchor).toContainElement(
      screen.getByRole("button", { name: "Inbox" })
    )
    expect(badge(container)).toHaveTextContent("5")
    expect(badge(container)).toHaveAttribute("data-variant", "standard")
    expect(badge(container)).toHaveAttribute("data-color", "primary")
  })

  it("hides when there is no count", () => {
    const { container } = render(<CountBadge>x</CountBadge>)
    expect(badge(container)).toBeNull()
  })

  it("hides a zero count unless showZero is set", () => {
    const { container, rerender } = render(<CountBadge count={0}>x</CountBadge>)
    expect(badge(container)).toBeNull()
    rerender(
      <CountBadge count={0} showZero>
        x
      </CountBadge>
    )
    expect(badge(container)).toHaveTextContent("0")
  })

  it("caps the count at max with a plus", () => {
    const { container, rerender } = render(
      <CountBadge count={150}>x</CountBadge>
    )
    expect(badge(container)).toHaveTextContent("99+")
    rerender(
      <CountBadge count={150} max={200}>
        x
      </CountBadge>
    )
    expect(badge(container)).toHaveTextContent("150")
    rerender(
      <CountBadge count={99} max={99}>
        x
      </CountBadge>
    )
    expect(badge(container)).toHaveTextContent("99")
  })

  it("renders custom content instead of the count", () => {
    const { container } = render(
      <CountBadge count={3} content="New">
        x
      </CountBadge>
    )
    expect(badge(container)).toHaveTextContent("New")
  })

  it("renders custom content even without a count", () => {
    const { container } = render(<CountBadge content="!">x</CountBadge>)
    expect(badge(container)).toHaveTextContent("!")
  })

  it("renders a dot without any label and without needing a count", () => {
    const { container } = render(<CountBadge variant="dot">x</CountBadge>)
    expect(badge(container)).toBeInTheDocument()
    expect(badge(container)).toHaveAttribute("data-variant", "dot")
    expect(badge(container)).toHaveTextContent("")
    expect(badge(container)).toHaveClass("size-2")
  })

  it("a dot ignores content and count", () => {
    const { container } = render(
      <CountBadge variant="dot" count={7} content="New">
        x
      </CountBadge>
    )
    expect(badge(container)).toHaveTextContent("")
  })

  it("is removed entirely when invisible", () => {
    const { container } = render(
      <CountBadge count={4} invisible>
        x
      </CountBadge>
    )
    expect(badge(container)).toBeNull()
  })

  it.each([
    ["top-right", "-top-1 -right-1"],
    ["top-left", "-top-1 -left-1"],
    ["bottom-right", "-right-1 -bottom-1"],
    ["bottom-left", "-bottom-1 -left-1"],
  ] as const)("anchor=%s positions the badge", (anchor, classes) => {
    const { container } = render(
      <CountBadge count={1} anchor={anchor}>
        x
      </CountBadge>
    )
    expect(badge(container)).toHaveClass(...classes.split(" "))
  })

  it("applies the colour variant", () => {
    const { container } = render(
      <CountBadge count={1} color="error">
        x
      </CountBadge>
    )
    expect(badge(container)).toHaveAttribute("data-color", "error")
    expect(badge(container)).toHaveClass("bg-destructive")
  })

  it("passes className and other props to the anchor", () => {
    const { container } = render(
      <CountBadge count={1} className="custom" title="t">
        x
      </CountBadge>
    )
    const anchor = container.querySelector('[data-slot="count-badge-anchor"]')
    expect(anchor).toHaveClass("custom", "relative")
    expect(anchor).toHaveAttribute("title", "t")
  })
})
