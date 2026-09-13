import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  AppFinder,
  AppFinderGroup,
  AppFinderInput,
  AppFinderItem,
  AppFinderList,
  AppFinderMenu,
  AppFinderTrigger,
} from "@tecton/react/tecton/app-finder"

function Finder({ onAction }: { onAction?: (key: React.Key) => void }) {
  return (
    <AppFinder>
      <AppFinderTrigger>DSG</AppFinderTrigger>
      <AppFinderMenu>
        <AppFinderInput />
        <AppFinderList onAction={onAction}>
          <AppFinderGroup heading="Subsurface">
            <AppFinderItem
              id="dsg"
              icon="DSG"
              name="Discovery"
              description="Regional geology"
              keywords={["geo"]}
              isCurrent
            />
            <AppFinderItem id="fwm" name="Framework Modeling" />
          </AppFinderGroup>
          <AppFinderGroup heading="Wells">
            <AppFinderItem id="dwp" name="Well Planning" />
          </AppFinderGroup>
        </AppFinderList>
      </AppFinderMenu>
    </AppFinder>
  )
}

describe("AppFinder", () => {
  it("renders a compact trigger with a chevron", () => {
    render(<Finder />)
    const trigger = screen.getByRole("button", { name: "DSG" })
    expect(trigger).toHaveAttribute("data-slot", "app-finder-trigger")
    expect(trigger).toHaveClass("rounded-full", "uppercase")
    expect(trigger.querySelector("svg")).toHaveAttribute(
      "data-icon",
      "inline-end"
    )
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("opens a searchable palette listing the apps by group", async () => {
    render(<Finder />)
    await userEvent.click(screen.getByRole("button", { name: "DSG" }))
    const dialog = await screen.findByRole("dialog", { name: "Applications" })
    expect(dialog.closest('[data-slot="app-finder-menu"]')).toBeInTheDocument()
    // Command sets its own data-slot after the props, so the input is a command-input.
    expect(screen.getByPlaceholderText("Search applications…")).toHaveAttribute(
      "data-slot",
      "command-input"
    )
    expect(
      document.querySelector('[data-slot="app-finder-group"]')
    ).toBeInTheDocument()
    expect(screen.getByText("Subsurface")).toBeInTheDocument()
    expect(screen.getByText("Wells")).toBeInTheDocument()
    const items = screen.getAllByRole("menuitem")
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveAttribute("data-current", "true")
    expect(items[0]).toHaveTextContent("Current")
    expect(items[0]).toHaveTextContent("Regional geology")
    expect(
      items[0].querySelector('[data-slot="app-finder-item-icon"]')
    ).toHaveTextContent("DSG")
    expect(items[1]).not.toHaveAttribute("data-current")
    expect(
      items[1].querySelector('[data-slot="app-finder-item-icon"]')
    ).toBeNull()
  })

  it("filters across groups by name and keywords", async () => {
    render(<Finder />)
    await userEvent.click(screen.getByRole("button", { name: "DSG" }))
    const input = await screen.findByPlaceholderText("Search applications…")

    await userEvent.type(input, "well")
    await waitFor(() => {
      expect(screen.getAllByRole("menuitem")).toHaveLength(1)
    })
    expect(screen.getByRole("menuitem")).toHaveTextContent("Well Planning")
    expect(screen.queryByText("Subsurface")).toBeNull()

    await userEvent.clear(input)
    await userEvent.type(input, "geo")
    await waitFor(() => {
      expect(screen.getAllByRole("menuitem")).toHaveLength(1)
    })
    expect(screen.getByRole("menuitem")).toHaveTextContent("Discovery")
  })

  it("shows the empty message when nothing matches", async () => {
    render(<Finder />)
    await userEvent.click(screen.getByRole("button", { name: "DSG" }))
    const input = await screen.findByPlaceholderText("Search applications…")
    await userEvent.type(input, "zzz")
    expect(
      await screen.findByText("No applications match.")
    ).toBeInTheDocument()
    expect(
      document.querySelectorAll('[data-slot="command-item"]')
    ).toHaveLength(0)
  })

  it("calls onAction with the app id and closes", async () => {
    const onAction = vi.fn()
    render(<Finder onAction={onAction} />)
    await userEvent.click(screen.getByRole("button", { name: "DSG" }))
    await screen.findByRole("dialog")
    await userEvent.click(
      screen.getByRole("menuitem", { name: /Well Planning/ })
    )
    expect(onAction).toHaveBeenCalledWith("dwp")
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull()
    })
  })

  it("accepts a custom empty message and palette label", async () => {
    render(
      <AppFinder>
        <AppFinderTrigger>X</AppFinderTrigger>
        <AppFinderMenu aria-label="Apps">
          <AppFinderInput placeholder="Find…" />
          <AppFinderList emptyMessage="Nothing here">
            <AppFinderItem id="a" name="Alpha" />
          </AppFinderList>
        </AppFinderMenu>
      </AppFinder>
    )
    await userEvent.click(screen.getByRole("button", { name: "X" }))
    expect(
      await screen.findByRole("dialog", { name: "Apps" })
    ).toBeInTheDocument()
    await userEvent.type(screen.getByPlaceholderText("Find…"), "q")
    expect(await screen.findByText("Nothing here")).toBeInTheDocument()
  })
})
