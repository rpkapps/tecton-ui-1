import * as React from "react"
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest"

import { Button } from "@tecton/react/components/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tecton/react/components/tabs"
import { DropdownMenuItem } from "@tecton/react/components/dropdown-menu"
import {
  Overflow,
  OverflowDivider,
  OverflowGroup,
  OverflowItem,
  OverflowLabel,
  OverflowMenu,
  OverflowSpacer,
  Toolbar,
  useIsOverflowItemVisible,
} from "@tecton/react/tecton/overflow"

/**
 * jsdom has no layout. Elements declare their size with `data-w`; the row
 * takes its width from `data-w` on the root. Hidden items (display:none in a
 * browser) still report their declared size here, which matches the store's
 * cache-on-first-measure behaviour.
 */
const originalRect = Element.prototype.getBoundingClientRect
const OriginalResizeObserver = globalThis.ResizeObserver

/** A ResizeObserver that reports only when a test resizes the row. */
const observers = new Set<TestObserver>()
class TestObserver {
  targets = new Set<Element>()
  constructor(private callback: ResizeObserverCallback) {
    observers.add(this)
  }
  observe(target: Element) {
    // As in a browser: only a real element can be observed.
    if (!(target instanceof Element))
      throw new TypeError("ResizeObserver.observe: target is not an Element")
    this.targets.add(target)
  }
  unobserve(target: Element) {
    this.targets.delete(target)
  }
  disconnect() {
    this.targets.clear()
    observers.delete(this)
  }
  takeRecords() {
    return []
  }
  report(target: Element, size: number) {
    const box = [{ inlineSize: size, blockSize: size }]
    this.callback(
      [
        {
          target,
          contentBoxSize: box,
          borderBoxSize: box,
        } as unknown as ResizeObserverEntry,
      ],
      this
    )
  }
}

/** Gives the row a new width (or height), as a browser's observer would. */
function resize(root: HTMLElement, size: number) {
  root.dataset.w = String(size)
  act(() => {
    for (const observer of [...observers]) {
      if (observer.targets.has(root)) observer.report(root, size)
    }
  })
}

const rowEl = () => document.querySelector<HTMLElement>("[data-overflow-root]")!

let warn: MockInstance<typeof console.warn>

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", TestObserver)
  warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const w = Number((this as HTMLElement).dataset.w ?? 0)
    return {
      width: w,
      height: w,
      top: 0,
      left: 0,
      right: w,
      bottom: w,
      x: 0,
      y: 0,
      toJSON() {},
    }
  }
})

afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect
  vi.stubGlobal("ResizeObserver", OriginalResizeObserver)
  observers.clear()
  warn.mockRestore()
})

const itemEl = (id: string) =>
  document.querySelector<HTMLElement>(
    `[data-slot="overflow-item"][data-id="${id}"]`
  )

function Row({
  width,
  children,
  ...props
}: React.ComponentProps<typeof Overflow> & { width: number }) {
  return (
    <Overflow data-w={width} {...props}>
      {children}
    </Overflow>
  )
}

function Item({
  id,
  w = 100,
  textOnly = false,
  ...props
}: Partial<React.ComponentProps<typeof OverflowItem>> & {
  id: string
  w?: number
  /** No icon in the control, so it cannot go icon-only. */
  textOnly?: boolean
}) {
  return (
    <OverflowItem
      value={id}
      data-id={id}
      data-w={w}
      label={props.label ?? id}
      {...props}
    >
      <Button>
        {textOnly ? null : <svg aria-hidden data-icon="inline-start" />}
        <OverflowLabel>{props.label ?? id}</OverflowLabel>
      </Button>
    </OverflowItem>
  )
}

