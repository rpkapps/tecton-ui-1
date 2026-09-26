import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  ColorSwatch,
  colorSwatchPresets,
  colorSwatchVariants,
} from "@tecton/react/tecton/color-swatch"
import { PortalProvider } from "@tecton/react/tecton/portal"

const swatch = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="color-swatch"]')

describe("ColorSwatch", () => {
  it("renders a parseable colour with React Aria's swatch", () => {
    const { container } = render(<ColorSwatch color="#ff0000" />)
    const el = swatch(container)
    expect(el).toHaveAttribute("role", "img")
    // React Aria names the colour ("vibrant red").
    expect(el).toHaveAttribute("aria-roledescription", "color swatch")
    expect(el?.getAttribute("aria-label")).toMatch(/red/)
    expect(el).toHaveClass("size-6", "rounded-md", "border")
    expect(el?.style.backgroundColor).toBe("rgb(255, 0, 0)")
  })

  it("renders an unparseable token as a plain swatch with the value as background", () => {
    const { container } = render(
      <ColorSwatch color="var(--tecton-color-accent-lime-fill)" />
    )
    const el = swatch(container)
    expect(el?.tagName).toBe("SPAN")
    expect(el).toHaveAttribute("role", "img")
    expect(el).toHaveAttribute(
      "aria-label",
      "var(--tecton-color-accent-lime-fill)"
    )
    expect(el?.getAttribute("style")).toContain(
      "var(--tecton-color-accent-lime-fill)"
    )
  })

  it("passes DOM props through to the plain swatch of an unparseable token", () => {
    const onMouseEnter = vi.fn()
    const { container } = render(
      <ColorSwatch
        color="var(--tecton-color-accent-lime-fill)"
        id="lime"
        data-token="accent-lime"
        aria-describedby="legend"
        className="ring"
        style={{ outlineColor: "red" }}
        onMouseEnter={onMouseEnter}
      />
    )
    const el = swatch(container)
    expect(el?.tagName).toBe("SPAN")
    expect(el).toHaveAttribute("id", "lime")
    expect(el).toHaveAttribute("data-token", "accent-lime")
    expect(el).toHaveAttribute("aria-describedby", "legend")
    expect(el).toHaveClass("ring", "size-6", "rounded-md")
    // The token stays the background next to the caller's style.
    expect(el?.style.outlineColor).toBe("red")
    expect(el?.getAttribute("style")).toContain(
      "var(--tecton-color-accent-lime-fill)"
    )
    // Not DOM attributes.
    expect(el).not.toHaveAttribute("color")
    fireEvent.mouseEnter(el!)
    expect(onMouseEnter).toHaveBeenCalledOnce()
  })

  it("names the plain swatch by colorName when there is no aria-label", () => {
    const { container } = render(
      <ColorSwatch color="var(--brand)" colorName="Brand" />
    )
    expect(swatch(container)).toHaveAttribute("aria-label", "Brand")
    expect(swatch(container)).not.toHaveAttribute("colorname")
  })

  it("prefers an explicit aria-label", () => {
    const { container } = render(
      <ColorSwatch color="oklch(0.7 0.1 200)" aria-label="Sea" />
    )
    expect(swatch(container)).toHaveAttribute("aria-label", "Sea")
  })

  it.each([
    ["xs", "size-3"],
    ["sm", "size-4"],
    ["md", "size-6"],
    ["lg", "size-8"],
    ["xl", "size-12"],
  ] as const)("size=%s", (size, cls) => {
    const { container } = render(<ColorSwatch color="#000" size={size} />)
    expect(swatch(container)).toHaveClass(cls)
  })

  it.each([
    ["square", "rounded-sm"],
    ["rounded", "rounded-md"],
    ["circle", "rounded-full"],
  ] as const)("shape=%s", (shape, cls) => {
    const { container } = render(<ColorSwatch color="#000" shape={shape} />)
    expect(swatch(container)).toHaveClass(cls)
  })

  it("puts className on the swatch when there is no text", () => {
    const { container } = render(<ColorSwatch color="#000" className="ring" />)
    expect(swatch(container)).toHaveClass("ring")
    expect(
      container.querySelector('[data-slot="color-swatch-item"]')
    ).toBeNull()
  })

  it("renders label and value beside the swatch and moves className to the item", () => {
    const { container } = render(
      <ColorSwatch
        color="#123456"
        label="Primary"
        value="#123456"
        className="row"
      />
    )
    const item = container.querySelector('[data-slot="color-swatch-item"]')
    expect(item).toHaveClass("row", "inline-flex")
    expect(item).toContainElement(swatch(container))
    expect(swatch(container)).not.toHaveClass("row")
    expect(screen.getByText("Primary")).toHaveClass("font-medium")
    expect(screen.getByText("#123456")).toHaveClass("font-mono")
  })

  it("is static without onChange", () => {
    const { container } = render(<ColorSwatch color="#000" />)
    expect(
      container.querySelector('[data-slot="color-swatch-trigger"]')
    ).toBeNull()
  })

  it("becomes a button that opens a picker with onChange", async () => {
    const onChange = vi.fn()
    render(
      <ColorSwatch
        color="#ff0000"
        onChange={onChange}
        presets={["#00ff00", "#0000ff"]}
      />
    )
    const trigger = screen.getByRole("button", { name: "Edit colour" })
    expect(trigger).toHaveAttribute("data-slot", "color-swatch-trigger")

    await userEvent.click(trigger)
    const picker = await screen.findByRole("dialog")
    expect(
      picker.querySelector("[data-slot='color-swatch-picker']") ?? picker
    ).toBeInTheDocument()
    expect(screen.getByText("Presets")).toBeInTheDocument()
    expect(screen.getByText("Custom")).toBeInTheDocument()
    expect(screen.getByLabelText("Pick a custom colour")).toHaveValue("#ff0000")
    expect(screen.getByRole("textbox", { name: "Hex colour" })).toHaveValue(
      "#FF0000"
    )
  })

  it("emits a hex string when a preset is chosen", async () => {
    const onChange = vi.fn()
    render(
      <ColorSwatch
        color="#ff0000"
        onChange={onChange}
        presets={["#00ff00", "#0000ff"]}
      />
    )
    await userEvent.click(screen.getByRole("button", { name: "Edit colour" }))
    const options = await screen.findAllByRole("option")
    expect(options).toHaveLength(2)
    expect(options[0]).toHaveAttribute("aria-selected", "false")
    await userEvent.click(options[1])
    expect(onChange).toHaveBeenCalledWith("#0000FF")
  })

  it("marks the preset matching the current colour as selected", async () => {
    render(
      <ColorSwatch
        color="#00ff00"
        onChange={() => {}}
        presets={["#00ff00", "#0000ff"]}
      />
    )
    await userEvent.click(screen.getByRole("button", { name: "Edit colour" }))
    const options = await screen.findAllByRole("option")
    expect(options[0]).toHaveAttribute("aria-selected", "true")
    expect(options[1]).toHaveAttribute("aria-selected", "false")
  })

  // A value the browser cannot resolve falls back to the inherited colour; the
  // probe must report it as unresolved, not as the surrounding text colour.
  it("drops a preset that does not resolve instead of offering the text colour", async () => {
    // The picker portals here, so its text colour is a known one.
    const host = document.createElement("div")
    host.style.color = "rgb(9, 9, 9)"
    document.body.append(host)
    render(
      <PortalProvider container={host}>
        <ColorSwatch
          color="#0000ff"
          onChange={() => {}}
          presets={["not-a-colour", "var(--no-such-token)", "#0000ff"]}
        />
      </PortalProvider>
    )
    await userEvent.click(screen.getByRole("button", { name: "Edit colour" }))
    const options = await screen.findAllByRole("option")
    expect(host).toContainElement(options[0])
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveAttribute("aria-selected", "true")
    host.remove()
  })

  it("resolves a colour keyword through the DOM", async () => {
    const onChange = vi.fn()
    render(
      <ColorSwatch
        color="#ff0000"
        onChange={onChange}
        presets={["rebeccapurple"]}
      />
    )
    await userEvent.click(screen.getByRole("button", { name: "Edit colour" }))
    const [option] = await screen.findAllByRole("option")
    await userEvent.click(option)
    expect(onChange).toHaveBeenCalledWith("#663399")
  })

  it("emits from the native colour input", async () => {
    const onChange = vi.fn()
    render(<ColorSwatch color="#ff0000" onChange={onChange} presets={[]} />)
    await userEvent.click(screen.getByRole("button", { name: "Edit colour" }))
    const input = await screen.findByLabelText("Pick a custom colour")
    // No presets: only the custom section renders.
    expect(screen.queryByText("Presets")).toBeNull()
    // jsdom does not open a picker; drive the change event directly.
    fireEvent.change(input, { target: { value: "#00ff00" } })
    expect(onChange).toHaveBeenCalledWith("#00ff00")
  })

  it("uses the Tecton accent presets by default", () => {
    expect(colorSwatchPresets).toHaveLength(6)
    expect(
      colorSwatchPresets.every((p) =>
        p.startsWith("var(--tecton-color-accent-")
      )
    ).toBe(true)
  })

  it("exposes the variants helper", () => {
    expect(colorSwatchVariants({ size: "xl", shape: "circle" })).toContain(
      "size-12"
    )
    expect(colorSwatchVariants({ size: "xl", shape: "circle" })).toContain(
      "rounded-full"
    )
  })
})
