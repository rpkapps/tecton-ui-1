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

function Finder({ onSelect }: { onSelect?: (value: string) => void }) {
  return (
    <AppFinder>
      <AppFinderTrigger>DSG</AppFinderTrigger>
      <AppFinderMenu>
        <AppFinderInput />
        <AppFinderList onSelect={onSelect}>
          <AppFinderGroup heading="Subsurface">
            <AppFinderItem
              value="dsg"
              icon="DSG"
              name="Discovery"
              description="Regional geology"
              keywords={["geo"]}
              current
            />
            <AppFinderItem value="fwm" name="Framework Modeling" />
          </AppFinderGroup>
          <AppFinderGroup heading="Wells">
            <AppFinderItem value="dwp" name="Well Planning" />
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
    expect(trigger).toHaveClass("rounded-lg")
    // The tile carries the monospaced, uppercased app code; the trigger does not.
    expect(trigger.querySelector('[data-slot="app-finder-icon"]')).toHaveClass(
      "uppercase"
    )
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
    const input = screen.getByRole("combobox")
    expect(input).toHaveAttribute("placeholder", "Search applications…")
    expect(input).toHaveAttribute("data-slot", "app-finder-input")
    expect(input).toHaveFocus()
    expect(
      document.querySelector('[data-slot="app-finder-group"]')
    ).toBeInTheDocument()
    expect(screen.getByText("Subsurface")).toBeInTheDocument()
    expect(screen.getByText("Wells")).toBeInTheDocument()
    const items = screen.getAllByRole("option")
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveAttribute("data-current", "")
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
      expect(screen.getAllByRole("option")).toHaveLength(1)
    })
    expect(screen.getByRole("option")).toHaveTextContent("Well Planning")
    expect(screen.getByText("Subsurface")).not.toBeVisible()

    await userEvent.clear(input)
    await userEvent.type(input, "geo")
    await waitFor(() => {
      expect(screen.getAllByRole("option")).toHaveLength(1)
    })
    expect(screen.getByRole("option")).toHaveTextContent("Discovery")
  })

  it("shows the empty message when nothing matches", async () => {
    render(<Finder />)
    await userEvent.click(screen.getByRole("button", { name: "DSG" }))
    const input = await screen.findByPlaceholderText("Search applications…")
    await userEvent.type(input, "zzz")
    expect(await screen.findByText("No applications match")).toBeInTheDocument()
    expect(
      document.querySelectorAll('[data-slot="command-item"]')
    ).toHaveLength(0)
  })

  it("calls onSelect with the app value and closes", async () => {
    const onSelect = vi.fn()
    render(<Finder onSelect={onSelect} />)
    await userEvent.click(screen.getByRole("button", { name: "DSG" }))
    await screen.findByRole("dialog")
    await userEvent.click(screen.getByRole("option", { name: /Well Planning/ }))
    expect(onSelect).toHaveBeenCalledWith("dwp")
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull()
    })
  })

  it("chooses an app with the keyboard", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Finder onSelect={onSelect} />)
    await user.click(screen.getByRole("button", { name: "DSG" }))
    const input = await screen.findByRole("combobox")
    await waitFor(() => expect(input).toHaveFocus())
    // The first item is highlighted; arrows move the highlight.
    expect(screen.getAllByRole("option")[0]).toHaveAttribute(
      "aria-selected",
      "true"
    )
    await user.keyboard("{ArrowDown}{Enter}")
    expect(onSelect).toHaveBeenCalledWith("fwm")
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull()
    })
  })

  it("does not match the value, only the name and keywords", async () => {
    render(<Finder />)
    await userEvent.click(screen.getByRole("button", { name: "DSG" }))
    const input = await screen.findByPlaceholderText("Search applications…")
    await userEvent.type(input, "fwm")
    expect(await screen.findByText("No applications match")).toBeInTheDocument()
  })

  it("can be controlled", async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <AppFinder open={false} onOpenChange={onOpenChange}>
        <AppFinderTrigger>X</AppFinderTrigger>
        <AppFinderMenu>
          <AppFinderList>
            <AppFinderItem value="a" name="Alpha" />
          </AppFinderList>
        </AppFinderMenu>
      </AppFinder>
    )
    await userEvent.click(screen.getByRole("button", { name: "X" }))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true))
    expect(screen.queryByRole("dialog")).toBeNull()
    rerender(
      <AppFinder open onOpenChange={onOpenChange}>
        <AppFinderTrigger>X</AppFinderTrigger>
        <AppFinderMenu>
          <AppFinderList>
            <AppFinderItem value="a" name="Alpha" />
          </AppFinderList>
        </AppFinderMenu>
      </AppFinder>
    )
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("accepts a custom empty message and palette label", async () => {
    render(
      <AppFinder>
        <AppFinderTrigger>X</AppFinderTrigger>
        <AppFinderMenu aria-label="Apps">
          <AppFinderInput placeholder="Find…" />
          <AppFinderList emptyMessage="Nothing here">
            <AppFinderItem value="a" name="Alpha" />
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