describe("Overflow", () => {
  it("renders a row with every item visible when it fits", () => {
    render(
      <Row width={1000}>
        <Item id="a" />
        <Item id="b" />
      </Row>
    )
    const root = document.querySelector('[data-slot="overflow"]')
    expect(root).toHaveAttribute("data-overflow-root")
    expect(root).toHaveAttribute("data-orientation", "horizontal")
    expect(root).toHaveClass("flex-wrap")
    expect(itemEl("a")).not.toHaveAttribute("data-overflowing")
    expect(itemEl("b")).not.toHaveAttribute("data-overflowing")
    expect(document.querySelector('[data-slot="overflow-menu"]')).toBeNull()
  })

  it("Toolbar renders the same row as a toolbar", () => {
    render(
      <Toolbar aria-label="Tools" orientation="vertical" lastResort="scroll">
        <Item id="a" />
      </Toolbar>
    )
    const toolbar = screen.getByRole("toolbar", { name: "Tools" })
    expect(toolbar).toHaveAttribute("data-slot", "toolbar")
    expect(toolbar).toHaveAttribute("data-overflow-root")
    expect(toolbar).toHaveAttribute("aria-orientation", "vertical")
    expect(toolbar).toHaveClass("flex-col", "overflow-y-auto")
  })

  it("scrolls instead of wrapping with lastResort=scroll", () => {
    render(<Row width={100} lastResort="scroll" />)
    const root = document.querySelector('[data-slot="overflow"]')
    expect(root).toHaveClass("overflow-x-auto")
    expect(root).not.toHaveClass("flex-wrap")
  })

  it("moves items into the More menu, lowest priority first", async () => {
    render(
      <Row width={150} labels="always">
        <Item id="a" priority={2} />
        <Item id="b" priority={0} />
        <Item id="c" priority={1} />
      </Row>
    )
    // Three 100px items do not fit in 150px; b (priority 0) leaves first,
    // then c; a and the 32px trigger fit.
    expect(itemEl("b")).toHaveAttribute("data-overflowing")
    expect(itemEl("c")).toHaveAttribute("data-overflowing")
    expect(itemEl("a")).not.toHaveAttribute("data-overflowing")
    const trigger = screen.getByRole("button", { name: "More actions" })
    expect(trigger.closest('[data-slot="overflow-menu"]')).toBeInTheDocument()

    await userEvent.click(trigger)
    const items = await screen.findAllByRole("menuitem")
    // Menu keeps source order, not priority order.
    expect(items.map((i) => i.textContent)).toEqual(["b", "c"])
  })

  it("breaks priority ties from the logical end", () => {
    render(
      <Row width={150} labels="always">
        <Item id="a" />
        <Item id="b" />
        <Item id="c" />
      </Row>
    )
    expect(itemEl("c")).toHaveAttribute("data-overflowing")
    expect(itemEl("b")).toHaveAttribute("data-overflowing")
    expect(itemEl("a")).not.toHaveAttribute("data-overflowing")
  })

  it("keeps minimumVisible items in the row", () => {
    render(
      <Row width={50} minimumVisible={2}>
        <Item id="a" />
        <Item id="b" />
        <Item id="c" />
      </Row>
    )
    expect(itemEl("a")).not.toHaveAttribute("data-overflowing")
    expect(itemEl("b")).not.toHaveAttribute("data-overflowing")
    expect(itemEl("c")).toHaveAttribute("data-overflowing")
  })

  it("an item with overflow=never is fixed and never leaves", () => {
    render(
      <Row width={50}>
        <Item id="a" />
        <Item id="fixed" overflow="never" />
      </Row>
    )
    expect(itemEl("a")).toHaveAttribute("data-overflowing")
    expect(itemEl("fixed")).not.toHaveAttribute("data-overflowing")
  })

  it("writes the fixed minimum size of the row as an inline style", () => {
    render(
      <Row width={1000}>
        <div data-w={40}>fixed</div>
        <Item id="a" />
      </Row>
    )
    const root = document.querySelector<HTMLElement>('[data-slot="overflow"]')
    // 40px fixed + 32px trigger estimate + one 0px gap (jsdom).
    expect(root?.style.minInlineSize).toBe("72px")
  })

  it("passes onClick and disabled to the row control", async () => {
    const onClick = vi.fn()
    const own = vi.fn()
    const { rerender } = render(
      <Row width={1000}>
        <OverflowItem value="a" label="a" onClick={onClick}>
          <Button onClick={own}>a</Button>
        </OverflowItem>
      </Row>
    )
    await userEvent.click(screen.getByRole("button", { name: "a" }))
    expect(own).toHaveBeenCalledTimes(1)
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(
      <Row width={1000}>
        <OverflowItem value="a" label="a" onClick={onClick} disabled>
          <Button>a</Button>
        </OverflowItem>
      </Row>
    )
    expect(screen.getByRole("button", { name: "a" })).toBeDisabled()
  })

  it("renders the menu item with icon, shortcut and destructive variant", async () => {
    const onClick = vi.fn()
    render(
      <Row width={10}>
        <Item
          id="del"
          label="Delete"
          icon={<svg data-testid="icon" />}
          shortcut="⌘⌫"
          variant="destructive"
          onClick={onClick}
        />
      </Row>
    )
    await userEvent.click(screen.getByRole("button", { name: "More actions" }))
    const item = await screen.findByRole("menuitem", { name: /Delete/ })
    expect(item).toHaveAttribute("data-variant", "destructive")
    expect(item).toContainElement(screen.getByTestId("icon"))
    expect(item).toHaveTextContent("⌘⌫")
    await userEvent.click(item)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("disables the menu item of a disabled item", async () => {
    render(
      <Row width={10}>
        <Item id="a" disabled />
      </Row>
    )
    await userEvent.click(screen.getByRole("button", { name: "More actions" }))
    expect(await screen.findByRole("menuitem", { name: "a" })).toHaveAttribute(
      "aria-disabled",
      "true"
    )
  })

  it("uses a custom overflow node in the menu", async () => {
    render(
      <Row width={10}>
        <Item
          id="a"
          overflow={<DropdownMenuItem>Custom form</DropdownMenuItem>}
        />
      </Row>
    )
    await userEvent.click(screen.getByRole("button", { name: "More actions" }))
    expect(
      await screen.findByRole("menuitem", { name: "Custom form" })
    ).toBeInTheDocument()
  })

  it("groups menu items under the group label and collapses together", async () => {
    render(
      <Row width={140} labels="always">
        <OverflowGroup value="edit" label="Edit" collapse="together">
          <Item id="cut" priority={5} />
          <Item id="copy" priority={0} />
        </OverflowGroup>
        <Item id="share" priority={3} />
      </Row>
    )
    // copy leaves first and takes cut with it; share fits beside the trigger.
    expect(itemEl("cut")).toHaveAttribute("data-overflowing")
    expect(itemEl("copy")).toHaveAttribute("data-overflowing")
    expect(itemEl("share")).not.toHaveAttribute("data-overflowing")
    await userEvent.click(screen.getByRole("button", { name: "More actions" }))
    const menu = await screen.findByRole("menu")
    expect(menu).toHaveTextContent("Edit")
    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual([
      "cut",
      "copy",
    ])
  })

  it("hides a divider once nothing visible remains on one side", () => {
    render(
      <Row width={140} labels="always">
        <Item id="a" priority={1} />
        <OverflowDivider data-w={1} />
        <Item id="b" priority={0} />
      </Row>
    )
    expect(itemEl("b")).toHaveAttribute("data-overflowing")
    expect(itemEl("a")).not.toHaveAttribute("data-overflowing")
    // The trigger counts for the trailing side, so the divider stays.
    expect(
      document.querySelector('[data-slot="overflow-divider"]')
    ).not.toHaveAttribute("data-overflowing")
  })

  it("never shows two dividers next to each other", () => {
    // The items between the dividers leave, then the ones after them: one
    // divider stays, the last, beside what follows it; never two.
    const dividers = () =>
      [...document.querySelectorAll('[data-slot="overflow-divider"]')].map(
        (d) => !d.hasAttribute("data-overflowing")
      )
    const row = (width: number) => (
      <Row width={width} labels="always">
        <Item id="a" priority={5} />
        <OverflowDivider data-w={1} />
        <Item id="b" priority={1} />
        <OverflowDivider data-w={1} />
        <Item id="c" priority={2} />
        <OverflowSpacer />
        <OverflowDivider data-w={1} />
        <Item id="d" priority={0} />
      </Row>
    )
    const at = (width: number, gone: string[], shown: boolean[]) => {
      const { unmount } = render(row(width))
      for (const id of ["a", "b", "c", "d"]) {
        if (gone.includes(id))
          expect(itemEl(id)).toHaveAttribute("data-overflowing")
        else expect(itemEl(id)).not.toHaveAttribute("data-overflowing")
      }
      expect(dividers()).toEqual(shown)
      unmount()
    }
    at(1000, [], [true, true, true])
    // d leaves: the trigger takes its place after the last divider.
    at(340, ["d"], [true, true, true])
    // b leaves too: the dividers around it would meet, so the first goes.
    at(250, ["b", "d"], [false, true, true])
    // c leaves: only the last divider, before the trigger, remains.
    at(140, ["b", "c", "d"], [false, false, true])
  })

  it("counts a divider's margins as space it takes", () => {
    // 100 + 1 + 100 fits in 205, but not with 10px margins on the divider.
    render(
      <Row width={205} labels="always">
        <Item id="a" priority={1} />
        <OverflowDivider
          data-w={1}
          style={{ marginLeft: 10, marginRight: 10 }}
        />
        <Item id="b" priority={0} />
      </Row>
    )
    expect(itemEl("b")).toHaveAttribute("data-overflowing")
    expect(itemEl("a")).not.toHaveAttribute("data-overflowing")
  })

  it("keeps a separator between hidden groups when a visible item stands between them", async () => {
    render(
      <Row width={150} labels="always">
        <Item id="a" priority={0} />
        <OverflowDivider data-w={1} />
        <Item id="b" priority={5} />
        <Item id="c" priority={0} />
      </Row>
    )
    expect(itemEl("b")).not.toHaveAttribute("data-overflowing")
    await userEvent.click(screen.getByRole("button", { name: "More actions" }))
    const menu = await screen.findByRole("menu")
    expect(
      [...menu.querySelectorAll('[role="menuitem"], [role="separator"]')].map(
        (el) =>
          el.getAttribute("role") === "separator" ? "---" : el.textContent
      )
    ).toEqual(["a", "---", "c"])
  })

  it("renders a divider as a vertical separator and a spacer as hidden filler", () => {
    render(
      <Row width={1000}>
        <Item id="a" />
        <OverflowDivider />
        <OverflowSpacer />
        <Item id="b" />
      </Row>
    )
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "vertical"
    )
    expect(
      document.querySelector('[data-slot="overflow-spacer"]')
    ).toHaveAttribute("aria-hidden", "true")
  })

  it("collapses labels to icons before hiding anything (labels=auto)", () => {
    render(
      <Row width={150}>
        <Item id="a" />
        <Item id="b" />
      </Row>
    )
    // 200px does not fit; two icon-only items (32px each) do.
    expect(itemEl("a")).toHaveAttribute("data-compact")
    expect(itemEl("b")).toHaveAttribute("data-compact")
    expect(itemEl("a")).not.toHaveAttribute("data-overflowing")
    expect(itemEl("b")).not.toHaveAttribute("data-overflowing")
    expect(
      itemEl("a")?.querySelector('[data-slot="overflow-label"]')
    ).toHaveClass("sr-only")
  })

  it("never collapses labels with labels=always and always with labels=never", () => {
    const { unmount } = render(
      <Row width={150} labels="always">
        <Item id="a" />
        <Item id="b" />
      </Row>
    )
    expect(itemEl("a")).not.toHaveAttribute("data-compact")
    expect(itemEl("b")).toHaveAttribute("data-overflowing")
    unmount()

    render(
      <Row width={1000} labels="never">
        <Item id="a" />
      </Row>
    )
    expect(itemEl("a")).toHaveAttribute("data-compact")
  })

  it("keeps the label of an item with labelBehavior=keep", () => {
    render(
      <Row width={150}>
        <Item id="a" labelBehavior="keep" />
        <Item id="b" />
      </Row>
    )
    expect(itemEl("a")).not.toHaveAttribute("data-compact")
    expect(
      itemEl("a")?.querySelector('[data-slot="overflow-label"]')
    ).not.toHaveClass("sr-only")
    expect(itemEl("b")).toHaveAttribute("data-compact")
  })

  it("sets the elastic bounds as CSS variables", () => {
    render(
      <Row width={1000}>
        <Item id="a" elastic={{ min: "8rem", max: "20rem" }} />
        <Item id="b" elastic />
      </Row>
    )
    const a = itemEl("a")!
    expect(a).toHaveAttribute("data-elastic")
    expect(a.style.getPropertyValue("--overflow-min")).toBe("8rem")
    expect(a.style.getPropertyValue("--overflow-max")).toBe("20rem")
    expect(itemEl("b")).toHaveAttribute("data-elastic")
    expect(itemEl("b")?.style.getPropertyValue("--overflow-min")).toBe("")
  })

  it("uses a custom menu trigger and label", () => {
    render(
      <Row width={10} menu={false}>
        <Item id="a" />
        <OverflowMenu label="Extra" />
      </Row>
    )
    expect(screen.getByRole("button", { name: "Extra" })).toBeInTheDocument()
  })

  it("opens the menu from a custom trigger element", async () => {
    render(
      <Row width={10} menu={false}>
        <Item id="a" />
        <OverflowMenu trigger={<Button variant="outline">More</Button>} />
      </Row>
    )
    const trigger = screen.getByRole("button", { name: "More" })
    expect(trigger).toHaveAttribute("aria-haspopup", "menu")
    await userEvent.click(trigger)
    expect(await screen.findByRole("menuitem", { name: "a" })).toBeVisible()
  })

  it("shows the label of an icon-only item as a tooltip", async () => {
    render(
      <Row width={1000} labels="never">
        <Item id="share" label="Share" />
      </Row>
    )
    // The visually hidden label still names the control.
    const control = screen.getByRole("button", { name: "Share" })
    await userEvent.hover(control)
    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="tooltip-content"]')
      ).toHaveTextContent("Share")
    )
  })

  it("throws when parts are used outside a row", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() =>
      render(
        <OverflowItem value="a">
          <button>x</button>
        </OverflowItem>
      )
    ).toThrow(/OverflowItem must be inside <Overflow> or <Toolbar>/)
    expect(() => render(<OverflowDivider />)).toThrow(/OverflowDivider/)
    expect(() => render(<OverflowMenu />)).toThrow(/OverflowMenu/)
    expect(() => render(<OverflowGroup value="g" />)).toThrow(/OverflowGroup/)
    spy.mockRestore()
  })

  it("useIsOverflowItemVisible tracks the item", () => {
    let visible: Record<string, boolean> = {}
    function Probe({ id }: { id: string }) {
      visible[id] = useIsOverflowItemVisible(id)
      return null
    }
    render(
      <Row width={150} labels="always">
        <Item id="a" priority={1} />
        <Item id="b" priority={0} />
        <Probe id="a" />
        <Probe id="b" />
      </Row>
    )
    expect(visible).toEqual({ a: true, b: false })
    visible = {}
  })

  it("useIsOverflowItemVisible throws outside a row", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderHook(() => useIsOverflowItemVisible("a"))).toThrow(
      /useIsOverflowItemVisible/
    )
    spy.mockRestore()
  })

  it("moves focus to the trigger when the focused item leaves the row", async () => {
    // Start wide so both items are in the row, then shrink via re-mount with
    // a narrower root (the store is re-attached on configure changes).
    function App({ labels }: { labels: "auto" | "always" }) {
      return (
        <Row width={150} labels={labels}>
          <Item id="a" priority={1} />
          <Item id="b" priority={0} />
        </Row>
      )
    }
    const { rerender } = render(<App labels="auto" />)
    // Both fit compact; focus b.
    const b = screen.getByRole("button", { name: "b" })
    act(() => b.focus())
    expect(b).toHaveFocus()
    // Forbidding label collapse pushes b out.
    rerender(<App labels="always" />)
    expect(itemEl("b")).toHaveAttribute("data-overflowing")
    expect(screen.getByRole("button", { name: "More actions" })).toHaveFocus()
  })
})

