import { act, render, renderHook, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DropdownMenuItem } from "@tecton/react/components/dropdown-menu"
import {
  AppShell,
  AppShellAction,
  AppShellActions,
  AppShellAside,
  AppShellBody,
  AppShellBrand,
  AppShellCommandTrigger,
  AppShellDivider,
  AppShellHeader,
  AppShellMain,
  AppShellNav,
  AppShellOverflow,
  AppShellSidebar,
  AppShellSplit,
  AppShellSplitHandle,
  AppShellSplitPanel,
  AppShellUserMenu,
  useMinWidth,
} from "@tecton/react/tecton/app-shell"

describe("AppShell", () => {
  it("renders the frame with landmarks", () => {
    const { container } = render(
      <AppShell>
        <AppShellHeader>
          <AppShellBrand>Tecton</AppShellBrand>
          <AppShellNav aria-label="Primary">
            <a href="#">Home</a>
          </AppShellNav>
          <AppShellActions>
            <button>Help</button>
          </AppShellActions>
        </AppShellHeader>
        <AppShellBody>
          <AppShellSidebar aria-label="Sidebar">side</AppShellSidebar>
          <AppShellMain>main</AppShellMain>
          <AppShellAside aria-label="Aside">aside</AppShellAside>
        </AppShellBody>
      </AppShell>
    )
    expect(container.querySelector('[data-slot="app-shell"]')).toHaveClass(
      "grid",
      "h-svh"
    )
    expect(screen.getByRole("banner")).toHaveAttribute(
      "data-slot",
      "app-shell-header"
    )
    expect(screen.getByText("Tecton")).toHaveAttribute(
      "data-slot",
      "app-shell-brand"
    )
    expect(screen.getByRole("navigation", { name: "Primary" })).toHaveAttribute(
      "data-slot",
      "app-shell-nav"
    )
    expect(
      container.querySelector('[data-slot="app-shell-actions"]')
    ).toContainElement(screen.getByRole("button", { name: "Help" }))
    expect(
      container.querySelector('[data-slot="app-shell-body"]')
    ).toBeInTheDocument()
    expect(
      screen.getByRole("complementary", { name: "Sidebar" })
    ).toHaveAttribute("data-slot", "app-shell-sidebar")
    expect(screen.getByRole("main")).toHaveAttribute(
      "data-slot",
      "app-shell-main"
    )
    expect(
      screen.getByRole("complementary", { name: "Aside" })
    ).toHaveAttribute("data-slot", "app-shell-aside")
  })

  it("merges className on the layout parts", () => {
    const { container } = render(
      <AppShell className="a">
        <AppShellHeader className="b" />
        <AppShellBody className="c">
          <AppShellSidebar className="d" />
          <AppShellMain className="e" />
          <AppShellAside className="f" />
        </AppShellBody>
      </AppShell>
    )
    const cls = (slot: string) =>
      container.querySelector(`[data-slot="${slot}"]`)
    expect(cls("app-shell")).toHaveClass("a")
    expect(cls("app-shell-header")).toHaveClass("b")
    expect(cls("app-shell-body")).toHaveClass("c")
    expect(cls("app-shell-sidebar")).toHaveClass("d")
    expect(cls("app-shell-main")).toHaveClass("e")
    expect(cls("app-shell-aside")).toHaveClass("f")
  })

  it("renders a resizable split with panels and a handle", () => {
    const { container } = render(
      <AppShellSplit>
        <AppShellSplitPanel defaultSize="70%">main</AppShellSplitPanel>
        <AppShellSplitHandle />
        <AppShellSplitPanel defaultSize="30%">aside</AppShellSplitPanel>
      </AppShellSplit>
    )
    const split = container.querySelector('[data-slot="app-shell-split"]')
    expect(split).toBeInTheDocument()
    expect(
      container.querySelectorAll('[data-slot="app-shell-split-panel"]')
    ).toHaveLength(2)
    expect(screen.getByRole("separator")).toHaveAttribute(
      "data-slot",
      "app-shell-split-handle"
    )
  })
})

