import * as React from "react"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  ContextMenuContent,
  ContextMenuItem,
} from "@tecton/react/components/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import { TectonProvider } from "@tecton/react/tecton/provider"
import {
  moveTreeItems,
  TreeView,
  TreeViewAction,
  TreeViewCollection,
  TreeViewItem,
  TreeViewItemContent,
  TreeViewVisibilityToggle,
  type TreeViewMove,
} from "@tecton/react/tecton/tree-view"

function Project(props: Partial<React.ComponentProps<typeof TreeView>>) {
  return (
    <TreeView aria-label="Project" {...props}>
      <TreeViewItem value="wells" label="Wells">
        <TreeViewItemContent kind="folder">Wells</TreeViewItemContent>
        <TreeViewItem value="a12" label="A-12">
          <TreeViewItemContent>A-12</TreeViewItemContent>
        </TreeViewItem>
      </TreeViewItem>
      <TreeViewItem value="notes" label="Notes" hidden>
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
        <TreeViewItem value="x" label="x">
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
        <TreeViewItem value="balder" label="Top Balder">
          <TreeViewItemContent>Top Balder</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem value="bcu" label="Base Cretaceous">
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
        label={node.name}
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
    expect(onClick.mock.calls[0][0]).toHaveProperty("type", "click")
  })

  it.each(["mouse", "Enter", "Space"])(
    "opens a menu when it is the trigger (%s)",
    async (input) => {
      const user = userEvent.setup()
      render(
        <TreeView aria-label="Layers">
          <TreeViewItem value="wells">
            <TreeViewItemContent
              endAdornment={
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<TreeViewAction aria-label="Actions for Wells" />}
                  />
                  <DropdownMenuContent>
                    <DropdownMenuItem>Rename</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            >
              Wells
            </TreeViewItemContent>
          </TreeViewItem>
        </TreeView>
      )
      const trigger = screen.getByRole("button", { name: "Actions for Wells" })
      if (input === "mouse") {
        await user.click(trigger)
      } else {
        act(() => trigger.focus())
        await user.keyboard(input === "Enter" ? "{Enter}" : " ")
      }
      expect(await screen.findByRole("menu")).toBeInTheDocument()
    }
  )

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
        <TreeViewItem value="faults" label="Faults">
          <TreeViewItemContent
            endAdornment={<TreeViewVisibilityToggle visible={false} />}
          >
            Faults
          </TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem value="wells" label="Wells">
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
        <TreeViewItem value="faults" label="Faults">
          <TreeViewItemContent
            endAdornment={<TreeViewVisibilityToggle name="fault sticks" />}
          >
            <b>Faults</b>
          </TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem value="wells" label="Wells">
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

