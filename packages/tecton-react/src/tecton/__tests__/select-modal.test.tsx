import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "@tecton/react/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

// `Select` is not modal unless it is given `modal`, and its list opens below
// the trigger unless `SelectContent` is given `alignItemWithTrigger` (the
// overlay patch, docs/UPSTREAM.md "Overlay hunks"): a modal Select, and one
// whose list is aligned over the trigger, lock the page's scroll, which
// restyles the whole document at each open and close.

// The scroll lock is taken and released in a timeout.
const settle = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 50)))

// A modal Select's backdrop, over the page.
const backdrop = () =>
  document.querySelector('[role="presentation"][data-base-ui-inert]')

const items = { a: "Alpha", b: "Bravo" }

function Field({
  modal,
  alignItemWithTrigger,
  onOutside,
}: {
  modal?: boolean
  alignItemWithTrigger?: boolean
  onOutside?: () => void
}) {
  return (
    <>
      <Select modal={modal} items={items} defaultValue="a">
        <SelectTrigger aria-label="Well">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={alignItemWithTrigger}>
          <SelectItem value="a">Alpha</SelectItem>
          <SelectItem value="b">Bravo</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={onOutside}>Outside</Button>
    </>
  )
}

const trigger = () => screen.getByRole("combobox", { name: "Well" })
const popup = () => document.querySelector("[data-slot=select-content]")

describe("Select modal", () => {
  it("is not modal by default: no scroll lock, no backdrop", async () => {
    const user = userEvent.setup()
    render(<Field />)
    const html = document.documentElement
    const before = html.getAttribute("style")
    await user.click(trigger())
    expect(await screen.findByRole("listbox")).toBeInTheDocument()
    await settle()
    expect(backdrop()).toBeNull()
    expect(html.getAttribute("style")).toBe(before)
    expect(html).not.toHaveAttribute("data-base-ui-scroll-locked")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    // Escape still returns focus to the trigger.
    await waitFor(() => expect(trigger()).toHaveFocus())
  })

  it("opens the list below the trigger by default, not over it", async () => {
    const user = userEvent.setup()
    render(<Field />)
    await user.click(trigger())
    expect(await screen.findByRole("listbox")).toBeInTheDocument()
    expect(popup()).toHaveAttribute("data-align-trigger", "false")
    expect(popup()).toHaveAttribute("data-side", "bottom")
    expect(popup()).toHaveAttribute("data-align", "start")
  })

  it("lets a press outside close the list and reach what it pressed", async () => {
    const user = userEvent.setup()
    const onOutside = vi.fn()
    render(<Field onOutside={onOutside} />)
    await user.click(trigger())
    expect(await screen.findByRole("listbox")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Outside" }))
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    expect(onOutside).toHaveBeenCalledTimes(1)
  })

  it("still picks a value", async () => {
    const user = userEvent.setup()
    render(<Field />)
    await user.click(trigger())
    await user.click(await screen.findByRole("option", { name: "Bravo" }))
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    expect(trigger()).toHaveTextContent("Bravo")
  })

  it("is modal with `modal`: the page's scroll is locked under a backdrop", async () => {
    const user = userEvent.setup()
    render(<Field modal />)
    const html = document.documentElement
    const before = html.getAttribute("style")
    await user.click(trigger())
    expect(await screen.findByRole("listbox")).toBeInTheDocument()
    await settle()
    expect(backdrop()).not.toBeNull()
    expect(html.getAttribute("style")).not.toBe(before)
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull())
    await settle()
    // Released as the list closes.
    expect(html.getAttribute("style") ?? "").toBe(before ?? "")
  })

  it("aligns the selected item over the trigger with `alignItemWithTrigger`", async () => {
    const user = userEvent.setup()
    render(<Field alignItemWithTrigger />)
    await user.click(trigger())
    expect(await screen.findByRole("listbox")).toBeInTheDocument()
    expect(popup()).toHaveAttribute("data-align-trigger", "true")
  })
})