describe("Overflow refs", () => {
  it("fills a caller's ref on the row and still collapses", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(
      <Overflow ref={ref} data-w={150} labels="always">
        <Item id="a" priority={1} />
        <Item id="b" priority={0} />
      </Overflow>
    )
    expect(ref.current).toBe(rowEl())
    expect(itemEl("b")).toHaveAttribute("data-overflowing")
  })

  it("fills a caller's ref on a Toolbar, an item and a divider", () => {
    const toolbar = React.createRef<HTMLDivElement>()
    const item = vi.fn()
    const divider = React.createRef<HTMLDivElement>()
    render(
      <Toolbar ref={toolbar} aria-label="Tools" data-w={150} labels="always">
        <Item id="a" priority={1} ref={item} />
        <OverflowDivider ref={divider} data-w={1} />
        <Item id="b" priority={0} />
      </Toolbar>
    )
    expect(toolbar.current).toBe(screen.getByRole("toolbar"))
    expect(item).toHaveBeenLastCalledWith(itemEl("a"))
    expect(divider.current).toBe(
      document.querySelector('[data-slot="overflow-divider"]')
    )
    expect(itemEl("b")).toHaveAttribute("data-overflowing")
  })
})

describe("Overflow items that arrive late", () => {
  it("renders an item that mounts into an icon-only row icon-only", () => {
    const { rerender } = render(
      <Row width={150}>
        <Item id="a" />
        <Item id="b" />
      </Row>
    )
    expect(itemEl("a")).toHaveAttribute("data-compact")
    rerender(
      <Row width={150}>
        <Item id="a" />
        <Item id="b" />
        <Item id="c" />
      </Row>
    )
    expect(itemEl("c")).toHaveAttribute("data-compact")
    expect(itemEl("c")).not.toHaveAttribute("data-overflowing")
  })

  it("keeps an item icon-only when it registers again after a priority change", () => {
    const row = (priority: number) => (
      <Row width={150}>
        <Item id="a" priority={priority} />
        <Item id="b" />
      </Row>
    )
    const { rerender } = render(row(0))
    expect(itemEl("a")).toHaveAttribute("data-compact")
    rerender(row(3))
    expect(itemEl("a")).toHaveAttribute("data-compact")
    expect(
      itemEl("a")?.querySelector('[data-slot="overflow-label"]')
    ).toHaveClass("sr-only")
  })

  it("measures an item that a child component adds by its own state", () => {
    function Late() {
      const [shown, setShown] = React.useState(false)
      React.useEffect(() => setShown(true), [])
      return shown ? <Item id="late" /> : null
    }
    render(
      <Row width={150} labels="always">
        <Item id="a" />
        <Late />
      </Row>
    )
    // 100 + 100 does not fit in 150: the late item, at the end, leaves.
    expect(itemEl("late")).toHaveAttribute("data-overflowing")
    expect(itemEl("a")).not.toHaveAttribute("data-overflowing")
  })
})

