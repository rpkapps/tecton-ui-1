"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  Button as ButtonPrimitive,
  ColorField as ColorFieldPrimitive,
  ColorSwatch as ColorSwatchPrimitive,
  ColorSwatchPicker as ColorSwatchPickerPrimitive,
  ColorSwatchPickerItem as ColorSwatchPickerItemPrimitive,
  composeRenderProps,
  parseColor,
  type Color,
  type ColorSwatchProps as ColorSwatchPrimitiveProps,
} from "react-aria-components"

import { Input } from "@tecton/react/components/input"
import { Popover, PopoverTrigger } from "@tecton/react/components/popover"
import { Separator } from "@tecton/react/components/separator"

/**
 * Tecton ColorSwatch — a colour preview chip (React Aria `ColorSwatch`)
 * with optional label / value text. Used for colour tags, legends and the
 * theme documentation. Pass `onChange` to make it editable: the swatch
 * becomes a button that opens a picker with preset colours and a hex field.
 */
const colorSwatchVariants = cva(
  "shrink-0 border border-border-subtle shadow-xs",
  {
    variants: {
      size: {
        xs: "size-3",
        sm: "size-4",
        md: "size-6",
        lg: "size-8",
        xl: "size-12",
      },
      shape: {
        square: "rounded-sm",
        rounded: "rounded-md",
        circle: "rounded-full",
      },
    },
    defaultVariants: {
      size: "md",
      shape: "rounded",
    },
  }
)

/** The Tecton accent fills, the default presets of an editable swatch. */
const colorSwatchPresets = [
  "var(--tecton-color-accent-saffron-fill)",
  "var(--tecton-color-accent-lime-fill)",
  "var(--tecton-color-accent-blue-fill)",
  "var(--tecton-color-accent-pink-fill)",
  "var(--tecton-color-accent-lemon-fill)",
  "var(--tecton-color-accent-graphite-fill)",
]

/**
 * React Aria's ColorSwatch only parses hex/rgb/hsl(a) strings. Tecton tokens
 * may be `oklch(...)` or `var(--...)`, so anything it cannot parse is rendered
 * as a plain swatch with the value as CSS background.
 */
function isParseable(color: ColorSwatchPrimitiveProps["color"]) {
  if (typeof color !== "string") return true
  try {
    parseColor(color)
    return true
  } catch {
    return false
  }
}

/** An unlikely colour the probe inherits when the value does not resolve. */
const PROBE_SENTINEL = "rgba(1, 2, 3, 0.004)"

/**
 * Resolves `var(--token)` / other CSS colours to a hex string the picker can
 * compare, or `null`. The probe sits inside a parent painted with a sentinel:
 * an invalid colour, or a `var()` that resolves to nothing, falls back to the
 * inherited colour, and that must read as "unresolved", not as the colour of
 * whatever text surrounds the picker.
 */
function toHex(color: string, el: Element | null): string | null {
  try {
    return parseColor(color).toString("hex")
  } catch {
    if (typeof window === "undefined" || !el) return null
    const parent = document.createElement("span")
    parent.style.color = PROBE_SENTINEL
    const probe = document.createElement("span")
    probe.style.color = color
    parent.appendChild(probe)
    el.appendChild(parent)
    const sentinel = getComputedStyle(parent).color
    const rgb = getComputedStyle(probe).color
    parent.remove()
    if (rgb === sentinel) return null
    try {
      return parseColor(rgb).toString("hex")
    } catch {
      return null
    }
  }
}

type ResolvedColors = {
  current: string | null
  presets: { preset: string; hex: string }[]
}

function resolveColors(
  color: ColorSwatchPrimitiveProps["color"],
  presets: string[],
  root: Element | null
): ResolvedColors {
  return {
    current: !color
      ? null
      : typeof color === "string"
        ? toHex(color, root)
        : color.toString("hex"),
    presets: presets.flatMap((preset) => {
      const hex = toHex(preset, root)
      return hex ? [{ preset, hex }] : []
    }),
  }
}

function sameColors(a: ResolvedColors, b: ResolvedColors) {
  return (
    a.current === b.current &&
    a.presets.length === b.presets.length &&
    a.presets.every(
      (p, i) => p.preset === b.presets[i].preset && p.hex === b.presets[i].hex
    )
  )
}

/**
 * The picker's colours as hex. Parseable values resolve during render; a
 * token (`var(--…)`) needs the DOM, so it is probed in a layout effect once
 * the picker has mounted — never during render — and kept in state.
 */
function useResolvedColors(
  color: ColorSwatchPrimitiveProps["color"],
  presets: string[],
  root: Element | null
) {
  const [resolved, setResolved] = React.useState(() =>
    resolveColors(color, presets, null)
  )
  React.useLayoutEffect(() => {
    const next = resolveColors(color, presets, root)
    setResolved((prev) => (sameColors(prev, next) ? prev : next))
  }, [color, presets, root])
  return resolved
}

type ColorSwatchProps = Omit<ColorSwatchPrimitiveProps, "className"> &
  VariantProps<typeof colorSwatchVariants> & {
    className?: string
    /** Text rendered next to the swatch. */
    label?: React.ReactNode
    /** Secondary text (e.g. the hex value), rendered in mono. */
    value?: React.ReactNode
    /** Makes the swatch editable: called with the new colour as a hex string. */
    onChange?: (color: string) => void
    /** Preset colours offered by the editable picker (defaults to the Tecton accents). */
    presets?: string[]
  }

