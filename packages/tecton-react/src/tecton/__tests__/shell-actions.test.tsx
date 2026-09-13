import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DropdownMenuItem } from "@tecton/react/components/dropdown-menu"
import {
  ShellAction,
  ShellActions,
  ShellCommandTrigger,
  ShellDivider,
  ShellOverflow,
  ShellUserMenu,
} from "@tecton/react/tecton/shell-actions"

describe("ShellActions", () => {
  beforeEach(() => {
    vi.spyOn(navigator, "platform", "get").mockReturnValue("Win32")
  })

  it("renders the cluster", () => {
    const { container } = render(<ShellActions className="x">y</ShellActions>)
    expect(container.querySelector('[data-slot="shell-actions"]')).toHaveClass(
      "x",
      "ml-auto"
    )
  })

  it("ShellAction is an icon button named by its label with a tooltip", async () => {
    const onPress = vi.fn()
    render(
      <ShellAction label="Help" shortcut="?" onPress={onPress}>
        <svg />
      </ShellAction>
    )
    const button = screen.getByRole("button", { name: "Help" })
    expect(button).toHaveAttribute("data-slot", "shell-action")
    expect(button).toHaveAttribute("data-size", "icon-sm")
    expect(button).toHaveAttribute("data-variant", "ghost")

    // Keyboard focus shows the tooltip without the hover delay.
    await userEvent.tab()
    expect(button).toHaveFocus()
    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip).toHaveTextContent("Help")
    expect(
      tooltip.querySelector('[data-slot="shortcut-keys"]')
    ).toHaveAttribute("aria-label", "?")

    await userEvent.click(button)
    expect(onPress).toHaveBeenCalled()
  })

  it("ShellAction without a shortcut has no key caps", async () => {
    render(<ShellAction label="Settings" />)
    await userEvent.tab()
    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip.querySelector('[data-slot="shortcut-keys"]')).toBeNull()
  })

  it("ShellCommandTrigger defaults to Search with a ⌘K hint", () => {
    render(<ShellCommandTrigger />)
    const button = screen.getByRole("button", { name: "Search" })
    expect(button).toHaveAttribute("data-slot", "shell-command-trigger")
    expect(button).toHaveTextContent("Search")
    expect(button.querySelector('[data-slot="kbd"]')).toHaveTextContent("⌘K")
  })

  it("ShellCommandTrigger accepts a label, a shortcut and no shortcut", () => {
    const { rerender } = render(
      <ShellCommandTrigger shortcut="/">Jump to</ShellCommandTrigger>
    )
    const button = screen.getByRole("button", { name: "Jump to" })
    expect(button.querySelector('[data-slot="kbd"]')).toHaveTextContent("/")
    rerender(<ShellCommandTrigger shortcut={null} />)
    expect(
      screen.getByRole("button").querySelector('[data-slot="kbd"]')
    ).toBeNull()
  })

  it("ShellCommandTrigger falls back to Search for a non-string label", () => {
    render(
      <ShellCommandTrigger>
        <em>Find</em>
      </ShellCommandTrigger>
    )
    expect(screen.getByRole("button", { name: "Search" })).toHaveTextContent(
      "Find"
    )
  })

  it("ShellDivider is a vertical separator", () => {
    render(<ShellDivider className="x" />)
    const divider = screen.getByRole("separator")
    expect(divider).toHaveAttribute("aria-orientation", "vertical")
    expect(divider).toHaveAttribute("data-slot", "shell-divider")
    expect(divider).toHaveClass("x", "w-px")
  })

  it("ShellOverflow opens a menu from a More button", async () => {
    render(
      <ShellOverflow>
        <DropdownMenuItem>Release notes</DropdownMenuItem>
      </ShellOverflow>
    )
    const trigger = screen.getByRole("button", { name: "More" })
    await userEvent.click(trigger)
    expect(
      await screen.findByRole("menuitem", { name: "Release notes" })
    ).toBeInTheDocument()
  })

  it("ShellOverflow accepts a custom label", () => {
    render(<ShellOverflow label="Extra">x</ShellOverflow>)
    expect(screen.getByRole("button", { name: "Extra" })).toBeInTheDocument()
  })

  it("ShellUserMenu shows the avatar and opens the account menu", async () => {
    render(
      <ShellUserMenu user={{ name: "Ada Lovelace", initials: "AL" }}>
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </ShellUserMenu>
    )
    const trigger = screen.getByRole("button", {
      name: "Account: Ada Lovelace",
    })
    expect(trigger).toHaveTextContent("AL")
    expect(trigger.querySelector("img")).toBeNull()
    await userEvent.click(trigger)
    expect(
      await screen.findByRole("menuitem", { name: "Sign out" })
    ).toBeInTheDocument()
  })

  it("ShellUserMenu renders the image when given", () => {
    render(
      <ShellUserMenu user={{ name: "Ada", initials: "A", image: "/ada.png" }}>
        x
      </ShellUserMenu>
    )
    const img = screen.getByRole("button").querySelector("img")
    expect(img).toHaveAttribute("src", "/ada.png")
  })
})
