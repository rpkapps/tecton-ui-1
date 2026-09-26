import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Link, LinkButton } from "@tecton/react/tecton/link"
import { TectonProvider } from "@tecton/react/tecton/provider"

function withRouter(
  ui: React.ReactNode,
  router: {
    navigate?: (href: string, options?: unknown) => void
    useHref?: (href: string) => string
  }
) {
  return render(<TectonProvider {...router}>{ui}</TectonProvider>)
}

/**
 * Clicks `element` and reports whether Tecton prevented the default (i.e.
 * took over the navigation). The browser default is cancelled afterwards,
 * as jsdom cannot navigate.
 */
function click(element: HTMLElement, init: MouseEventInit = {}) {
  let prevented = false
  const record = (event: Event) => {
    prevented = event.defaultPrevented
    event.preventDefault()
  }
  window.addEventListener("click", record, { once: true })
  element.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, ...init })
  )
  return prevented
}

describe("Link", () => {
  it("renders an anchor with the default variant", () => {
    render(<Link href="/wells">Wells</Link>)
    const link = screen.getByRole("link", { name: "Wells" })
    expect(link.tagName).toBe("A")
    expect(link).toHaveAttribute("href", "/wells")
    expect(link).toHaveAttribute("data-slot", "link")
    expect(link).toHaveAttribute("data-variant", "default")
    expect(link).toHaveClass("text-foreground", "hover:underline")
    expect(link).not.toHaveAttribute("target")
    expect(link).not.toHaveAttribute("rel")
    expect(link).not.toHaveAttribute("data-disabled")
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
      <Link href="https://example.com" external>
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
      "hover:text-link-hover-foreground",
      "active:text-link-pressed-foreground"
    )
    expect(link).not.toHaveClass("text-primary-foreground")
  })

  it("styles state with pseudo-classes and aria-disabled, never library data attributes", () => {
    render(<Link href="#">x</Link>)
    const classes = screen.getByRole("link").className
    expect(classes).toContain("focus-visible:ring-2")
    expect(classes).toContain("aria-disabled:opacity-50")
    expect(classes).not.toMatch(/data-(hovered|pressed|focus-visible|disabled)/)
  })

  it("adds a caller's rel to noreferrer noopener on an external link", () => {
    render(
      <Link href="https://example.com" external rel="nofollow">
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

  it("merges className and fires onClick", async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault())
    render(
      <Link href="/go" className="extra" onClick={onClick}>
        Go
      </Link>
    )
    const link = screen.getByRole("link", { name: "Go" })
    expect(link).toHaveClass("extra", "inline-flex")
    await userEvent.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0][0].target).toBe(link)
  })

  it("is disabled: no href, not focusable, aria-disabled, no onClick", async () => {
    const onClick = vi.fn()
    render(
      <Link href="/wells" disabled onClick={onClick}>
        x
      </Link>
    )
    const link = screen.getByRole("link", { name: "x" })
    expect(link.tagName).toBe("A")
    expect(link).not.toHaveAttribute("href")
    expect(link).not.toHaveAttribute("tabindex")
    expect(link).toHaveAttribute("aria-disabled", "true")
    expect(link).toHaveAttribute("data-disabled", "")
    await userEvent.tab()
    expect(link).not.toHaveFocus()
    fireEvent.click(link)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("renders another element through render, keeping the link props", () => {
    render(
      <Link
        href="/wells"
        variant="primary"
        render={<a data-router-link="" />}
        className="extra"
      >
        Wells
      </Link>
    )
    const link = screen.getByRole("link", { name: "Wells" })
    expect(link).toHaveAttribute("data-router-link", "")
    expect(link).toHaveAttribute("href", "/wells")
    expect(link).toHaveClass("text-link-foreground", "extra")
  })

  it("renders through a render function", () => {
    render(
      <Link href="/wells" render={(props) => <a {...props} data-fn="" />}>
        Wells
      </Link>
    )
    expect(screen.getByRole("link", { name: "Wells" })).toHaveAttribute(
      "data-fn",
      ""
    )
  })
})

