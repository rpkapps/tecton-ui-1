import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { materialSymbolCodepoints } from "../material-codepoints"
import { tectonIconTable } from "../names"

/**
 * `Icon` keeps the font state in one module-level store, so every test loads a
 * fresh copy of the module with the `document.fonts` it wants to see.
 */
type FaceMock = { family: string; status: string }

type FontsMock = {
  load: ReturnType<typeof vi.fn>
  faces: Array<FaceMock>
  forEach: (callback: (face: FaceMock) => void) => void
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
  dispatch: (type: string) => void
}

function fontsMock(
  load: (font: string) => Promise<Array<unknown>>,
  faces: Array<FaceMock> = []
): FontsMock {
  const listeners = new Map<string, Set<() => void>>()
  return {
    load: vi.fn(load),
    faces,
    forEach(callback) {
      for (const face of this.faces) callback(face)
    },
    addEventListener(type, listener) {
      const set = listeners.get(type) ?? new Set<() => void>()
      set.add(listener)
      listeners.set(type, set)
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener)
    },
    dispatch(type) {
      for (const listener of listeners.get(type) ?? []) listener()
    },
  }
}

function setFonts(fonts: FontsMock | undefined) {
  if (fonts) {
    Object.defineProperty(document, "fonts", { value: fonts, configurable: true })
  } else {
    delete (document as { fonts?: unknown }).fonts
  }
}

/** A fresh `./icon` (and `./material`), with the font store reset. */
async function loadIcons(fonts?: FontsMock) {
  vi.resetModules()
  setFonts(fonts)
  const icon = await import("../icon")
  const material = await import("../material")
  return { ...icon, ...material }
}

const host = () => document.querySelector("svg") as SVGSVGElement
const glyph = () => document.querySelector("text")
const codepointOf = (element: Element | null) =>
  element === null ? undefined : String(element.textContent).codePointAt(0)

afterEach(() => {
  setFonts(undefined)
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("Icon", () => {
  it("renders an svg host with the icon's size and data attributes", async () => {
    const { Icon } = await loadIcons()
    render(<Icon name="close" />)

    const svg = host()
    expect(svg.tagName.toLowerCase()).toBe("svg")
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24")
    expect(svg).toHaveAttribute("width", "24")
    expect(svg).toHaveAttribute("height", "24")
    expect(svg).toHaveAttribute("fill", "currentColor")
    expect(svg).toHaveAttribute("data-tecton-icon", "close")
    expect(svg).toHaveAttribute("data-tecton-source", "symbol")
    expect(svg).toHaveAttribute("data-tecton-variant", "outlined")
    expect(svg).toHaveAttribute("data-state", "ready")
    expect(svg).toHaveAttribute("aria-hidden", "true")
    expect(svg).not.toHaveAttribute("role")
  })

  it("passes size, className and svg props through", async () => {
    const { Icon } = await loadIcons()
    render(<Icon name="close" size={16} className="size-4 text-primary" data-icon="inline-start" />)

    const svg = host()
    expect(svg).toHaveAttribute("width", "16")
    expect(svg).toHaveAttribute("height", "16")
    expect(svg).toHaveClass("size-4", "text-primary")
    expect(svg).toHaveAttribute("data-icon", "inline-start")
  })

  it("is labelled as an image when a label is given", async () => {
    const { Icon } = await loadIcons()
    render(<Icon name="close" aria-label="Close" />)

    const svg = screen.getByRole("img", { name: "Close" })
    expect(svg).not.toHaveAttribute("aria-hidden")
  })

  it("renders the Material codepoint of a symbol-backed icon, FILL per variant", async () => {
    const { Icon } = await loadIcons()
    const record = tectonIconTable["check-circle"]
    expect(record.source).toBe("symbol")
    const codepoint = record.source === "symbol" ? record.codepoint : 0

    const { rerender } = render(<Icon name="check-circle" />)
    expect(codepointOf(glyph())).toBe(codepoint)
    expect(codepointOf(glyph())).toBe(materialSymbolCodepoints.check_circle)
    expect(glyph()).toHaveClass("tecton-symbols")
    expect(glyph()?.getAttribute("style")).toContain("--tecton-symbol-fill: 0")
    expect(glyph()).toHaveAttribute("font-size", "24")
    expect(glyph()).toHaveAttribute("x", "0")
    expect(glyph()).toHaveAttribute("y", "24")

    rerender(<Icon name="check-circle" variant="filled" />)
    // One codepoint, two variants: the font's FILL axis moves.
    expect(codepointOf(glyph())).toBe(codepoint)
    expect(glyph()?.getAttribute("style")).toContain("--tecton-symbol-fill: 1")
    expect(host()).toHaveAttribute("data-tecton-variant", "filled")
  })

  it("renders the two codepoints of a domain-backed icon", async () => {
    const { Icon } = await loadIcons()
    const record = tectonIconTable.well
    expect(record.source).toBe("domain")
    const { outlined, filled } = record.source === "domain" ? record : { outlined: 0, filled: 0 }
    expect(outlined).toBe(0x10007e)
    expect(filled).toBe(outlined + 0x800)

    const { rerender } = render(<Icon name="well" />)
    expect(host()).toHaveAttribute("data-tecton-source", "domain")
    expect(codepointOf(glyph())).toBe(outlined)

    rerender(<Icon name="well" variant="filled" />)
    expect(codepointOf(glyph())).toBe(filled)
  })

  it("keeps the inline SVG of a colour drawing", async () => {
    const { Icon } = await loadIcons()
    render(<Icon name="strata" size={32} />)

    const svg = host()
    expect(svg).toHaveAttribute("data-tecton-source", "svg")
    expect(svg).toHaveAttribute("width", "32")
    expect(glyph()).toBeNull()
    // Figma's conic gradient, which is why this one is not a font glyph.
    expect(svg.querySelector("foreignObject")).not.toBeNull()
  })

  it("renders the unknown glyph for a name the table does not have, warning once", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { Icon } = await loadIcons()

    const { rerender } = render(<Icon name="not-a-real-icon" />)
    expect(host()).toHaveAttribute("data-tecton-source", "unknown")
    expect(codepointOf(glyph())).toBe(0x100000)

    rerender(<Icon name="not-a-real-icon" size={16} />)
    render(<Icon name="not-a-real-icon" />)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain("not-a-real-icon")
  })

  it("gives a named component per icon through tectonIcon", async () => {
    const { tectonIcon } = await loadIcons()
    const WellIcon = tectonIcon("well")
    expect(WellIcon.displayName).toBe("WellIcon")

    render(<WellIcon variant="filled" />)
    expect(host()).toHaveAttribute("data-tecton-icon", "well")
    expect(codepointOf(glyph())).toBe(0x10087e)
  })
})

describe("MaterialSymbol", () => {
  it("renders a Material codepoint from the raw catalogue", async () => {
    const { MaterialSymbol } = await loadIcons()
    render(<MaterialSymbol name="rocket_launch" variant="filled" />)

    const svg = host()
    expect(svg).toHaveAttribute("data-tecton-icon", "rocket_launch")
    expect(svg).toHaveAttribute("data-tecton-source", "material")
    expect(codepointOf(glyph())).toBe(materialSymbolCodepoints.rocket_launch)
    expect(glyph()?.getAttribute("style")).toContain("--tecton-symbol-fill: 1")
  })

  it("falls back to the unknown glyph for a name Google does not have", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { MaterialSymbol } = await loadIcons()
    render(<MaterialSymbol name="not_a_material_symbol" />)

    expect(codepointOf(glyph())).toBe(0x100000)
    expect(warn).toHaveBeenCalledTimes(1)
  })
})

