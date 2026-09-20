import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import CanvasPage from "../blocks/canvas-01/page"
import CostVsRiskPage from "../blocks/cost-vs-risk-panel/page"
import FaciesPage from "../blocks/facies-modeling-panel/page"
import HorizonsPage from "../blocks/horizons-panel/page"
import Sidebar03Page from "../blocks/sidebar-03/page"
import { ConceptSection } from "../blocks/detail-01/components/concept-section"
import { project } from "../blocks/detail-01/data"

describe("block chrome", () => {
  it("collapses and restores the horizons panel", async () => {
    const user = userEvent.setup()
    render(<HorizonsPage />)
    expect(screen.getByText("2 Horizons")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Collapse panel" }))
    expect(screen.queryByText("2 Horizons")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /show horizons/i }))
    expect(screen.getByText("2 Horizons")).toBeInTheDocument()
  })

  it("collapses and restores the facies panel", async () => {
    const user = userEvent.setup()
    render(<FaciesPage />)
    await user.click(screen.getByRole("button", { name: "Collapse panel" }))
    expect(screen.queryByText("Facies Modeling")).not.toBeInTheDocument()
    await user.click(
      screen.getByRole("button", { name: "Expand facies modeling panel" })
    )
    expect(screen.getByText("Facies Modeling")).toBeInTheDocument()
  })

  it("collapses and restores the cost vs risk panel", async () => {
    const user = userEvent.setup()
    render(<CostVsRiskPage />)
    await user.click(screen.getByRole("button", { name: "Collapse panel" }))
    expect(screen.queryByText(/Selected/)).not.toBeInTheDocument()
    await user.click(
      screen.getByRole("button", { name: "Expand cost vs risk panel" })
    )
    expect(screen.getByText(/Selected/)).toBeInTheDocument()
  })

  it("zooms the fairway map and updates the scale bar", async () => {
    const user = userEvent.setup()
    const { container } = render(<CanvasPage />)
    const map = container.querySelector("[data-slot=fairway-map]")!
    expect(map).toHaveAttribute("viewBox", "0 0 1000 600")
    expect(screen.getByText("750 m")).toBeInTheDocument()

    const zoomOut = screen.getByRole("button", { name: "Zoom out" })
    expect(zoomOut).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Zoom in" }))
    expect(map.getAttribute("viewBox")).not.toBe("0 0 1000 600")
    expect(screen.getByText("500 m")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeEnabled()
  })

  it("hides map layers from the layers menu", async () => {
    const user = userEvent.setup()
    render(<CanvasPage />)
    expect(screen.getByText("Orion West A")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Layers" }))
    const menu = await screen.findByRole("menu")
    await user.click(
      within(menu).getByRole("menuitemcheckbox", { name: "Prospect areas" })
    )
    expect(screen.queryByText("Orion West A")).not.toBeInTheDocument()
  })

  it("opens the canvas More menu and resets the zoom", async () => {
    const user = userEvent.setup()
    const { container } = render(<CanvasPage />)
    await user.click(screen.getByRole("button", { name: "Zoom in" }))
    await user.click(screen.getByRole("button", { name: "More" }))
    await user.click(
      await screen.findByRole("menuitem", { name: "Reset zoom" })
    )
    const map = container.querySelector("[data-slot=fairway-map]")!
    expect(map).toHaveAttribute("viewBox", "0 0 1000 600")
  })

  it("disables undo and redo on the canvas", () => {
    render(<CanvasPage />)
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled()
  })

  it("selects the section tool", async () => {
    const user = userEvent.setup()
    render(<CanvasPage />)
    const section = screen.getByRole("button", { name: "Section" })
    expect(section).toHaveAttribute("aria-pressed", "false")
    await user.click(section)
    expect(section).toHaveAttribute("aria-pressed", "true")
  })

  it("opens the preset actions menu", async () => {
    const user = userEvent.setup()
    render(<CanvasPage />)
    const [trigger] = screen.getAllByRole("button", { name: /^Actions for / })
    await user.click(trigger)
    expect(await screen.findByRole("menu")).toBeInTheDocument()
  })

  it("zooms and toggles the measure tool in sidebar-03", async () => {
    const user = userEvent.setup()
    render(<Sidebar03Page />)
    expect(screen.getByText("100%")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Zoom in" }))
    expect(screen.getByText("150%")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Zoom out" }))
    await user.click(screen.getByRole("button", { name: "Zoom out" }))
    expect(screen.getByText("75%")).toBeInTheDocument()

    const measure = screen.getByRole("button", { name: "Measure" })
    expect(measure).toHaveAttribute("aria-pressed", "false")
    await user.click(measure)
    expect(measure).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("Measure tool active")).toBeInTheDocument()
  })

  it("opens the concept and alternative action menus", async () => {
    const user = userEvent.setup()
    render(<ConceptSection concept={project.concepts[0]} />)
    const triggers = screen.getAllByRole("button", { name: /^Actions for / })
    await user.click(triggers[0])
    expect(await screen.findByRole("menu")).toBeInTheDocument()
  })
})
