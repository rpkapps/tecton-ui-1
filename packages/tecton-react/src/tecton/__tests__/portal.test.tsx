import { render, renderHook, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Button } from "@tecton/react/components/button"
import { Dialog, DialogTrigger } from "@tecton/react/components/dialog"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"
import { PortalProvider, usePortalContainer } from "@tecton/react/tecton/portal"

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
})
