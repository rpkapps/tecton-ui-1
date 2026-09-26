import * as React from "react"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { TectonProvider } from "@tecton/react/tecton/provider"
import {
  TreeView,
  TreeViewAction,
  TreeViewCollection,
  TreeViewItem,
  TreeViewItemContent,
  TreeViewVisibilityToggle,
} from "@tecton/react/tecton/tree-view"

function Project(props: Partial<React.ComponentProps<typeof TreeView>>) {
  return (
    <TreeView aria-label="Project" {...props}>
      <TreeViewItem value="wells" textValue="Wells">
        <TreeViewItemContent kind="folder">Wells</TreeViewItemContent>
        <TreeViewItem value="a12" textValue="A-12">
          <TreeViewItemContent>A-12</TreeViewItemContent>
        </TreeViewItem>
      </TreeViewItem>
      <TreeViewItem value="notes" textValue="Notes" hidden>
        <TreeViewItemContent
          colorTag={<span data-testid="tag" />}
          suffix={<span data-testid="suffix">3</span>}
          endAdornment={<span data-testid="end" />}
        >
          Notes
        </TreeViewItemContent>
      </TreeViewItem>
    </TreeView>
  )
}

const row = (name: string | RegExp) => screen.getByRole("row", { name })

describe("TreeView", () => {
  it("renders a tree with collapsed folders", () => {
    render(<Project />)
    const tree = screen.getByRole("treegrid", { name: "Project" })
    expect(tree).toHaveAttribute("data-slot", "tree-view")
    expect(row("Wells")).toHaveAttribute("aria-expanded", "false")
    expect(row("Wells")).not.toHaveAttribute("data-expanded")
    expect(screen.queryByRole("row", { name: "A-12" })).toBeNull()
  })

  it("expands a folder from its chevron and swaps the folder icon", async () => {
    const { container } = render(<Project />)
    const wells = row("Wells")
    const chevron = wells.querySelector(
      '[data-slot="tree-view-chevron"]'
    ) as HTMLElement
    expect(chevron).not.toHaveClass("invisible")
    expect(chevron.querySelector("svg")).not.toHaveClass("rotate-90")
    const iconBefore = wells.querySelector(
      '[data-slot="tree-view-icon"] svg'
    )?.outerHTML

    await userEvent.click(chevron)

    expect(wells).toHaveAttribute("aria-expanded", "true")
    expect(wells).toHaveAttribute("data-expanded", "")
    expect(chevron.querySelector("svg")).toHaveClass("rotate-90")
    expect(row("A-12")).toBeInTheDocument()
    expect(
      wells.querySelector('[data-slot="tree-view-icon"] svg')?.outerHTML
    ).not.toBe(iconBefore)
    // Nested rows are indented by level.
    const child = container.querySelector(
      '[data-slot="tree-view-item"][data-level="2"] [data-slot="tree-view-item-content"]'
    ) as HTMLElement
    expect(child.style.paddingInlineStart).toBe("1.5rem")
  })

  it("hides the chevron on leaf rows and shows a dot instead of a folder", () => {
    render(<Project />)
    const notes = row(/Notes/)
    const chevron = notes.querySelector('[data-slot="tree-view-chevron"]')
    // The chevron button drops `aria-hidden`, so it is hidden visually only.
    expect(chevron).toHaveClass("invisible")
    const content = notes.querySelector('[data-slot="tree-view-item-content"]')
    expect(content).toHaveAttribute("data-kind", "item")
    expect(
      content?.querySelector('[data-slot="tree-view-icon"] svg')
    ).toBeNull()
    expect(
      content?.querySelector('[data-slot="tree-view-icon"] span')
    ).toHaveClass("rounded-full")
  })

  it("renders colour tag, suffix and end adornment", () => {
    render(<Project />)
    const notes = row(/Notes/)
    expect(
      notes.querySelector('[data-slot="tree-view-color-tag"]')
    ).toContainElement(screen.getByTestId("tag"))
    expect(
      notes.querySelector('[data-slot="tree-view-suffix"]')
    ).toContainElement(screen.getByTestId("suffix"))
    expect(notes.querySelector('[data-slot="tree-view-end"]')).toContainElement(
      screen.getByTestId("end")
    )
    expect(
      notes.querySelector('[data-slot="tree-view-label"]')
    ).toHaveTextContent("Notes")
  })

  it("marks hidden rows with a presence attribute and keeps them visible", () => {
    render(<Project />)
    const notes = row(/Notes/)
    expect(notes).toHaveAttribute("data-hidden", "")
    expect(notes).not.toHaveAttribute("hidden")
    expect(notes).toBeVisible()
    expect(row("Wells")).not.toHaveAttribute("data-hidden")
  })

  it("uses a custom icon over the kind icon", () => {
    render(
      <TreeView aria-label="t">
        <TreeViewItem value="x" textValue="x">
          <TreeViewItemContent kind="folder" icon={<i data-testid="custom" />}>
            x
          </TreeViewItemContent>
        </TreeViewItem>
      </TreeView>
    )
    expect(
      screen.getByRole("row").querySelector('[data-slot="tree-view-icon"]')
    ).toContainElement(screen.getByTestId("custom"))
  })

  it("exposes only presence state attributes, never hover, press or focus ones", async () => {
    render(<Project selectionMode="single" />)
    const wells = row("Wells")
    await userEvent.hover(wells)
    await userEvent.click(wells)
    await userEvent.keyboard("{ArrowDown}")
    const elements = [
      screen.getByRole("treegrid"),
      ...screen.getAllByRole("row"),
      ...screen.getAllByRole("treegrid")[0].querySelectorAll("button"),
    ]
    for (const element of elements) {
      for (const name of [
        "data-rac",
        "data-hovered",
        "data-pressed",
        "data-focused",
        "data-focus-visible",
        "data-selection-mode",
        "data-has-child-items",
      ]) {
        expect(element).not.toHaveAttribute(name)
      }
      for (const name of ["data-selected", "data-expanded", "data-disabled"]) {
        if (element.hasAttribute(name)) {
          expect(element.getAttribute(name)).toBe("")
        }
      }
    }
    expect(wells).toHaveAttribute("data-selected", "")
    expect(wells.className).toContain("hover:bg-accent/60")
    expect(wells.className).toContain("focus-visible:ring-2")
    expect(wells.className).not.toMatch(/data-(hovered|pressed|focus-visible)/)
  })

  it("infers textValue from plain-text content", async () => {
    render(
      <TreeView aria-label="t">
        <TreeViewItem value="alpha">
          <TreeViewItemContent>Alpha</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem value="beta">
          <TreeViewItemContent suffix={<span>9</span>}>
            Beta
          </TreeViewItemContent>
        </TreeViewItem>
      </TreeView>
    )
    await userEvent.tab()
    expect(row(/Alpha/)).toHaveFocus()
    await userEvent.keyboard("b")
    expect(row(/Beta/)).toHaveFocus()
  })
})

