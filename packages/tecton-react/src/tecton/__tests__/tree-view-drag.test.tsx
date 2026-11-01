import * as React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  moveTreeItems,
  TreeView,
  TreeViewCollection,
  TreeViewItem,
  TreeViewItemContent,
} from "@tecton/react/tecton/tree-view"

/**
 * Pointer and screen reader drags. jsdom has no layout: rows are laid out
 * here 32 px tall, 33 px apart, in DOM order, across 300 px.
 */
const ROW = 33
const originalRect = Element.prototype.getBoundingClientRect
const rows = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[role="row"][data-value]'))

beforeEach(() => {
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const index = rows().indexOf(this as HTMLElement)
    const top = index < 0 ? 0 : index * ROW
    const height = index < 0 ? 400 : 32
    return {
      top,
      bottom: top + height,
      left: 0,
      right: 300,
      width: 300,
      height,
      x: 0,
      y: top,
      toJSON() {},
    }
  }
  document.elementsFromPoint = (_x: number, y: number) =>
    rows().filter((row) => {
      const rect = row.getBoundingClientRect()
      return y >= rect.top && y < rect.bottom
    })
})

afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect
  // @ts-expect-error -- jsdom has none; set per test
  delete document.elementsFromPoint
})

function Movable(props: Partial<React.ComponentProps<typeof TreeView>>) {
  return (
    <TreeView aria-label="Project" defaultExpanded={["wells"]} {...props}>
      <TreeViewItem value="wells" label="Wells">
        <TreeViewItemContent kind="folder">Wells</TreeViewItemContent>
        <TreeViewItem value="a12" label="A-12">
          <TreeViewItemContent>A-12</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem value="a13" label="A-13">
          <TreeViewItemContent>A-13</TreeViewItemContent>
        </TreeViewItem>
      </TreeViewItem>
      <TreeViewItem value="notes" label="Notes">
        <TreeViewItemContent>Notes</TreeViewItemContent>
      </TreeViewItem>
      <TreeViewItem value="archive" label="Archive">
        <TreeViewItemContent kind="folder">Archive</TreeViewItemContent>
      </TreeViewItem>
    </TreeView>
  )
}

const row = (name: string) => screen.getByRole("row", { name })
/** The vertical middle of visible row `index`, and a y `offset` px into it. */
const yOf = (index: number, offset = 16) => index * ROW + offset

function press(name: string, y: number, pointerType = "mouse") {
  fireEvent.pointerDown(row(name), {
    button: 0,
    pointerId: 1,
    pointerType,
    clientX: 150,
    clientY: y,
  })
}
const moveTo = (x: number, y: number) =>
  fireEvent.pointerMove(document, { pointerId: 1, clientX: x, clientY: y })
const release = (x: number, y: number) =>
  fireEvent.pointerUp(document, { pointerId: 1, clientX: x, clientY: y })