describe("Overflow focus when the last item returns", () => {
  it("moves focus from the More trigger to the item that returns", () => {
    render(
      <Row width={150} labels="always">
        <Item id="a" priority={1} />
        <Item id="b" priority={0} />
      </Row>
    )
    const trigger = screen.getByRole("button", { name: "More actions" })
    act(() => trigger.focus())
    resize(rowEl(), 1000)
    expect(
      screen.queryByRole("button", { name: "More actions" })
    ).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "b" })).toHaveFocus()
  })

  it("moves focus from the open menu to the item that returns", async () => {
    render(
      <Row width={150} labels="always">
        <Item id="a" priority={1} />
        <Item id="b" priority={0} />
      </Row>
    )
    await userEvent.click(screen.getByRole("button", { name: "More actions" }))
    await screen.findByRole("menu")
    resize(rowEl(), 1000)
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "b" })).toHaveFocus()
  })

  it("leaves focus alone when it was elsewhere", () => {
    render(
      <Row width={150} labels="always">
        <Item id="a" priority={1} />
        <Item id="b" priority={0} />
      </Row>
    )
    const a = screen.getByRole("button", { name: "a" })
    act(() => a.focus())
    resize(rowEl(), 1000)
    expect(a).toHaveFocus()
  })
})

describe("Overflow orientation", () => {
  it("clears the minimum size of the old axis when the orientation changes", () => {
    const row = (orientation: "horizontal" | "vertical") => (
      <Row width={1000} orientation={orientation}>
        <div data-w={40}>fixed</div>
        <Item id="a" />
      </Row>
    )
    const { rerender } = render(row("vertical"))
    expect(rowEl().style.minBlockSize).toBe("72px")
    expect(rowEl().style.minInlineSize).toBe("")
    rerender(row("horizontal"))
    expect(rowEl().style.minBlockSize).toBe("")
    expect(rowEl().style.minInlineSize).toBe("72px")
  })

  it("skips the label stage in a vertical row (rule 10.1)", () => {
    render(
      <Toolbar aria-label="Tools" orientation="vertical" data-w={150}>
        <Item id="a" priority={1} />
        <Item id="b" priority={0} />
      </Toolbar>
    )
    expect(itemEl("a")).not.toHaveAttribute("data-compact")
    expect(itemEl("b")).not.toHaveAttribute("data-compact")
    expect(itemEl("b")).toHaveAttribute("data-overflowing")
  })

  it("is still icon-only from the start with labels=never in a vertical row", () => {
    render(
      <Toolbar
        aria-label="Tools"
        orientation="vertical"
        labels="never"
        data-w={1000}
      >
        <Item id="a" />
      </Toolbar>
    )
    expect(itemEl("a")).toHaveAttribute("data-compact")
  })
})

