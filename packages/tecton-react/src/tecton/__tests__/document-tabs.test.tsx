import * as React from "react"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ContextMenuItem } from "@tecton/react/components/context-menu"
import { TectonProvider } from "@tecton/react/tecton/provider"
import {
  DocumentTabs,
  DocumentTabsAdd,
  DocumentTabsClose,
  DocumentTabsContent,
  DocumentTabsLabel,
  DocumentTabsList,
  DocumentTabsMenu,
  DocumentTabsMenuClose,
  DocumentTabsMore,
  DocumentTabsTrigger,
} from "@tecton/react/tecton/document-tabs"

/**
 * jsdom has no layout. Elements declare their width with `data-w` and their
 * inline start with `data-x`; the row's width is set by `resize`, and a
 * ResizeObserver reports only when a test resizes the row.
 */
const originalRect = Element.prototype.getBoundingClientRect

const observers = new Set<TestObserver>()
class TestObserver {
  targets = new Set<Element>()
  constructor(private callback: ResizeObserverCallback) {
    observers.add(this)
  }
  observe(target: Element) {
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
  report(target: Element) {
    this.callback([{ target } as unknown as ResizeObserverEntry], this)
  }
}

const rowEl = () =>
  document.querySelector<HTMLElement>('[data-slot="document-tabs-list"]')!

function resize(width: number) {
  rowEl().dataset.w = String(width)
  act(() => {
    for (const observer of [...observers])
      if (observer.targets.has(rowEl())) observer.report(rowEl())
  })
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", TestObserver)
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const element = this as HTMLElement
    // Tabs are 100 wide and laid out in DOM order unless they say otherwise.
    const slot = element.dataset.slot
    const fallback =
      slot === "document-tabs-trigger"
        ? 100
        : slot === "document-tabs-add" || slot === "document-tabs-more"
          ? 40
          : 0
    const width = Number(element.dataset.w ?? fallback)
    let left = Number(element.dataset.x ?? NaN)
    if (Number.isNaN(left) && slot === "document-tabs-trigger") {
      const siblings = Array.from(
        element.parentElement?.querySelectorAll(
          '[data-slot="document-tabs-trigger"]'
        ) ?? []
      )
      left = siblings.indexOf(element) * 100
    }
    left = Number.isNaN(left) ? 0 : left
    return {
      width,
      height: 40,
      top: 0,
      left,
      right: left + width,
      bottom: 40,
      x: left,
      y: 0,
      toJSON() {},
    }
  }
})

afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect
  observers.clear()
})

type Tab = { id: string; label: string; closable?: boolean; disabled?: boolean }

const WELLS: Array<Tab> = [
  { id: "w1", label: "Well-01" },
  { id: "w2", label: "Well-02" },
  { id: "w3", label: "Well-03" },
  { id: "w4", label: "Well-04" },
]

type StripProps = {
  initial?: Array<Tab>
  defaultValue?: string
  onValueChange?: (value: string) => void
  onClose?: (values: Array<string>) => void
  onRename?: (value: string, label: string) => void
  onReorder?: (values: Array<string>) => void
  onAdd?: () => void
  closable?: boolean
  renamable?: boolean
  reorderable?: boolean
  activateOnFocus?: boolean
  more?: React.ReactNode
  menu?: React.ReactNode
}