describe("TreeView activation, empty state and forwarded attributes", () => {
  it("activates a row with Enter and a click when rows are not selectable", async () => {
    const onActivate = vi.fn()
    render(<Project onActivate={onActivate} />)
    await userEvent.tab()
    expect(row("Wells")).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    expect(onActivate).toHaveBeenLastCalledWith("wells")
    await userEvent.click(row(/Notes/))
    expect(onActivate).toHaveBeenLastCalledWith("notes")
  })

  it("activates a selectable row with Enter and a double click", async () => {
    const onActivate = vi.fn()
    const onValueChange = vi.fn()
    render(
      <Project
        selectionMode="single"
        onActivate={onActivate}
        onValueChange={onValueChange}
      />
    )
    await userEvent.click(row("Wells"))
    expect(onValueChange).toHaveBeenLastCalledWith(["wells"])
    expect(onActivate).not.toHaveBeenCalled()
    await userEvent.dblClick(row(/Notes/))
    expect(onActivate).toHaveBeenLastCalledWith("notes")
    await userEvent.keyboard("{Enter}")
    expect(onActivate).toHaveBeenCalledTimes(2)
  })

  it("adds to a multiple selection with a modifier click when rows activate", async () => {
    const onValueChange = vi.fn()
    render(
      <Project
        selectionMode="multiple"
        onActivate={() => {}}
        onValueChange={onValueChange}
      />
    )
    const user = userEvent.setup()
    await user.click(row("Wells"))
    await user.keyboard("{Control>}")
    await user.click(row(/Notes/))
    await user.keyboard("{/Control}")
    expect([...onValueChange.mock.lastCall![0]].sort()).toEqual([
      "notes",
      "wells",
    ])
  })

  it("renders empty in place of the rows", () => {
    render(<TreeView aria-label="Layers" empty="No layers" />)
    const tree = screen.getByRole("treegrid", { name: "Layers" })
    expect(tree).toHaveTextContent("No layers")
    expect(tree).toHaveAttribute("data-empty", "")
  })

  it("keeps the last selected row with disallowEmptySelection", async () => {
    const onValueChange = vi.fn()
    render(
      <Project
        selectionMode="multiple"
        defaultValue={["wells"]}
        disallowEmptySelection
        onValueChange={onValueChange}
      />
    )
    await userEvent.click(row("Wells"))
    expect(row("Wells")).toHaveAttribute("data-selected", "")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("forwards id, className, style, aria and data attributes", () => {
    render(
      <TreeView
        aria-label="Project"
        aria-describedby="hint"
        id="project-tree"
        className="max-h-40"
        style={{ maxWidth: 200 }}
        data-testid="tree"
      >
        <TreeViewItem
          value="wells"
          className="font-medium"
          style={{ color: "red" }}
          data-testid="wells-row"
        >
          <TreeViewItemContent
            endAdornment={
              <TreeViewAction
                id="wells-actions"
                aria-label="Actions for Wells"
                aria-describedby="hint"
                aria-haspopup="menu"
                aria-expanded={false}
                data-testid="action"
              />
            }
          >
            Wells
          </TreeViewItemContent>
        </TreeViewItem>
      </TreeView>
    )
    const tree = screen.getByTestId("tree")
    expect(tree).toHaveAttribute("id", "project-tree")
    expect(tree).toHaveAttribute("aria-describedby", "hint")
    expect(tree).toHaveClass("max-h-40")
    expect(tree).toHaveStyle({ maxWidth: "200px" })
    const wells = screen.getByTestId("wells-row")
    expect(wells).toHaveClass("font-medium")
    expect(wells).toHaveStyle({ color: "rgb(255, 0, 0)" })
    const action = screen.getByTestId("action")
    expect(action).toHaveAttribute("id", "wells-actions")
    expect(action).toHaveAttribute("aria-describedby", "hint")
    expect(action).toHaveAttribute("aria-haspopup", "menu")
    expect(action).toHaveAttribute("aria-expanded", "false")
  })
})

type Well = { id: string; name: string; children?: Well[] }

/** `fields` folders of `wells` rows each. */
function inventory(fields: number, wells: number): Well[] {
  return Array.from({ length: fields }, (_, f) => ({
    id: `field-${f}`,
    name: `Field ${f}`,
    children: Array.from({ length: wells }, (_, w) => ({
      id: `well-${f}-${w}`,
      name: `Well ${f}-${w}`,
    })),
  }))
}

function Inventory({
  nodes,
  ...props
}: Partial<React.ComponentProps<typeof TreeView<Well>>> & { nodes: Well[] }) {
  const renderNode = (node: Well): React.ReactElement => (
    <TreeViewItem value={node.id}>
      <TreeViewItemContent kind={node.children ? "folder" : "item"}>
        {node.name}
      </TreeViewItemContent>
      <TreeViewCollection items={node.children ?? []}>
        {renderNode}
      </TreeViewCollection>
    </TreeViewItem>
  )
  return (
    <TreeView aria-label="Inventory" items={nodes} {...props}>
      {renderNode}
    </TreeView>
  )
}

describe("TreeView virtualized", () => {
  // jsdom has no layout: give every element a 320 x 320 viewport.
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(320)
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(320)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const nodes = inventory(50, 100)
  const allFields = nodes.map((node) => node.id)

  it("renders only the rows in view of a 5,050-row tree", () => {
    render(<Inventory nodes={nodes} virtualized defaultExpanded={allFields} />)
    const rendered = screen.getAllByRole("row")
    expect(rendered.length).toBeGreaterThan(5)
    expect(rendered.length).toBeLessThan(40)
    expect(row("Field 0")).toBeInTheDocument()
    expect(screen.queryByRole("row", { name: "Field 49" })).toBeNull()
    expect(screen.getByRole("treegrid")).toHaveAttribute(
      "aria-rowcount",
      "5050"
    )
  })

  it("moves to the last row with End, rendering it", async () => {
    const user = userEvent.setup()
    render(<Inventory nodes={nodes} virtualized defaultExpanded={allFields} />)
    await user.tab()
    expect(row("Field 0")).toHaveFocus()
    await user.keyboard("{End}")
    expect(row("Well 49-99")).toHaveFocus()
  })

  it("reaches a row out of view with type-ahead", async () => {
    const user = userEvent.setup()
    render(<Inventory nodes={nodes} virtualized />)
    await user.tab()
    await user.keyboard("Field 42")
    expect(row("Field 42")).toHaveFocus()
  })

  it("selects rows and reports their values", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Inventory
        nodes={nodes}
        virtualized
        selectionMode="multiple"
        onValueChange={onValueChange}
      />
    )
    await user.click(row("Field 1"))
    expect(onValueChange).toHaveBeenLastCalledWith(["field-1"])
    expect(row("Field 1")).toHaveAttribute("data-selected", "")
  })

  it("does not re-render rows when a controlled selection changes", async () => {
    const user = userEvent.setup()
    // Stable render functions, as a module-level `renderNode` would be.
    const renderWell = vi.fn((node: Well) => (
      <TreeViewItem value={node.id}>
        <TreeViewItemContent>{node.name}</TreeViewItemContent>
      </TreeViewItem>
    ))
    const renderField = vi.fn((node: Well) => (
      <TreeViewItem value={node.id}>
        <TreeViewItemContent kind="folder">{node.name}</TreeViewItemContent>
        <TreeViewCollection items={node.children ?? []}>
          {renderWell}
        </TreeViewCollection>
      </TreeViewItem>
    ))
    function Controlled() {
      const [value, setValue] = React.useState<string[]>([])
      return (
        <TreeView
          aria-label="Inventory"
          items={nodes}
          virtualized
          selectionMode="multiple"
          value={value}
          onValueChange={setValue}
        >
          {renderField}
        </TreeView>
      )
    }
    render(<Controlled />)
    expect(renderWell).toHaveBeenCalled()
    renderField.mockClear()
    renderWell.mockClear()
    await user.click(row("Field 1"))
    await user.keyboard("{ArrowDown}")
    expect(row("Field 1")).toHaveAttribute("data-selected", "")
    expect(renderField).not.toHaveBeenCalled()
    expect(renderWell).not.toHaveBeenCalled()
  })

  it("re-renders rows when the render function changes", async () => {
    const user = userEvent.setup()
    function Suffixed() {
      const [suffix, setSuffix] = React.useState("")
      // Created during render: it reads `suffix`, so rows must follow it.
      const renderNode = (node: Well): React.ReactElement => (
        <TreeViewItem value={node.id} label={node.name + suffix}>
          <TreeViewItemContent>{node.name + suffix}</TreeViewItemContent>
          <TreeViewCollection items={node.children ?? []}>
            {renderNode}
          </TreeViewCollection>
        </TreeViewItem>
      )
      return (
        <>
          <button onClick={() => setSuffix(" (hidden)")}>Hide</button>
          <TreeView
            aria-label="Inventory"
            items={inventory(2, 2)}
            defaultExpanded={["field-0"]}
          >
            {renderNode}
          </TreeView>
        </>
      )
    }
    render(<Suffixed />)
    await user.click(screen.getByRole("button", { name: "Hide" }))
    expect(row("Field 0 (hidden)")).toBeInTheDocument()
    expect(row("Well 0-1 (hidden)")).toBeInTheDocument()
  })
})