describe("Overflow label stage", () => {
  it("keeps the label of a text-only item, which has no icon to collapse to (rule 4.3)", () => {
    render(
      <Row width={180}>
        <Item id="a" textOnly />
        <Item id="b" />
      </Row>
    )
    // b goes icon-only; a stays labelled and costs its full width.
    expect(itemEl("b")).toHaveAttribute("data-compact")
    expect(itemEl("a")).not.toHaveAttribute("data-compact")
    expect(
      itemEl("a")?.querySelector('[data-slot="overflow-label"]')
    ).not.toHaveClass("sr-only")
  })

  it("warns once in development about labelBehavior=collapse without an icon", () => {
    const { rerender } = render(
      <Row width={1000}>
        <Item id="a" textOnly labelBehavior="collapse" />
        <Item id="b" labelBehavior="collapse" />
      </Row>
    )
    rerender(
      <Row width={1000}>
        <Item id="a" textOnly labelBehavior="collapse" />
        <Item id="b" labelBehavior="collapse" />
      </Row>
    )
    const calls = warn.mock.calls.filter(([message]) =>
      String(message).includes("labelBehavior")
    )
    expect(calls).toHaveLength(1)
    expect(String(calls[0]?.[0])).toContain('"a"')
  })
})

describe("Overflow last resort", () => {
  const lastResortWarnings = () =>
    warn.mock.calls.filter(([message]) => String(message).includes("stage 5"))

  it("logs once in development when fixed items alone do not fit (rule 9.3)", () => {
    render(
      <Row width={100}>
        <div data-w={200}>fixed</div>
        <Item id="a" />
      </Row>
    )
    expect(itemEl("a")).toHaveAttribute("data-overflowing")
    expect(lastResortWarnings()).toHaveLength(1)
    resize(rowEl(), 90)
    expect(lastResortWarnings()).toHaveLength(1)
  })

  it("logs nothing while the row fits", () => {
    render(
      <Row width={150} labels="always">
        <Item id="a" />
        <Item id="b" />
      </Row>
    )
    expect(itemEl("b")).toHaveAttribute("data-overflowing")
    expect(lastResortWarnings()).toHaveLength(0)
  })

  it("gives an absolutely positioned child neither size nor a gap", () => {
    // 100 + 10 + 100 fits in 215; a third gap for the live region would not.
    render(
      <Row width={215} labels="always" style={{ columnGap: "10px" }}>
        <Item id="a" />
        <span style={{ position: "absolute" }} data-w={0} />
        <Item id="b" />
      </Row>
    )
    expect(itemEl("a")).not.toHaveAttribute("data-overflowing")
    expect(itemEl("b")).not.toHaveAttribute("data-overflowing")
  })
})

