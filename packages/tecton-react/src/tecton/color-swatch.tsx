"use client"

import * as React from "react"
import { Field as FieldPrimitive } from "@base-ui/react/field"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { oklch } from "culori/css"
import { formatHex, parse, toGamut } from "culori/fn"

import { Button } from "@tecton/react/components/button"
import { Input } from "@tecton/react/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@tecton/react/components/popover"
import { Separator } from "@tecton/react/components/separator"

/**
 * Tecton ColorSwatch — a colour preview chip with an optional label and
 * detail text. Used for colour tags, legends and the theme documentation. Pass
 * `onColorChange` to make it editable: the swatch becomes a button that opens a
 * picker with preset colours and a hex field.
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

type ParsedColor = NonNullable<ReturnType<typeof parse>>

const toRgbGamut = toGamut("rgb", "oklch")

/** Any CSS colour culori understands (hex, rgb/hsl, oklch, lab, named…). */
function parseCss(color: string | null | undefined): ParsedColor | null {
  return (color && parse(color.trim())) || null
}

/** `#RRGGBB` (uppercase, alpha dropped), mapped into the sRGB gamut. */
function toHex(color: ParsedColor) {
  return formatHex(toRgbGamut(color)).toUpperCase()
}

/** Hue buckets on the OKLCH hue circle: each name runs up to its angle. */
const HUES: [number, string][] = [
  [15, "pink"],
  [40, "red"],
  [80, "orange"],
  [115, "yellow"],
  [170, "green"],
  [220, "cyan"],
  [285, "blue"],
  [320, "purple"],
  [345, "magenta"],
  [360, "pink"],
]

function lightnessWord(l: number, vibrant: boolean) {
  if (l < 0.3) return "very dark"
  if (l < 0.5) return "dark"
  // A vibrant colour reads as saturated, not light, however high its
  // lightness (yellow, cyan).
  if (vibrant) return ""
  if (l >= 0.9) return "very light"
  return l >= 0.78 ? "light" : ""
}

/**
 * An English description of a colour — "dark vibrant blue", "light gray",
 * "pale pink" — from its OKLCH lightness, chroma and hue.
 */
function describeColor(color: ParsedColor): string {
  const { l, c, h, alpha = 1 } = oklch(color)
  if (alpha === 0) return "transparent"
  let words: string[]
  if (c < 0.02 || h === undefined || Number.isNaN(h)) {
    if (l >= 0.99) words = ["white"]
    else if (l <= 0.05) words = ["black"]
    else words = [lightnessWord(l, false), "gray"]
  } else {
    const angle = ((h % 360) + 360) % 360
    let hue = HUES.find(([max]) => angle < max)?.[1] ?? "pink"
    if (hue === "orange" && l < 0.6) hue = "brown"
    if (hue === "yellow" && l < 0.65) hue = "olive"
    const earthy = hue === "brown" || hue === "olive"
    const vibrant = c >= 0.15 && !earthy
    const pale = c < 0.08 && l >= 0.78
    words = pale
      ? ["pale", hue]
      : [
          lightnessWord(l, vibrant),
          vibrant ? "vibrant" : c < 0.08 ? "grayish" : "",
          hue,
        ]
  }
  const name = words.filter(Boolean).join(" ")
  return alpha < 1
    ? `${name}, ${Math.round((1 - alpha) * 100)}% transparent`
    : name
}

/** An unlikely colour the probe inherits when the value does not resolve. */
const PROBE_SENTINEL = "rgba(1, 2, 3, 0.004)"

/**
 * Resolves a colour culori cannot parse on its own (`var(--token)`) through
 * the DOM, or returns `null`. The probe sits inside a
 * parent painted with a sentinel: an invalid colour, or a `var()` that
 * resolves to nothing, falls back to the inherited colour, and that must read
 * as "unresolved", not as the colour of whatever text surrounds the picker.
 */
function resolveColor(color: string, el: Element | null): ParsedColor | null {
  const parsed = parseCss(color)
  if (parsed || typeof window === "undefined" || !el) return parsed
  const parent = document.createElement("span")
  parent.style.color = PROBE_SENTINEL
  const probe = document.createElement("span")
  probe.style.color = color
  parent.appendChild(probe)
  el.appendChild(parent)
  const sentinel = getComputedStyle(parent).color
  const computed = getComputedStyle(probe).color
  parent.remove()
  return computed === sentinel ? null : parseCss(computed)
}

/** A checkerboard behind translucent colours, so their alpha shows. */
const CHECKERBOARD = "repeating-conic-gradient(#d4d4d4 0% 25%, #ffffff 0% 50%)"

