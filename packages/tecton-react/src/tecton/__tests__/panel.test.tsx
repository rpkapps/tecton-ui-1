import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  Panel,
  PanelActions,
  PanelContent,
  PanelDescription,
  PanelFooter,
  PanelHeader,
  PanelTitle,
} from "@tecton/react/tecton/panel"

describe("Panel", () => {
  it("renders a section with the default variant and size", () => {
    render(<Panel aria-label="Tools" />)
    const panel = screen.getByRole("region", { name: "Tools" })
    expect(panel.tagName).toBe("SECTION")
    expect(panel).toHaveAttribute("data-slot", "panel")
    expect(panel).toHaveAttribute("data-variant", "default")
    expect(panel).toHaveAttribute("data-size", "md")
    expect(panel).toHaveClass(
      "rounded-xl",
      "border",
      "border-foreground/10",
      "bg-card"
    )
  })

  it.each([
    ["default", ["rounded-xl", "border", "border-foreground/10", "bg-card"]],
    ["elevated", ["rounded-xl", "border", "shadow-md"]],
    ["flat", ["rounded-xl", "bg-card"]],
    ["outline", ["rounded-xl", "border-border", "bg-transparent"]],
  ] as const)("variant=%s", (variant, classes) => {
    const { container } = render(<Panel variant={variant} />)
    const panel = container.querySelector('[data-slot="panel"]')
    expect(panel).toHaveAttribute("data-variant", variant)
    expect(panel).toHaveClass(...classes)
  })

  it.each([
    ["sm", "[--panel-px:0.75rem]"],
    ["md", "[--panel-px:1rem]"],
    ["lg", "[--panel-px:1.5rem]"],
  ] as const)("size=%s", (size, cls) => {
    const { container } = render(<Panel size={size} />)
    const panel = container.querySelector('[data-slot="panel"]')
    expect(panel).toHaveAttribute("data-size", size)
    expect(panel).toHaveClass(cls)
  })

  it("composes the header, content and footer parts", () => {
    const { container } = render(
      <Panel>
        <PanelHeader>
          <PanelTitle>Layers</PanelTitle>
          <PanelDescription>Visible layers</PanelDescription>
          <PanelActions>
            <button>Add</button>
          </PanelActions>
        </PanelHeader>
        <PanelContent>Body</PanelContent>
        <PanelFooter>Foot</PanelFooter>
      </Panel>
    )
    const header = container.querySelector('[data-slot="panel-header"]')
    expect(header?.tagName).toBe("HEADER")
    expect(
      screen.getByRole("heading", { level: 2, name: "Layers" })
    ).toHaveAttribute("data-slot", "panel-title")
    expect(screen.getByText("Visible layers")).toHaveAttribute(
      "data-slot",
      "panel-description"
    )
    expect(
      container.querySelector('[data-slot="panel-actions"]')
    ).toContainElement(screen.getByRole("button", { name: "Add" }))
    expect(screen.getByText("Body")).toHaveAttribute(
      "data-slot",
      "panel-content"
    )
    const footer = screen.getByText("Foot")
    expect(footer).toHaveAttribute("data-slot", "panel-footer")
    expect(footer.tagName).toBe("FOOTER")
  })

  it("merges className on each part", () => {
    const { container } = render(
      <Panel className="p">
        <PanelHeader className="h" />
        <PanelTitle className="t" />
        <PanelDescription className="d" />
        <PanelActions className="a" />
        <PanelContent className="c" />
        <PanelFooter className="f" />
      </Panel>
    )
    const cls = (slot: string) =>
      container.querySelector(`[data-slot="${slot}"]`)
    expect(cls("panel")).toHaveClass("p")
    expect(cls("panel-header")).toHaveClass("h")
    expect(cls("panel-title")).toHaveClass("t")
    expect(cls("panel-description")).toHaveClass("d")
    expect(cls("panel-actions")).toHaveClass("a")
    expect(cls("panel-content")).toHaveClass("c")
    expect(cls("panel-footer")).toHaveClass("f")
  })
})
