import * as React from "react"
import { render, renderHook, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "@tecton/react/components/button"
import { Dialog, DialogTrigger } from "@tecton/react/components/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@tecton/react/components/drawer"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"
import {
  PortalProvider,
  usePortalContainer,
  usePortalTarget,
} from "@tecton/react/tecton/portal"

function makeContainer(name: string) {
  const container = document.createElement("div")
  container.setAttribute("data-mfe", name)
  document.body.append(container)
  return container
}

describe("PortalProvider", () => {
  it("portals a Dialog into the given container", async () => {
    const container = makeContainer("assets")
    render(
      <PortalProvider container={container}>
        <DialogTrigger>
          <Button>Open</Button>
          <Dialog>
            <p>Dialog body</p>
          </Dialog>
        </DialogTrigger>
      </PortalProvider>
    )
    await userEvent.click(screen.getByRole("button", { name: "Open" }))
    const body = await screen.findByText("Dialog body")
    expect(container.contains(body)).toBe(true)
    container.remove()
  })

  it("keeps dialog Escape dismissal and focus restoration in its container", async () => {
    const container = makeContainer("dialog")
    render(
      <PortalProvider container={container}>
        <DialogTrigger>
          <Button>Open dialog</Button>
          <Dialog>
            <p>Dialog body</p>
          </Dialog>
        </DialogTrigger>
      </PortalProvider>
    )
    const trigger = screen.getByRole("button", { name: "Open dialog" })
    await userEvent.click(trigger)
    expect(container).toContainElement(screen.getByRole("dialog"))
    await userEvent.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).toBeNull()
    await waitFor(() => expect(trigger).toHaveFocus())
    container.remove()
  })

  // The Drawer is the one overlay built on Base UI rather than React Aria, so
  // it honours the container through `Drawer.Portal`'s own `container` prop.
  it("portals a Drawer into the given container", async () => {
    const container = makeContainer("drawer")
    render(
      <PortalProvider container={container}>
        <Drawer>
          <DrawerTrigger render={<Button />}>Open drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Drawer title</DrawerTitle>
            <p>Drawer body</p>
          </DrawerContent>
        </Drawer>
      </PortalProvider>
    )
    await userEvent.click(screen.getByRole("button", { name: "Open drawer" }))
    const body = await screen.findByText("Drawer body")
    expect(container.contains(body)).toBe(true)
    container.remove()
  })

  it("leaves a Drawer in document.body without a provider", async () => {
    render(
      <Drawer>
        <DrawerTrigger render={<Button />}>Open plain drawer</DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Plain drawer title</DrawerTitle>
          <p>Plain drawer body</p>
        </DrawerContent>
      </Drawer>
    )
    await userEvent.click(
      screen.getByRole("button", { name: "Open plain drawer" })
    )
    const body = await screen.findByText("Plain drawer body")
    expect(body.closest("[data-mfe]")).toBeNull()
  })

  it("portals a Popover into the container returned by a function", async () => {
    const container = makeContainer("reports")
    render(
      <PortalProvider container={() => container}>
        <PopoverTrigger>
          <Button>Details</Button>
          <Popover>
            <p>Popover body</p>
          </Popover>
        </PopoverTrigger>
      </PortalProvider>
    )
    await userEvent.click(screen.getByRole("button", { name: "Details" }))
    const body = await screen.findByText("Popover body")
    expect(container.contains(body)).toBe(true)
    container.remove()
  })

  // The guideline's ref pattern: the host is a sibling that only exists once
  // the tree has committed, so reading the function during render sees null.
  it("resolves a function reading a ref after mount", async () => {
    function App() {
      const host = React.useRef<HTMLDivElement>(null)
      return (
        <>
          <PortalProvider container={() => host.current}>
            <PopoverTrigger>
              <Button>Ref details</Button>
              <Popover>
                <p>Ref popover body</p>
              </Popover>
            </PopoverTrigger>
          </PortalProvider>
          <div ref={host} data-testid="ref-host" />
        </>
      )
    }
    render(<App />)
    await userEvent.click(screen.getByRole("button", { name: "Ref details" }))
    const body = await screen.findByText("Ref popover body")
    expect(screen.getByTestId("ref-host")).toContainElement(body)
  })

  it("exposes a function container as the element it returns", () => {
    const container = makeContainer("fn")
    const { result } = renderHook(() => usePortalTarget(), {
      wrapper: ({ children }) => (
        <PortalProvider container={() => container}>{children}</PortalProvider>
      ),
    })
    expect(result.current).toBe(container)
    container.remove()
  })

  it("re-resolves when a new function is passed", () => {
    const first = makeContainer("first")
    const second = makeContainer("second")
    let target: HTMLElement | null = first
    function Probe() {
      return (
        <span data-testid="probe">{usePortalContainer()?.dataset.mfe}</span>
      )
    }
    const { rerender } = render(
      <PortalProvider container={() => target}>
        <Probe />
      </PortalProvider>
    )
    expect(screen.getByTestId("probe")).toHaveTextContent("first")
    target = second
    rerender(
      <PortalProvider container={() => target}>
        <Probe />
      </PortalProvider>
    )
    expect(screen.getByTestId("probe")).toHaveTextContent("second")
    first.remove()
    second.remove()
  })

  it("falls back to document.body without a provider", async () => {
    render(
      <DialogTrigger>
        <Button>Open</Button>
        <Dialog>
          <p>Plain body</p>
        </Dialog>
      </DialogTrigger>
    )
    await userEvent.click(screen.getByRole("button", { name: "Open" }))
    const body = await screen.findByText("Plain body")
    expect(body.closest("[data-mfe]")).toBeNull()
  })

  it("exposes the container through usePortalContainer", () => {
    const container = makeContainer("widget")
    const { result } = renderHook(() => usePortalContainer(), {
      wrapper: ({ children }) => (
        <PortalProvider container={container}>{children}</PortalProvider>
      ),
    })
    expect(result.current).toBe(container)
    container.remove()
  })

  it("returns null outside a provider and after `container={null}`", () => {
    const outer = makeContainer("outer")
    expect(renderHook(() => usePortalContainer()).result.current).toBeNull()
    const { result } = renderHook(() => usePortalContainer(), {
      wrapper: ({ children }) => (
        <PortalProvider container={outer}>
          <PortalProvider container={null}>{children}</PortalProvider>
        </PortalProvider>
      ),
    })
    expect(result.current).toBeNull()
    outer.remove()
  })

  it("leaves the default and null target unset for React Aria to resolve", () => {
    expect(renderHook(() => usePortalTarget()).result.current).toBeUndefined()
    const { result } = renderHook(() => usePortalTarget(), {
      wrapper: ({ children }) => (
        <PortalProvider container={null}>{children}</PortalProvider>
      ),
    })
    expect(result.current).toBeUndefined()
  })

  it("keeps a submenu usable and inside the container", async () => {
    const container = makeContainer("menus")
    const onAction = vi.fn()
    render(
      <PortalProvider container={container}>
        <DropdownMenuTrigger>
          <Button>Open menu</Button>
          <DropdownMenu>
            <DropdownMenuItem>Plain item</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onAction={onAction}>
                  Nested item
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenu>
        </DropdownMenuTrigger>
      </PortalProvider>
    )
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }))
    const root = document.querySelector('[data-slot="dropdown-menu-content"]')!
    expect(container.contains(root)).toBe(true)
    await userEvent.click(screen.getByText("More"))
    const nested = await screen.findByText("Nested item")
    // React Aria nests a submenu inside the root popover's own container, so it
    // rides along into the provider's container instead of portalling itself.
    expect(container.contains(nested)).toBe(true)
    expect(root.parentElement!.contains(nested)).toBe(true)
    // A submenu mounted outside the root popover reads as an interact-outside:
    // the menus close and the item never fires.
    await userEvent.click(nested)
    expect(onAction).toHaveBeenCalledTimes(1)
    container.remove()
  })

  it("keeps a submenu usable with no provider in scope", async () => {
    const onAction = vi.fn()
    render(
      <DropdownMenuTrigger>
        <Button>Open plain menu</Button>
        <DropdownMenu>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onAction={onAction}>
                Plain nested
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenu>
      </DropdownMenuTrigger>
    )
    await userEvent.click(
      screen.getByRole("button", { name: "Open plain menu" })
    )
    await userEvent.click(screen.getByText("More"))
    await userEvent.click(await screen.findByText("Plain nested"))
    expect(onAction).toHaveBeenCalledTimes(1)
  })
})