describe("TreeView selection", () => {
  it("selects rows (uncontrolled) and reports the values", async () => {
    const onValueChange = vi.fn()
    render(<Project selectionMode="single" onValueChange={onValueChange} />)
    await userEvent.click(row("Wells"))
    expect(row("Wells")).toHaveAttribute("data-selected", "")
    expect(row("Wells")).toHaveAttribute("aria-selected", "true")
    expect(onValueChange).toHaveBeenLastCalledWith(["wells"])
    await userEvent.click(row(/Notes/))
    expect(onValueChange).toHaveBeenLastCalledWith(["notes"])
    expect(row("Wells")).not.toHaveAttribute("data-selected")
  })

  it("starts from defaultValue", () => {
    render(<Project selectionMode="multiple" defaultValue={["notes"]} />)
    expect(row(/Notes/)).toHaveAttribute("data-selected", "")
    expect(row("Wells")).not.toHaveAttribute("data-selected")
  })

  it("follows a controlled value", async () => {
    const onValueChange = vi.fn()
    const { rerender } = render(
      <Project
        selectionMode="multiple"
        value={["wells"]}
        onValueChange={onValueChange}
      />
    )
    expect(row("Wells")).toHaveAttribute("data-selected", "")
    await userEvent.click(row(/Notes/))
    expect(onValueChange).toHaveBeenLastCalledWith(["wells", "notes"])
    // Not applied until the owner passes it back.
    expect(row(/Notes/)).not.toHaveAttribute("data-selected")
    rerender(
      <Project
        selectionMode="multiple"
        value={["notes"]}
        onValueChange={onValueChange}
      />
    )
    expect(row(/Notes/)).toHaveAttribute("data-selected", "")
    expect(row("Wells")).not.toHaveAttribute("data-selected")
  })

  it("lists every selectable row on select all, collapsed and nested ones too", async () => {
    const onValueChange = vi.fn()
    render(
      <TreeView
        aria-label="Project"
        selectionMode="multiple"
        onValueChange={onValueChange}
      >
        <TreeViewItem value="wells">
          <TreeViewItemContent>Wells</TreeViewItemContent>
          <TreeViewItem value="a12">
            <TreeViewItemContent>A-12</TreeViewItemContent>
          </TreeViewItem>
          <TreeViewItem value="a13" disabled>
            <TreeViewItemContent>A-13</TreeViewItemContent>
          </TreeViewItem>
        </TreeViewItem>
        <TreeViewItem value="notes">
          <TreeViewItemContent>Notes</TreeViewItemContent>
        </TreeViewItem>
      </TreeView>
    )
    await userEvent.tab()
    await userEvent.keyboard("{Control>}a{/Control}")
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect([...onValueChange.mock.calls[0][0]].sort()).toEqual([
      "a12",
      "notes",
      "wells",
    ])
  })

  it("selects nothing with selectionMode none", async () => {
    const onValueChange = vi.fn()
    render(<Project onValueChange={onValueChange} />)
    await userEvent.click(row("Wells"))
    expect(row("Wells")).not.toHaveAttribute("data-selected")
    expect(onValueChange).not.toHaveBeenCalled()
    expect(row("Wells").className).not.toContain("hover:bg-accent/60")
  })
})

