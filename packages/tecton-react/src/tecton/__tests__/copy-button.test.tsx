import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { CopyButton } from "@tecton/react/tecton/copy-button"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe("CopyButton", () => {
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("is an icon-only ghost button labelled Copy by default", () => {
    render(<CopyButton value="abc" />)
    const button = screen.getByRole("button", { name: "Copy" })
    expect(button).toHaveAttribute("data-slot", "copy-button")
    expect(button).toHaveAttribute("data-variant", "ghost")
    expect(button).toHaveAttribute("data-size", "icon-sm")
    expect(button).not.toHaveAttribute("data-copied")
  })

  it("becomes a small labelled button when given children", () => {
    render(<CopyButton value="abc">Copy link</CopyButton>)
    const button = screen.getByRole("button", { name: "Copy link" })
    expect(button).toHaveAttribute("data-size", "sm")
    expect(button).not.toHaveAttribute("aria-label")
  })

  it("respects explicit variant and size", () => {
    render(<CopyButton value="abc" variant="outline" size="lg" />)
    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("data-variant", "outline")
    expect(button).toHaveAttribute("data-size", "lg")
  })

  it("copies the value, reports it and shows the copied state for the timeout", async () => {
    const onCopied = vi.fn()
    render(<CopyButton value="hello" timeout={60} onCopied={onCopied} />)

    await userEvent.click(screen.getByRole("button", { name: "Copy" }))

    expect(writeText).toHaveBeenCalledWith("hello")
    expect(onCopied).toHaveBeenCalledWith("hello")
    const button = screen.getByRole("button", { name: "Copied" })
    expect(button).toHaveAttribute("data-copied", "true")
    expect(button).toHaveClass("data-[copied=true]:text-success")

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copy" })).not.toHaveAttribute(
        "data-copied"
      )
    })
  })

  it("restarts the timeout on a second copy", async () => {
    render(<CopyButton value="v" timeout={400} />)
    const button = screen.getByRole("button")

    await userEvent.click(button)
    await sleep(250)
    await userEvent.click(button)
    await sleep(250)
    // 500ms after the first copy, but only 250ms after the second.
    expect(button).toHaveAttribute("data-copied", "true")
    await waitFor(() => {
      expect(button).not.toHaveAttribute("data-copied")
    })
  })

  it("shows and reports a failure when the clipboard refuses", async () => {
    const error = new Error("denied")
    writeText.mockRejectedValue(error)
    const onCopied = vi.fn()
    const onError = vi.fn()
    render(
      <CopyButton
        value="v"
        timeout={60}
        onCopied={onCopied}
        onError={onError}
      />
    )
    await userEvent.click(screen.getByRole("button", { name: "Copy" }))
    expect(onCopied).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(error)
    const button = screen.getByRole("button", { name: "Copy failed" })
    expect(button).toHaveAttribute("data-error", "true")
    expect(button).not.toHaveAttribute("data-copied")
    expect(button).toHaveClass("data-[error=true]:text-destructive")
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Copy" })).not.toHaveAttribute(
        "data-error"
      )
    )
  })

  it("fails the same way without a Clipboard API", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    })
    const onError = vi.fn()
    render(<CopyButton value="v" onError={onError} />)
    await userEvent.click(screen.getByRole("button", { name: "Copy" }))
    expect(onError).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole("button", { name: "Copy failed" })
    ).toBeInTheDocument()
  })

  it("announces the outcome in a polite live region", async () => {
    const announcer = () =>
      document.querySelector('[data-slot="copy-button-announcer"]')
    render(<CopyButton value="v">Copy link</CopyButton>)
    await userEvent.click(screen.getByRole("button", { name: "Copy link" }))
    expect(announcer()).toHaveAttribute("aria-live", "polite")
    expect(announcer()?.parentElement).toBe(document.body)
    await waitFor(() => expect(announcer()).toHaveTextContent("Copied"))

    writeText.mockRejectedValue(new Error("denied"))
    await userEvent.click(screen.getByRole("button", { name: "Copy link" }))
    await waitFor(() => expect(announcer()).toHaveTextContent("Copy failed"))
    expect(
      document.querySelectorAll('[data-slot="copy-button-announcer"]')
    ).toHaveLength(1)
  })

  it("clears the pending timer on unmount", async () => {
    const setSpy = vi.spyOn(globalThis, "setTimeout")
    const clearSpy = vi.spyOn(globalThis, "clearTimeout")
    const { unmount } = render(<CopyButton value="v" timeout={54321} />)
    await userEvent.click(screen.getByRole("button"))

    const call = setSpy.mock.calls.find(([, delay]) => delay === 54321)
    expect(call).toBeDefined()
    const timer = setSpy.mock.results[setSpy.mock.calls.indexOf(call!)].value

    unmount()
    expect(clearSpy).toHaveBeenCalledWith(timer)
  })
})
