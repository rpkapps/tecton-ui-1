import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Link } from "@tecton/react/tecton/link"

describe("Link", () => {
  it("renders an anchor with the default variant", () => {
    render(<Link href="/wells">Wells</Link>)
    const link = screen.getByRole("link", { name: "Wells" })
    expect(link).toHaveAttribute("href", "/wells")
    expect(link).toHaveAttribute("data-slot", "link")
    expect(link).toHaveAttribute("data-variant", "default")
    expect(link).toHaveClass("text-foreground")
    expect(link).not.toHaveAttribute("target")
    expect(link).not.toHaveAttribute("rel")
    expect(link.querySelector("svg")).toBeNull()
  })

  it.each([
    ["primary", "text-link-foreground"],
    ["muted", "text-muted-foreground"],
    ["subtle", "underline"],
  ] as const)("variant=%s", (variant, cls) => {
    render(
      <Link href="#" variant={variant}>
        x
      </Link>
    )
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("data-variant", variant)
    expect(link).toHaveClass(cls)
  })

  it.each([
    ["sm", "text-xs"],
    ["md", "text-sm"],
    ["lg", "text-base"],
  ] as const)("size=%s", (size, cls) => {
    render(
      <Link href="#" size={size}>
        x
      </Link>
    )
    expect(screen.getByRole("link")).toHaveClass(cls)
  })

  it("opens external links in a new tab with a safe rel and an icon", () => {
    render(
      <Link href="https://example.com" isExternal>
        Docs
      </Link>
    )
    const link = screen.getByRole("link", { name: "Docs" })
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noreferrer noopener")
    expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  it("paints variant=primary with the link colours, never primary-foreground", () => {
    render(
      <Link href="#" variant="primary">
        x
      </Link>
    )
    const link = screen.getByRole("link")
    expect(link).toHaveClass(
      "text-link-foreground",
      "data-hovered:text-link-hover-foreground",
      "data-pressed:text-link-pressed-foreground"
    )
    expect(link).not.toHaveClass("text-primary-foreground")
  })

  it("adds a caller's rel to noreferrer noopener on an external link", () => {
    render(
      <Link href="https://example.com" isExternal rel="nofollow">
        Docs
      </Link>
    )
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "rel",
      "noreferrer noopener nofollow"
    )
  })

  it("keeps an explicit target and rel when not external", () => {
    render(
      <Link href="#" target="_parent" rel="nofollow">
        x
      </Link>
    )
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("target", "_parent")
    expect(link).toHaveAttribute("rel", "nofollow")
  })

  it("merges className and fires onPress", async () => {
    const onPress = vi.fn()
    render(
      <Link className="extra" onPress={onPress}>
        Go
      </Link>
    )
    const link = screen.getByText("Go")
    expect(link).toHaveClass("extra", "inline-flex")
    await userEvent.click(link)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it("is disabled with isDisabled", () => {
    render(
      <Link href="#" isDisabled>
        x
      </Link>
    )
    expect(screen.getByText("x")).toHaveAttribute("data-disabled", "true")
  })
})