describe("AppShellActions", () => {
  beforeEach(() => {
    vi.spyOn(navigator, "platform", "get").mockReturnValue("Win32")
  })

  it("renders the cluster", () => {
    const { container } = render(
      <AppShellActions className="x">y</AppShellActions>
    )
    expect(
      container.querySelector('[data-slot="app-shell-actions"]')
    ).toHaveClass("x", "ms-auto")
  })

  it("AppShellAction is an icon button named by its label with a tooltip", async () => {
    const onPress = vi.fn()
    render(
      <AppShellAction label="Help" shortcut="?" onPress={onPress}>
        <svg />
      </AppShellAction>
    )
    const button = screen.getByRole("button", { name: "Help" })
    expect(button).toHaveAttribute("data-slot", "app-shell-action")
    expect(button).toHaveAttribute("data-size", "icon-sm")
    expect(button).toHaveAttribute("data-variant", "ghost")

    // Keyboard focus shows the tooltip without the hover delay.
    await userEvent.tab()
    expect(button).toHaveFocus()
    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip).toHaveTextContent("Help")
    expect(tooltip.querySelector('[data-slot="kbd"]')).toHaveTextContent("?")

    await userEvent.click(button)
    expect(onPress).toHaveBeenCalled()
  })

  it("AppShellAction without a shortcut has no key caps", async () => {
    render(<AppShellAction label="Settings" />)
    await userEvent.tab()
    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip.querySelector('[data-slot="kbd"]')).toBeNull()
  })

  // Tecton binds no keys, so the trigger advertises none unless told to.
  it("AppShellCommandTrigger defaults to Search with no key hint", () => {
    render(<AppShellCommandTrigger />)
    const button = screen.getByRole("button", { name: "Search" })
    expect(button).toHaveAttribute("data-slot", "app-shell-command-trigger")
    expect(button).toHaveTextContent("Search")
    expect(button.querySelector('[data-slot="kbd"]')).toBeNull()
  })

  it("AppShellCommandTrigger accepts a label, a shortcut and no shortcut", () => {
    const { rerender } = render(
      <AppShellCommandTrigger shortcut="/">Jump to</AppShellCommandTrigger>
    )
    const button = screen.getByRole("button", { name: "Jump to" })
    expect(button.querySelector('[data-slot="kbd"]')).toHaveTextContent("/")
    rerender(<AppShellCommandTrigger shortcut={null} />)
    expect(
      screen.getByRole("button").querySelector('[data-slot="kbd"]')
    ).toBeNull()
  })

  it("AppShellCommandTrigger falls back to Search for a non-string label", () => {
    render(
      <AppShellCommandTrigger>
        <em>Find</em>
      </AppShellCommandTrigger>
    )
    expect(screen.getByRole("button", { name: "Search" })).toHaveTextContent(
      "Find"
    )
  })

  it("AppShellDivider is a vertical separator", () => {
    render(<AppShellDivider className="x" />)
    const divider = screen.getByRole("separator")
    expect(divider).toHaveAttribute("aria-orientation", "vertical")
    expect(divider).toHaveAttribute("data-slot", "app-shell-divider")
    expect(divider).toHaveClass("x", "w-px")
  })

  it("AppShellOverflow opens a menu from a More button", async () => {
    render(
      <AppShellOverflow>
        <DropdownMenuItem>Release notes</DropdownMenuItem>
      </AppShellOverflow>
    )
    const trigger = screen.getByRole("button", { name: "More" })
    await userEvent.click(trigger)
    expect(
      await screen.findByRole("menuitem", { name: "Release notes" })
    ).toBeInTheDocument()
  })

  it("AppShellOverflow accepts a custom label", () => {
    render(<AppShellOverflow label="Extra">x</AppShellOverflow>)
    expect(screen.getByRole("button", { name: "Extra" })).toBeInTheDocument()
  })

  it("AppShellUserMenu shows the avatar and opens the account menu", async () => {
    render(
      <AppShellUserMenu user={{ name: "Ada Lovelace", initials: "AL" }}>
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </AppShellUserMenu>
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

  it("AppShellUserMenu renders the image when given", () => {
    render(
      <AppShellUserMenu
        user={{ name: "Ada", initials: "A", image: "/ada.png" }}
      >
        x
      </AppShellUserMenu>
    )
    const img = screen.getByRole("button").querySelector("img")
    expect(img).toHaveAttribute("src", "/ada.png")
  })
})

describe("useMinWidth", () => {
  const original = window.matchMedia

  afterEach(() => {
    window.matchMedia = original
  })

  function stubMatchMedia(initial: boolean) {
    const listeners = new Set<() => void>()
    let matches = initial
    window.matchMedia = vi.fn((query: string) => ({
      get matches() {
        return matches
      },
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_: string, cb: () => void) => listeners.add(cb),
      removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
    return {
      set(next: boolean) {
        matches = next
        listeners.forEach((cb) => cb())
      },
      listeners,
    }
  }

  it("reports whether the viewport matches the min-width query", () => {
    stubMatchMedia(true)
    const { result } = renderHook(() => useMinWidth(1024))
    expect(result.current).toBe(true)
    expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 1024px)")
  })

  it("updates when the media query changes and unsubscribes on unmount", () => {
    const media = stubMatchMedia(false)
    const { result, unmount } = renderHook(() => useMinWidth(768))
    expect(result.current).toBe(false)
    act(() => media.set(true))
    expect(result.current).toBe(true)
    expect(media.listeners.size).toBe(1)
    unmount()
    expect(media.listeners.size).toBe(0)
  })
})
