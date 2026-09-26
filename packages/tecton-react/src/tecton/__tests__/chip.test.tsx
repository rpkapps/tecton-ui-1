import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  Chip,
  ChipGroup,
  ChipList,
  ChipRemove,
} from "@tecton/react/tecton/chip"
import { TectonProvider } from "@tecton/react/tecton/provider"

function Tags(
  props: React.ComponentProps<typeof ChipGroup> & {
    chip?: Partial<React.ComponentProps<typeof Chip>>
  }
) {
  const { chip, ...group } = props
  return (
    <ChipGroup aria-label="Tags" {...group}>
      <ChipList>
        <Chip value="a" {...chip}>
          Alpha
        </Chip>
        <Chip value="b" {...chip}>
          Beta
        </Chip>
      </ChipList>
    </ChipGroup>
  )
}

const WELLS = [
  { id: "a", name: "A-7" },
  { id: "b", name: "B-2" },
  { id: "c", name: "C-4" },
]

/** Removable chips from data, the way an app keeps them. */
function Removable() {
  const [wells, setWells] = React.useState(WELLS)
  return (
    <ChipGroup
      aria-label="Wells"
      onRemove={(values) =>
        setWells((current) =>
          current.filter((well) => !values.includes(well.id))
        )
      }
    >
      <ChipList items={wells} empty="No wells.">
        {(well) => <Chip value={well.id}>{well.name}</Chip>}
      </ChipList>
    </ChipGroup>
  )
}

const rows = () => screen.getAllByRole("row")