describe("Overflow badge", () => {
  it("counts the hidden items on the trigger with overflowBadge", () => {
    render(
      <Row width={150} labels="always" overflowBadge>
        <Item id="a" priority={2} />
        <Item id="b" />
        <Item id="c" />
      </Row>
    )
    const badge = document.querySelector('[data-slot="overflow-menu-badge"]')
    expect(badge).toHaveTextContent("2")
    expect(badge).toHaveAttribute("aria-hidden", "true")
    // The trigger keeps its name.
    expect(
      screen.getByRole("button", { name: "More actions" })
    ).toBeInTheDocument()
  })

  it("shows no badge unless asked", () => {
    render(
      <Row width={150} labels="always">
        <Item id="a" priority={2} />
        <Item id="b" />
      </Row>
    )
    expect(
      document.querySelector('[data-slot="overflow-menu-badge"]')
    ).toBeNull()
  })
})

describe("Overflow inside Tabs", () => {
  it("renders a row inside Tabs, next to the tab list and panels", async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue="one">
        <Row width={1000} labels="always">
          <OverflowItem value="tabs" data-id="tabs" data-w={200}>
            <TabsList aria-label="Sections">
              <TabsTrigger value="one">One</TabsTrigger>
              <TabsTrigger value="two">Two</TabsTrigger>
            </TabsList>
          </OverflowItem>
          <OverflowSpacer />
          <Item id="a" />
        </Row>
        <TabsContent value="one">First panel</TabsContent>
        <TabsContent value="two">Second panel</TabsContent>
      </Tabs>
    )
    // One real row, measured and laid out as usual.
    expect(document.querySelectorAll("[data-overflow-root]")).toHaveLength(1)
    expect(itemEl("tabs")).not.toHaveAttribute("data-overflowing")
    expect(itemEl("a")).not.toHaveAttribute("data-overflowing")
    expect(screen.getByRole("tabpanel")).toHaveTextContent("First panel")

    await user.click(screen.getByRole("tab", { name: "Two" }))
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Second panel")

    // Still overflows once the real row gets narrow.
    resize(rowEl(), 250)
    expect(itemEl("a")).toHaveAttribute("data-overflowing")
  })
})

