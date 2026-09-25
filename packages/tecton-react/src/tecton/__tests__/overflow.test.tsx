import { act, render, renderHook, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Button } from "@tecton/react/components/button"
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

beforeEach(() => {
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
  ...props
}: Partial<React.ComponentProps<typeof OverflowItem>> & {
  id: string
  w?: number
}) {
  return (
    <OverflowItem
      id={id}
      data-id={id}
      data-w={w}
      label={props.label ?? id}
      {...props}
    >
      <Button>
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

  it("Toolbar renders the same row on a React Aria toolbar", () => {
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

  it("calls onAction from the menu item and injects it into the row button", async () => {
    const onAction = vi.fn()
    render(
      <Row width={1000}>
        <Item id="a" onAction={onAction} />
      </Row>
    )
    await userEvent.click(screen.getByRole("button", { name: "a" }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it("renders the menu item with icon, shortcut and destructive variant", async () => {
    const onAction = vi.fn()
    render(
      <Row width={10}>
        <Item
          id="del"
          label="Delete"
          icon={<svg data-testid="icon" />}
          shortcut="⌘⌫"
          variant="destructive"
          onAction={onAction}
        />
      </Row>
    )
    await userEvent.click(screen.getByRole("button", { name: "More actions" }))
    const item = await screen.findByRole("menuitem", { name: /Delete/ })
    expect(item).toHaveAttribute("data-variant", "destructive")
    expect(item).toContainElement(screen.getByTestId("icon"))
    expect(item).toHaveTextContent("⌘⌫")
    await userEvent.click(item)
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it("uses a custom overflow node in the menu", async () => {
    render(
      <Row width={10}>
        <Item
          id="a"
          overflow={<DropdownMenuItem id="a">Custom form</DropdownMenuItem>}
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
        <OverflowGroup id="edit" label="Edit" collapse="together">
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
    // divider stays before the trigger, never both.
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
    // b leaves too: the dividers around it would meet, so the second goes.
    at(250, ["b", "d"], [true, false, true])
    // c leaves: only the first divider, before the trigger, remains.
    at(140, ["b", "c", "d"], [true, false, false])
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

  it("throws when parts are used outside a row", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() =>
      render(
        <OverflowItem id="a">
          <button>x</button>
        </OverflowItem>
      )
    ).toThrow(/OverflowItem must be inside <Overflow> or <Toolbar>/)
    expect(() => render(<OverflowDivider />)).toThrow(/OverflowDivider/)
    expect(() => render(<OverflowMenu />)).toThrow(/OverflowMenu/)
    expect(() => render(<OverflowGroup id="g" />)).toThrow(/OverflowGroup/)
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