describe("TreeView context menu", () => {
  function WithMenu({
    onPick = () => {},
    ...props
  }: Partial<React.ComponentProps<typeof TreeView>> & {
    onPick?: (action: string, value: string) => void
  }) {
    return (
      <Project
        contextMenu={(value) => (
          <ContextMenuContent>
            <ContextMenuItem onClick={() => onPick("rename", value)}>
              Rename {value}
            </ContextMenuItem>
          </ContextMenuContent>
        )}
        {...props}
      />
    )
  }

  it("opens the menu of the right-clicked row without selecting it", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <WithMenu
        selectionMode="single"
        defaultValue={["notes"]}
        onValueChange={onValueChange}
      />
    )
    await user.pointer({ keys: "[MouseRight]", target: row("Wells") })
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    expect(
      screen.getByRole("menuitem", { name: "Rename wells" })
    ).toBeInTheDocument()
    // The menu is modal: the tree is hidden from assistive technology.
    const wells = screen.getByRole("row", { name: "Wells", hidden: true })
    const notes = screen.getByRole("row", { name: "Notes", hidden: true })
    expect(wells).toHaveAttribute("data-context-menu-open", "")
    expect(notes).not.toHaveAttribute("data-context-menu-open")
    expect(notes).toHaveAttribute("data-selected", "")
    expect(wells).not.toHaveAttribute("data-selected")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("calls the item's handler with the row value", async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<WithMenu onPick={onPick} />)
    await user.pointer({ keys: "[MouseRight]", target: row("Notes") })
    await user.click(
      await screen.findByRole("menuitem", { name: "Rename notes" })
    )
    expect(onPick).toHaveBeenCalledWith("rename", "notes")
  })

  it("opens from Shift+F10 and the Menu key on the focused row", async () => {
    const user = userEvent.setup()
    render(<WithMenu />)
    await user.tab()
    expect(row("Wells")).toHaveFocus()
    await user.keyboard("{Shift>}{F10}{/Shift}")
    expect(
      await screen.findByRole("menuitem", { name: "Rename wells" })
    ).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await vi.waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    await user.keyboard("{ArrowDown}{ContextMenu}")
    expect(
      await screen.findByRole("menuitem", { name: "Rename notes" })
    ).toBeInTheDocument()
  })

  it("returns focus to the row when the menu closes", async () => {
    const user = userEvent.setup()
    render(<WithMenu />)
    await user.tab()
    await user.keyboard("{ArrowDown}{Shift>}{F10}{/Shift}")
    await screen.findByRole("menu")
    await user.keyboard("{Escape}")
    await vi.waitFor(() => expect(row("Notes")).toHaveFocus())
    expect(row("Notes")).not.toHaveAttribute("data-context-menu-open")
  })

  it("opens nothing on a disabled row, the empty area or a null menu", async () => {
    const user = userEvent.setup()
    render(
      <TreeView
        aria-label="Project"
        contextMenu={(value) =>
          value === "plain" ? null : (
            <ContextMenuContent>
              <ContextMenuItem>Rename</ContextMenuItem>
            </ContextMenuContent>
          )
        }
      >
        <TreeViewItem value="off" disabled>
          <TreeViewItemContent>Off</TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem value="plain">
          <TreeViewItemContent>Plain</TreeViewItemContent>
        </TreeViewItem>
      </TreeView>
    )
    await user.pointer({ keys: "[MouseRight]", target: row("Off") })
    await user.pointer({ keys: "[MouseRight]", target: row("Plain") })
    await user.pointer({
      keys: "[MouseRight]",
      target: screen.getByRole("treegrid"),
    })
    expect(screen.queryByRole("menu")).toBeNull()
  })

  it("works in a virtualized tree", async () => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(320)
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(320)
    const user = userEvent.setup()
    render(
      <Inventory
        nodes={inventory(20, 50)}
        virtualized
        contextMenu={(value) => (
          <ContextMenuContent>
            <ContextMenuItem>Open {value}</ContextMenuItem>
          </ContextMenuContent>
        )}
      />
    )
    await user.pointer({ keys: "[MouseRight]", target: row("Field 3") })
    expect(
      await screen.findByRole("menuitem", { name: "Open field-3" })
    ).toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it("leaves the tree without a menu when contextMenu is not set", () => {
    render(<Project />)
    expect(row("Wells")).toHaveAttribute("data-value", "wells")
    expect(row("Wells")).not.toHaveAttribute("data-context-menu-open")
  })
})