describe("TreeView pointer drag", () => {
  it("drops a row inside a folder held under the pointer", () => {
    const onMove = vi.fn()
    render(<Movable onMove={onMove} />)
    press("Notes", yOf(3))
    moveTo(150, yOf(3) + 2)
    expect(row("Notes")).not.toHaveAttribute("data-dragging")
    moveTo(150, yOf(4))
    expect(row("Notes")).toHaveAttribute("data-dragging", "")
    expect(row("Archive")).toHaveAttribute("data-drop-target", "")
    // A copy follows the pointer, hidden from assistive technology.
    expect(
      document.body.querySelector('[aria-hidden="true"][inert]')
    ).not.toBeNull()
    release(150, yOf(4))
    expect(onMove).toHaveBeenCalledWith({
      values: ["notes"],
      target: "archive",
      position: "inside",
    })
    expect(row("Notes")).not.toHaveAttribute("data-dragging")
    expect(row("Archive")).not.toHaveAttribute("data-drop-target")
    expect(document.body.querySelector("[inert]")).toBeNull()
  })

  it("drops between rows, at the depth the pointer is across the row", () => {
    const onMove = vi.fn()
    render(<Movable onMove={onMove} />)
    press("Notes", yOf(3))
    // The top edge of A-13 (a gap inside Wells), under the level 2 chevron.
    moveTo(55, yOf(2, 2))
    const line = document.querySelector<HTMLElement>(
      '[data-slot="tree-view-drop-indicator"]'
    )!
    expect(line).not.toHaveAttribute("hidden")
    expect(line.style.getPropertyValue("--tree-drop-level")).toBe("2")
    release(55, yOf(2, 2))
    expect(onMove).toHaveBeenLastCalledWith({
      values: ["notes"],
      target: "a13",
      position: "before",
    })

    // The bottom of A-13 (the end of Wells): at the top level towards the
    // tree's start, at A-13's level under its chevron.
    press("Archive", yOf(4))
    moveTo(5, yOf(2, 30))
    release(5, yOf(2, 30))
    expect(onMove).toHaveBeenLastCalledWith({
      values: ["archive"],
      target: "notes",
      position: "before",
    })
    press("Archive", yOf(4))
    moveTo(55, yOf(2, 30))
    release(55, yOf(2, 30))
    expect(onMove).toHaveBeenLastCalledWith({
      values: ["archive"],
      target: "a13",
      position: "after",
    })
  })

  it("moves the whole selection when a selected row is dragged", () => {
    const onMove = vi.fn()
    render(
      <Movable
        onMove={onMove}
        selectionMode="multiple"
        defaultValue={["notes", "a12"]}
      />
    )
    press("Notes", yOf(3))
    moveTo(150, yOf(4))
    release(150, yOf(4))
    expect(onMove).toHaveBeenCalledWith({
      values: ["a12", "notes"],
      target: "archive",
      position: "inside",
    })
  })

  it("cancels with Escape and refuses drops into the dragged rows", () => {
    const onMove = vi.fn()
    render(<Movable onMove={onMove} />)
    press("Wells", yOf(0))
    // Over A-12, inside the dragged Wells: nowhere to drop.
    moveTo(150, yOf(1))
    expect(
      document.querySelector('[data-slot="tree-view-drop-indicator"]')
    ).toHaveAttribute("hidden")
    moveTo(150, yOf(4))
    fireEvent.keyDown(document, { key: "Escape" })
    expect(row("Wells")).not.toHaveAttribute("data-dragging")
    release(150, yOf(4))
    expect(onMove).not.toHaveBeenCalled()
  })

  it("waits for a long press before a finger drags a row", () => {
    vi.useFakeTimers()
    try {
      const onMove = vi.fn()
      render(<Movable onMove={onMove} />)
      // A finger that moves at once scrolls.
      press("Notes", yOf(3), "touch")
      moveTo(150, yOf(4))
      expect(row("Notes")).not.toHaveAttribute("data-dragging")
      release(150, yOf(4))

      press("Notes", yOf(3), "touch")
      act(() => vi.advanceTimersByTime(500))
      expect(row("Notes")).toHaveAttribute("data-dragging", "")
      moveTo(150, yOf(4))
      release(150, yOf(4))
      expect(onMove).toHaveBeenCalledWith(
        expect.objectContaining({ target: "archive", position: "inside" })
      )
    } finally {
      // Lets the drop's click guard expire.
      vi.runOnlyPendingTimers()
      vi.useRealTimers()
    }
  })
})