describe("Link navigation", () => {
  it("lets the browser navigate without a TectonProvider router", () => {
    render(<Link href="/wells">Wells</Link>)
    expect(click(screen.getByRole("link"))).toBe(false)
  })

  it("hands a plain click to the provider's navigate", () => {
    const navigate = vi.fn()
    withRouter(
      <Link href="/wells" navigateOptions={{ replace: true }}>
        Wells
      </Link>,
      { navigate }
    )
    expect(click(screen.getByRole("link"))).toBe(true)
    expect(navigate).toHaveBeenCalledWith("/wells", { replace: true })
  })

  it.each([
    ["metaKey", { metaKey: true }],
    ["ctrlKey", { ctrlKey: true }],
    ["shiftKey", { shiftKey: true }],
    ["altKey", { altKey: true }],
    ["middle button", { button: 1 }],
  ])("leaves a %s click to the browser", (_, init) => {
    const navigate = vi.fn()
    withRouter(<Link href="/wells">Wells</Link>, { navigate })
    expect(click(screen.getByRole("link"), init)).toBe(false)
    expect(navigate).not.toHaveBeenCalled()
  })

  it("leaves target=_blank, external and cross-origin links to the browser", () => {
    const navigate = vi.fn()
    withRouter(
      <>
        <Link href="/a" target="_blank">
          A
        </Link>
        <Link href="/b" external>
          B
        </Link>
        <Link href="https://example.com/c">C</Link>
        <Link href="/d" download>
          D
        </Link>
      </>,
      { navigate }
    )
    for (const name of ["A", "B", "C", "D"]) {
      expect(click(screen.getByRole("link", { name }))).toBe(false)
    }
    expect(navigate).not.toHaveBeenCalled()
  })

  it("does not navigate when onClick prevents the default", () => {
    const navigate = vi.fn()
    withRouter(
      <Link href="/wells" onClick={(event) => event.preventDefault()}>
        Wells
      </Link>,
      { navigate }
    )
    fireEvent.click(screen.getByRole("link"))
    expect(navigate).not.toHaveBeenCalled()
  })

  it("renders the href mapped by the provider's useHref and navigates to the router path", () => {
    const navigate = vi.fn()
    const useHref = vi.fn((href: string) => `/base${href}`)
    withRouter(<Link href="/wells">Wells</Link>, { navigate, useHref })
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/base/wells")
    fireEvent.click(link)
    expect(navigate).toHaveBeenCalledWith("/wells", undefined)
  })

  it("does not navigate a disabled link", () => {
    const navigate = vi.fn()
    withRouter(
      <Link href="/wells" disabled>
        Wells
      </Link>,
      { navigate }
    )
    fireEvent.click(screen.getByRole("link"))
    expect(navigate).not.toHaveBeenCalled()
  })
})

describe("LinkButton", () => {
  it("renders an anchor with the button variants", () => {
    render(
      <LinkButton href="/wells" variant="secondary" size="sm" className="x">
        Open
      </LinkButton>
    )
    const link = screen.getByRole("link", { name: "Open" })
    expect(link.tagName).toBe("A")
    expect(link).toHaveAttribute("href", "/wells")
    expect(link).toHaveAttribute("data-slot", "button")
    expect(link).toHaveAttribute("data-variant", "secondary")
    expect(link).toHaveAttribute("data-size", "sm")
    expect(link).toHaveClass("bg-secondary", "h-7", "x")
  })

  it("defaults to the default variant and size", () => {
    render(<LinkButton href="/">Home</LinkButton>)
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("data-variant", "default")
    expect(link).toHaveAttribute("data-size", "default")
    expect(link).toHaveClass("bg-primary", "h-8")
  })

  it("navigates through the provider and maps the href", () => {
    const navigate = vi.fn()
    withRouter(<LinkButton href="/wells">Wells</LinkButton>, {
      navigate,
      useHref: (href) => `/app${href}`,
    })
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/app/wells")
    fireEvent.click(link)
    expect(navigate).toHaveBeenCalledWith("/wells", undefined)
    click(link, { ctrlKey: true })
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it("is disabled with disabled", () => {
    const navigate = vi.fn()
    withRouter(
      <LinkButton href="/wells" disabled>
        Wells
      </LinkButton>,
      { navigate }
    )
    const link = screen.getByRole("link")
    expect(link).not.toHaveAttribute("href")
    expect(link).toHaveAttribute("aria-disabled", "true")
    expect(link).toHaveAttribute("data-disabled", "")
    expect(link).toHaveClass("aria-disabled:opacity-50")
    fireEvent.click(link)
    expect(navigate).not.toHaveBeenCalled()
  })

  it("renders through render", () => {
    render(
      <LinkButton href="/wells" render={<a data-router-link="" />}>
        Wells
      </LinkButton>
    )
    expect(screen.getByRole("link")).toHaveAttribute("data-router-link", "")
  })
})