describe("TreeView expansion", () => {
  it("starts from defaultExpanded", () => {
    render(<Project defaultExpanded={["wells"]} />)
    expect(row("A-12")).toBeInTheDocument()
    expect(row("Wells")).toHaveAttribute("data-expanded", "")
  })

  it("reports expansion changes (uncontrolled)", async () => {
    const onExpandedChange = vi.fn()
    render(<Project onExpandedChange={onExpandedChange} />)
    const chevron = row("Wells").querySelector(
      '[data-slot="tree-view-chevron"]'
    ) as HTMLElement
    await userEvent.click(chevron)
    expect(onExpandedChange).toHaveBeenLastCalledWith(["wells"])
    await userEvent.click(chevron)
    expect(onExpandedChange).toHaveBeenLastCalledWith([])
  })

  it("follows a controlled expanded", async () => {
    const onExpandedChange = vi.fn()
    const { rerender } = render(
      <Project expanded={[]} onExpandedChange={onExpandedChange} />
    )
    const chevron = row("Wells").querySelector(
      '[data-slot="tree-view-chevron"]'
    ) as HTMLElement
    await userEvent.click(chevron)
    expect(onExpandedChange).toHaveBeenLastCalledWith(["wells"])
    expect(screen.queryByRole("row", { name: "A-12" })).toBeNull()
    rerender(
      <Project expanded={["wells"]} onExpandedChange={onExpandedChange} />
    )
    expect(row("A-12")).toBeInTheDocument()
  })
})

