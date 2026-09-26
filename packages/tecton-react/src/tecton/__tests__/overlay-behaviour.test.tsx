import * as React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@tecton/react/components/alert-dialog"
import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"
import { Calendar } from "@tecton/react/components/calendar"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@tecton/react/components/pagination"
import {
  Sidebar,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  useSidebar,
} from "@tecton/react/components/sidebar"
import { Slider } from "@tecton/react/components/slider"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tecton/react/components/tabs"

// Behaviour the overlay patch (scripts/registry-mirror/overlay/tecton.patch)
// fixes in the generated components; see docs/UPSTREAM.md, "Overlay hunks".

describe("calendar", () => {
  function Controlled() {
    const [date, setDate] = React.useState<Date | undefined>(
      new Date(2026, 8, 15)
    )
    return (
      <Calendar
        mode="single"
        month={new Date(2026, 8, 1)}
        selected={date}
        onSelect={setDate}
      />
    )
  }
  const day = (n: number) =>
    screen.getAllByRole("button").find((b) => b.textContent === String(n))!

  it("keeps the day buttons mounted when the selection changes", () => {
    render(<Controlled />)
    const tenth = day(10)
    fireEvent.click(tenth)
    expect(tenth.isConnected).toBe(true)
    expect(day(10)).toBe(tenth)
  })

  it("moves DOM focus with the arrow keys", () => {
    render(<Controlled />)
    const fifteenth = day(15)
    act(() => fifteenth.focus())
    fireEvent.keyDown(fifteenth, { key: "ArrowRight" })
    expect(document.activeElement).toBe(day(16))
  })
})

describe("pagination", () => {
  it("renders page links as links, not buttons", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#1">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#2" isActive>
              2
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
    expect(screen.queryAllByRole("button")).toHaveLength(0)
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })
})

describe("tabs", () => {
  it("passes a vertical orientation to the tab list", () => {
    render(
      <Tabs defaultValue="a" orientation="vertical">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
      </Tabs>
    )
    expect(screen.getByRole("tablist")).toHaveAttribute(
      "aria-orientation",
      "vertical"
    )
  })
})

describe("tabs activation", () => {
  function Strip(props: React.ComponentProps<typeof TabsList>) {
    return (
      <Tabs defaultValue="a">
        <TabsList {...props}>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel A</TabsContent>
        <TabsContent value="b">Panel B</TabsContent>
      </Tabs>
    )
  }

  it("selects the tab an arrow key moves to", async () => {
    render(<Strip />)
    const [a, b] = screen.getAllByRole("tab")
    act(() => a.focus())
    await userEvent.keyboard("{ArrowRight}")
    expect(document.activeElement).toBe(b)
    expect(b).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel B")
  })

  it("only moves focus with activateOnFocus={false}", async () => {
    render(<Strip activateOnFocus={false} />)
    const [a, b] = screen.getAllByRole("tab")
    act(() => a.focus())
    await userEvent.keyboard("{ArrowRight}")
    expect(document.activeElement).toBe(b)
    expect(a).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel A")
  })
})

describe("alert-dialog", () => {
  function Prompt({
    onClick,
  }: {
    onClick?: React.ComponentProps<typeof AlertDialogAction>["onClick"]
  }) {
    return (
      <AlertDialog>
        <AlertDialogTrigger>Delete well</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete 34/10-A-12?</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onClick}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  it("closes an uncontrolled prompt when the action is pressed", async () => {
    const onClick = vi.fn()
    render(<Prompt onClick={onClick} />)
    await userEvent.click(screen.getByRole("button", { name: "Delete well" }))
    const action = await screen.findByRole("button", { name: "Delete" })
    expect(action).toHaveAttribute("data-slot", "alert-dialog-action")
    await userEvent.click(action)
    expect(onClick).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    )
  })

  it("stays open when the action's onClick prevents the close", async () => {
    render(<Prompt onClick={(event) => event.preventBaseUIHandler()} />)
    await userEvent.click(screen.getByRole("button", { name: "Delete well" }))
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }))
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })
})

