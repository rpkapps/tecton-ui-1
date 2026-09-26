import * as React from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  ColorSwatch,
  colorSwatchPresets,
  colorSwatchVariants,
} from "@tecton/react/tecton/color-swatch"
import { PortalProvider } from "@tecton/react/tecton/portal"

const swatch = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="color-swatch"]')

const nameOf = (color: string) => {
  const { container, unmount } = render(<ColorSwatch color={color} />)
  const name = swatch(container)?.getAttribute("aria-label")
  unmount()
  return name
}

/**
 * jsdom does not resolve `var()`; stand in for the browser by resolving the
 * given tokens wherever they are the computed colour or background.
 */
function resolveTokens(tokens: Record<string, string>) {
  const original = window.getComputedStyle
  return vi
    .spyOn(window, "getComputedStyle")
    .mockImplementation((el, pseudo) => {
      const style = original(el, pseudo)
      const map = (value: string) => tokens[value] ?? value
      return new Proxy(style, {
        get(target, prop) {
          if (prop === "color") return map(target.color)
          if (prop === "backgroundColor") return map(target.backgroundColor)
          const value = Reflect.get(target, prop)
          return typeof value === "function" ? value.bind(target) : value
        },
      })
    })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("ColorSwatch", () => {
  it("renders a named colour swatch image", () => {
    const { container } = render(<ColorSwatch color="#ff0000" />)
    const el = swatch(container)
    expect(el).toHaveAttribute("role", "img")
    expect(el).toHaveAttribute("aria-roledescription", "color swatch")
    expect(el).toHaveAttribute("aria-label", "vibrant red")
    expect(el).toHaveClass("size-6", "rounded-md", "border")
    expect(el?.style.backgroundColor).toBe("rgb(255, 0, 0)")
    expect(el?.style.getPropertyValue("forced-color-adjust")).toBe("none")
    // An opaque colour needs no checkerboard.
    expect(el?.style.backgroundImage).toBe("")
  })

  it("paints a checkerboard behind a translucent colour", () => {
    const { container } = render(<ColorSwatch color="rgb(255 0 0 / 50%)" />)
    const el = swatch(container)
    expect(el?.style.backgroundImage).toContain("repeating-conic-gradient")
    expect(el).toHaveAttribute("aria-label", "vibrant red, 50% transparent")
  })

  it("renders a token as the background, named by its value until it resolves", () => {
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
    // A token may hide an alpha, so it keeps the checkerboard.
    expect(el?.style.backgroundImage).toContain("repeating-conic-gradient")
  })

  it("names a token by the colour it resolves to", () => {
    resolveTokens({ "var(--brand)": "rgb(0, 0, 255)" })
    const { container } = render(
      <ColorSwatch color="var(--brand)" aria-label="Brand" />
    )
    expect(swatch(container)).toHaveAttribute(
      "aria-label",
      "Brand, dark vibrant blue"
    )
  })

  it("names an unresolved token by the caller's label alone", () => {
    const { container } = render(
      <ColorSwatch color="var(--brand)" aria-label="Brand" />
    )
    expect(swatch(container)).toHaveAttribute("aria-label", "Brand")
  })

  it("passes DOM props and the ref through to the swatch", () => {
    const onMouseEnter = vi.fn()
    const ref = React.createRef<HTMLSpanElement>()
    const { container } = render(
      <ColorSwatch
        ref={ref}
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
    expect(ref.current).toBe(el)
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

  it("replaces the generated name with colorName", () => {
    const { container } = render(
      <ColorSwatch color="var(--brand)" colorName="Brand" />
    )
    expect(swatch(container)).toHaveAttribute("aria-label", "Brand")
    expect(swatch(container)).not.toHaveAttribute("colorname")
  })

  it("puts the caller's aria-label before the colour name", () => {
    const { container } = render(
      <ColorSwatch color="oklch(0.7 0.1 200)" aria-label="Sea" />
    )
    expect(swatch(container)).toHaveAttribute("aria-label", "Sea, cyan")
  })

  it("uses a string label as the caller's name", () => {
    render(<ColorSwatch color="#f59e0b" label="Sandstone" value="#f59e0b" />)
    expect(
      screen.getByRole("img", { name: "Sandstone, vibrant orange" })
    ).toBeInTheDocument()
  })

  it("adds aria-labelledby to its own colour name", () => {
    render(
      <>
        <span id="legend">Horizon</span>
        <ColorSwatch color="#0000ff" id="sw" aria-labelledby="legend" />
      </>
    )
    const el = screen.getByRole("img", { name: "dark vibrant blue Horizon" })
    expect(el).toHaveAttribute("aria-labelledby", "sw legend")
  })

  it.each([
    ["#ff0000", "vibrant red"],
    ["#0000ff", "dark vibrant blue"],
    ["#000080", "very dark vibrant blue"],
    ["#00ff00", "vibrant green"],
    ["hsl(120 100% 25%)", "vibrant green"],
    ["#ffff00", "vibrant yellow"],
    ["orange", "vibrant orange"],
    ["#00ffff", "vibrant cyan"],
    ["#ff00ff", "vibrant magenta"],
    ["#8000ff", "vibrant purple"],
    ["rebeccapurple", "dark vibrant purple"],
    ["hotpink", "vibrant pink"],
    ["pink", "pale pink"],
    ["wheat", "pale yellow"],
    ["saddlebrown", "dark brown"],
    ["olive", "olive"],
    ["#64748b", "grayish blue"],
    ["#1e293b", "very dark grayish blue"],
    ["oklch(0.7 0.1 200)", "cyan"],
    ["#ffffff", "white"],
    ["#000000", "black"],
    ["#f5f5f5", "very light gray"],
    ["#cccccc", "light gray"],
    ["#808080", "gray"],
    ["#333333", "dark gray"],
    ["#111111", "very dark gray"],
    ["transparent", "transparent"],
    ["#ff000080", "vibrant red, 50% transparent"],
  ])("names %s as %s", (color, name) => {
    expect(nameOf(color)).toBe(name)
  })

  it("names a swatch without a colour transparent", () => {
    const { container } = render(<ColorSwatch />)
    expect(swatch(container)).toHaveAttribute("aria-label", "transparent")
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
    expect(screen.queryByRole("button")).toBeNull()
  })
})

describe("ColorSwatch editable", () => {
  /** A controlled swatch, as the blocks use it. */
  function Editable({
    initial = "#ff0000",
    presets = ["#00ff00", "#0000ff", "#ff0000"],
    onChange,
  }: {
    initial?: string
    presets?: string[]
    onChange?: (color: string) => void
  }) {
    const [color, setColor] = React.useState(initial)
    return (
      <ColorSwatch
        color={color}
        presets={presets}
        onChange={(next) => {
          onChange?.(next)
          setColor(next)
        }}
      />
    )
  }

  const open = async (name = "Edit colour") => {
    await userEvent.click(screen.getByRole("button", { name }))
    return screen.findByRole("dialog")
  }

  it("becomes a button that opens a picker", async () => {
    render(
      <ColorSwatch
        color="#ff0000"
        onChange={() => {}}
        presets={["#00ff00", "#0000ff"]}
      />
    )
    const trigger = screen.getByRole("button", { name: "Edit colour" })
    expect(trigger).toHaveAttribute("data-slot", "color-swatch-trigger")
    // The swatch inside, named by the current colour, describes the button
    // (jsdom's accname skips aria-label on a description reference, so the
    // reference is checked instead).
    const inner = within(trigger).getByRole("img", { hidden: true })
    expect(trigger).toHaveAttribute("aria-describedby", inner.id)
    expect(inner).toHaveAttribute("aria-label", "vibrant red")

    const picker = await open()
    expect(picker).toHaveAttribute("data-slot", "color-swatch-picker")
    expect(screen.getByText("Presets")).toBeInTheDocument()
    expect(screen.getByText("Custom")).toBeInTheDocument()
    expect(screen.getByLabelText("Pick a custom colour")).toHaveValue("#ff0000")
    expect(screen.getByRole("textbox", { name: "Hex colour" })).toHaveValue(
      "#FF0000"
    )
  })

  it("names the button with the caller's aria-label", async () => {
    render(
      <ColorSwatch
        color="#ff0000"
        onChange={() => {}}
        aria-label="Edit series colour"
        label="Series"
      />
    )
    expect(
      screen.getByRole("button", { name: "Edit series colour" })
    ).toBeInTheDocument()
  })

  it("offers the presets as a radio group labelled by its heading", async () => {
    render(
      <ColorSwatch
        color="#ff0000"
        onChange={() => {}}
        presets={["#00ff00", "#0000ff"]}
      />
    )
    await open()
    const group = screen.getByRole("radiogroup", { name: "Presets" })
    const radios = within(group).getAllByRole("radio")
    expect(radios).toHaveLength(2)
    expect(radios[0]).toHaveAccessibleName("vibrant green")
    expect(radios[1]).toHaveAccessibleName("dark vibrant blue")
    expect(radios[0]).toHaveAttribute("aria-checked", "false")
    expect(radios[1]).toHaveAttribute("aria-checked", "false")
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
    await open()
    await userEvent.click(
      screen.getByRole("radio", { name: "dark vibrant blue" })
    )
    expect(onChange).toHaveBeenCalledWith("#0000FF")
  })

  it("marks the preset matching the current colour as checked", async () => {
    render(
      <ColorSwatch
        color="rgb(0 255 0)"
        onChange={() => {}}
        presets={["#00ff00", "#0000ff"]}
      />
    )
    await open()
    const radios = screen.getAllByRole("radio")
    expect(radios[0]).toHaveAttribute("aria-checked", "true")
    expect(radios[0]).toHaveAttribute("data-checked")
    expect(radios[1]).toHaveAttribute("aria-checked", "false")
  })

  it("moves through the presets with the arrow keys, selecting as it goes", async () => {
    const onChange = vi.fn()
    render(<Editable initial="#00ff00" onChange={onChange} />)
    await open()
    const radios = screen.getAllByRole("radio")
    // Tab lands on the checked preset (roving focus).
    radios[0].focus()
    expect(radios[0]).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    expect(radios[1]).toHaveFocus()
    expect(onChange).toHaveBeenLastCalledWith("#0000FF")
    expect(radios[1]).toHaveAttribute("aria-checked", "true")
    await userEvent.keyboard("{ArrowLeft}")
    expect(radios[0]).toHaveFocus()
    expect(onChange).toHaveBeenLastCalledWith("#00FF00")
    // Only the checked preset is in the tab order.
    expect(radios[0]).toHaveAttribute("tabindex", "0")
    expect(radios[1]).toHaveAttribute("tabindex", "-1")
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
          presets={[
            "not-a-colour",
            "currentColor",
            "var(--no-such-token)",
            "#0000ff",
          ]}
        />
      </PortalProvider>
    )
    await open()
    const radios = await screen.findAllByRole("radio")
    expect(host).toContainElement(radios[0])
    expect(radios).toHaveLength(1)
    expect(radios[0]).toHaveAttribute("aria-checked", "true")
    host.remove()
  })

  it("parses colour keywords", async () => {
    const onChange = vi.fn()
    render(
      <ColorSwatch
        color="#ff0000"
        onChange={onChange}
        presets={["rebeccapurple"]}
      />
    )
    await open()
    await userEvent.click(screen.getByRole("radio"))
    expect(onChange).toHaveBeenCalledWith("#663399")
  })

  it("resolves a token preset through the DOM", async () => {
    resolveTokens({ "var(--brand)": "rgb(0, 128, 0)" })
    const onChange = vi.fn()
    render(
      <ColorSwatch
        color="#ff0000"
        onChange={onChange}
        presets={["var(--brand)"]}
      />
    )
    await open()
    const radio = await screen.findByRole("radio", { name: "vibrant green" })
    await userEvent.click(radio)
    expect(onChange).toHaveBeenCalledWith("#008000")
  })

  it("emits from the native colour input", async () => {
    const onChange = vi.fn()
    render(<ColorSwatch color="#ff0000" onChange={onChange} presets={[]} />)
    await open()
    const input = screen.getByLabelText("Pick a custom colour")
    // No presets: only the custom section renders.
    expect(screen.queryByText("Presets")).toBeNull()
    expect(screen.queryByRole("radiogroup")).toBeNull()
    // jsdom does not open a picker; drive the change event directly.
    fireEvent.change(input, { target: { value: "#00ff00" } })
    expect(onChange).toHaveBeenCalledWith("#00FF00")
  })

  describe("hex field", () => {
    const field = () => screen.getByRole("textbox", { name: "Hex colour" })

    it("commits on Enter", async () => {
      const onChange = vi.fn()
      render(<Editable onChange={onChange} />)
      await open()
      await userEvent.clear(field())
      await userEvent.type(field(), "#00ff00")
      expect(onChange).not.toHaveBeenCalled()
      await userEvent.keyboard("{Enter}")
      expect(onChange).toHaveBeenCalledExactlyOnceWith("#00FF00")
      expect(field()).toHaveValue("#00FF00")
    })

    it("commits on blur and accepts a hex without #", async () => {
      const onChange = vi.fn()
      render(<Editable onChange={onChange} />)
      await open()
      await userEvent.clear(field())
      await userEvent.type(field(), "00f")
      fireEvent.blur(field())
      expect(onChange).toHaveBeenCalledExactlyOnceWith("#0000FF")
      expect(field()).toHaveValue("#0000FF")
    })

    it("accepts any CSS colour and drops its alpha", async () => {
      const onChange = vi.fn()
      render(<Editable onChange={onChange} />)
      await open()
      await userEvent.clear(field())
      await userEvent.type(field(), "rgb(0 128 0 / 50%){Enter}")
      expect(onChange).toHaveBeenCalledExactlyOnceWith("#008000")
    })

    it("reverts invalid input without emitting", async () => {
      const onChange = vi.fn()
      render(<Editable onChange={onChange} />)
      await open()
      await userEvent.clear(field())
      await userEvent.type(field(), "#zzz")
      expect(field()).toHaveValue("#zzz")
      fireEvent.blur(field())
      expect(onChange).not.toHaveBeenCalled()
      expect(field()).toHaveValue("#FF0000")
    })

    it("reverts an empty field", async () => {
      const onChange = vi.fn()
      render(<Editable onChange={onChange} />)
      await open()
      await userEvent.clear(field())
      await userEvent.keyboard("{Enter}")
      expect(onChange).not.toHaveBeenCalled()
      expect(field()).toHaveValue("#FF0000")
    })

    it("does not emit when the colour is unchanged", async () => {
      const onChange = vi.fn()
      render(<Editable onChange={onChange} />)
      await open()
      await userEvent.clear(field())
      await userEvent.type(field(), "#f00{Enter}")
      expect(onChange).not.toHaveBeenCalled()
      expect(field()).toHaveValue("#FF0000")
    })

    it("follows a preset picked while it shows the colour", async () => {
      render(<Editable />)
      await open()
      await userEvent.click(
        screen.getByRole("radio", { name: "vibrant green" })
      )
      expect(field()).toHaveValue("#00FF00")
    })
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