function ColorSwatch({
  className,
  size = "md",
  shape = "rounded",
  label,
  value,
  onChange,
  presets = colorSwatchPresets,
  ...props
}: ColorSwatchProps) {
  const swatchClass = cn(
    colorSwatchVariants({ size, shape }),
    label || value ? "" : className
  )
  let swatch = isParseable(props.color) ? (
    <ColorSwatchPrimitive
      data-slot="color-swatch"
      className={composeRenderProps(className, () => swatchClass)}
      {...props}
    />
  ) : (
    <span
      data-slot="color-swatch"
      role="img"
      aria-label={props["aria-label"] ?? String(props.color)}
      className={swatchClass}
      style={{ background: String(props.color) }}
    />
  )

  if (onChange) {
    swatch = (
      <ColorSwatchEditor
        color={props.color}
        onChange={onChange}
        presets={presets}
        shape={shape}
        aria-label={props["aria-label"] ?? "Edit colour"}
      >
        {swatch}
      </ColorSwatchEditor>
    )
  }

  if (!label && !value) {
    return swatch
  }

  return (
    <span
      data-slot="color-swatch-item"
      className={cn("inline-flex items-center gap-2 text-sm", className)}
    >
      {swatch}
      <span className="flex min-w-0 flex-col leading-tight">
        {label && <span className="truncate font-medium">{label}</span>}
        {value && (
          <span className="truncate font-mono text-xs text-muted-foreground">
            {value}
          </span>
        )}
      </span>
    </span>
  )
}

function ColorSwatchEditor({
  color,
  onChange,
  presets,
  shape,
  children,
  "aria-label": ariaLabel,
}: {
  color: ColorSwatchPrimitiveProps["color"]
  onChange: (color: string) => void
  presets: string[]
  shape: VariantProps<typeof colorSwatchVariants>["shape"]
  children: React.ReactNode
  "aria-label": string
}) {
  const [root, setRoot] = React.useState<HTMLElement | null>(null)
  const { current, presets: presetValues } = useResolvedColors(
    color,
    presets,
    root
  )
  const emit = React.useCallback(
    (next: Color | null) => {
      if (next) onChange(next.toString("hex"))
    },
    [onChange]
  )

  return (
    <PopoverTrigger>
      <ButtonPrimitive
        data-slot="color-swatch-trigger"
        aria-label={ariaLabel}
        className="inline-flex cursor-pointer rounded-[inherit] transition-[filter,transform] outline-none data-focus-visible:ring-2 data-focus-visible:ring-ring data-focus-visible:ring-offset-1 data-focus-visible:ring-offset-background data-hovered:brightness-110 data-pressed:translate-y-px data-pressed:brightness-95"
      >
        {children}
      </ButtonPrimitive>
      <Popover
        data-slot="color-swatch-picker"
        className="w-auto min-w-64 gap-3 p-3"
      >
        <div ref={setRoot} className="flex flex-col gap-3">
          {presetValues.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Presets
              </span>
              <ColorSwatchPickerPrimitive
                value={current ?? undefined}
                onChange={emit}
                className="flex flex-wrap gap-2"
              >
                {presetValues.map(({ preset, hex }) => (
                  <ColorSwatchPickerItemPrimitive
                    key={preset}
                    color={hex}
                    className={cn(
                      "cursor-pointer rounded-md outline-none data-focus-visible:ring-2 data-focus-visible:ring-ring data-selected:ring-2 data-selected:ring-ring data-selected:ring-offset-1 data-selected:ring-offset-popover",
                      shape === "circle" && "rounded-full",
                      shape === "square" && "rounded-sm"
                    )}
                  >
                    <ColorSwatchPrimitive
                      className={colorSwatchVariants({ size: "md", shape })}
                      style={{ background: preset }}
                    />
                  </ColorSwatchPickerItemPrimitive>
                ))}
              </ColorSwatchPickerPrimitive>
            </div>
          )}
          {presetValues.length > 0 && <Separator emphasis="subtle" />}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Custom
            </span>
            <div className="flex items-center gap-2">
              {/* The custom swatch opens the platform colour picker, like a button. */}
              <label
                data-slot="color-swatch-native"
                className={cn(
                  colorSwatchVariants({ size: "lg", shape }),
                  "relative cursor-pointer overflow-hidden transition-[filter,transform] hover:brightness-110 active:translate-y-px has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-1 has-focus-visible:ring-offset-popover"
                )}
                style={{ background: current ?? "#000000" }}
              >
                <input
                  type="color"
                  aria-label="Pick a custom colour"
                  value={current ?? "#000000"}
                  onChange={(e) => onChange(e.target.value)}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                />
              </label>
              <ColorFieldPrimitive
                aria-label="Hex colour"
                value={current}
                onChange={emit}
                className="flex-1"
              >
                <Input className="font-mono" />
              </ColorFieldPrimitive>
            </div>
          </div>
        </div>
      </Popover>
    </PopoverTrigger>
  )
}

export { ColorSwatch, colorSwatchPresets, colorSwatchVariants }
export type { ColorSwatchProps }
