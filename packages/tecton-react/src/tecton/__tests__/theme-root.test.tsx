import { useDirection as useBaseUiDirection } from "@base-ui/react/direction-provider"
import { render, renderHook, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"

import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@tecton/react/components/dialog"
import {
  TectonProvider,
  useDirection,
  useLocale,
} from "@tecton/react/tecton/provider"
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
        <Dialog>
          <DialogTrigger render={<Button />}>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <p>Dialog body</p>
          </DialogContent>
        </Dialog>
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

  it("gives the container no box, so copied layout classes take no space", () => {
    render(
      <ThemeRoot className="mfe-a flex h-full flex-col p-4">content</ThemeRoot>
    )
    expect(container()).toHaveClass("flex", "p-4")
    expect(container().style.display).toBe("contents")
  })

  it("copies only overlayClassName and the theme class when given", () => {
    const { rerender } = render(
      <ThemeRoot
        className="mfe-a flex h-full p-4"
        overlayClassName="mfe-a [--primary:red]"
        theme="dark"
      >
        x
      </ThemeRoot>
    )
    expect(root()).toHaveClass("mfe-a", "flex", "h-full", "p-4", "dark")
    expect(container().className).toBe("dark mfe-a [--primary:red]")

    rerender(
      <ThemeRoot
        className="mfe-a flex h-full p-4"
        overlayClassName="mfe-a"
        theme="light"
      >
        x
      </ThemeRoot>
    )
    expect(container().className).toBe("light mfe-a")
  })

  it("forwards a ref to the root element", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<ThemeRoot ref={ref}>x</ThemeRoot>)
    expect(ref.current).toBe(root())
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
        <Dialog>
          <DialogTrigger render={<Button />}>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <p>Dialog body</p>
          </DialogContent>
        </Dialog>
      </ThemeRoot>
    )
    expect(containers()).toHaveLength(0)
    await user.click(screen.getByRole("button", { name: "Open" }))
    const dialog = await screen.findByRole("dialog")
    // The overlay's own default: it portals into `document.body`.
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
        <Dialog>
          <DialogTrigger render={<Button />}>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <p>Dialog body</p>
          </DialogContent>
        </Dialog>
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

  it("sets dir on the root and the container and feeds the provider", () => {
    const seen: string[] = []
    function Probe() {
      const { locale, direction } = useLocale()
      seen.push(`${locale}/${direction}/${useBaseUiDirection()}`)
      return null
    }
    const { rerender } = render(
      <ThemeRoot dir="rtl" locale="ar-EG">
        <Probe />
      </ThemeRoot>
    )
    expect(root()).toHaveAttribute("dir", "rtl")
    expect(container()).toHaveAttribute("dir", "rtl")
    expect(seen.at(-1)).toBe("ar-EG/rtl/rtl")

    rerender(
      <ThemeRoot dir="ltr" locale="ar-EG">
        <Probe />
      </ThemeRoot>
    )
    expect(root()).toHaveAttribute("dir", "ltr")
    expect(container()).toHaveAttribute("dir", "ltr")
    expect(seen.at(-1)).toBe("ar-EG/ltr/ltr")

    rerender(
      <ThemeRoot>
        <Probe />
      </ThemeRoot>
    )
    expect(root()).not.toHaveAttribute("dir")
    expect(container()).not.toHaveAttribute("dir")
  })

  it("takes the direction from locale when dir is not set", () => {
    render(<ThemeRoot locale="he-IL">x</ThemeRoot>)
    expect(root()).toHaveAttribute("dir", "rtl")
    expect(container()).toHaveAttribute("dir", "rtl")
  })

  it("inherits the direction of an outer TectonProvider", () => {
    const { result } = renderHook(() => useDirection(), {
      wrapper: ({ children }) => (
        <TectonProvider direction="rtl">
          <ThemeRoot>{children}</ThemeRoot>
        </TectonProvider>
      ),
    })
    expect(result.current).toBe("rtl")
    expect(root()).not.toHaveAttribute("dir")
  })

  it("leaves a supplied container's dir alone", () => {
    const supplied = document.createElement("div")
    supplied.setAttribute("data-supplied", "")
    document.body.append(supplied)
    render(
      <ThemeRoot dir="rtl" overlayContainer={supplied}>
        x
      </ThemeRoot>
    )
    expect(root()).toHaveAttribute("dir", "rtl")
    expect(supplied).not.toHaveAttribute("dir")
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
