import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import ContentPage from "../blocks/content-01/page"
import { TopNav } from "../blocks/dashboard-01/page"
import FaciesPage from "../blocks/facies-modeling-panel/page"
import HorizonsPage from "../blocks/horizons-panel/page"
import WellsListRoute from "../blocks/list-01/page"
import SettingsRoute from "../blocks/settings-01/page"
import Sidebar02Page from "../blocks/sidebar-02/page"
import Sidebar03Page from "../blocks/sidebar-03/page"
import Sidebar04Page from "../blocks/sidebar-04/page"

/**
 * A Select's trigger (a `combobox` that opens a listbox) is named by its
 * label, so the label text must be the trigger's accessible name.
 */
function expectSelect(label: string) {
  const trigger = screen.getByRole("combobox", { name: label })
  expect(trigger).toHaveAttribute("aria-haspopup", "listbox")
  return trigger
}

describe("Select fields have an accessible name", () => {
  it("settings: every select on every tab", async () => {
    const user = userEvent.setup()
    render(<SettingsRoute />)
    for (const label of ["Role", "Time zone", "Unit system"])
      expectSelect(label)
    await user.click(screen.getByRole("tab", { name: /Notifications/ }))
    for (const label of ["Channel", "Frequency"]) expectSelect(label)
    await user.click(screen.getByRole("tab", { name: /Appearance/ }))
    for (const label of ["Colour scheme", "Accent", "Density"])
      expectSelect(label)
  })

  it("content-01", () => {
    render(<ContentPage />)
    expectSelect("Operator")
    expectSelect("Rig")
  })

  it("horizons panel", () => {
    render(<HorizonsPage />)
    expectSelect("Surface pair")
    expectSelect("Volume")
    expectSelect("Line")
  })

  it("facies modeling panel", () => {
    render(<FaciesPage />)
    for (const label of [
      "Facies template",
      "Input data",
      "Target surface",
      "Volume",
      "Method",
    ])
      expectSelect(label)
  })

  it("sidebar-04 tool panel (in its sheet below 1024px)", async () => {
    const user = userEvent.setup()
    render(<Sidebar04Page />)
    await user.click(
      screen.getByRole("button", { name: "Open well properties" })
    )
    expectSelect("Type")
  })

  it("the label opens its select", async () => {
    const user = userEvent.setup()
    render(<SettingsRoute />)
    await user.click(screen.getByText("Role"))
    expect(expectSelect("Role")).toHaveAttribute("aria-expanded", "true")
    expect(
      await screen.findByRole("option", { name: "Subsurface lead" })
    ).toHaveAttribute("aria-selected", "true")
  })
})

describe("search inputs have an accessible name", () => {
  it("list-01", () => {
    render(<WellsListRoute />)
    expect(
      screen.getByRole("textbox", { name: "Search wells" })
    ).toBeInTheDocument()
  })

  it("sidebar-02", () => {
    render(<Sidebar02Page />)
    expect(
      screen.getByRole("textbox", { name: "Search workspace" })
    ).toBeInTheDocument()
  })

  it("sidebar-03", () => {
    render(<Sidebar03Page />)
    expect(
      screen.getByRole("textbox", { name: "Search project data" })
    ).toBeInTheDocument()
  })

  it("dashboard top navigation", () => {
    render(<TopNav />)
    expect(
      screen.getByRole("textbox", { name: "Search project" })
    ).toBeInTheDocument()
  })
})
