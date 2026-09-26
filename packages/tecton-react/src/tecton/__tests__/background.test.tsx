import { act, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  Background,
  BackgroundEffect,
  backgroundEffects,
  backgroundIntensities,
  backgroundSpeeds,
  backgroundTones,
  type BackgroundEffectName,
} from "@tecton/react/tecton/background"

const layer = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="background"]')

describe("Background", () => {
  it("renders a decorative, non-interactive layer with the defaults", () => {
    const { container } = render(<Background />)
    const bg = layer(container)
    expect(bg).toHaveAttribute("aria-hidden", "true")
    expect(bg).toHaveAttribute("role", "presentation")
    expect(bg).toHaveAttribute("data-tone", "neutral")
    expect(bg).toHaveAttribute("data-intensity", "medium")
    expect(bg).toHaveAttribute("data-speed", "normal")
    expect(bg).toHaveAttribute("data-animate", "true")
    expect(bg).not.toHaveAttribute("data-paused")
    expect(bg).toHaveClass(
      "pointer-events-none",
      "absolute",
      "inset-0",
      "-z-10"
    )
  })

  it("hoists its stylesheet into the document head once", () => {
    render(
      <>
        <Background />
        <Background />
      </>
    )
    const styles = Array.from(document.head.querySelectorAll("style")).filter(
      (s) => s.textContent.includes('[data-slot="background"]')
    )
    expect(styles).toHaveLength(1)
  })

  it.each(backgroundTones)("tone=%s", (tone) => {
    const { container } = render(<Background tone={tone} />)
    expect(layer(container)).toHaveAttribute("data-tone", tone)
  })

  it.each(backgroundIntensities)("intensity=%s", (intensity) => {
    const { container } = render(<Background intensity={intensity} />)
    expect(layer(container)).toHaveAttribute("data-intensity", intensity)
  })

  it.each(backgroundSpeeds)("speed=%s", (speed) => {
    const { container } = render(<Background speed={speed} />)
    expect(layer(container)).toHaveAttribute("data-speed", speed)
  })

  it("can be frozen with animate={false}", () => {
    const { container } = render(<Background animate={false} />)
    expect(layer(container)).toHaveAttribute("data-animate", "false")
  })

  // The suite's setup stubs IntersectionObserver; a consumer's jsdom (and
  // an old browser) has none, which used to throw on mount.
  describe("without IntersectionObserver", () => {
    const original = globalThis.IntersectionObserver
    afterEach(() => {
      globalThis.IntersectionObserver = original
    })

    it("mounts and still pauses on a hidden tab", () => {
      // @ts-expect-error: removed for this test only
      delete globalThis.IntersectionObserver
      expect(typeof IntersectionObserver).toBe("undefined")
      const visibility = vi
        .spyOn(document, "visibilityState", "get")
        .mockReturnValue("visible")
      const { container, unmount } = render(<Background />)
      expect(layer(container)).not.toHaveAttribute("data-paused")

      visibility.mockReturnValue("hidden")
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"))
      })
      expect(layer(container)).toHaveAttribute("data-paused", "")
      unmount()
      visibility.mockRestore()
    })
  })

  it("ships no unused keyframes", () => {
    render(<Background />)
    const css = Array.from(document.head.querySelectorAll("style"))
      .map((s) => s.textContent)
      .join("")
    expect(css).not.toContain("tecton-bg-drift-y")
    expect(css).toContain("tecton-bg-drift-x")
  })

  it("merges className and passes through props", () => {
    const { container } = render(
      <Background className="opacity-50" data-testid="bg" />
    )
    expect(layer(container)).toHaveClass("opacity-50", "absolute")
    expect(layer(container)).toHaveAttribute("data-testid", "bg")
  })
})

