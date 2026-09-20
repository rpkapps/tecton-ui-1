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

/** Resolves `var(--token)` / other CSS colours to a hex string the picker can compare. */
function toHex(color: string, el: Element | null): string | null {
  try {
    return parseColor(color).toString("hex")
  } catch {
    if (typeof window === "undefined" || !el) return null
    const probe = document.createElement("span")
    probe.style.color = color
    el.appendChild(probe)
    const rgb = getComputedStyle(probe).color
    probe.remove()
    try {
      return parseColor(rgb).toString("hex")
    } catch {
      return null
    }
  }
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
  const current = React.useMemo(() => {
    if (!color) return null
    return typeof color === "string"
      ? toHex(color, root)
      : color.toString("hex")
  }, [color, root])
  const presetValues = React.useMemo(
    () =>
      presets
        .map((p) => ({ preset: p, hex: toHex(p, root) }))
        .filter((p) => p.hex),
    [presets, root]
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
                    color={hex!}
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