describe("moveTreeItems", () => {
  type Item = { value: string; children?: Item[] }
  const data = (): Item[] => [
    {
      value: "wells",
      children: [{ value: "a12" }, { value: "a13" }, { value: "b4" }],
    },
    {
      value: "horizons",
      children: [{ value: "balder" }, { value: "sele" }],
    },
    { value: "archive", children: [] },
  ]
  const shape = (items: Item[]): unknown =>
    items.map((item) =>
      item.children ? { [item.value]: shape(item.children) } : item.value
    )
  const move = (
    values: string[],
    target: string,
    position: TreeViewMove["position"]
  ): TreeViewMove => ({ values, target, position })

  it("moves rows before and after a row", () => {
    expect(shape(moveTreeItems(data(), move(["b4"], "a12", "before")))).toEqual(
      [
        { wells: ["b4", "a12", "a13"] },
        { horizons: ["balder", "sele"] },
        { archive: [] },
      ]
    )
    expect(shape(moveTreeItems(data(), move(["a12"], "a13", "after")))).toEqual(
      [
        { wells: ["a13", "a12", "b4"] },
        { horizons: ["balder", "sele"] },
        { archive: [] },
      ]
    )
  })

  it("moves rows inside a folder, as its last children, across levels", () => {
    expect(
      shape(moveTreeItems(data(), move(["sele", "a13"], "archive", "inside")))
    ).toEqual([
      { wells: ["a12", "b4"] },
      { horizons: ["balder"] },
      // In tree order, whatever the order of `values`.
      { archive: ["a13", "sele"] },
    ])
    expect(
      shape(moveTreeItems(data(), move(["horizons"], "wells", "inside")))
    ).toEqual([
      { wells: ["a12", "a13", "b4", { horizons: ["balder", "sele"] }] },
      { archive: [] },
    ])
  })

  it("keeps the subtrees it does not change", () => {
    const items = data()
    const next = moveTreeItems(items, move(["a12"], "b4", "after"))
    expect(next).not.toBe(items)
    expect(next[0]).not.toBe(items[0])
    expect(next[1]).toBe(items[1])
    expect(next[2]).toBe(items[2])
  })

  it("changes nothing for a drop into a moved row or an unknown target", () => {
    const items = data()
    expect(moveTreeItems(items, move(["wells"], "a13", "after"))).toBe(items)
    expect(moveTreeItems(items, move(["wells"], "wells", "inside"))).toBe(items)
    expect(moveTreeItems(items, move(["a12"], "nowhere", "after"))).toBe(items)
  })

  it("reads `id` by default and takes a getValue", () => {
    const byId = [{ id: "x" }, { id: "y" }, { id: "z" }]
    expect(
      moveTreeItems(byId, move(["z"], "x", "before")).map((item) => item.id)
    ).toEqual(["z", "x", "y"])
    const byKey = [{ key: "x" }, { key: "y" }]
    expect(
      moveTreeItems(byKey, move(["x"], "y", "after"), (item) => item.key)
    ).toEqual([{ key: "y" }, { key: "x" }])
  })
})