describe("TreeView keyboard and screen reader drag", () => {
  it("steps through the drop targets with Tab too, and announces the drag", async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()
    render(<Movable onMove={onMove} />)
    act(() => row("Notes").focus())
    await user.keyboard("{ArrowRight}{Enter}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert between Notes and Archive"
    )
    await user.keyboard("{Tab}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Drop on Archive"
    )
    await waitFor(() =>
      expect(
        document.querySelector('[aria-live="assertive"]')
      ).toHaveTextContent(/^Started dragging/)
    )
    await user.keyboard("{Enter}")
    expect(onMove).toHaveBeenCalledWith({
      values: ["notes"],
      target: "archive",
      position: "inside",
    })
    await waitFor(() =>
      expect(
        document.querySelector('[aria-live="assertive"]')
      ).toHaveTextContent("Drop complete.")
    )
    // The move was not applied: the row is where it was, and has focus.
    await waitFor(() => expect(row("Notes")).toHaveFocus())
  })

  it("focuses the closed folder a row was dropped into", async () => {
    type Node = { id: string; children?: Array<Node> }
    const renderNode = (node: Node) => (
      <TreeViewItem value={node.id} label={node.id}>
        <TreeViewItemContent kind={node.children ? "folder" : "item"}>
          {node.id}
        </TreeViewItemContent>
        <TreeViewCollection items={node.children ?? []}>
          {renderNode}
        </TreeViewCollection>
      </TreeViewItem>
    )
    function Data() {
      const [items, setItems] = React.useState<Array<Node>>([
        { id: "notes" },
        { id: "archive", children: [{ id: "old" }] },
      ])
      return (
        <TreeView
          aria-label="Data"
          items={items}
          onMove={(move) => setItems((current) => moveTreeItems(current, move))}
        >
          {renderNode}
        </TreeView>
      )
    }
    const user = userEvent.setup()
    render(<Data />)
    act(() => row("notes").focus())
    await user.keyboard("{ArrowRight}{Enter}")
    while (
      document.activeElement?.getAttribute("aria-label") !== "Drop on archive"
    )
      await user.keyboard("{ArrowDown}")
    await user.keyboard("{Enter}")
    expect(screen.queryByRole("row", { name: "notes" })).toBeNull()
    await waitFor(() => expect(row("archive")).toHaveFocus())
  })

  it("opens the aimed folder with the arrow key across", async () => {
    const user = userEvent.setup()
    render(<Movable onMove={() => {}} defaultExpanded={[]} />)
    act(() => row("Notes").focus())
    await user.keyboard("{ArrowRight}{Enter}")
    // Notes, Archive: "Insert between Notes and Archive", then into Archive.
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Drop on Archive"
    )
    await user.keyboard("{ArrowUp}{ArrowUp}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Drop on Wells"
    )
    await user.keyboard("{ArrowRight}")
    expect(row("Wells")).toHaveAttribute("aria-expanded", "true")
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toHaveAttribute(
      "aria-label",
      "Insert before A-12"
    )
    await user.keyboard("{Escape}")
    // Focus goes back to the grip.
    await waitFor(() =>
      expect(document.activeElement).toHaveAttribute("aria-label", "Drag Notes")
    )
  })

  it("offers every drop target as a button to a screen reader on a touch screen", async () => {
    const onMove = vi.fn()
    render(<Movable onMove={onMove} />)
    // A screen reader's activation: a click with no detail.
    fireEvent.click(screen.getByRole("button", { name: "Drag Notes" }), {
      detail: 0,
    })
    const targets = screen
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label"))
      .filter((label) => /^(Drop|Insert)/.test(label ?? ""))
    expect(targets).toContain("Drop on Archive")
    expect(targets).toContain("Drop on Wells")
    expect(targets).not.toContain("Drop on Notes")
    await userEvent.click(screen.getByRole("button", { name: "Drop on Wells" }))
    expect(onMove).toHaveBeenCalledWith({
      values: ["notes"],
      target: "wells",
      position: "inside",
    })
    expect(screen.queryByRole("button", { name: "Drop on Archive" })).toBeNull()
  })
})

describe("TreeView drop animation", () => {
  // jsdom has no Web Animations: record the calls instead.
  const animate = vi.fn(function (this: Element) {
    return {
      finished: new Promise(() => {}),
      cancel() {},
    } as unknown as Animation
  })
  beforeEach(() => {
    animate.mockClear()
    Element.prototype.animate = animate
  })
  afterEach(() => {
    delete (Element.prototype as { animate?: unknown }).animate
  })

  function Ordered(props: Partial<React.ComponentProps<typeof TreeView>>) {
    const [order, setOrder] = React.useState(["a", "b", "c"])
    return (
      <TreeView
        aria-label="Project"
        onMove={({ values, target, position }) =>
          setOrder((current) => {
            const rest = current.filter((value) => !values.includes(value))
            const at = rest.indexOf(target) + (position === "after" ? 1 : 0)
            return [...rest.slice(0, at), ...values, ...rest.slice(at)]
          })
        }
        {...props}
      >
        {order.map((value) => (
          <TreeViewItem key={value} value={value} label={value}>
            <TreeViewItemContent>{value}</TreeViewItemContent>
          </TreeViewItem>
        ))}
      </TreeView>
    )
  }

  /** The translate each row animated from, by its name. */
  const slides = () =>
    new Map(
      animate.mock.calls.flatMap((call, at) => {
        const [keyframes] = call as unknown as [Array<Keyframe>]
        const from = keyframes[0]?.translate
        const element = animate.mock.contexts[at]
        return from === undefined
          ? []
          : [[element.getAttribute("data-value"), String(from)] as const]
      })
    )

  function dropFirstRowLast(props: { dropAnimation?: boolean } = {}) {
    render(<Ordered {...props} />)
    press("a", yOf(0))
    moveTo(150, yOf(2, 30))
    release(150, yOf(2, 30))
    expect(rows().map((r) => r.dataset.value)).toEqual(["b", "c", "a"])
  }

  it("slides the rows that moved, and the dropped one from where it was let go", () => {
    dropFirstRowLast()
    // The preview was let go at the page's top (jsdom draws it there).
    expect(slides()).toEqual(
      new Map([
        ["b", `0px ${ROW}px`],
        ["c", `0px ${ROW}px`],
        ["a", `0px ${-2 * ROW}px`],
      ])
    )
  })

  it("does not animate with dropAnimation={false}", () => {
    dropFirstRowLast({ dropAnimation: false })
    expect(animate).not.toHaveBeenCalled()
  })
})