describe("TreeView disabled rows", () => {
  it("marks disabled rows and skips them", async () => {
    const onValueChange = vi.fn()
    render(
      <TreeView
        aria-label="Horizons"
        selectionMode="single"
        onValueChange={onValueChange}
      >
        <TreeViewItem value="balder">
          <TreeViewItemContent>Top Balder</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem value="brent" disabled>
          <TreeViewItemContent>Top Brent</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem value="sele">
          <TreeViewItemContent>Top Sele</TreeViewItemContent>
        </TreeViewItem>
      </TreeView>
    )
    const brent = row("Top Brent")
    expect(brent).toHaveAttribute("data-disabled", "")
    expect(brent).toHaveAttribute("aria-disabled", "true")
    expect(row("Top Balder")).not.toHaveAttribute("data-disabled")

    await userEvent.tab()
    expect(row("Top Balder")).toHaveFocus()
    await userEvent.keyboard("{ArrowDown}")
    expect(row("Top Sele")).toHaveFocus()

    await userEvent.click(brent, { pointerEventsCheck: 0 })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("does not expand a disabled folder", async () => {
    render(
      <TreeView aria-label="Project">
        <TreeViewItem value="wells" disabled>
          <TreeViewItemContent kind="folder">Wells</TreeViewItemContent>
          <TreeViewItem value="a12">
            <TreeViewItemContent>A-12</TreeViewItemContent>
          </TreeViewItem>
        </TreeViewItem>
      </TreeView>
    )
    const chevron = row("Wells").querySelector(
      '[data-slot="tree-view-chevron"]'
    ) as HTMLElement
    await userEvent.click(chevron, { pointerEventsCheck: 0 })
    expect(row("Wells")).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("row", { name: "A-12" })).toBeNull()
  })
})

describe("TreeView keyboard", () => {
  it("moves between rows and expands and collapses with the arrow keys", async () => {
    render(<Project />)
    await userEvent.tab()
    expect(row("Wells")).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    expect(row("Wells")).toHaveAttribute("aria-expanded", "true")
    await userEvent.keyboard("{ArrowDown}")
    expect(row("A-12")).toHaveFocus()
    // Left on a child goes back to its parent row.
    await userEvent.keyboard("{ArrowLeft}")
    expect(row("Wells")).toHaveFocus()
    await userEvent.keyboard("{ArrowLeft}")
    expect(row("Wells")).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("row", { name: "A-12" })).toBeNull()
  })

  it("selects the focused row with Space and Enter", async () => {
    const onValueChange = vi.fn()
    render(<Project selectionMode="single" onValueChange={onValueChange} />)
    await userEvent.tab()
    await userEvent.keyboard(" ")
    expect(onValueChange).toHaveBeenLastCalledWith(["wells"])
  })

  it("moves into the row's controls with the arrow keys", async () => {
    const onClick = vi.fn()
    render(
      <TreeView aria-label="Layers">
        <TreeViewItem value="faults">
          <TreeViewItemContent
            endAdornment={
              <TreeViewAction aria-label="Faults actions" onClick={onClick} />
            }
          >
            Faults
          </TreeViewItemContent>
        </TreeViewItem>
      </TreeView>
    )
    await userEvent.tab()
    expect(row(/Faults/)).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    const action = screen.getByRole("button", { name: "Faults actions" })
    expect(action).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    expect(onClick).toHaveBeenCalledTimes(1)
    await userEvent.keyboard("{ArrowLeft}")
    expect(row(/Faults/)).toHaveFocus()
  })

  it("moves to a row by typing its name", async () => {
    render(
      <TreeView aria-label="Horizons">
        <TreeViewItem value="balder" textValue="Top Balder">
          <TreeViewItemContent>Top Balder</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem value="bcu" textValue="Base Cretaceous">
          <TreeViewItemContent>Base Cretaceous</TreeViewItemContent>
        </TreeViewItem>
      </TreeView>
    )
    await userEvent.tab()
    expect(row("Top Balder")).toHaveFocus()
    await userEvent.keyboard("base")
    expect(row("Base Cretaceous")).toHaveFocus()
  })

  it("swaps the expand and collapse arrows under a right-to-left TectonProvider", async () => {
    render(
      <TectonProvider direction="rtl">
        <Project />
      </TectonProvider>
    )
    await userEvent.tab()
    expect(row("Wells")).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    expect(row("Wells")).toHaveAttribute("aria-expanded", "false")
    await userEvent.keyboard("{ArrowLeft}")
    expect(row("Wells")).toHaveAttribute("aria-expanded", "true")
    await userEvent.keyboard("{ArrowRight}")
    expect(row("Wells")).toHaveAttribute("aria-expanded", "false")
  })
})