describe("sidebar", () => {
  function Rail({ side }: { side: "left" | "right" }) {
    return (
      <SidebarProvider defaultOpen={false}>
        <Sidebar side={side} collapsible="icon">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Wells">W</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarRail />
        </Sidebar>
      </SidebarProvider>
    )
  }

  it.each([
    ["left", "right"],
    ["right", "left"],
  ] as const)(
    "opens a collapsed button's tooltip away from a %s sidebar",
    async (side, tooltipSide) => {
      render(<Rail side={side} />)
      await userEvent.hover(screen.getByRole("button", { name: "W" }))
      const tooltip = await screen.findByText("Wells")
      await waitFor(() =>
        expect(tooltip.closest("[data-slot=tooltip-content]")).toHaveAttribute(
          "data-side",
          tooltipSide
        )
      )
    }
  )

  // `side` is physical: these classes must reach the component as written,
  // not mirrored by the CLI's right-to-left transform (docs/UPSTREAM.md).
  it("keeps the border on the inner edge in both directions", () => {
    const { container } = render(<Rail side="left" />)
    const classes = container
      .querySelector("[data-slot=sidebar-container]")!
      .className.split(" ")
    expect(classes).toEqual(
      expect.arrayContaining([
        "group-data-[side=left]:ltr:border-e",
        "group-data-[side=left]:rtl:border-s",
        "group-data-[side=right]:ltr:border-s",
        "group-data-[side=right]:rtl:border-e",
      ])
    )
    expect(classes).not.toContain("group-data-[side=left]:border-e")
    expect(classes).not.toContain("group-data-[side=right]:border-s")
  })

  // Tecton provides no keyboard shortcuts: upstream's window-wide ⌘B / Ctrl+B
  // listener is removed, and an application binds its own key to
  // `toggleSidebar()`.
  it("registers no ⌘B / Ctrl+B shortcut, and toggleSidebar still works", async () => {
    function Probe() {
      const { state, toggleSidebar } = useSidebar()
      return (
        <button type="button" data-state={state} onClick={toggleSidebar}>
          Toggle
        </button>
      )
    }
    render(
      <SidebarProvider>
        <Probe />
      </SidebarProvider>
    )
    const toggle = screen.getByRole("button", { name: "Toggle" })
    await userEvent.keyboard("{Meta>}b{/Meta}")
    await userEvent.keyboard("{Control>}b{/Control}")
    fireEvent.keyDown(window, { key: "b", metaKey: true })
    fireEvent.keyDown(window, { key: "b", ctrlKey: true })
    expect(toggle).toHaveAttribute("data-state", "expanded")

    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute("data-state", "collapsed")
  })

  it("positions the offcanvas rail physically", () => {
    const { container } = render(<Rail side="left" />)
    const classes = container
      .querySelector("[data-slot=sidebar-rail]")!
      .className.split(" ")
    expect(classes).toEqual(
      expect.arrayContaining([
        "group-data-[side=left]:group-data-[collapsible=offcanvas]:-right-2",
        "group-data-[side=right]:group-data-[collapsible=offcanvas]:-left-2",
        "in-data-[side=left]:cursor-[w-resize]",
      ])
    )
    expect(classes.filter((c) => /(-start-|-end-)2$/.test(c))).toEqual([])
    expect(
      classes.filter((c) => c.startsWith("rtl:") && c.includes("cursor"))
    ).toEqual([])
  })
})

describe("button", () => {
  it("exposes its variant and size as data attributes", () => {
    render(
      <>
        <Button>Save</Button>
        <Button variant="outline" size="sm">
          Cancel
        </Button>
      </>
    )
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "data-variant",
      "default"
    )
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "data-size",
      "default"
    )
    const cancel = screen.getByRole("button", { name: "Cancel" })
    expect(cancel).toHaveAttribute("data-variant", "outline")
    expect(cancel).toHaveAttribute("data-size", "sm")
  })
})

describe("button-group", () => {
  // The group gives its filled buttons the outline stroke whenever an outlined
  // member is present (style-tecton.css, `.cn-button-group`). The rule keys on
  // the buttons' `data-variant`, so run the selector the class compiles to.
  function strokeSelector(group: HTMLElement) {
    const rule = group.className
      .split(" ")
      .find(
        (c) => c.startsWith("[&:has(") && c.endsWith("]:border-outline-border")
      )
    expect(rule).toBeDefined()
    return rule!
      .slice(1, -"]:border-outline-border".length)
      .replace("&", "[data-slot=button-group]")
  }

  it("strokes the filled members of a group that has an outlined one", () => {
    render(
      <ButtonGroup>
        <Button variant="outline">Day</Button>
        <Button>Week</Button>
        <Button variant="secondary">Month</Button>
      </ButtonGroup>
    )
    const group = screen.getByRole("group")
    const stroked = Array.from(
      group.ownerDocument.querySelectorAll(strokeSelector(group))
    ).map((el) => el.textContent)
    expect(stroked).toEqual(["Week", "Month"])
  })

  it("leaves a group of only filled buttons borderless", () => {
    render(
      <ButtonGroup>
        <Button>Week</Button>
        <Button variant="secondary">Month</Button>
      </ButtonGroup>
    )
    const group = screen.getByRole("group")
    expect(
      group.ownerDocument.querySelectorAll(strokeSelector(group))
    ).toHaveLength(0)
  })
})

describe("slider", () => {
  // Base UI keeps the thumbs `visibility: hidden` until it has measured them,
  // which never happens in jsdom, so read the range inputs' attributes rather
  // than query them by accessible name.
  const rangeInputs = () =>
    Array.from(document.querySelectorAll<HTMLInputElement>("input[type=range]"))

  it("names every thumb's range input from aria-label", () => {
    render(<Slider aria-label="Depth" defaultValue={[20, 80]} />)
    const inputs = rangeInputs()
    expect(inputs).toHaveLength(2)
    for (const input of inputs) {
      expect(input).toHaveAttribute("aria-label", "Depth")
    }
    // The name is not duplicated on the group root.
    expect(document.querySelector("[data-slot=slider]")).not.toHaveAttribute(
      "aria-label"
    )
  })

  it("names the thumb from aria-labelledby", () => {
    render(
      <>
        <span id="zoom-label">Zoom</span>
        <Slider aria-labelledby="zoom-label" defaultValue={[2]} max={5} />
      </>
    )
    expect(rangeInputs()[0]).toHaveAttribute("aria-labelledby", "zoom-label")
  })
})
