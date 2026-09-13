import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

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