describe("Chip", () => {
  it("renders a grid of rows styled like badges", () => {
    const { container } = render(<Tags />)
    expect(
      container.querySelector('[data-slot="chip-group"]')
    ).toBeInTheDocument()
    // The grid role sits on the list, which is what the group's label names.
    expect(screen.getByRole("grid", { name: "Tags" })).toHaveAttribute(
      "data-slot",
      "chip-list"
    )
    const chips = container.querySelectorAll('[data-slot="chip"]')
    expect(chips).toHaveLength(2)
    expect(chips[0]).toHaveAttribute("role", "row")
    expect(chips[0]).toHaveAttribute("data-variant", "secondary")
    expect(chips[0]).toHaveAttribute("data-appearance", "solid")
    expect(chips[0]).toHaveAttribute("data-size", "default")
    expect(chips[0]).toHaveClass("bg-secondary", "cursor-pointer")
    expect(chips[0]).toHaveTextContent("Alpha")
  })

  it("applies the badge variants", () => {
    const { container } = render(
      <Tags chip={{ variant: "success", appearance: "outline", size: "lg" }} />
    )
    const chip = container.querySelector('[data-slot="chip"]')
    expect(chip).toHaveAttribute("data-variant", "success")
    expect(chip).toHaveAttribute("data-appearance", "outline")
    expect(chip).toHaveAttribute("data-size", "lg")
  })

  it("exposes only presence state attributes, none of the primitive's", async () => {
    render(<Tags selectionMode="multiple" defaultValue={["a"]} />)
    const [alpha, beta] = rows()
    await userEvent.hover(beta)
    for (const name of [
      "data-rac",
      "data-hovered",
      "data-focused",
      "data-focus-visible",
      "data-pressed",
      "data-selection-mode",
    ]) {
      expect(alpha).not.toHaveAttribute(name)
      expect(beta).not.toHaveAttribute(name)
    }
    expect(alpha).toHaveAttribute("data-selected", "")
    expect(beta).not.toHaveAttribute("data-selected")
  })

  it("does not render a remove button unless the group allows removing", () => {
    const { container } = render(<Tags />)
    expect(container.querySelector('[data-slot="chip-remove"]')).toBeNull()
  })

  it("renders a remove button per chip and calls onRemove with its value", async () => {
    const onRemove = vi.fn()
    const { container } = render(<Tags onRemove={onRemove} />)
    const removes = container.querySelectorAll('[data-slot="chip-remove"]')
    expect(removes).toHaveLength(2)
    expect(
      screen.getByRole("button", { name: "Remove Beta" })
    ).toBeInTheDocument()
    expect(removes[1]).not.toHaveAttribute("data-rac")
    await userEvent.click(removes[1])
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onRemove).toHaveBeenCalledWith(["b"])
  })

  it("selects chips, uncontrolled, reporting the values", async () => {
    const onValueChange = vi.fn()
    render(<Tags selectionMode="multiple" onValueChange={onValueChange} />)
    const [alpha, beta] = rows()
    await userEvent.click(alpha)
    expect(alpha).toHaveAttribute("data-selected", "")
    expect(alpha).toHaveAttribute("aria-selected", "true")
    expect(onValueChange).toHaveBeenLastCalledWith(["a"])
    await userEvent.click(beta)
    expect(onValueChange).toHaveBeenLastCalledWith(["a", "b"])
  })

  it("starts from defaultValue", () => {
    render(<Tags selectionMode="single" defaultValue={["b"]} />)
    const [alpha, beta] = rows()
    expect(alpha).not.toHaveAttribute("data-selected")
    expect(beta).toHaveAttribute("data-selected", "")
  })

  it("follows a controlled value, and only it", async () => {
    const onValueChange = vi.fn()
    const { rerender } = render(
      <Tags
        selectionMode="single"
        value={["a"]}
        onValueChange={onValueChange}
      />
    )
    const [alpha, beta] = rows()
    await userEvent.click(beta)
    expect(onValueChange).toHaveBeenCalledWith(["b"])
    // Not changed by the group itself.
    expect(alpha).toHaveAttribute("data-selected", "")
    expect(beta).not.toHaveAttribute("data-selected")

    rerender(
      <Tags
        selectionMode="single"
        value={["b"]}
        onValueChange={onValueChange}
      />
    )
    expect(alpha).not.toHaveAttribute("data-selected")
    expect(beta).toHaveAttribute("data-selected", "")
  })

  it("keeps the last chip selected with disallowEmptySelection", async () => {
    const onValueChange = vi.fn()
    render(
      <Tags
        selectionMode="single"
        defaultValue={["a"]}
        disallowEmptySelection
        onValueChange={onValueChange}
      />
    )
    await userEvent.click(rows()[0])
    expect(onValueChange).not.toHaveBeenCalled()
    expect(rows()[0]).toHaveAttribute("data-selected", "")
  })

  it("reports every selectable value for Ctrl+A", async () => {
    const onValueChange = vi.fn()
    render(
      <ChipGroup
        aria-label="Tags"
        selectionMode="multiple"
        onValueChange={onValueChange}
      >
        <ChipList>
          <Chip value="a">Alpha</Chip>
          <Chip value="b" disabled>
            Beta
          </Chip>
          <Chip value="c">Gamma</Chip>
        </ChipList>
      </ChipGroup>
    )
    rows()[0].focus()
    await userEvent.keyboard("{Control>}a{/Control}")
    expect(onValueChange).toHaveBeenLastCalledWith(["a", "c"])
  })

  it("disables one chip with disabled", async () => {
    const onValueChange = vi.fn()
    render(
      <ChipGroup
        aria-label="One disabled"
        selectionMode="multiple"
        onValueChange={onValueChange}
      >
        <ChipList>
          <Chip value="a" disabled>
            Alpha
          </Chip>
          <Chip value="b">Beta</Chip>
        </ChipList>
      </ChipGroup>
    )
    const grid = screen.getByRole("grid", { name: "One disabled" })
    const [alpha, beta] = grid.querySelectorAll('[role="row"]')
    expect(alpha).toHaveAttribute("data-disabled", "")
    expect(alpha).toHaveAttribute("aria-disabled", "true")
    expect(beta).not.toHaveAttribute("data-disabled")
    await userEvent.click(alpha)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("disables every chip with disabled on the group", async () => {
    const onRemove = vi.fn()
    render(<Tags disabled selectionMode="multiple" onRemove={onRemove} />)
    for (const row of rows()) expect(row).toHaveAttribute("data-disabled", "")
    rows()[0].focus()
    await userEvent.keyboard("{Delete}")
    expect(onRemove).not.toHaveBeenCalled()
  })

  it("merges className on the chip", () => {
    const { container } = render(<Tags chip={{ className: "extra" }} />)
    expect(container.querySelector('[data-slot="chip"]')).toHaveClass(
      "extra",
      "inline-flex"
    )
  })

  it("names a chip by its label when the children are not plain text", () => {
    render(
      <ChipGroup aria-label="Icons" selectionMode="single">
        <ChipList>
          <Chip value="pin" label="Pinned">
            <svg data-icon="inline-start" />
          </Chip>
        </ChipList>
      </ChipGroup>
    )
    expect(screen.getByRole("row", { name: "Pinned" })).toBeInTheDocument()
  })

  it("renders chips from items, and the empty content when there are none", async () => {
    render(<Removable />)
    expect(rows().map((row) => row.textContent)).toEqual(["A-7", "B-2", "C-4"])
    for (const button of screen.getAllByRole("button", { name: /^Remove/ })) {
      await userEvent.click(button)
    }
    expect(screen.queryAllByRole("row")).toHaveLength(0)
    // An empty list is a group, not a grid of no rows.
    expect(screen.getByRole("group", { name: "Wells" })).toHaveAttribute(
      "data-empty",
      ""
    )
    expect(screen.getByText("No wells.")).toBeInTheDocument()
  })

  it("ChipRemove renders the X icon unless given children", () => {
    const { container } = render(
      <ChipGroup aria-label="t" onRemove={() => {}}>
        <ChipList>
          <Chip value="a">A</Chip>
        </ChipList>
      </ChipGroup>
    )
    expect(
      container.querySelector('[data-slot="chip-remove"] svg')
    ).toBeInTheDocument()
  })

  it("ChipRemove is a button labelled Remove", () => {
    render(<ChipRemove>x</ChipRemove>)
    expect(screen.getByRole("button", { name: "Remove" })).toHaveTextContent(
      "x"
    )
  })
})

describe("Chip keyboard", () => {
  it("moves between chips with the arrow keys", async () => {
    render(<Removable />)
    const [a, b, c] = rows()
    a.focus()
    await userEvent.keyboard("{ArrowRight}")
    expect(b).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    expect(c).toHaveFocus()
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}")
    expect(a).toHaveFocus()
  })

  it("is one tab stop", async () => {
    render(
      <>
        <button type="button">Before</button>
        <Tags selectionMode="multiple" />
        <button type="button">After</button>
      </>
    )
    screen.getByRole("button", { name: "Before" }).focus()
    await userEvent.tab()
    expect(rows()[0]).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus()
  })

  it("removes the focused chip with Delete and moves focus to the next", async () => {
    render(<Removable />)
    rows()[1].focus()
    await userEvent.keyboard("{Delete}")
    expect(rows().map((row) => row.textContent)).toEqual(["A-7", "C-4"])
    expect(screen.getByRole("row", { name: "C-4" })).toHaveFocus()
  })

  it("removes the last chip with Backspace and moves focus to the one before", async () => {
    render(<Removable />)
    rows()[2].focus()
    await userEvent.keyboard("{Backspace}")
    expect(rows().map((row) => row.textContent)).toEqual(["A-7", "B-2"])
    expect(screen.getByRole("row", { name: "B-2" })).toHaveFocus()
  })

  it("reverses the arrow keys right to left", async () => {
    render(
      <TectonProvider direction="rtl">
        <Removable />
      </TectonProvider>
    )
    const [a, b] = rows()
    a.focus()
    await userEvent.keyboard("{ArrowLeft}")
    expect(b).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    expect(a).toHaveFocus()
  })

  it("names the remove button in the provider's locale", () => {
    render(
      <TectonProvider locale="de-DE">
        <Removable />
      </TectonProvider>
    )
    expect(
      screen.getByRole("button", { name: "Entfernen A-7" })
    ).toBeInTheDocument()
  })
})
