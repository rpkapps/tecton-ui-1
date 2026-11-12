import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@tecton/react/input-otp"
import { Select, SelectTrigger } from "@tecton/react/select"

// The registry build turns the style's `cn-*` classes into Tailwind classes,
// but only inside a `className` or a `cva()`. A `cn-*` class anywhere else
// reaches the generated component raw and has no CSS, so the variant silently
// renders as the default one. `scripts/registry-mirror.sh build` fails on those;
// these tests pin the rendered result.

const COMPONENTS_DIR = path.join(import.meta.dirname, "../../components")

describe("generated components", () => {
  it("carry no raw cn-* class", () => {
    const leftovers = readdirSync(COMPONENTS_DIR)
      .filter((file) => file.endsWith(".tsx"))
      .flatMap((file) =>
        [
          ...readFileSync(`${COMPONENTS_DIR}/${file}`, "utf8").matchAll(
            /\bcn-[\w-]+/g
          ),
        ].map((match) => `${file}: ${match[0]}`)
      )
    expect(leftovers).toEqual([])
  })
})

describe("SelectTrigger variant", () => {
  function renderTrigger(variant?: "outline" | "filled" | "text") {
    render(
      <Select>
        <SelectTrigger aria-label="Well" variant={variant}>
          Pick
        </SelectTrigger>
      </Select>
    )
    // Base UI's Select trigger is a combobox (it owns the listbox popup).
    return screen.getByRole("combobox")
  }

  it("renders the outline border by default", () => {
    const trigger = renderTrigger()
    expect(trigger).toHaveAttribute("data-variant", "outline")
    expect(trigger).toHaveClass("rounded-md", "border", "bg-transparent")
  })

  it("renders filled as a filled field with no border", () => {
    const trigger = renderTrigger("filled")
    expect(trigger).toHaveAttribute("data-variant", "filled")
    expect(trigger).toHaveClass(
      "bg-input-filled",
      "border-transparent",
      "rounded-md"
    )
    expect(trigger).not.toHaveClass("bg-transparent", "border-x-0")
  })

  it("renders text with no underline until focus, and no inline-start padding", () => {
    const trigger = renderTrigger("text")
    // Logical padding: components.json has "rtl": true.
    expect(trigger).toHaveClass(
      "rounded-none",
      "border-x-0",
      "border-transparent",
      "focus-visible:border-ring",
      "ps-0"
    )
    expect(trigger).not.toHaveClass("ps-2")
  })

  it("keeps a visible focus indicator on every variant", () => {
    for (const variant of ["outline", "filled", "text"] as const) {
      const { unmount } = render(
        <Select>
          <SelectTrigger aria-label={variant} variant={variant}>
            Pick
          </SelectTrigger>
        </Select>
      )
      const trigger = screen.getByRole("combobox")
      if (variant === "text") {
        // The underline turns the ring colour instead of drawing a ring.
        expect(trigger).toHaveClass("focus-visible:border-ring")
        expect(trigger).toHaveClass("focus-visible:ring-0")
      } else {
        expect(trigger).toHaveClass(
          "focus-visible:ring-2",
          "focus-visible:ring-ring"
        )
      }
      unmount()
    }
  })
})

describe("InputOTP", () => {
  it("spaces its groups with the style's container gap", () => {
    const { container } = render(
      <InputOTP maxLength={2} containerClassName="custom">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
        </InputOTPGroup>
      </InputOTP>
    )
    expect(container.querySelector(".custom")).toHaveClass(
      "flex",
      "items-center",
      "gap-2"
    )
  })
})
