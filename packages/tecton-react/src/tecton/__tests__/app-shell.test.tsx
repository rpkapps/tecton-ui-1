import { act, render, renderHook, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  AppShell,
  AppShellAside,
  AppShellBody,
  AppShellBrand,
  AppShellHeader,
  AppShellHeaderActions,
  AppShellMain,
  AppShellNav,
  AppShellSidebar,
  AppShellSplit,
  AppShellSplitHandle,
  AppShellSplitPanel,
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
          <AppShellHeaderActions>
            <button>Help</button>
          </AppShellHeaderActions>
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
      container.querySelector('[data-slot="app-shell-header-actions"]')
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