describe("Toolbar keyboard", () => {
  function Tools(props: Partial<React.ComponentProps<typeof Toolbar>>) {
    return (
      <>
        <button>Before</button>
        <Toolbar aria-label="Tools" data-w={1000} labels="always" {...props}>
          <Item id="a" />
          <OverflowItem value="search" data-id="search" data-w={100}>
            <input aria-label="Search" defaultValue="ab" />
          </OverflowItem>
          <Item id="b" />
          <Button>Fixed</Button>
        </Toolbar>
        <button>After</button>
      </>
    )
  }
  const button = (name: string) => screen.getByRole("button", { name })
  const search = () =>
    screen.getByRole<HTMLInputElement>("textbox", { name: "Search" })

  it("moves along every visible control with the arrow keys, without wrapping", async () => {
    const user = userEvent.setup()
    render(<Tools />)
    act(() => button("a").focus())
    await user.keyboard("{ArrowRight}")
    expect(search()).toHaveFocus()
    // The caret is at the end: the next arrow leaves the field.
    search().setSelectionRange(2, 2)
    await user.keyboard("{ArrowRight}")
    expect(button("b")).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(button("Fixed")).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(button("Fixed")).toHaveFocus()
    await user.keyboard("{ArrowLeft}{ArrowLeft}")
    expect(search()).toHaveFocus()
    // Up/Down belong to the other axis.
    await user.keyboard("{ArrowDown}")
    expect(search()).toHaveFocus()
  })

  it("keeps the arrow keys in a text field until the caret reaches its edge", async () => {
    const user = userEvent.setup()
    render(<Tools />)
    act(() => search().focus())
    search().setSelectionRange(1, 1)
    await user.keyboard("{ArrowLeft}")
    expect(search()).toHaveFocus()
    search().setSelectionRange(0, 0)
    await user.keyboard("{ArrowLeft}")
    expect(button("a")).toHaveFocus()
  })

  it("skips the controls of items in the More menu", async () => {
    const user = userEvent.setup()
    render(
      <Toolbar aria-label="Tools" data-w={150} labels="always">
        <Item id="a" priority={1} />
        <Item id="b" priority={0} />
      </Toolbar>
    )
    expect(itemEl("b")).toHaveAttribute("data-overflowing")
    act(() => button("a").focus())
    await user.keyboard("{ArrowRight}")
    expect(button("More actions")).toHaveFocus()
  })

  it("leaves the More menu's own keyboard alone", async () => {
    const user = userEvent.setup()
    render(
      <Toolbar aria-label="Tools" data-w={150} labels="always">
        <Item id="a" priority={2} />
        <Item id="b" priority={1} />
        <Item id="c" priority={0} />
      </Toolbar>
    )
    act(() => button("More actions").focus())
    await user.keyboard("{Enter}")
    const [first, second] = await screen.findAllByRole("menuitem")
    await waitFor(() => expect(first).toHaveFocus())
    await user.keyboard("{ArrowDown}")
    expect(second).toHaveFocus()
  })

  it("leaves with Tab and returns to the last focused control", async () => {
    const user = userEvent.setup()
    render(<Tools />)
    act(() => button("b").focus())
    await user.tab()
    expect(button("After")).toHaveFocus()
    await user.tab({ shift: true })
    expect(button("b")).toHaveFocus()
    await user.tab({ shift: true })
    expect(button("Before")).toHaveFocus()
  })

  it("uses Up/Down when vertical", async () => {
    const user = userEvent.setup()
    render(<Tools orientation="vertical" />)
    act(() => button("a").focus())
    await user.keyboard("{ArrowRight}")
    expect(button("a")).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(search()).toHaveFocus()
    await user.keyboard("{ArrowUp}")
    expect(button("a")).toHaveFocus()
  })

  it("mirrors Left/Right in a right-to-left layout", async () => {
    const user = userEvent.setup()
    render(
      <div dir="rtl">
        <Toolbar aria-label="Tools" data-w={1000} labels="always">
          <Item id="a" />
          <Item id="b" />
        </Toolbar>
      </div>
    )
    act(() => button("a").focus())
    await user.keyboard("{ArrowLeft}")
    expect(button("b")).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(button("a")).toHaveFocus()
  })

  it("leaves the arrow keys alone in a plain Overflow row", async () => {
    const user = userEvent.setup()
    render(
      <Row width={1000} labels="always">
        <Item id="a" />
        <Item id="b" />
      </Row>
    )
    expect(screen.queryByRole("toolbar")).toBeNull()
    act(() => button("a").focus())
    await user.keyboard("{ArrowRight}")
    expect(button("a")).toHaveFocus()
  })
})
