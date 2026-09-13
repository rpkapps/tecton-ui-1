import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  Chip,
  ChipGroup,
  ChipList,
  ChipRemove,
} from "@tecton/react/tecton/chip"

function Tags(
  props: React.ComponentProps<typeof ChipGroup> & {
    chip?: Partial<React.ComponentProps<typeof Chip>>
  }
) {
  const { chip, ...group } = props
  return (
    <ChipGroup aria-label="Tags" {...group}>
      <ChipList>
        <Chip id="a" textValue="Alpha" {...chip}>
          Alpha
        </Chip>
        <Chip id="b" textValue="Beta" {...chip}>
          Beta
        </Chip>
      </ChipList>
    </ChipGroup>
  )
}

describe("Chip", () => {
  it("renders a tag group with rows styled like badges", () => {
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

  it("does not render a remove button unless the group allows removing", () => {
    const { container } = render(<Tags />)
    expect(container.querySelector('[data-slot="chip-remove"]')).toBeNull()
  })

  it("renders a remove button per chip and calls onRemove with its key", async () => {
    const onRemove = vi.fn()
    const { container } = render(<Tags onRemove={onRemove} />)
    const removes = container.querySelectorAll('[data-slot="chip-remove"]')
    expect(removes).toHaveLength(2)
    expect(removes[0]).toHaveAttribute("aria-label", "Remove")
    await userEvent.click(removes[1])
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect([...onRemove.mock.calls[0][0]]).toEqual(["b"])
  })

  it("selects chips in the group", async () => {
    const onSelectionChange = vi.fn()
    const { container } = render(
      <Tags selectionMode="multiple" onSelectionChange={onSelectionChange} />
    )
    const [alpha] = container.querySelectorAll('[data-slot="chip"]')
    await userEvent.click(alpha)
    expect(alpha).toHaveAttribute("data-selected", "true")
    expect([...onSelectionChange.mock.calls[0][0]]).toEqual(["a"])
  })

  it("reflects the disabled state", () => {
    const { container } = render(<Tags disabledKeys={["a"]} />)
    const [alpha, beta] = container.querySelectorAll('[data-slot="chip"]')
    expect(alpha).toHaveAttribute("data-disabled", "true")
    expect(beta).not.toHaveAttribute("data-disabled")
  })

  it("merges className on the chip", () => {
    const { container } = render(<Tags chip={{ className: "extra" }} />)
    expect(container.querySelector('[data-slot="chip"]')).toHaveClass(
      "extra",
      "inline-flex"
    )
  })

  it("ChipRemove renders custom children in place of the icon", () => {
    const { container } = render(
      <ChipGroup aria-label="t" onRemove={() => {}}>
        <ChipList>
          <Chip id="a" textValue="A">
            A
          </Chip>
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
