import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"

import { Button } from "@tecton/react/components/button"
import { Dialog, DialogTrigger } from "@tecton/react/components/dialog"
import { ThemeRoot } from "@tecton/react/tecton/theme-root"

function root() {
  return document.querySelector<HTMLElement>('[data-slot="theme-root"]')!
}

function containers() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      'body > [data-slot="theme-root-overlay"][data-tecton-root]'
    )
  )
}

function container() {
  const [only, ...rest] = containers()
  expect(rest).toEqual([])
  return only
}

afterEach(() => {
  // The component removes its own container; a supplied one is the test's.
  document
    .querySelectorAll('[data-slot="theme-root-overlay"], [data-supplied]')
    .forEach((element) => element.remove())
})

describe("ThemeRoot", () => {
  it("renders a marked root with the given className and children", () => {
    render(<ThemeRoot className="mfe-a">content</ThemeRoot>)
    expect(root()).toHaveAttribute("data-tecton-root", "")
    expect(root()).toHaveClass("mfe-a")
    expect(root()).toHaveTextContent("content")
  })

  it("creates one body-level overlay container mirroring the root className", () => {
    render(
      <ThemeRoot className="mfe-a" theme="dark">
        content
      </ThemeRoot>
    )
    expect(containers()).toHaveLength(1)
    expect(container().parentElement).toBe(document.body)
    expect(container().className).toBe(root().className)
    expect(container()).toHaveClass("dark", "mfe-a")
  })

  it("portals a Dialog into the overlay container", async () => {
    const user = userEvent.setup()
    render(
      <ThemeRoot className="mfe-a">
        <DialogTrigger>
          <Button>Open</Button>
          <Dialog>
            <p>Dialog body</p>
          </Dialog>
        </DialogTrigger>
      </ThemeRoot>
    )
    await user.click(screen.getByRole("button", { name: "Open" }))
    const dialog = await screen.findByRole("dialog")
    expect(dialog.closest("[data-tecton-root]")).toBe(container())
    expect(container()).not.toBe(root())
  })

  it("puts the theme class on the root and the container and swaps it", () => {
    const { rerender } = render(<ThemeRoot theme="dark">content</ThemeRoot>)
    expect(root()).toHaveClass("dark")
    expect(container()).toHaveClass("dark")

    rerender(<ThemeRoot theme="light">content</ThemeRoot>)
    expect(root()).toHaveClass("light")
    expect(root()).not.toHaveClass("dark")
    expect(container()).toHaveClass("light")
    expect(container()).not.toHaveClass("dark")
  })

  it("syncs a className change to the container", () => {
    const { rerender } = render(<ThemeRoot className="mfe-a">x</ThemeRoot>)
    expect(container()).toHaveClass("mfe-a")

    rerender(<ThemeRoot className="mfe-b [--primary:red]">x</ThemeRoot>)
    expect(container().className).toBe(root().className)
    expect(container()).toHaveClass("mfe-b", "[--primary:red]")
    expect(container()).not.toHaveClass("mfe-a")
  })

  it("removes the container on unmount", () => {
    const { unmount } = render(<ThemeRoot>x</ThemeRoot>)
    expect(containers()).toHaveLength(1)
    unmount()
    expect(containers()).toHaveLength(0)
  })

  it("creates no container when overlayContainer is null", async () => {
    const user = userEvent.setup()
    render(
      <ThemeRoot overlayContainer={null}>
        <DialogTrigger>
          <Button>Open</Button>
          <Dialog>
            <p>Dialog body</p>
          </Dialog>
        </DialogTrigger>
      </ThemeRoot>
    )
    expect(containers()).toHaveLength(0)
    await user.click(screen.getByRole("button", { name: "Open" }))
    const dialog = await screen.findByRole("dialog")
    // React Aria's own default: the overlay portals into `document.body`.
    expect(dialog.closest("[data-tecton-root]")).toBeNull()
    expect(document.body.contains(dialog)).toBe(true)
  })

  it("uses a supplied overlayContainer and leaves it in place on unmount", async () => {
    const user = userEvent.setup()
    const supplied = document.createElement("div")
    supplied.setAttribute("data-supplied", "")
    supplied.setAttribute("data-tecton-root", "")
    document.body.append(supplied)

    const { unmount } = render(
      <ThemeRoot overlayContainer={supplied}>
        <DialogTrigger>
          <Button>Open</Button>
          <Dialog>
            <p>Dialog body</p>
          </Dialog>
        </DialogTrigger>
      </ThemeRoot>
    )
    expect(containers()).toHaveLength(0)
    await user.click(screen.getByRole("button", { name: "Open" }))
    const dialog = await screen.findByRole("dialog")
    expect(supplied.contains(dialog)).toBe(true)

    unmount()
    expect(document.body.contains(supplied)).toBe(true)
    supplied.remove()
  })

  it("gives each ThemeRoot its own container", () => {
    render(
      <>
        <ThemeRoot className="mfe-a">a</ThemeRoot>
        <ThemeRoot className="mfe-b" theme="dark">
          b
        </ThemeRoot>
      </>
    )
    expect(containers()).toHaveLength(2)
    expect(containers().map((element) => element.className)).toEqual([
      "mfe-a",
      "dark mfe-b",
    ])
  })
})