/**
 * The swatch paint: the colour as `background-color`, over a checkerboard
 * unless it is known to be opaque (a `var()` may hide an alpha). Forced-colour
 * modes must not replace it — the colour is the content.
 */
function swatchStyle(color: string, parsed: ParsedColor | null) {
  const opaque = parsed !== null && (parsed.alpha ?? 1) >= 1
  return {
    backgroundColor: color,
    forcedColorAdjust: "none",
    ...(opaque
      ? undefined
      : {
          backgroundImage: `linear-gradient(${color}, ${color}), ${CHECKERBOARD}`,
          backgroundSize: "auto, 8px 8px",
          backgroundPosition: "0 0, 50% 50%",
        }),
  } satisfies React.CSSProperties
}

type ColorSwatchProps = Omit<
  React.ComponentProps<"span">,
  "color" | "children" | "onChange"
> &
  VariantProps<typeof colorSwatchVariants> & {
    /** Any CSS colour: hex, `rgb()`, `hsl()`, `oklch()`, a keyword or `var(--token)`. */
    color?: string
    /** Replaces the generated English colour name in the accessible name. */
    colorName?: string
    /** Text rendered next to the swatch. */
    label?: React.ReactNode
    /** Secondary text (e.g. the hex value), rendered in mono. */
    detail?: React.ReactNode
    /** Makes the swatch editable: called with the new colour as `#RRGGBB`. */
    onColorChange?: (color: string) => void
    /** Preset colours offered by the editable picker (defaults to the Tecton accents). */
    presets?: string[]
  }

/**
 * The colour's name. A value culori cannot parse (`var(--token)`) is read back
 * from the painted swatch after mount; a token that resolves to nothing paints
 * transparent and is named so.
 */
function useColorName(
  color: string,
  parsed: ParsedColor | null,
  node: React.RefObject<HTMLElement | null>
) {
  const [probed, setProbed] = React.useState<string | null>(null)
  React.useLayoutEffect(() => {
    if (parsed || !node.current) return
    const computed = parseCss(getComputedStyle(node.current).backgroundColor)
    setProbed(computed ? describeColor(computed) : null)
  }, [color, parsed, node])
  return parsed ? describeColor(parsed) : probed
}

