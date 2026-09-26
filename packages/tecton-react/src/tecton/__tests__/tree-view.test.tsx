import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  TreeView,
  TreeViewAction,
  TreeViewItem,
  TreeViewItemContent,
  TreeViewVisibilityToggle,
} from "@tecton/react/tecton/tree-view"

function Project(props: Partial<React.ComponentProps<typeof TreeView>>) {
  return (
    <TreeView aria-label="Project" {...props}>
      <TreeViewItem id="wells" textValue="Wells">
        <TreeViewItemContent kind="folder">Wells</TreeViewItemContent>
        <TreeViewItem id="a12" textValue="A-12">
          <TreeViewItemContent>A-12</TreeViewItemContent>
        </TreeViewItem>
      </TreeViewItem>
      <TreeViewItem id="notes" textValue="Notes" isHidden>
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

describe("TreeView", () => {
  it("renders a tree with collapsed folders", () => {
    render(<Project />)
    const tree = screen.getByRole("treegrid", { name: "Project" })
    expect(tree).toHaveAttribute("data-slot", "tree-view")
    expect(screen.getByRole("row", { name: "Wells" })).toHaveAttribute(
      "aria-expanded",
      "false"
    )
    expect(screen.queryByRole("row", { name: "A-12" })).toBeNull()
  })

  it("expands a folder from its chevron and swaps the folder icon", async () => {
    const { container } = render(<Project />)
    const wells = screen.getByRole("row", { name: "Wells" })
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
    expect(chevron.querySelector("svg")).toHaveClass("rotate-90")
    expect(screen.getByRole("row", { name: "A-12" })).toBeInTheDocument()
    expect(
      wells.querySelector('[data-slot="tree-view-icon"] svg')?.outerHTML
    ).not.toBe(iconBefore)
    // Nested rows are indented by level.
    const child = container.querySelector(
      '[data-slot="tree-view-item"][data-key="a12"] [data-slot="tree-view-item-content"]'
    ) as HTMLElement
    expect(child.style.paddingInlineStart).toBe("1.5rem")
  })

  it("respects defaultExpandedKeys", () => {
    render(<Project defaultExpandedKeys={["wells"]} />)
    expect(screen.getByRole("row", { name: "A-12" })).toBeInTheDocument()
  })

  it("hides the chevron on leaf rows and shows a dot instead of a folder", () => {
    render(<Project />)
    const notes = screen.getByRole("row", { name: /Notes/ })
    const chevron = notes.querySelector('[data-slot="tree-view-chevron"]')
    // React Aria's Button drops `aria-hidden`, so the chevron is hidden visually only.
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
    const notes = screen.getByRole("row", { name: /Notes/ })
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

  it("marks hidden rows", () => {
    render(<Project />)
    expect(screen.getByRole("row", { name: /Notes/ })).toHaveAttribute(
      "data-hidden",
      "true"
    )
    expect(screen.getByRole("row", { name: "Wells" })).not.toHaveAttribute(
      "data-hidden"
    )
  })

  it("uses a custom icon over the kind icon", () => {
    render(
      <TreeView aria-label="t">
        <TreeViewItem id="x" textValue="x">
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

  it("selects rows", async () => {
    const onSelectionChange = vi.fn()
    render(
      <Project selectionMode="single" onSelectionChange={onSelectionChange} />
    )
    await userEvent.click(screen.getByRole("row", { name: "Wells" }))
    expect(screen.getByRole("row", { name: "Wells" })).toHaveAttribute(
      "data-selected",
      "true"
    )
    expect([...onSelectionChange.mock.calls[0][0]]).toEqual(["wells"])
  })

  it("marks disabled rows", () => {
    render(<Project disabledKeys={["wells"]} />)
    expect(screen.getByRole("row", { name: "Wells" })).toHaveAttribute(
      "data-disabled",
      "true"
    )
  })
})

describe("TreeViewAction", () => {
  it("renders a menu icon button by default and fires onPress", async () => {
    const onPress = vi.fn()
    render(<TreeViewAction aria-label="More" onPress={onPress} className="x" />)
    const button = screen.getByRole("button", { name: "More" })
    expect(button).toHaveAttribute("data-slot", "tree-view-action")
    expect(button).toHaveClass("x", "size-6")
    expect(button.querySelector("svg")).toBeInTheDocument()
    await userEvent.click(button)
    expect(onPress).toHaveBeenCalled()
  })

  it("renders custom children", () => {
    render(<TreeViewAction aria-label="a">go</TreeViewAction>)
    expect(screen.getByRole("button")).toHaveTextContent("go")
  })
})

describe("TreeViewVisibilityToggle", () => {
  it("is labelled Hide while visible and toggles to hidden", async () => {
    const onChange = vi.fn()
    render(<TreeViewVisibilityToggle onChange={onChange} />)
    const button = screen.getByRole("button", { name: "Hide" })
    expect(button).toHaveAttribute("aria-pressed", "false")
    await userEvent.click(button)
    expect(onChange).toHaveBeenCalledWith(false)
  })

  // A toggle button keeps its name; the pressed state is what changes. A
  // "Show" label with aria-pressed="true" would read as "Show, pressed".
  it("keeps the Hide label while hidden and reports it pressed", async () => {
    const onChange = vi.fn()
    render(<TreeViewVisibilityToggle isVisible={false} onChange={onChange} />)
    const button = screen.getByRole("button", { name: "Hide" })
    expect(button).toHaveAttribute("aria-pressed", "true")
    expect(screen.queryByRole("button", { name: "Show" })).toBeNull()
    await userEvent.click(button)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it("names itself after the row it sits in", () => {
    render(
      <TreeView aria-label="Layers">
        <TreeViewItem id="faults" textValue="Faults">
          <TreeViewItemContent
            endAdornment={<TreeViewVisibilityToggle isVisible={false} />}
          >
            Faults
          </TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem id="wells" textValue="Wells">
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
        <TreeViewItem id="faults" textValue="Faults">
          <TreeViewItemContent
            endAdornment={<TreeViewVisibilityToggle name="fault sticks" />}
          >
            <b>Faults</b>
          </TreeViewItemContent>
        </TreeViewItem>
        <TreeViewItem id="wells" textValue="Wells">
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
