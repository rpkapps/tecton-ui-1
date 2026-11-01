import * as React from "react"
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"
import { TectonProvider } from "@tecton/react/tecton/provider"
import {
  TreeView,
  TreeViewCollection,
  TreeViewItem,
  TreeViewItemContent,
} from "@tecton/react/tecton/tree-view"

import { ChipPrimitive } from "../internal/primitives/chip/index"
import { edgeKey, nextKey } from "../internal/primitives/navigation"
import { useSelection } from "../internal/primitives/selection"
import { buildTree, visibleRows } from "../internal/primitives/tree/collection"
import { TreePrimitive } from "../internal/primitives/tree/index"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useSelection", () => {
  const order = ["a", "b", "c", "d"]
  function setup(options: Partial<Parameters<typeof useSelection>[0]> = {}) {
    const onValueChange = vi.fn()
    const hook = renderHook(() =>
      useSelection({
        mode: "multiple",
        getOrder: () => order,
        onValueChange,
        ...options,
      })
    )
    const select = (
      ...args: Parameters<ReturnType<typeof useSelection>["select"]>
    ) =>
      act(() => {
        hook.result.current.select(...args)
      })
    return { hook, onValueChange, select }
  }

  it("toggles, and extends a range from the anchor", () => {
    const { hook, onValueChange, select } = setup()
    select("b")
    expect(onValueChange).toHaveBeenLastCalledWith(["b"], expect.anything())
    select("d", { range: true })
    expect(hook.result.current.selected).toEqual(new Set(["b", "c", "d"]))
    select("c")
    expect(hook.result.current.selected).toEqual(new Set(["b", "d"]))
  })

  it("replaces, and keeps the anchor across a controlled round trip", () => {
    const onValueChange = vi.fn()
    const { result, rerender } = renderHook(
      ({ value }: { value: Array<string> }) =>
        useSelection({
          mode: "multiple",
          behavior: "replace",
          value,
          onValueChange,
          getOrder: () => order,
        }),
      { initialProps: { value: [] as Array<string> } }
    )
    act(() => void result.current.select("b"))
    rerender({ value: ["b"] })
    act(() => void result.current.select("d", { range: true }))
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["b", "c", "d"],
      expect.anything()
    )
    rerender({ value: ["b", "c", "d"] })
    act(() => void result.current.select("a", { range: true }))
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["a", "b"],
      expect.anything()
    )
  })

  it("keeps one item with disallowEmptySelection and skips refused items", () => {
    const { hook, onValueChange, select } = setup({
      mode: "single",
      defaultValue: ["a"],
      disallowEmptySelection: true,
      isSelectable: (key) => key !== "c",
    })
    select("a")
    select("c")
    expect(onValueChange).not.toHaveBeenCalled()
    expect(hook.result.current.selected).toEqual(new Set(["a"]))
  })

  it("selects all through getAllKeys, and a canceled change is not applied", () => {
    const onValueChange = vi.fn((_value, details: { cancel: () => void }) =>
      details.cancel()
    )
    const { result } = renderHook(() =>
      useSelection({
        mode: "multiple",
        getOrder: () => ["a"],
        getAllKeys: () => order,
        onValueChange,
      })
    )
    act(() => result.current.selectAll())
    expect(onValueChange).toHaveBeenCalledWith(
      order,
      expect.objectContaining({ reason: "select-all", isCanceled: true })
    )
    expect(result.current.selected.size).toBe(0)
  })
})

describe("navigation", () => {
  const keys = ["a", "b", "c", "d"]
  const disabled = (key: string) => key === "b"

  it("steps over disabled keys and stops at the ends", () => {
    expect(nextKey(keys, "a", 1, disabled)).toBe("c")
    expect(nextKey(keys, "c", -1, disabled)).toBe("a")
    expect(nextKey(keys, "d", 1, disabled)).toBe("d")
    expect(nextKey(keys, "a", 3, disabled)).toBe("d")
    expect(edgeKey(keys, -1, (k) => k === "d")).toBe("c")
  })
})

describe("tree collection", () => {
  type Node = { id: string; children?: Array<Node> }
  const data: Array<Node> = [
    { id: "a", children: [{ id: "a1" }, { id: "a2" }] },
    { id: "b" },
  ]
  const renderNode = (node: Node) => (
    <TreeViewItem value={node.id} label={node.id.toUpperCase()}>
      <TreeViewItemContent kind={node.children ? "folder" : "item"}>
        {node.id}
      </TreeViewItemContent>
      <TreeViewCollection items={node.children ?? []}>
        {renderNode}
      </TreeViewCollection>
    </TreeViewItem>
  )

  it("reads rows from elements, collapsed ones included, and keeps unchanged nodes", () => {
    const children = (
      <TreeViewCollection items={data}>{renderNode}</TreeViewCollection>
    )
    const tree = buildTree(children)
    expect(tree.order).toEqual(["a", "a1", "a2", "b"])
    const a = tree.byValue.get("a")!
    expect(a).toMatchObject({
      level: 1,
      isFolder: true,
      textValue: "A",
      setSize: 2,
    })
    expect(tree.byValue.get("a2")).toMatchObject({
      level: 2,
      posInSet: 2,
      parent: "a",
    })
    expect(visibleRows(tree, new Set()).map((n) => n.value)).toEqual(["a", "b"])
    expect(visibleRows(tree, new Set(["a"])).map((n) => n.value)).toEqual([
      "a",
      "a1",
      "a2",
      "b",
    ])
    // The same items and render function: the same nodes.
    const again = buildTree(
      <TreeViewCollection items={data}>{renderNode}</TreeViewCollection>
    )
    expect(again.byValue.get("a")).toBe(a)
  })
})