/** An application that owns its tabs, as the docs show. */
function Strip({
  initial = WELLS,
  defaultValue = "w1",
  closable = true,
  renamable = true,
  reorderable = true,
  activateOnFocus,
  more,
  menu,
  ...spies
}: StripProps) {
  const [tabs, setTabs] = React.useState(initial)
  const [value, setValue] = React.useState(defaultValue)
  return (
    <DocumentTabs
      value={value}
      onValueChange={(next) => {
        spies.onValueChange?.(next)
        setValue(next)
      }}
      onClose={
        closable
          ? (values) => {
              spies.onClose?.(values)
              setTabs((all) => all.filter((tab) => !values.includes(tab.id)))
            }
          : undefined
      }
      onRename={
        renamable
          ? (id, label) => {
              spies.onRename?.(id, label)
              setTabs((all) =>
                all.map((tab) => (tab.id === id ? { ...tab, label } : tab))
              )
            }
          : undefined
      }
      onReorder={
        reorderable
          ? (values) => {
              spies.onReorder?.(values)
              setTabs((all) =>
                values.map((id) => all.find((tab) => tab.id === id)!)
              )
            }
          : undefined
      }
    >
      <DocumentTabsList
        aria-label="Open wells"
        activateOnFocus={activateOnFocus}
      >
        {tabs.map((tab) => (
          <DocumentTabsTrigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
          >
            <DocumentTabsLabel>{tab.label}</DocumentTabsLabel>
            {tab.closable === false ? null : <DocumentTabsClose />}
          </DocumentTabsTrigger>
        ))}
        {more}
        {menu}
        {spies.onAdd ? <DocumentTabsAdd onClick={spies.onAdd} /> : null}
      </DocumentTabsList>
      {tabs.map((tab) => (
        <DocumentTabsContent key={tab.id} value={tab.id}>
          {tab.label} panel
        </DocumentTabsContent>
      ))}
    </DocumentTabs>
  )
}

const tabNames = () => screen.getAllByRole("tab").map((tab) => tab.textContent)