describe("TreeView dynamic items", () => {
  type Node = { id: string; name: string; children?: Node[] }
  const nodes: Node[] = [
    {
      id: "fields",
      name: "Fields",
      children: [
        { id: "gullfaks", name: "Gullfaks" },
        { id: "statfjord", name: "Statfjord" },
      ],
    },
    { id: "notes", name: "Notes" },
  ]

  function Dynamic() {
    const [hidden, setHidden] = React.useState<Set<string>>(new Set())
    const renderNode = (node: Node) => (
      <TreeViewItem
        value={node.id}
        textValue={node.name}
        hidden={hidden.has(node.id)}
      >
        <TreeViewItemContent
          kind={node.children ? "folder" : "item"}
          endAdornment={
            <TreeViewVisibilityToggle
              visible={!hidden.has(node.id)}
              onVisibleChange={(visible) =>
                setHidden((current) => {
                  const next = new Set(current)
                  if (visible) next.delete(node.id)
                  else next.add(node.id)
                  return next
                })
              }
            />
          }
        >
          {node.name}
        </TreeViewItemContent>
        <TreeViewCollection items={node.children ?? []}>
          {renderNode}
        </TreeViewCollection>
      </TreeViewItem>
    )
    return (
      <TreeView aria-label="Fields" items={nodes} defaultExpanded={["fields"]}>
        {renderNode}
      </TreeView>
    )
  }

  it("renders items and nested collections", () => {
    render(<Dynamic />)
    expect(row(/Fields/)).toHaveAttribute("aria-level", "1")
    expect(row(/Gullfaks/)).toHaveAttribute("aria-level", "2")
    expect(row(/Statfjord/)).toBeInTheDocument()
    expect(row(/Notes/)).toHaveAttribute("aria-level", "1")
  })

  it("re-renders rows from state outside items", async () => {
    render(<Dynamic />)
    const toggle = screen.getByRole("button", { name: "Hide Gullfaks" })
    expect(row(/Gullfaks/)).not.toHaveAttribute("data-hidden")
    await userEvent.click(toggle)
    expect(row(/Gullfaks/)).toHaveAttribute("data-hidden", "")
    expect(
      screen.getByRole("button", { name: "Hide Gullfaks" })
    ).toHaveAttribute("aria-pressed", "true")
  })

  it("updates when items change", () => {
    function Changing() {
      const [items, setItems] = React.useState([{ id: "a", name: "A" }])
      return (
        <>
          <button
            type="button"
            onClick={() => setItems((i) => [...i, { id: "b", name: "B" }])}
          >
            add
          </button>
          <TreeView aria-label="List" items={items}>
            {(item) => (
              <TreeViewItem value={item.id}>
                <TreeViewItemContent>{item.name}</TreeViewItemContent>
              </TreeViewItem>
            )}
          </TreeView>
        </>
      )
    }
    render(<Changing />)
    expect(screen.getAllByRole("row")).toHaveLength(1)
    act(() => screen.getByRole("button", { name: "add" }).click())
    expect(screen.getAllByRole("row")).toHaveLength(2)
  })
})