describe("primitive parts", () => {
  it("render through `render`, `className` and `style` functions of the state, with the ref", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(
      <ChipPrimitive.Root
        aria-label="Tags"
        selectionMode="multiple"
        defaultValue={["a"]}
      >
        <ChipPrimitive.List>
          <ChipPrimitive.Chip
            ref={ref}
            value="a"
            textValue="Alpha"
            className={(state) => (state.selected ? "is-on" : "is-off")}
            style={(state) => ({ opacity: state.disabled ? 0.5 : 1 })}
            render={(props, state) => (
              <section {...props} data-state={state.selected ? "on" : "off"} />
            )}
          >
            Alpha
          </ChipPrimitive.Chip>
          <ChipPrimitive.Chip value="b" textValue="Beta" render={<article />}>
            Beta
          </ChipPrimitive.Chip>
        </ChipPrimitive.List>
      </ChipPrimitive.Root>
    )
    const alpha = screen.getByRole("row", { name: "Alpha" })
    expect(alpha.tagName).toBe("SECTION")
    expect(alpha).toBe(ref.current)
    expect(alpha).toHaveClass("is-on")
    expect(alpha).toHaveAttribute("data-state", "on")
    expect(alpha).toHaveAttribute("data-selected", "")
    expect(alpha.style.opacity).toBe("1")
    expect(screen.getByRole("row", { name: "Beta" }).tagName).toBe("ARTICLE")
  })

  it("throw outside their root", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() =>
      render(<ChipPrimitive.Chip value="a" textValue="A" />)
    ).toThrow(/ChipGroup/)
    expect(() => render(<TreePrimitive.Chevron />)).toThrow(/TreeView/)
  })

  it("let onValueChange cancel a change through its event details", async () => {
    render(
      <ChipPrimitive.Root
        aria-label="Tags"
        selectionMode="multiple"
        onValueChange={(_value, details) => details.cancel()}
      >
        <ChipPrimitive.List>
          <ChipPrimitive.Chip value="a" textValue="Alpha">
            Alpha
          </ChipPrimitive.Chip>
        </ChipPrimitive.List>
      </ChipPrimitive.Root>
    )
    await userEvent.click(screen.getByRole("row", { name: "Alpha" }))
    expect(screen.getByRole("row", { name: "Alpha" })).not.toHaveAttribute(
      "data-selected"
    )
  })
})

describe("announcements", () => {
  it("announce a selection made from the keyboard", async () => {
    const user = userEvent.setup()
    render(
      <TreeView aria-label="Project" selectionMode="multiple">
        <TreeViewItem value="wells" label="Wells">
          <TreeViewItemContent>Wells</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem value="notes" label="Notes">
          <TreeViewItemContent>Notes</TreeViewItemContent>
        </TreeViewItem>
      </TreeView>
    )
    await user.tab()
    await user.keyboard(" ")
    const region = () =>
      document.querySelector('[aria-live="polite"][data-slot="announcer"]')
    await waitFor(() => expect(region()).toHaveTextContent("Wells selected."))
    await user.keyboard("{Control>}a{/Control}")
    await waitFor(() =>
      expect(region()).toHaveTextContent("All items selected.")
    )
  })
})

describe("server rendering and StrictMode", () => {
  const tree = (props: Partial<React.ComponentProps<typeof TreeView>> = {}) => (
    <TectonProvider locale="de-DE">
      <TreeView
        aria-label="Project"
        defaultExpanded={["wells"]}
        onMove={() => {}}
        {...props}
      >
        <TreeViewItem value="wells" label="Wells">
          <TreeViewItemContent kind="folder">Wells</TreeViewItemContent>
          <TreeViewItem value="a12" label="A-12">
            <TreeViewItemContent>A-12</TreeViewItemContent>
          </TreeViewItem>
        </TreeViewItem>
      </TreeView>
      <ChipGroup aria-label="Tags" onRemove={() => {}}>
        <ChipList>
          <Chip value="a">Alpha</Chip>
        </ChipList>
      </ChipGroup>
    </TectonProvider>
  )

  it("renders on the server, virtualized too", () => {
    const html = renderToString(tree())
    expect(html).toContain('role="treegrid"')
    expect(html).toContain('aria-label="A-12"')
    // The server renders en-US: other locales load in the browser.
    expect(html).toContain('aria-label="Drag Wells"')
    expect(html).toContain('aria-label="Remove"')
    const virtual = renderToString(tree({ virtualized: true }))
    expect(virtual).toContain('aria-rowindex="2"')
  })

  it("works under StrictMode", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <React.StrictMode>
        {tree({ selectionMode: "single", onValueChange })}
      </React.StrictMode>
    )
    await user.tab()
    await user.keyboard("{ArrowDown} ")
    expect(onValueChange).toHaveBeenCalledWith(["a12"])
    await user.tab()
    expect(screen.getByRole("row", { name: "Alpha" })).toHaveFocus()
    await user.keyboard("{Delete}")
  })
})
