import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import CanvasPage from "../blocks/canvas-01/page"
import DetailPage, { project } from "../blocks/detail-01/page"
import {
  axisOptions,
  designs,
  getAxis,
} from "../blocks/cost-vs-risk-panel/page"
import { FdaComparisonTable } from "../blocks/fda-comparison-table/page"
import HorizonsPage, {
  defaultHorizonSettings,
  validateDepths,
} from "../blocks/horizons-panel/page"

async function rowAction(code: string, action: string) {
  const user = userEvent.setup()
  await user.click(screen.getByRole("button", { name: `Actions for ${code}` }))
  await user.click(await screen.findByRole("menuitem", { name: action }))
}

describe("fda-comparison-table", () => {
  it(
    "gives every copy its own row id, even after a delete",
    { timeout: 30000 },
    async () => {
      render(<FdaComparisonTable />)
      await rowAction("FDA 2.3", "Duplicate")
      await rowAction("FDA 1.2", "Delete")
      // With ids built from the row count, this copy would reuse the first
      // copy's id and the two rows would share a key.
      await rowAction("FDA 2.3", "Duplicate")
      expect(screen.getAllByText("FDA 2.3 (copy)")).toHaveLength(2)
    }
  )
})

describe("cost-vs-risk-panel axes", () => {
  it("maps every axis to a plotted field, a format and a domain", () => {
    expect(axisOptions.map((axis) => axis.id)).toEqual(["cost", "risk", "days"])
    const days = getAxis("days")
    expect(days.dataKey).toBe("planDays")
    expect(days.format(30)).toBe("30d")
    const [min, max] = days.domain(designs.map((design) => design.planDays))
    for (const design of designs) {
      expect(design.planDays).toBeGreaterThanOrEqual(min)
      expect(design.planDays).toBeLessThanOrEqual(max)
    }
    expect(getAxis("risk").domain([10, 90])).toEqual([0, 100])
    expect(getAxis("cost").format(120)).toBe("$120M")
  })
})

describe("canvas-01 fairway map", () => {
  it("selects a map feature from the keyboard", async () => {
    const user = userEvent.setup()
    render(<CanvasPage />)
    const map = screen.getByRole("group", { name: "Fairway map" })
    const feature = within(map).getByRole("button", { name: "Orion Alpha" })
    expect(feature).toHaveAttribute("aria-pressed", "false")
    feature.focus()
    await user.keyboard("{Enter}")
    expect(feature).toHaveAttribute("aria-pressed", "true")
    await user.keyboard(" ")
    expect(feature).toHaveAttribute("aria-pressed", "false")
  })

  it("opens a preset from its card", async () => {
    const user = userEvent.setup()
    render(<CanvasPage />)
    const [, second] = screen.getAllByRole("button", { name: /^Open / })
    if (!second) throw new Error("expected two presets")
    await user.click(second)
    expect(second).toHaveAttribute("aria-pressed", "true")
  })
})

describe("horizons-panel depths", () => {
  it("validates that the bottom is deeper than the top", () => {
    expect(validateDepths(defaultHorizonSettings)).toBeUndefined()
    expect(
      validateDepths({ ...defaultHorizonSettings, bottomDepth: 2000 })
    ).toMatch(/deeper/)
  })

  it("accepts a typed minus sign and blocks Apply for an inverted pair", async () => {
    const user = userEvent.setup()
    render(<HorizonsPage />)
    const top = screen.getByRole("textbox", { name: "Top depth (TVDSS)" })
    const bottom = screen.getByRole("textbox", { name: "Bottom depth (TVDSS)" })

    await user.clear(top)
    await user.type(top, "-")
    expect(top).toHaveValue("-")
    await user.type(top, "50")
    await user.tab()
    expect(top).toHaveValue("-50")

    await user.clear(bottom)
    await user.type(bottom, "-100")
    await user.tab()
    expect(bottom).toHaveAttribute("aria-invalid", "true")
    expect(bottom).toHaveAccessibleDescription(
      "Bottom depth must be deeper than the top depth."
    )
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled()
  })
})

describe("detail-01 section tabs", () => {
  /** The panel the selected tab controls, which must exist. */
  function controlledPanel(tab: HTMLElement) {
    const id = tab.getAttribute("aria-controls")
    expect(id).toBeTruthy()
    const panel = document.getElementById(id ?? "")
    expect(panel).toHaveAttribute("role", "tabpanel")
    expect(panel).toHaveAttribute("aria-labelledby", tab.id)
    return panel
  }

  it("shows the panel of the chosen tab", { timeout: 30000 }, async () => {
    const user = userEvent.setup()
    render(<DetailPage />)
    const tabs = screen.getByRole("tablist", { name: "Sections" })

    const overview = within(tabs).getByRole("tab", { name: "Overview" })
    expect(overview).toHaveAttribute("aria-selected", "true")
    const overviewPanel = controlledPanel(overview)
    expect(screen.getByRole("tabpanel")).toBe(overviewPanel)
    expect(overviewPanel).toHaveTextContent(project.concepts[0]!.name)

    const team = within(tabs).getByRole("tab", { name: "Team" })
    await user.click(team)
    expect(team).toHaveAttribute("aria-selected", "true")
    const teamPanel = controlledPanel(team)
    expect(screen.getByRole("tabpanel")).toBe(teamPanel)
    expect(teamPanel).toHaveTextContent(`Team for ${project.name}`)
    // The overview panel is gone with its tab.
    expect(overviewPanel).not.toBeInTheDocument()
  })
})
