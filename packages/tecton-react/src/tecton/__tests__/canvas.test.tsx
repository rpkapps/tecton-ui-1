import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

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

  it("CanvasLegend renders a definition list of items", () => {
    const { container } = render(
      <CanvasLegend>
        <CanvasLegendItem swatch="#ff0000">Faults</CanvasLegendItem>
        <CanvasLegendItem swatch={<span data-testid="custom" />}>
          Wells
        </CanvasLegendItem>
      </CanvasLegend>
    )
    const legend = container.querySelector('[data-slot="canvas-legend"]')
    expect(legend?.tagName).toBe("DL")
    const items = container.querySelectorAll('[data-slot="canvas-legend-item"]')
    expect(items).toHaveLength(2)

    // A string swatch becomes a coloured block.
    const colourBlock = items[0].querySelector("dt > span") as HTMLElement
    expect(colourBlock).toHaveAttribute("aria-hidden", "true")
    expect(colourBlock.style.background).toMatch(/rgb\(255, 0, 0\)|#ff0000/)
    expect(items[0].querySelector("dd")).toHaveTextContent("Faults")

    // A node swatch is rendered as is.
    expect(items[1].querySelector("dt")).toContainElement(
      screen.getByTestId("custom")
    )
    expect(items[1].querySelector("dd")).toHaveTextContent("Wells")
  })
})