describe("DocumentTabs", () => {
  it("renders a tab list beside its add button", () => {
    render(<Strip onAdd={() => {}} />)
    const list = screen.getByRole("tablist", { name: "Open wells" })
    expect(within(list).getAllByRole("tab")).toHaveLength(4)
    // A tablist owns tabs only: the add button sits outside it.
    expect(list).not.toContainElement(
      screen.getByRole("button", { name: "New tab" })
    )
    expect(screen.getByRole("tab", { name: "Well-01" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(screen.getByText("Well-01 panel")).toBeVisible()
  })

  it("sets data-slot on every part and merges className", () => {
    render(
      <DocumentTabs defaultValue="a">
        <DocumentTabsList className="custom-list">
          <DocumentTabsTrigger value="a" className="custom-tab">
            <DocumentTabsLabel>A</DocumentTabsLabel>
          </DocumentTabsTrigger>
          <DocumentTabsAdd />
        </DocumentTabsList>
        <DocumentTabsContent value="a">A</DocumentTabsContent>
      </DocumentTabs>
    )
    for (const slot of [
      "document-tabs",
      "document-tabs-list",
      "document-tabs-tablist",
      "document-tabs-trigger",
      "document-tabs-tab",
      "document-tabs-label",
      "document-tabs-add",
      "document-tabs-content",
    ])
      expect(
        document.querySelector(`[data-slot="${slot}"]`),
        slot
      ).toBeInTheDocument()
    expect(rowEl()).toHaveClass("custom-list")
    expect(screen.getByRole("tab")).toHaveClass("custom-tab")
  })

  it("opens the first tab when uncontrolled without a default", () => {
    const onValueChange = vi.fn()
    render(
      <DocumentTabs onValueChange={onValueChange}>
        <DocumentTabsList>
          <DocumentTabsTrigger value="a">A</DocumentTabsTrigger>
          <DocumentTabsTrigger value="b">B</DocumentTabsTrigger>
        </DocumentTabsList>
      </DocumentTabs>
    )
    expect(screen.getByRole("tab", { name: "A" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(onValueChange).toHaveBeenCalledWith(
      "a",
      expect.objectContaining({ reason: "initial" })
    )
  })

  it("selects on click and moves with the arrow keys, Home and End", async () => {
    const user = userEvent.setup()
    render(<Strip />)
    await user.click(screen.getByRole("tab", { name: "Well-02" }))
    expect(screen.getByRole("tab", { name: "Well-02" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "Well-03" })).toHaveFocus()
    await user.keyboard("{End}")
    expect(screen.getByRole("tab", { name: "Well-04" })).toHaveFocus()
    await user.keyboard("{Home}")
    expect(screen.getByRole("tab", { name: "Well-01" })).toHaveFocus()
    expect(screen.getByRole("tab", { name: "Well-01" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  it("mirrors the arrow keys in RTL", async () => {
    const user = userEvent.setup()
    render(
      <TectonProvider direction="rtl">
        <Strip />
      </TectonProvider>
    )
    await user.click(screen.getByRole("tab", { name: "Well-01" }))
    await user.keyboard("{ArrowLeft}")
    expect(screen.getByRole("tab", { name: "Well-02" })).toHaveFocus()
  })

  describe("close", () => {
    it("closes with the × button, which is not a tab stop", async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<Strip onClose={onClose} />)
      const close = screen.getByRole("button", { name: "Close Well-02" })
      expect(close).toHaveAttribute("tabindex", "-1")
      // Beside the tab, not inside it.
      expect(screen.getByRole("tab", { name: "Well-02" })).not.toContainElement(
        close
      )
      await user.click(close)
      expect(onClose).toHaveBeenCalledWith(["w2"])
      expect(tabNames()).toEqual(["Well-01", "Well-03", "Well-04"])
    })

    it("closes the focused tab with Delete and opens its neighbour first", async () => {
      const user = userEvent.setup()
      const calls: Array<string> = []
      render(
        <Strip
          defaultValue="w2"
          onValueChange={(value) => calls.push(`select ${value}`)}
          onClose={(values) => calls.push(`close ${values.join()}`)}
        />
      )
      await user.click(screen.getByRole("tab", { name: "Well-02" }))
      await user.keyboard("{Delete}")
      expect(calls).toEqual(["select w3", "close w2"])
      expect(screen.getByRole("tab", { name: "Well-03" })).toHaveFocus()
      expect(screen.getByRole("tab", { name: "Well-03" })).toHaveAttribute(
        "aria-selected",
        "true"
      )
    })

    it("opens the previous tab when the last one closes", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<Strip defaultValue="w4" onValueChange={onValueChange} />)
      await user.click(screen.getByRole("button", { name: "Close Well-04" }))
      expect(onValueChange).toHaveBeenLastCalledWith("w3")
    })

    it("does not close a tab without a close button, or without onClose", async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      const { unmount } = render(
        <Strip
          onClose={onClose}
          initial={[
            { id: "w1", label: "Well-01", closable: false },
            ...WELLS.slice(1),
          ]}
        />
      )
      await user.click(screen.getByRole("tab", { name: "Well-01" }))
      await user.keyboard("{Delete}")
      expect(onClose).not.toHaveBeenCalled()
      unmount()

      render(<Strip closable={false} />)
      expect(
        screen.queryByRole("button", { name: /Close/ })
      ).not.toBeInTheDocument()
    })
  })

  describe("rename", () => {
    it("renames on double-click; Enter commits and returns focus", async () => {
      const user = userEvent.setup()
      const onRename = vi.fn()
      render(<Strip onRename={onRename} />)
      await user.dblClick(screen.getByRole("tab", { name: "Well-02" }))
      const field = screen.getByRole("textbox", { name: "Rename Well-02" })
      expect(field).toHaveFocus()
      await user.clear(field)
      // The arrow keys move the caret, not the focus between tabs.
      await user.type(field, "Discovery{ArrowLeft}{ArrowRight} 2{Enter}")
      expect(onRename).toHaveBeenCalledWith("w2", "Discovery 2")
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
      expect(screen.getByRole("tab", { name: "Discovery 2" })).toHaveFocus()
    })

    it("renames with F2; Escape cancels", async () => {
      const user = userEvent.setup()
      const onRename = vi.fn()
      render(<Strip onRename={onRename} />)
      await user.click(screen.getByRole("tab", { name: "Well-01" }))
      await user.keyboard("{F2}")
      await user.keyboard("Other{Escape}")
      expect(onRename).not.toHaveBeenCalled()
      expect(screen.getByRole("tab", { name: "Well-01" })).toHaveFocus()
    })

    it("commits on blur and ignores an empty or unchanged label", async () => {
      const user = userEvent.setup()
      const onRename = vi.fn()
      render(<Strip onRename={onRename} />)
      await user.dblClick(screen.getByRole("tab", { name: "Well-01" }))
      await user.clear(screen.getByRole("textbox"))
      await user.keyboard("   {Enter}")
      await user.dblClick(screen.getByRole("tab", { name: "Well-01" }))
      await user.keyboard("{Enter}")
      expect(onRename).not.toHaveBeenCalled()

      await user.dblClick(screen.getByRole("tab", { name: "Well-03" }))
      await user.keyboard("  Well-3B  ")
      await user.click(document.body)
      expect(onRename).toHaveBeenCalledWith("w3", "Well-3B")
    })

    it("does not rename without onRename", async () => {
      const user = userEvent.setup()
      render(<Strip renamable={false} />)
      await user.dblClick(screen.getByRole("tab", { name: "Well-01" }))
      await user.keyboard("{F2}")
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    })
  })

  describe("context menu", () => {
    it("renames, closes and closes the other tabs", async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<Strip onClose={onClose} />)

      fireEvent.contextMenu(screen.getByRole("tab", { name: "Well-02" }))
      await user.click(await screen.findByRole("menuitem", { name: "Rename" }))
      expect(
        await screen.findByRole("textbox", { name: "Rename Well-02" })
      ).toBeInTheDocument()
      await user.keyboard("{Escape}")

      fireEvent.contextMenu(screen.getByRole("tab", { name: "Well-02" }))
      await user.click(
        await screen.findByRole("menuitem", { name: "Close other tabs" })
      )
      expect(onClose).toHaveBeenLastCalledWith(["w1", "w3", "w4"])
      expect(tabNames()).toEqual(["Well-02"])

      fireEvent.contextMenu(screen.getByRole("tab", { name: "Well-02" }))
      await user.click(await screen.findByRole("menuitem", { name: "Close" }))
      expect(onClose).toHaveBeenLastCalledWith(["w2"])
    })

    it("neither focuses nor opens the tab it was opened on", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<Strip onValueChange={onValueChange} />)
      await user.click(screen.getByRole("tab", { name: "Well-01" }))
      onValueChange.mockClear()

      const target = screen.getByRole("tab", { name: "Well-03" })
      // The secondary press does not move focus to the tab.
      expect(fireEvent.mouseDown(target, { button: 2 })).toBe(false)
      fireEvent.contextMenu(target)
      expect(await screen.findByRole("menu")).toBeInTheDocument()
      await user.keyboard("{Escape}")
      await waitFor(() =>
        expect(screen.queryByRole("menu")).not.toBeInTheDocument()
      )
      expect(onValueChange).not.toHaveBeenCalled()
      expect(screen.getByRole("tab", { name: "Well-01" })).toHaveFocus()
      expect(target).toHaveAttribute("aria-selected", "false")
    })

    it("draws an icon and the shortcut on each default item", async () => {
      render(<Strip />)
      fireEvent.contextMenu(screen.getByRole("tab", { name: "Well-02" }))
      const items = await screen.findAllByRole("menuitem")
      expect(
        items.map((item) => item.getAttribute("aria-keyshortcuts"))
      ).toEqual(["F2", "Delete", "Shift+Delete"])
      for (const item of items)
        expect(item.querySelector("svg")).toBeInTheDocument()
      expect(
        items.map(
          (item) =>
            item.querySelector('[data-slot="context-menu-shortcut"]')
              ?.textContent
        )
      ).toEqual(["F2", "Del", "⇧Del"])
    })

    it("closes the other tabs with Shift+Delete", async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<Strip onClose={onClose} />)
      await user.click(screen.getByRole("tab", { name: "Well-03" }))
      await user.keyboard("{Shift>}{Delete}{/Shift}")
      expect(onClose).toHaveBeenCalledWith(["w1", "w2", "w4"])
      expect(tabNames()).toEqual(["Well-03"])
      expect(screen.getByRole("tab", { name: "Well-03" })).toHaveFocus()
    })

    it("takes items of its own, with the value of the tab it opened on", async () => {
      const user = userEvent.setup()
      const duplicate = vi.fn()
      render(
        <Strip
          menu={
            <DocumentTabsMenu className="custom-menu">
              {(value) => (
                <>
                  <ContextMenuItem onClick={() => duplicate(value)}>
                    Duplicate
                  </ContextMenuItem>
                  <DocumentTabsMenuClose
                    variant="destructive"
                    className="custom-close"
                  >
                    Close well
                  </DocumentTabsMenuClose>
                </>
              )}
            </DocumentTabsMenu>
          }
        />
      )
      fireEvent.contextMenu(screen.getByRole("tab", { name: "Well-03" }))
      const items = await screen.findAllByRole("menuitem")
      expect(items.map((item) => item.textContent)).toEqual([
        "Duplicate",
        "Close well",
      ])
      expect(
        document.querySelector('[data-slot="context-menu-content"]')
      ).toHaveClass("custom-menu")
      expect(items[1]).toHaveClass("custom-close")
      expect(items[1]).toHaveAttribute("data-variant", "destructive")
      // Custom children: no shortcut is announced that is not drawn.
      expect(items[1]).not.toHaveAttribute("aria-keyshortcuts")
      await user.click(items[0])
      expect(duplicate).toHaveBeenCalledWith("w3")
    })

    it("hides the items whose action is off, and turns off with disabled", async () => {
      const { unmount } = render(<Strip closable={false} />)
      fireEvent.contextMenu(screen.getByRole("tab", { name: "Well-02" }))
      const items = await screen.findAllByRole("menuitem")
      expect(items.map((item) => item.textContent)).toEqual(["RenameF2"])
      unmount()

      render(<Strip menu={<DocumentTabsMenu disabled />} />)
      fireEvent.contextMenu(screen.getByRole("tab", { name: "Well-02" }))
      expect(screen.queryByRole("menu")).not.toBeInTheDocument()
      expect(
        document.querySelector('[data-slot="context-menu-trigger"]')
      ).not.toBeInTheDocument()
    })
  })

  describe("reorder", () => {
    it("moves the focused tab with Ctrl+Shift+Arrow and announces it", async () => {
      const user = userEvent.setup()
      const onReorder = vi.fn()
      render(<Strip onReorder={onReorder} />)
      await user.click(screen.getByRole("tab", { name: "Well-01" }))
      await user.keyboard("{Control>}{Shift>}{ArrowRight}{/Shift}{/Control}")
      expect(onReorder).toHaveBeenCalledWith(["w2", "w1", "w3", "w4"])
      expect(tabNames()).toEqual(["Well-02", "Well-01", "Well-03", "Well-04"])
      expect(screen.getByRole("tab", { name: "Well-01" })).toHaveFocus()
      expect(
        document.querySelector('[data-slot="document-tabs-announcer"]')
      ).toHaveTextContent("Well-01 moved to position 2 of 4")

      // Already first: nothing to do.
      await user.keyboard("{Meta>}{Shift>}{ArrowLeft}{/Shift}{/Meta}")
      await user.keyboard("{Meta>}{Shift>}{ArrowLeft}{/Shift}{/Meta}")
      expect(onReorder).toHaveBeenCalledTimes(2)
      expect(tabNames()[0]).toBe("Well-01")
    })

    /** Lays the tabs out at these inline starts and widths, in DOM order. */
    function layout(boxes: Array<[x: number, w: number]>) {
      document
        .querySelectorAll<HTMLElement>('[data-slot="document-tabs-trigger"]')
        .forEach((wrapper, index) => {
          wrapper.dataset.x = String(boxes[index][0])
          wrapper.dataset.w = String(boxes[index][1])
        })
    }

    function drag(name: string, from: number, to: number) {
      const wrapper = screen
        .getByRole("tab", { name })
        .closest<HTMLElement>('[data-slot="document-tabs-trigger"]')!
      fireEvent.pointerDown(wrapper, { button: 0, pointerId: 1, clientX: from })
      fireEvent.pointerMove(document, { pointerId: 1, clientX: from + 2 })
      expect(wrapper).not.toHaveAttribute("data-dragging")
      fireEvent.pointerMove(document, { pointerId: 1, clientX: to })
      expect(wrapper).toHaveAttribute("data-dragging")
      const transform = wrapper.style.transform
      fireEvent.pointerUp(document, { pointerId: 1, clientX: to })
      expect(wrapper.style.transform).toBe("")
      return transform
    }

    it("reorders once the dragged tab's edge passes a neighbour's middle", () => {
      const onReorder = vi.fn()
      render(<Strip onReorder={onReorder} />)
      // Trailing edge at 100 + 40 = 140: short of Well-02's middle (150).
      drag("Well-01", 50, 90)
      expect(onReorder).not.toHaveBeenCalled()
      // Trailing edge at 160: past it.
      expect(drag("Well-01", 50, 110)).toBe("translateX(60px)")
      expect(onReorder).toHaveBeenCalledWith(["w2", "w1", "w3", "w4"])
    })

    it("reaches the first slot from a tab narrower than the first one", () => {
      const onReorder = vi.fn()
      render(<Strip onReorder={onReorder} />)
      layout([
        [0, 300],
        [300, 100],
        [400, 100],
        [500, 100],
      ])
      drag("Well-03", 450, 0)
      expect(onReorder).toHaveBeenCalledWith(["w3", "w1", "w2", "w4"])
    })

    it("reaches the first slot from a tab wider than the first one", () => {
      const onReorder = vi.fn()
      render(<Strip onReorder={onReorder} />)
      layout([
        [0, 100],
        [100, 100],
        [200, 300],
        [500, 100],
      ])
      // Clamped at the start of the strip.
      expect(drag("Well-03", 350, 0)).toBe("translateX(-200px)")
      expect(onReorder).toHaveBeenCalledWith(["w3", "w1", "w2", "w4"])
    })

    it("reaches the last slot from a wide tab", () => {
      const onReorder = vi.fn()
      render(<Strip onReorder={onReorder} />)
      layout([
        [0, 300],
        [300, 100],
        [400, 100],
        [500, 100],
      ])
      expect(drag("Well-01", 150, 1000)).toBe("translateX(300px)")
      expect(onReorder).toHaveBeenCalledWith(["w2", "w3", "w4", "w1"])
    })

    it("drags in the reading direction in RTL", () => {
      const onReorder = vi.fn()
      render(
        <TectonProvider direction="rtl">
          <Strip onReorder={onReorder} />
        </TectonProvider>
      )
      // Right to left: Well-01 is rightmost, the wide Well-04 leftmost.
      layout([
        [500, 100],
        [400, 100],
        [300, 100],
        [0, 300],
      ])
      expect(drag("Well-04", 150, 1000)).toBe("translateX(300px)")
      expect(onReorder).toHaveBeenCalledWith(["w4", "w1", "w2", "w3"])
    })

    it("does not reorder without onReorder", async () => {
      const user = userEvent.setup()
      render(<Strip reorderable={false} />)
      await user.click(screen.getByRole("tab", { name: "Well-01" }))
      await user.keyboard("{Control>}{Shift>}{ArrowRight}{/Shift}{/Control}")
      expect(tabNames()[0]).toBe("Well-01")
    })
  })

  describe("overflow", () => {
    it("moves the trailing tabs into the More menu and keeps the open tab", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(
        <Strip
          defaultValue="w4"
          onValueChange={onValueChange}
          onAdd={() => {}}
        />
      )
      expect(
        screen.queryByRole("button", { name: /More tabs/ })
      ).not.toBeInTheDocument()

      // 290 - add 40 - more 40 = 210: the open tab and one more.
      resize(290)
      const overflowing = () =>
        Array.from(
          document.querySelectorAll<HTMLElement>("[data-overflowing]")
        ).map((element) => element.dataset.value)
      expect(overflowing()).toEqual(["w2", "w3"])
      const more = screen.getByRole("button", { name: "More tabs (2)" })
      expect(tabNames()).toEqual(["Well-01", "Well-04"])

      await user.click(more)
      const items = await screen.findAllByRole("menuitem")
      expect(items.map((item) => item.textContent)).toEqual([
        "Well-02",
        "Well-03",
      ])
      await user.click(items[1])
      expect(onValueChange).toHaveBeenLastCalledWith("w3")
      expect(overflowing()).toEqual(["w2", "w4"])
      expect(screen.getByRole("tab", { name: "Well-03" })).toHaveFocus()

      resize(1000)
      expect(overflowing()).toEqual([])
    })

    it("skips the hidden tabs with the arrow keys", async () => {
      const user = userEvent.setup()
      render(<Strip />)
      resize(250)
      await user.click(screen.getByRole("tab", { name: "Well-01" }))
      await user.keyboard("{ArrowRight}")
      expect(screen.getByRole("tab", { name: "Well-02" })).toHaveFocus()
      await user.keyboard("{ArrowRight}")
      // Well-03 and Well-04 are in the menu; focus wraps around.
      expect(screen.getByRole("tab", { name: "Well-01" })).toHaveFocus()
    })

    it("shrinks the open tab when even alone it does not fit", () => {
      render(<Strip />)
      const wrapper = (value: string) =>
        document.querySelector(`[data-value="${value}"]`)
      resize(120)
      expect(wrapper("w1")).toHaveAttribute("data-squeezed")
      expect(wrapper("w1")).not.toHaveAttribute("data-overflowing")
      // Its own width is remembered, so a wider row stops squeezing it.
      resize(1000)
      expect(wrapper("w1")).not.toHaveAttribute("data-squeezed")
    })

    it("renders no close button in a tab that is in the menu", () => {
      render(<Strip />)
      resize(250)
      expect(
        screen.getByRole("button", { name: "Close Well-01" })
      ).toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: "Close Well-03", hidden: true })
      ).not.toBeInTheDocument()
    })

    it("takes a custom More trigger", () => {
      render(<Strip more={<DocumentTabsMore aria-label="Hidden wells" />} />)
      resize(250)
      expect(
        screen.getByRole("button", { name: "Hidden wells (2)" })
      ).toBeInTheDocument()
    })
  })

  it("renders only the tabs a rename or an overflow concerns", async () => {
    const user = userEvent.setup()
    const renders = new Map<string, number>()
    const count = (id: string) => renders.set(id, (renders.get(id) ?? 0) + 1)
    // Uncontrolled, so nothing above the strip renders again.
    render(
      <DocumentTabs defaultValue="w1" onRename={() => {}}>
        <DocumentTabsList>
          {WELLS.map((well) => (
            <React.Profiler key={well.id} id={well.id} onRender={count}>
              <DocumentTabsTrigger value={well.id}>
                <DocumentTabsLabel>{well.label}</DocumentTabsLabel>
              </DocumentTabsTrigger>
            </React.Profiler>
          ))}
        </DocumentTabsList>
      </DocumentTabs>
    )
    act(() => screen.getByRole("tab", { name: "Well-01" }).focus())
    renders.clear()
    await user.keyboard("{F2}")
    await user.keyboard("{Escape}")
    expect([...renders.keys()]).toEqual(["w1"])

    renders.clear()
    resize(250)
    // Well-03 and Well-04 move into the menu; Well-01 and Well-02 stay put.
    expect([...renders.keys()].sort()).toEqual(["w3", "w4"])
  })

  it("hides a leaving panel at once", () => {
    render(<Strip />)
    expect(screen.getByRole("tabpanel")).toHaveClass("data-ending-style:hidden")
  })

  it("shares one size observer and one context menu across its tabs", () => {
    const many = Array.from({ length: 50 }, (_, index) => ({
      id: `t${index}`,
      label: `Tab ${index}`,
    }))
    render(<Strip initial={many} defaultValue="t0" />)
    // (The tab list keeps an observer of its own for its indicator.)
    const ours = [...observers].filter((observer) =>
      observer.targets.has(rowEl())
    )
    expect(ours).toHaveLength(1)
    const [observer] = ours
    // The row and every tab.
    expect(observer.targets.size).toBe(51)
    expect(
      document.querySelectorAll('[data-slot="context-menu-trigger"]')
    ).toHaveLength(1)
  })

  it("calls the add button's onClick", async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<Strip onAdd={onAdd} />)
    await user.click(screen.getByRole("button", { name: "New tab" }))
    expect(onAdd).toHaveBeenCalledOnce()
  })

  it("translates its words through messages", () => {
    render(
      <DocumentTabs
        defaultValue="a"
        onClose={() => {}}
        messages={{ close: "Fermer", add: "Nouvel onglet" }}
      >
        <DocumentTabsList>
          <DocumentTabsTrigger value="a">
            <DocumentTabsLabel>Puits</DocumentTabsLabel>
            <DocumentTabsClose />
          </DocumentTabsTrigger>
          <DocumentTabsAdd />
        </DocumentTabsList>
      </DocumentTabs>
    )
    expect(
      screen.getByRole("button", { name: "Fermer Puits" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Nouvel onglet" })
    ).toBeInTheDocument()
  })
})