function ColorSwatch({
  className,
  size = "md",
  shape = "rounded",
  color = "transparent",
  colorName,
  label,
  detail,
  onColorChange,
  presets = colorSwatchPresets,
  style,
  ref,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: ColorSwatchProps) {
  const generatedId = React.useId()
  const swatchId = id ?? generatedId
  const node = React.useRef<HTMLSpanElement | null>(null)
  const setNode = React.useCallback(
    (el: HTMLSpanElement | null) => {
      node.current = el
      if (typeof ref === "function") ref(el)
      else if (ref) ref.current = el
    },
    [ref]
  )
  const parsed = React.useMemo(() => parseCss(color), [color])
  const generatedName = useColorName(color, parsed, node)
  const name = colorName ?? generatedName
  // Editable, the caller's `aria-label` names the button; the swatch then
  // only describes it with the colour.
  const callerName = onColorChange
    ? undefined
    : (ariaLabel ?? (typeof label === "string" ? label : undefined))
  // The caller's name first, then the colour; the raw value only when the
  // colour has no name and nothing else names the swatch.
  const accessibleName =
    [ariaLabelledBy ? undefined : callerName, name]
      .filter(Boolean)
      .join(", ") || color

  let swatch: React.ReactNode = (
    <span
      data-slot="color-swatch"
      role="img"
      aria-roledescription="color swatch"
      {...props}
      ref={setNode}
      id={swatchId}
      aria-label={accessibleName}
      aria-labelledby={
        ariaLabelledBy ? `${swatchId} ${ariaLabelledBy}` : undefined
      }
      className={cn(
        colorSwatchVariants({ size, shape }),
        label || detail ? "" : className
      )}
      style={{ ...swatchStyle(color, parsed), ...style }}
    />
  )

  if (onColorChange) {
    swatch = (
      <ColorSwatchEditor
        color={color}
        onColorChange={onColorChange}
        presets={presets}
        shape={shape}
        swatchId={swatchId}
        aria-label={ariaLabel ?? "Edit colour"}
      >
        {swatch}
      </ColorSwatchEditor>
    )
  }

  if (!label && !detail) {
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
        {detail && (
          <span className="truncate font-mono text-xs text-muted-foreground">
            {detail}
          </span>
        )}
      </span>
    </span>
  )
}

type ResolvedColors = {
  current: string | null
  presets: { preset: string; hex: string; name: string }[]
}

function resolveColors(
  color: string,
  presets: string[],
  root: Element | null
): ResolvedColors {
  const current = resolveColor(color, root)
  return {
    current: current ? toHex(current) : null,
    presets: presets.flatMap((preset) => {
      const parsed = resolveColor(preset, root)
      return parsed
        ? [{ preset, hex: toHex(parsed), name: describeColor(parsed) }]
        : []
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
  color: string,
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

/** A bare hex is accepted without its `#`; anything culori parses works too. */
function parseTyped(text: string) {
  const trimmed = text.trim()
  return parseCss(/^[0-9a-f]{3,8}$/i.test(trimmed) ? `#${trimmed}` : trimmed)
}

/**
 * The hex field: typing edits a draft, which is committed on blur or Enter.
 * An unparseable draft reverts to the current colour.
 */
function HexField({
  value,
  onCommit,
}: {
  value: string | null
  onCommit: (hex: string) => void
}) {
  const [draft, setDraft] = React.useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const parsed = parseTyped(draft)
    setDraft(null)
    if (!parsed) return
    const hex = toHex(parsed)
    if (hex !== value) onCommit(hex)
  }
  return (
    <FieldPrimitive.Root className="flex-1">
      <Input
        aria-label="Hex colour"
        autoComplete="off"
        spellCheck={false}
        className="font-mono"
        value={draft ?? value ?? ""}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit()
        }}
      />
    </FieldPrimitive.Root>
  )
}

function ColorSwatchEditor({
  color,
  onColorChange,
  presets,
  shape,
  swatchId,
  children,
  "aria-label": ariaLabel,
}: {
  color: string
  onColorChange: (color: string) => void
  presets: string[]
  shape: VariantProps<typeof colorSwatchVariants>["shape"]
  swatchId: string
  children: React.ReactNode
  "aria-label": string
}) {
  const presetsId = React.useId()
  const [root, setRoot] = React.useState<HTMLElement | null>(null)
  const { current, presets: presetValues } = useResolvedColors(
    color,
    presets,
    root
  )
  const selected = presetValues.find((p) => p.hex === current)?.preset ?? null
  const shapeClass = cn(
    shape === "circle" && "rounded-full",
    shape === "square" && "rounded-sm"
  )

  return (
    <Popover>
      <PopoverTrigger
        aria-label={ariaLabel}
        aria-describedby={swatchId}
        render={
          <Button
            variant="ghost"
            data-slot="color-swatch-trigger"
            className="h-auto gap-0 rounded-[inherit] border-0 bg-transparent p-0 transition-[filter,transform] hover:bg-transparent hover:brightness-110 focus-visible:bg-transparent focus-visible:ring-offset-1 focus-visible:ring-offset-background active:translate-y-px active:bg-transparent active:brightness-95 aria-expanded:bg-transparent"
          />
        }
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        data-slot="color-swatch-picker"
        className="w-auto min-w-64 gap-3 p-3"
      >
        <div ref={setRoot} className="flex flex-col gap-3">
          {presetValues.length > 0 && (
            <div className="flex flex-col gap-2">
              <span
                id={presetsId}
                className="text-xs font-medium text-muted-foreground"
              >
                Presets
              </span>
              {/* Selection follows focus: arrow keys pick the next preset. */}
              <RadioGroupPrimitive
                aria-labelledby={presetsId}
                value={selected}
                onValueChange={(preset: string | null) => {
                  const hit = presetValues.find((p) => p.preset === preset)
                  if (hit && hit.hex !== current) onColorChange(hit.hex)
                }}
                className="flex flex-wrap gap-2"
              >
                {presetValues.map(({ preset, hex, name }) => (
                  <RadioPrimitive.Root
                    key={preset}
                    value={preset}
                    aria-label={name}
                    data-slot="color-swatch-preset"
                    data-color={hex}
                    className={cn(
                      "cursor-pointer rounded-md transition-[filter] outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring data-checked:ring-2 data-checked:ring-ring data-checked:ring-offset-1 data-checked:ring-offset-popover",
                      shapeClass
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        colorSwatchVariants({ size: "md", shape }),
                        "block"
                      )}
                      style={swatchStyle(preset, parseCss(preset))}
                    />
                  </RadioPrimitive.Root>
                ))}
              </RadioGroupPrimitive>
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
                  value={(current ?? "#000000").toLowerCase()}
                  onChange={(event) =>
                    onColorChange(event.target.value.toUpperCase())
                  }
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                />
              </label>
              <HexField value={current} onCommit={onColorChange} />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { ColorSwatch, colorSwatchPresets, colorSwatchVariants }
export type { ColorSwatchProps }
