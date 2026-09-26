import type * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"

import { Button } from "@tecton/react/components/button"
import { Dialog, DialogTrigger } from "@tecton/react/components/dialog"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"
import { PortalProvider } from "@tecton/react/tecton/portal"

// A caller's own `UNSTABLE_portalContainer` must win over the Tecton portal
// target on every React Aria overlay, with or without a PortalProvider: the
// overlay patch forwards `UNSTABLE_portalContainer ?? portalTarget`.

const containers: HTMLElement[] = []

function makeContainer(name: string) {
  const container = document.createElement("div")
  container.setAttribute("data-container", name)
  document.body.append(container)
  containers.push(container)
  return container
}

afterEach(() => {
  for (const container of containers.splice(0)) container.remove()
})

function withProvider(provider: HTMLElement | undefined, ui: React.ReactNode) {
  return provider ? (
    <PortalProvider container={provider}>{ui}</PortalProvider>
  ) : (
    ui
  )
}

describe.each([
  { name: "without a PortalProvider", hasProvider: false },
  { name: "inside a PortalProvider", hasProvider: true },
])("a caller's UNSTABLE_portalContainer $name", ({ hasProvider }) => {
  it("portals a Popover into the caller's container", async () => {
    const provider = hasProvider ? makeContainer("provider") : undefined
    const own = makeContainer("own")
    render(
      withProvider(
        provider,
        <PopoverTrigger>
          <Button>Open</Button>
          <Popover UNSTABLE_portalContainer={own}>
            <p>Popover body</p>
          </Popover>
        </PopoverTrigger>
      )
    )
    await userEvent.click(screen.getByRole("button", { name: "Open" }))
    const body = await screen.findByText("Popover body")
    expect(own).toContainElement(body)
    if (provider) expect(provider).not.toContainElement(body)
  })

  it("portals a Dialog into the caller's container", async () => {
    const provider = hasProvider ? makeContainer("provider") : undefined
    const own = makeContainer("own")
    render(
      withProvider(
        provider,
        <DialogTrigger>
          <Button>Open</Button>
          <Dialog UNSTABLE_portalContainer={own}>
            <p>Dialog body</p>
          </Dialog>
        </DialogTrigger>
      )
    )
    await userEvent.click(screen.getByRole("button", { name: "Open" }))
    const dialog = await screen.findByRole("dialog")
    expect(own).toContainElement(dialog)
    if (provider) expect(provider).not.toContainElement(dialog)
  })

  it("portals a DropdownMenu into the caller's container", async () => {
    const provider = hasProvider ? makeContainer("provider") : undefined
    const own = makeContainer("own")
    render(
      withProvider(
        provider,
        <DropdownMenuTrigger>
          <Button>Open</Button>
          <DropdownMenu UNSTABLE_portalContainer={own}>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenu>
        </DropdownMenuTrigger>
      )
    )
    await userEvent.click(screen.getByRole("button", { name: "Open" }))
    const menu = await screen.findByRole("menu")
    expect(own).toContainElement(menu)
    if (provider) expect(provider).not.toContainElement(menu)
  })
})

describe("without a caller container", () => {
  it("still portals a Popover into the PortalProvider's container", async () => {
    const provider = makeContainer("provider")
    render(
      <PortalProvider container={provider}>
        <PopoverTrigger>
          <Button>Open</Button>
          <Popover>
            <p>Popover body</p>
          </Popover>
        </PopoverTrigger>
      </PortalProvider>
    )
    await userEvent.click(screen.getByRole("button", { name: "Open" }))
    expect(provider).toContainElement(await screen.findByText("Popover body"))
  })
})