describe("TreeView drag and drop", () => {
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

  const grip = (name: string) =>
    screen.getByRole("button", { name: `Drag ${name}` })

  /** Starts a keyboard drag from the grip of row `name`. */
  async function startDrag(
    user: ReturnType<typeof userEvent.setup>,
    name: string
  ) {
    act(() => row(name).focus())
    await user.keyboard("{ArrowRight}")
    expect(grip(name)).toHaveFocus()
    await user.keyboard("{Enter}")
  }

  /** Starts a keyboard drag of `name` and lists every drop target offered. */
  async function targetsWhileDragging(
    user: ReturnType<typeof userEvent.setup>,
    name: string
  ) {
    await startDrag(user, name)
    const seen: string[] = []
    for (let i = 0; i < 20; i++) {
      const label = document.activeElement?.getAttribute("aria-label") ?? ""
      if (seen.includes(label)) break
      seen.push(label)
      await user.keyboard("{ArrowDown}")
    }
    // A drag session is global: end it before the next test.
    await user.keyboard("{Escape}")
    return seen
  }

  /** Moves the keyboard drag to the target named `label`, then drops. */
  async function dropOn(
    user: ReturnType<typeof userEvent.setup>,
    label: string
  ) {
    for (let i = 0; i < 20; i++) {
      if (document.activeElement?.getAttribute("aria-label") === label) break
      await user.keyboard("{ArrowDown}")
    }
    expect(document.activeElement).toHaveAttribute("aria-label", label)
    await user.keyboard("{Enter}")
  }

  it("has no grip unless rows can move", () => {
    render(<Movable />)
    expect(screen.queryByRole("button", { name: /^Drag/ })).toBeNull()
  })

  it("gives every row a grip named after it", () => {
    render(<Movable onMove={() => {}} />)
    expect(grip("A-12")).toHaveAttribute("data-slot", "tree-view-drag-handle")
    expect(grip("Wells")).toBeInTheDocument()
  })

  it("keeps the grips visible, in one column before the indent", () => {
    render(<Movable onMove={() => {}} />)
    const content = (name: string) =>
      row(name).querySelector<HTMLElement>(
        '[data-slot="tree-view-item-content"]'
      )!
    const chevron = (name: string) =>
      row(name).querySelector<HTMLElement>('[data-slot="tree-view-chevron"]')!
    expect(grip("A-12").className).not.toMatch(/opacity-0/)
    // One colour, whatever the row's state.
    expect(grip("A-12").className).toMatch(/(^|\s)text-muted-foreground(\s|$)/)
    expect(grip("A-12").className).not.toMatch(/text-muted-foreground\/|:text-/)
    // Every row starts at the same padding, the grip first; the level indent
    // comes after it, on the chevron.
    expect(content("Wells").style.paddingInlineStart).toBe("0.25rem")
    expect(content("A-12").style.paddingInlineStart).toBe("0.25rem")
    expect(content("A-12").firstElementChild).toBe(grip("A-12"))
    expect(chevron("Wells").style.marginInlineStart).toBe("0rem")
    expect(chevron("A-12").style.marginInlineStart).toBe("1.25rem")
  })

  it("spaces rows with their own margin, so drag elements move none", () => {
    render(<Movable onMove={() => {}} />)
    // A drag inserts zero-height elements between rows (the drop line, a
    // folder's screen reader drop target); a flex gap around them would shift
    // every row below by a pixel.
    expect(screen.getByRole("treegrid").className).not.toMatch(/\bgap-/)
    expect(row("A-12").className).toMatch(/(^|\s)mb-px(\s|$)/)
  })

  it("leaves the dragged row looking as it was", async () => {
    const user = userEvent.setup()
    render(<Movable onMove={() => {}} selectionMode="multiple" />)
    await startDrag(user, "A-12")
    const dragging = row("A-12").hasAttribute("data-dragging")
    const className = row("A-12").className
    await user.keyboard("{Escape}")
    expect(dragging).toBe(true)
    expect(className).not.toMatch(/(^|\s)data-\[dragging\]/)
    // Hover and press styles stay off a dragged row.
    expect(className).not.toMatch(/(^|\s)(hover|active):/)
  })

  it("moves a row next to another from the keyboard", async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()
    render(<Movable onMove={onMove} />)
    await startDrag(user, "A-12")
    expect(row("A-12")).toHaveAttribute("data-dragging", "")
    await dropOn(user, "Insert between Notes and Archive")
    expect(onMove).toHaveBeenCalledWith({
      values: ["a12"],
      target: "archive",
      position: "before",
    })
  })

  it("moves a row inside a folder", async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()
    render(<Movable onMove={onMove} />)
    await startDrag(user, "Notes")
    await dropOn(user, "Drop on Archive")
    expect(onMove).toHaveBeenCalledWith({
      values: ["notes"],
      target: "archive",
      position: "inside",
    })
  })

  it("offers no drop on a leaf row, nor into the dragged rows", async () => {
    const user = userEvent.setup()
    render(<Movable onMove={() => {}} />)
    const targets = await targetsWhileDragging(user, "Wells")
    expect(targets).toContain("Drop on Archive")
    expect(targets.some((label) => label.includes("Notes"))).toBe(true)
    expect(targets).not.toContain("Drop on Notes")
    expect(targets.filter((label) => /A-1[23]/.test(label))).toEqual([])
  })

  it("leaves out the drops canDrop refuses", async () => {
    const user = userEvent.setup()
    const canDrop = vi.fn((move: TreeViewMove) => move.target !== "archive")
    render(<Movable onMove={() => {}} canDrop={canDrop} />)
    const targets = await targetsWhileDragging(user, "Notes")
    expect(targets).not.toContain("Drop on Archive")
    expect(canDrop).toHaveBeenCalledWith(
      expect.objectContaining({ values: ["notes"] })
    )
  })

  it("cancels with Escape", async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()
    render(<Movable onMove={onMove} />)
    await startDrag(user, "A-12")
    await user.keyboard("{ArrowDown}{Escape}")
    expect(onMove).not.toHaveBeenCalled()
    expect(row("A-12")).not.toHaveAttribute("data-dragging")
  })

  it("moves rows of a data tree with moveTreeItems", async () => {
    const user = userEvent.setup()
    function Data() {
      const [items, setItems] = React.useState(inventory(2, 2))
      const renderNode = React.useCallback(
        (node: Well): React.ReactElement => (
          <TreeViewItem value={node.id} label={node.name}>
            <TreeViewItemContent kind={node.children ? "folder" : "item"}>
              {node.name}
            </TreeViewItemContent>
            <TreeViewCollection items={node.children ?? []}>
              {renderNode}
            </TreeViewCollection>
          </TreeViewItem>
        ),
        []
      )
      return (
        <TreeView
          aria-label="Inventory"
          items={items}
          defaultExpanded={["field-0", "field-1"]}
          onMove={(move) => setItems((current) => moveTreeItems(current, move))}
        >
          {renderNode}
        </TreeView>
      )
    }
    render(<Data />)
    await startDrag(user, "Well 0-0")
    await dropOn(user, "Drop on Field 1")
    const names = screen
      .getAllByRole("row")
      .map((element) => element.getAttribute("data-value"))
    expect(names).toEqual([
      "field-0",
      "well-0-1",
      "field-1",
      "well-1-0",
      "well-1-1",
      "well-0-0",
    ])
  })
})