describe("Background effects", () => {
  const names = Object.keys(backgroundEffects) as BackgroundEffectName[]

  it.each(names)("%s renders as a background layer", (name) => {
    const Effect = backgroundEffects[name]
    const { container } = render(<Effect />)
    const bg = layer(container)
    expect(bg).toBeInTheDocument()
    expect(bg).toHaveAttribute("aria-hidden", "true")
    // Every effect draws something.
    expect(bg?.querySelector("svg, canvas, div")).not.toBeNull()
  })

  it.each(names)("%s accepts the shared variants", (name) => {
    const Effect = backgroundEffects[name]
    const { container } = render(
      <Effect tone="lime" intensity="high" speed="slow" animate={false} />
    )
    const bg = layer(container)
    expect(bg).toHaveAttribute("data-tone", "lime")
    expect(bg).toHaveAttribute("data-intensity", "high")
    expect(bg).toHaveAttribute("data-speed", "slow")
    expect(bg).toHaveAttribute("data-animate", "false")
  })

  // The server and the browser may disagree in the last digit of a
  // Math.sin / Math.cos result, and React reports an unrounded coordinate as
  // a hydration mismatch, so the SVG geometry is rounded.
  // (Plain arithmetic such as a dash length is the same everywhere.)
  const GEOMETRY = new Set([
    "x",
    "y",
    "x1",
    "y1",
    "x2",
    "y2",
    "cx",
    "cy",
    "d",
    "points",
    "transform",
  ])
  it.each(names)("%s writes rounded SVG coordinates", (name) => {
    const Effect = backgroundEffects[name]
    const { container } = render(<Effect />)
    const unrounded = Array.from(container.querySelectorAll("svg *")).flatMap(
      (node) =>
        Array.from(node.attributes)
          .filter((attr) => GEOMETRY.has(attr.name))
          .filter((attr) => /\d\.\d{5,}/.test(attr.value))
          .map((attr) => `<${node.tagName} ${attr.name}="${attr.value}">`)
    )
    expect(unrounded).toEqual([])
  })

  // The pulse animates `opacity`, so a dimmed opacity on the same node
  // would never show: the far nodes are dimmed through fill-opacity.
  it("terrain-grid dims the far nodes without fighting the pulse", () => {
    const Effect = backgroundEffects["terrain-grid"]
    const { container } = render(<Effect />)
    const nodes = Array.from(container.querySelectorAll("circle"))
    expect(nodes.length).toBeGreaterThan(0)
    const dimmed = nodes.filter((n) => n.getAttribute("fill-opacity") === "0.5")
    expect(dimmed.length).toBeGreaterThan(0)
    expect(dimmed.length).toBeLessThan(nodes.length)
    for (const node of nodes) {
      expect(node.style.animation).toContain("tecton-bg-pulse")
      expect(node.style.opacity).toBe("")
    }
  })

  it("contour shares its geometry across palettes and recolours it", () => {
    const Effect = backgroundEffects.contour
    const { container, rerender } = render(<Effect palette="map" />)
    const strokes = () =>
      Array.from(container.querySelectorAll("path[stroke]")).map((path) => [
        path.getAttribute("d"),
        path.getAttribute("stroke"),
      ])
    const map = strokes()
    rerender(<Effect palette="tone" />)
    const tone = strokes()
    expect(tone.map(([d]) => d)).toEqual(map.map(([d]) => d))
    expect(new Set(tone.map(([, stroke]) => stroke))).toEqual(
      new Set(["var(--bg-tone)"])
    )
    expect(map.some(([, stroke]) => stroke !== "var(--bg-tone)")).toBe(true)
  })

  it("BackgroundEffect picks the effect by name", () => {
    const { container } = render(
      <BackgroundEffect effect="seismic" tone="azure" />
    )
    expect(layer(container)).toHaveAttribute("data-tone", "azure")
  })

  it("exposes the variant lists", () => {
    expect(backgroundTones).toContain("neutral")
    expect(backgroundIntensities).toEqual(["low", "medium", "high"])
    expect(backgroundSpeeds).toEqual(["slow", "normal", "fast"])
  })
})
