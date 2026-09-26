import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Button } from "@tecton/react/components/button"

import {
  Canvas,
  CanvasLegend,
  CanvasLegendItem,
  CanvasOverlay,
  CanvasSurface,
  CanvasToolbar,
} from "@tecton/react/tecton/canvas"

describe("Canvas", () => {
  it("renders the surface inside the canvas", () => {
    const { container } = render(
      <Canvas className="h-64">
        <CanvasSurface data-testid="surface" />
      </Canvas>
    )
    const canvas = container.querySelector('[data-slot="canvas"]')
    expect(canvas).toHaveClass("h-64", "relative", "isolate")
    expect(screen.getByTestId("surface")).toHaveAttribute(
      "data-slot",
      "canvas-surface"
    )
    expect(canvas).toContainElement(screen.getByTestId("surface"))
  })

  it.each([
    ["top-left", ["top-3", "left-3", "flex-col"]],
    ["top", ["top-3", "left-1/2", "flex-row"]],
    ["top-right", ["top-3", "right-3", "items-end"]],
    ["left", ["top-1/2", "left-3"]],
    ["right", ["top-1/2", "right-3"]],
    ["bottom-left", ["bottom-3", "left-3"]],
    ["bottom", ["bottom-3", "left-1/2", "flex-row"]],
    ["bottom-right", ["right-3", "bottom-3", "items-end"]],
  ] as const)("CanvasOverlay position=%s", (position, classes) => {
    const { container } = render(<CanvasOverlay position={position} />)
    const overlay = container.querySelector('[data-slot="canvas-overlay"]')
    expect(overlay).toHaveAttribute("data-position", position)
    expect(overlay).toHaveClass(...classes)
  })

  it("CanvasOverlay defaults to top-left", () => {
    const { container } = render(<CanvasOverlay />)
    expect(
      container.querySelector('[data-slot="canvas-overlay"]')
    ).toHaveAttribute("data-position", "top-left")
  })

  it("CanvasToolbar is a vertical toolbar by default", () => {
    render(<CanvasToolbar aria-label="Tools" />)
    const toolbar = screen.getByRole("toolbar", { name: "Tools" })
    expect(toolbar).toHaveAttribute("aria-orientation", "vertical")
    expect(toolbar).toHaveAttribute("data-orientation", "vertical")
    expect(toolbar).toHaveClass("flex-col")
  })

  it("CanvasToolbar can be horizontal", () => {
    render(<CanvasToolbar orientation="horizontal" />)
    const toolbar = screen.getByRole("toolbar")
    expect(toolbar).toHaveAttribute("aria-orientation", "horizontal")
    expect(toolbar).toHaveClass("flex-row")
  })

  it("CanvasToolbar moves focus with the arrow keys along its orientation", async () => {
    const user = userEvent.setup()
    render(
      <>
        <CanvasToolbar aria-label="Tools">
          <Button aria-label="Zoom in">+</Button>
          <Button aria-label="Zoom out">-</Button>
          <Button aria-label="Pan">P</Button>
        </CanvasToolbar>
        <Button>After</Button>
      </>
    )
    await user.tab()
    expect(screen.getByRole("button", { name: "Zoom in" })).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("button", { name: "Zoom out" })).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("button", { name: "Pan" })).toHaveFocus()
    await user.keyboard("{ArrowUp}")
    expect(screen.getByRole("button", { name: "Zoom out" })).toHaveFocus()
    // Left/Right belong to the other axis on a vertical rail.
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("button", { name: "Zoom out" })).toHaveFocus()
    // Tab leaves the rail instead of stepping through every tool.
    await user.tab()
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus()
  })

  it("CanvasToolbar uses Left/Right when horizontal", async () => {
    const user = userEvent.setup()
    render(
      <CanvasToolbar aria-label="Measure" orientation="horizontal">
        <Button aria-label="Ruler">R</Button>
        <Button aria-label="Area">A</Button>
      </CanvasToolbar>
    )
    await user.tab()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("button", { name: "Area" })).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    expect(screen.getByRole("button", { name: "Ruler" })).toHaveFocus()
  })

  it("CanvasLegend renders a list of swatch and name items", () => {
    const { container } = render(
      <CanvasLegend aria-label="Legend">
        <CanvasLegendItem swatch="#ff0000">Faults</CanvasLegendItem>
        <CanvasLegendItem swatch={<span data-testid="custom" />}>
          Wells
        </CanvasLegendItem>
      </CanvasLegend>
    )
    const legend = screen.getByRole("list", { name: "Legend" })
    expect(legend).toHaveAttribute("data-slot", "canvas-legend")
    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(2)
    expect(items.map((item) => item.textContent)).toEqual(["Faults", "Wells"])

    // A string swatch becomes a coloured block, hidden from assistive tech.
    const swatch = items[0].querySelector(
      '[data-slot="canvas-legend-swatch"]'
    ) as HTMLElement
    expect(swatch).toHaveAttribute("aria-hidden", "true")
    const colourBlock = swatch.firstElementChild as HTMLElement
    expect(colourBlock.style.background).toMatch(/rgb\(255, 0, 0\)|#ff0000/)
    // The swatch comes before its name.
    expect(swatch.nextElementSibling).toHaveTextContent("Faults")

    // A node swatch is rendered as is.
    expect(
      container.querySelectorAll('[data-slot="canvas-legend-swatch"]')[1]
    ).toContainElement(screen.getByTestId("custom"))
  })
})