describe("TreeViewAction", () => {
  it("renders a menu icon button by default and fires onClick", async () => {
    const onClick = vi.fn()
    render(<TreeViewAction aria-label="More" onClick={onClick} className="x" />)
    const button = screen.getByRole("button", { name: "More" })
    expect(button).toHaveAttribute("data-slot", "tree-view-action")
    expect(button).toHaveClass("x", "size-6")
    expect(button.querySelector("svg")).toBeInTheDocument()
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick).toHaveBeenCalledWith()
  })

  it("renders custom children", () => {
    render(<TreeViewAction aria-label="a">go</TreeViewAction>)
    expect(screen.getByRole("button")).toHaveTextContent("go")
  })

  it("is disabled with disabled", async () => {
    const onClick = vi.fn()
    render(<TreeViewAction aria-label="a" disabled onClick={onClick} />)
    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("data-disabled", "")
    await userEvent.click(button, { pointerEventsCheck: 0 })
    expect(onClick).not.toHaveBeenCalled()
  })

  it("does not select or expand its row", async () => {
    const onValueChange = vi.fn()
    const onClick = vi.fn()
    render(
      <TreeView
        aria-label="Layers"
        selectionMode="single"
        onValueChange={onValueChange}
      >
        <TreeViewItem value="wells">
          <TreeViewItemContent
            kind="folder"
            endAdornment={
              <TreeViewAction aria-label="More" onClick={onClick} />
            }
          >
            Wells
          </TreeViewItemContent>
          <TreeViewItem value="a12">
            <TreeViewItemContent>A-12</TreeViewItemContent>
          </TreeViewItem>
        </TreeViewItem>
      </TreeView>
    )
    await userEvent.click(screen.getByRole("button", { name: "More" }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onValueChange).not.toHaveBeenCalled()
    expect(row(/Wells/)).toHaveAttribute("aria-expanded", "false")
  })
})

describe("TreeViewVisibilityToggle", () => {
  it("is labelled Hide while visible and toggles to hidden", async () => {
    const onVisibleChange = vi.fn()
    render(<TreeViewVisibilityToggle onVisibleChange={onVisibleChange} />)
    const button = screen.getByRole("button", { name: "Hide" })
    expect(button).toHaveAttribute("aria-pressed", "false")
    await userEvent.click(button)
    expect(onVisibleChange).toHaveBeenCalledWith(false)
  })

  // A toggle button keeps its name; the pressed state is what changes. A
  // "Show" label with aria-pressed="true" would read as "Show, pressed".
  it("keeps the Hide label while hidden and reports it pressed", async () => {
    const onVisibleChange = vi.fn()
    render(
      <TreeViewVisibilityToggle
        visible={false}
        onVisibleChange={onVisibleChange}
      />
    )
    const button = screen.getByRole("button", { name: "Hide" })
    expect(button).toHaveAttribute("aria-pressed", "true")
    expect(screen.queryByRole("button", { name: "Show" })).toBeNull()
    await userEvent.click(button)
    expect(onVisibleChange).toHaveBeenCalledWith(true)
  })

  it("names itself after the row it sits in", () => {
    render(
      <TreeView aria-label="Layers">
        <TreeViewItem value="faults" textValue="Faults">
          <TreeViewItemContent
            endAdornment={<TreeViewVisibilityToggle visible={false} />}
          >
            Faults
          </TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem value="wells" textValue="Wells">
          <TreeViewItemContent endAdornment={<TreeViewVisibilityToggle />}>
            Wells
          </TreeViewItemContent>
        </TreeViewItem>
      </TreeView>
    )
    expect(screen.getByRole("button", { name: "Hide Faults" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: "Hide Wells" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })

  it("takes an explicit name or aria-label over the row label", () => {
    render(
      <TreeView aria-label="Layers">
        <TreeViewItem value="faults" textValue="Faults">
          <TreeViewItemContent
            endAdornment={<TreeViewVisibilityToggle name="fault sticks" />}
          >
            <b>Faults</b>
          </TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem value="wells" textValue="Wells">
          <TreeViewItemContent
            endAdornment={<TreeViewVisibilityToggle aria-label="Wells layer" />}
          >
            Wells
          </TreeViewItemContent>
        </TreeViewItem>
      </TreeView>
    )
    expect(
      screen.getByRole("button", { name: "Hide fault sticks" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Wells layer" })
    ).toBeInTheDocument()
  })
})
