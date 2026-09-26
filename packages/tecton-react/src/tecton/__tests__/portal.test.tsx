import * as React from "react"
import { render, renderHook, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@tecton/react/components/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@tecton/react/components/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@tecton/react/components/popover"
import {
  PortalProvider,
  usePortalContainer,
  usePortalTarget,
} from "@tecton/react/tecton/portal"
import { TectonProvider } from "@tecton/react/tecton/provider"

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
        <Dialog>
          <DialogTrigger render={<Button />}>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Open title</DialogTitle>
            <p>Dialog body</p>
          </DialogContent>
        </Dialog>
      </PortalProvider>
    )
    await userEvent.click(screen.getByRole("button", { name: "Open" }))
    const body = await screen.findByText("Dialog body")
    expect(container.contains(body)).toBe(true)
    container.remove()
  })

  it("portals a Dialog into TectonProvider's portalContainer", async () => {
    const container = makeContainer("provider")
    render(
      <TectonProvider portalContainer={container}>
        <Dialog>
          <DialogTrigger render={<Button />}>Open provided</DialogTrigger>
          <DialogContent>
            <DialogTitle>Open provided title</DialogTitle>
            <p>Provided body</p>
          </DialogContent>
        </Dialog>
      </TectonProvider>
    )
    await userEvent.click(screen.getByRole("button", { name: "Open provided" }))
    const body = await screen.findByText("Provided body")
    expect(container.contains(body)).toBe(true)
    container.remove()
  })

  it("keeps dialog Escape dismissal and focus restoration in its container", async () => {
    const container = makeContainer("dialog")
    render(
      <PortalProvider container={container}>
        <Dialog>
          <DialogTrigger render={<Button />}>Open dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Open dialog title</DialogTitle>
            <p>Dialog body</p>
          </DialogContent>
        </Dialog>
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

  // The Drawer honours the container through its portal's own `container`.
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
        <Popover>
          <PopoverTrigger render={<Button />}>Details</PopoverTrigger>
          <PopoverContent>
            <p>Popover body</p>
          </PopoverContent>
        </Popover>
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
            <Popover>
              <PopoverTrigger render={<Button />}>Ref details</PopoverTrigger>
              <PopoverContent>
                <p>Ref popover body</p>
              </PopoverContent>
            </Popover>
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
      <Dialog>
        <DialogTrigger render={<Button />}>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Open title</DialogTitle>
          <p>Plain body</p>
        </DialogContent>
      </Dialog>
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

  // Never `null`: a primitive would read `container={null}` as "render
  // nothing", so no container is `undefined` and the primitive's default.
  it("leaves the default and null target undefined", () => {
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
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button />}>
            Open menu
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Plain item</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={onAction}>
                  Nested item
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </PortalProvider>
    )
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }))
    const root = await screen.findByRole("menu")
    expect(container.contains(root)).toBe(true)
    await userEvent.click(await screen.findByText("More"))
    const nested = await screen.findByText("Nested item")
    // The submenu portals into the same container as its parent menu, and
    // still counts as inside the menu: the item fires instead of the click
    // reading as an outside press that closes both menus.
    expect(container.contains(nested)).toBe(true)
    await userEvent.click(nested)
    expect(onAction).toHaveBeenCalledTimes(1)
    container.remove()
  })

  it("keeps a submenu usable with no provider in scope", async () => {
    const onAction = vi.fn()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button />}>
          Open plain menu
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={onAction}>
                Plain nested
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    await userEvent.click(
      screen.getByRole("button", { name: "Open plain menu" })
    )
    await userEvent.click(await screen.findByText("More"))
    await userEvent.click(await screen.findByText("Plain nested"))
    expect(onAction).toHaveBeenCalledTimes(1)
  })
})
