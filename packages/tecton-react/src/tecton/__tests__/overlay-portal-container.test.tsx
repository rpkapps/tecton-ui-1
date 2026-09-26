import type * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"

import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@tecton/react/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@tecton/react/components/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@tecton/react/components/sheet"
import { TectonProvider } from "@tecton/react/tecton/provider"

// Every overlay takes a caller's `container` on its content part and forwards
// `container ?? portalTarget` to its Base UI Portal (the overlay patch): the
// caller's container wins, with or without a provider, and the provider's
// `portalContainer` is used when the caller passes none.

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
    <TectonProvider portalContainer={provider}>{ui}</TectonProvider>
  ) : (
    ui
  )
}

type OverlayCase = {
  name: string
  ui: (container: HTMLElement | undefined) => React.ReactNode
  /** Opens the overlay and resolves with its popup element. */
  open: () => Promise<HTMLElement>
}

async function clickOpen() {
  await userEvent.click(screen.getByRole("button", { name: "Open" }))
}

const overlays: OverlayCase[] = [
  {
    name: "Popover",
    ui: (container) => (
      <Popover>
        <PopoverTrigger render={<Button />}>Open</PopoverTrigger>
        <PopoverContent container={container}>
          <p>Popover body</p>
        </PopoverContent>
      </Popover>
    ),
    open: async () => {
      await clickOpen()
      return screen.findByText("Popover body")
    },
  },
  {
    name: "Dialog",
    ui: (container) => (
      <Dialog>
        <DialogTrigger render={<Button />}>Open</DialogTrigger>
        <DialogContent container={container}>
          <DialogTitle>Dialog title</DialogTitle>
        </DialogContent>
      </Dialog>
    ),
    open: async () => {
      await clickOpen()
      return screen.findByRole("dialog")
    },
  },
  {
    name: "Sheet",
    ui: (container) => (
      <Sheet>
        <SheetTrigger render={<Button />}>Open</SheetTrigger>
        <SheetContent container={container}>
          <SheetTitle>Sheet title</SheetTitle>
        </SheetContent>
      </Sheet>
    ),
    open: async () => {
      await clickOpen()
      return screen.findByRole("dialog")
    },
  },
  {
    name: "DropdownMenu",
    ui: (container) => (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button />}>Open</DropdownMenuTrigger>
        <DropdownMenuContent container={container}>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    open: async () => {
      await clickOpen()
      return screen.findByRole("menu")
    },
  },
  {
    name: "Select",
    ui: (container) => (
      <Select>
        <SelectTrigger aria-label="Well">
          <SelectValue placeholder="Pick a well" />
        </SelectTrigger>
        <SelectContent container={container}>
          <SelectItem value="a">Alpha</SelectItem>
          <SelectItem value="b">Bravo</SelectItem>
        </SelectContent>
      </Select>
    ),
    open: async () => {
      await userEvent.click(screen.getByRole("combobox", { name: "Well" }))
      return screen.findByRole("listbox")
    },
  },
]

describe.each([
  { name: "without a provider", hasProvider: false },
  { name: "inside a TectonProvider portalContainer", hasProvider: true },
])("a caller's container $name", ({ hasProvider }) => {
  it.each(overlays)(
    "portals a $name into the caller's container",
    async (overlay) => {
      const provider = hasProvider ? makeContainer("provider") : undefined
      const own = makeContainer("own")
      render(withProvider(provider, overlay.ui(own)))
      const popup = await overlay.open()
      expect(own).toContainElement(popup)
      if (provider) expect(provider).not.toContainElement(popup)
    }
  )
})

describe("without a caller container", () => {
  it.each(overlays)(
    "portals a $name into the TectonProvider's portalContainer",
    async (overlay) => {
      const provider = makeContainer("provider")
      render(withProvider(provider, overlay.ui(undefined)))
      expect(provider).toContainElement(await overlay.open())
    }
  )

  it.each(overlays)(
    "portals a $name into document.body with no provider",
    async (overlay) => {
      const unrelated = makeContainer("unrelated")
      render(overlay.ui(undefined))
      const popup = await overlay.open()
      expect(document.body).toContainElement(popup)
      expect(unrelated).not.toContainElement(popup)
    }
  )
})