describe("font readiness", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it("is ready immediately when the environment has no FontFaceSet", async () => {
    const { Icon } = await loadIcons()
    render(<Icon name="close" />)

    expect(host()).toHaveAttribute("data-state", "ready")
    expect(glyph()?.getAttribute("style") ?? "").not.toContain("visibility")
    expect(document.querySelector(".tecton-symbol-skeleton")).toBeNull()
  })

  it("draws the hidden glyph and the skeleton while the fonts load, then the glyph", async () => {
    let resolve: (faces: Array<unknown>) => void = () => {}
    const pending = new Promise<Array<unknown>>((r) => {
      resolve = r
    })
    const fonts = fontsMock(() => pending)
    const { Icon } = await loadIcons(fonts)

    render(<Icon name="close" />)
    expect(host()).toHaveAttribute("data-state", "loading")
    // The text stays in the DOM (the browser only fetches a font it lays out).
    expect(glyph()?.getAttribute("style")).toContain("visibility: hidden")
    expect(document.querySelector(".tecton-symbol-skeleton")).not.toBeNull()
    expect(fonts.load).toHaveBeenCalledTimes(3)

    await act(async () => {
      resolve([{}])
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(host()).toHaveAttribute("data-state", "ready")
    expect(glyph()?.getAttribute("style") ?? "").not.toContain("visibility")
    expect(document.querySelector(".tecton-symbol-skeleton")).toBeNull()
  })

  it("gives up on a rejected load after 5s and draws the placeholder", async () => {
    const fonts = fontsMock(() => Promise.reject(new Error("network")))
    const { Icon } = await loadIcons(fonts)

    render(<Icon name="close" />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4999)
    })
    expect(host()).toHaveAttribute("data-state", "loading")

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(host()).toHaveAttribute("data-state", "unavailable")
    expect(glyph()).toBeNull()
    const placeholder = host().querySelector("rect")
    expect(placeholder).toHaveAttribute("stroke-dasharray", "3 2")
    expect(placeholder).toHaveAttribute("fill", "none")
  })

  it("treats a load that matches no face as unavailable", async () => {
    const fonts = fontsMock(() => Promise.resolve([]))
    const { Icon } = await loadIcons(fonts)

    render(<Icon name="close" />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })
    expect(host()).toHaveAttribute("data-state", "unavailable")
  })

  it("accepts a loaded face even when the set's load() rejects", async () => {
    // What a page looks like when a blocked font is followed by a working
    // stylesheet: the errored face keeps rejecting load(), the new one is fine.
    const fonts = fontsMock(() => Promise.reject(new Error("blocked")), [
      { family: '"Tecton Symbols"', status: "error" },
    ])
    const { Icon } = await loadIcons(fonts)

    render(<Icon name="close" />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })
    expect(host()).toHaveAttribute("data-state", "unavailable")

    fonts.faces.push({ family: "Tecton Symbols", status: "loaded" })
    await act(async () => {
      fonts.dispatch("loadingdone")
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(host()).toHaveAttribute("data-state", "ready")
  })

  it("flips back to ready when a font arrives late", async () => {
    let faces: Array<unknown> = []
    const fonts = fontsMock(() => Promise.resolve(faces))
    const { Icon } = await loadIcons(fonts)

    render(<Icon name="close" />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })
    expect(host()).toHaveAttribute("data-state", "unavailable")

    faces = [{}]
    await act(async () => {
      fonts.dispatch("loadingdone")
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(host()).toHaveAttribute("data-state", "ready")
    expect(codepointOf(glyph())).toBe(materialSymbolCodepoints.close)
  })
})
