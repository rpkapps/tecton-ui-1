import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "@tecton/react/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tecton/react/dropdown-menu"

// `DropdownMenu` is not modal unless it is given `modal` (the overlay patch,
// docs/UPSTREAM.md "Overlay hunks"): a modal menu locks the page's scroll,
// which restyles the whole document at each open and close.

// The scroll lock is taken and released in a timeout.
const settle = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 50)))

// A modal menu's backdrop, over the page.
const backdrop = () =>
  document.querySelector('[role="presentation"][data-base-ui-inert]')

function Menu({
  modal,
  onOutside,
}: {
  modal?: boolean
  onOutside?: () => void
}) {
  return (
    <>
      <DropdownMenu modal={modal}>
        <DropdownMenuTrigger render={<Button />}>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button onClick={onOutside}>Outside</Button>
    </>
  )
}

describe("DropdownMenu modal", () => {
  it("is not modal by default: no scroll lock, no backdrop", async () => {
    const user = userEvent.setup()
    render(<Menu />)
    const html = document.documentElement
    const before = html.getAttribute("style")
    await user.click(screen.getByRole("button", { name: "Actions" }))
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    await settle()
    expect(backdrop()).toBeNull()
    expect(html.getAttribute("style")).toBe(before)
    expect(html).not.toHaveAttribute("data-base-ui-scroll-locked")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    // Escape still returns focus to the trigger.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Actions" })).toHaveFocus()
    )
  })

  it("lets a press outside close the menu and reach what it pressed", async () => {
    const user = userEvent.setup()
    const onOutside = vi.fn()
    render(<Menu onOutside={onOutside} />)
    await user.click(screen.getByRole("button", { name: "Actions" }))
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Outside" }))
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    expect(onOutside).toHaveBeenCalledTimes(1)
  })

  it("is modal with `modal`: the page's scroll is locked under a backdrop", async () => {
    const user = userEvent.setup()
    render(<Menu modal />)
    const html = document.documentElement
    const before = html.getAttribute("style")
    await user.click(screen.getByRole("button", { name: "Actions" }))
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    await settle()
    expect(backdrop()).not.toBeNull()
    expect(html.getAttribute("style")).not.toBe(before)
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    await settle()
    // Released as the menu closes.
    expect(html.getAttribute("style") ?? "").toBe(before ?? "")
  })
})
