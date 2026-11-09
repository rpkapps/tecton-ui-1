/**
 * Colormaps, scale maths and tick formatting shared by the colour-scale
 * exploration variations. Stops are evenly spaced samples of each map; the
 * colours are data colours (what an inversion pixel is painted with), not UI
 * colours, so they are hex values rather than Tecton tokens.
 */

export type ColormapGroup =
  "perceptual" | "rainbow" | "diverging" | "geophysics"

export type Colormap = {
  id: string
  name: string
  group: ColormapGroup
  stops: string[]
  note: string
}

export const colormaps: Colormap[] = [
  {
    id: "viridis",
    name: "Viridis",
    group: "perceptual",
    note: "Uniform lightness ramp, colour-blind safe",
    stops: [
      "#440154",
      "#482878",
      "#3e4989",
      "#31688e",
      "#26828e",
      "#1f9e89",
      "#35b779",
      "#6ece58",
      "#b5de2b",
      "#fde725",
    ],
  },
  {
    id: "cividis",
    name: "Cividis",
    group: "perceptual",
    note: "Optimised for colour-vision deficiency",
    stops: [
      "#00224e",
      "#123570",
      "#3b496c",
      "#575d6d",
      "#707173",
      "#8a8779",
      "#a69d75",
      "#c4b56c",
      "#e4cf5b",
      "#fee838",
    ],
  },
  {
    id: "magma",
    name: "Magma",
    group: "perceptual",
    note: "Black to pale yellow, prints well",
    stops: [
      "#000004",
      "#1c1044",
      "#4f127b",
      "#812581",
      "#b5367a",
      "#e55964",
      "#fb8761",
      "#fec287",
      "#fcfdbf",
    ],
  },
  {
    id: "inferno",
    name: "Inferno",
    group: "perceptual",
    note: "High contrast at the resistive end",
    stops: [
      "#000004",
      "#1f0c48",
      "#550f6d",
      "#88226a",
      "#ba3655",
      "#e35933",
      "#f98e09",
      "#f9cb35",
      "#fcffa4",
    ],
  },
  {
    id: "plasma",
    name: "Plasma",
    group: "perceptual",
    note: "No black end, bright throughout",
    stops: [
      "#0d0887",
      "#46039f",
      "#7201a8",
      "#9c179e",
      "#bd3786",
      "#d8576b",
      "#ed7953",
      "#fb9f3a",
      "#fdca26",
      "#f0f921",
    ],
  },
  {
    id: "turbo",
    name: "Turbo",
    group: "rainbow",
    note: "Improved rainbow, smooth lightness",
    stops: [
      "#30123b",
      "#4145ab",
      "#4675ed",
      "#39a2fc",
      "#1bcfd4",
      "#24eca6",
      "#61fc6c",
      "#a4fc3b",
      "#d1e835",
      "#f3c63a",
      "#fe9b2d",
      "#f36315",
      "#d93806",
      "#b11901",
      "#7a0403",
    ],
  },
  {
    id: "jet",
    name: "Jet",
    group: "rainbow",
    note: "Legacy rainbow, matches older reports",
    stops: [
      "#00007f",
      "#0000ff",
      "#007fff",
      "#00ffff",
      "#7fff7f",
      "#ffff00",
      "#ff7f00",
      "#ff0000",
      "#7f0000",
    ],
  },
  {
    id: "spectral",
    name: "Spectral",
    group: "rainbow",
    note: "Soft rainbow with a pale middle",
    stops: [
      "#5e4fa2",
      "#3288bd",
      "#66c2a5",
      "#abdda4",
      "#e6f598",
      "#ffffbf",
      "#fee08b",
      "#fdae61",
      "#f46d43",
      "#d53e4f",
      "#9e0142",
    ],
  },
  {
    id: "rdbu",
    name: "Red–Blue",
    group: "diverging",
    note: "Decrease red, increase blue",
    stops: [
      "#67001f",
      "#b2182b",
      "#d6604d",
      "#f4a582",
      "#fddbc7",
      "#f7f7f7",
      "#d1e5f0",
      "#92c5de",
      "#4393c3",
      "#2166ac",
      "#053061",
    ],
  },
  {
    id: "brbg",
    name: "Brown–Teal",
    group: "diverging",
    note: "Earthy diverging, neutral centre",
    stops: [
      "#543005",
      "#8c510a",
      "#bf812d",
      "#dfc27d",
      "#f6e8c3",
      "#f5f5f5",
      "#c7eae5",
      "#80cdc1",
      "#35978f",
      "#01665e",
      "#003c30",
    ],
  },
  {
    id: "puor",
    name: "Orange–Purple",
    group: "diverging",
    note: "Diverging, distinct from red–green",
    stops: [
      "#7f3b08",
      "#b35806",
      "#e08214",
      "#fdb863",
      "#fee0b6",
      "#f7f7f7",
      "#d8daeb",
      "#b2abd2",
      "#8073ac",
      "#542788",
      "#2d004b",
    ],
  },
  {
    id: "res2d",
    name: "Classic ERT",
    group: "geophysics",
    note: "Conductive blue to resistive purple",
    stops: [
      "#0b2a8c",
      "#1f5bd6",
      "#29a3e0",
      "#3fcfb8",
      "#7ed957",
      "#e8e24a",
      "#f5a332",
      "#e5482a",
      "#a81f36",
      "#7a1a5e",
    ],
  },
  {
    id: "earth",
    name: "Earth",
    group: "geophysics",
    note: "Clay ochre to bedrock grey-blue",
    stops: [
      "#5a3a1a",
      "#8a5a2b",
      "#b9874a",
      "#d8b878",
      "#e7dcb0",
      "#c9d6c3",
      "#93b3b5",
      "#5f8ca3",
      "#3a6386",
      "#243f62",
    ],
  },
  {
    id: "greys",
    name: "Greys",
    group: "geophysics",
    note: "Monochrome, for overlays and print",
    stops: ["#0a0a0a", "#3a3a3a", "#6b6b6b", "#9d9d9d", "#cfcfcf", "#f7f7f7"],
  },
]

export const colormapGroups: { id: ColormapGroup; name: string }[] = [
  { id: "perceptual", name: "Perceptual" },
  { id: "rainbow", name: "Rainbow" },
  { id: "diverging", name: "Diverging" },
  { id: "geophysics", name: "Geophysics" },
]

export function getColormap(id: string): Colormap {
  return colormaps.find((map) => map.id === id) ?? colormaps[0]
}

/* -------------------------------------------------------------------------- */
/* Colour                                                                      */
/* -------------------------------------------------------------------------- */

export type RGB = [number, number, number]

export function hexToRgb(hex: string): RGB {
  const value = hex.replace("#", "")
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value
  const n = parseInt(full.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Black or white, whichever reads better on `hex` (WCAG relative luminance). */
export function textOn(hex: string): "black" | "white" {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }) as RGB
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.25 ? "black" : "white"
}

export function rgbToHex([r, g, b]: RGB): string {
  return (
    "#" +
    [r, g, b]
      .map((c) =>
        Math.round(Math.min(255, Math.max(0, c)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  )
}

/** A colour stop at `pos` (0–1) along a gradient. */
export type Stop = { pos: number; color: string }

export function evenStops(colors: string[], reversed = false): Stop[] {
  const list = reversed ? [...colors].reverse() : colors
  return list.map((color, i) => ({
    pos: list.length === 1 ? 0 : i / (list.length - 1),
    color,
  }))
}

/** Linear sRGB interpolation between sorted stops. */
export function sampleStops(stops: Stop[], t: number): RGB {
  const x = Math.min(1, Math.max(0, t))
  if (stops.length === 0) return [0, 0, 0]
  if (x <= stops[0].pos) return hexToRgb(stops[0].color)
  for (let i = 1; i < stops.length; i++) {
    const b = stops[i]
    if (x <= b.pos) {
      const a = stops[i - 1]
      const span = b.pos - a.pos || 1
      const f = (x - a.pos) / span
      const ca = hexToRgb(a.color)
      const cb = hexToRgb(b.color)
      return [
        ca[0] + (cb[0] - ca[0]) * f,
        ca[1] + (cb[1] - ca[1]) * f,
        ca[2] + (cb[2] - ca[2]) * f,
      ]
    }
  }
  return hexToRgb(stops[stops.length - 1].color)
}

/** A 256-entry lookup table, for painting thousands of cells quickly. */
export function buildLut(stops: Stop[], size = 256): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(size * 3)
  for (let i = 0; i < size; i++) {
    const [r, g, b] = sampleStops(stops, i / (size - 1))
    lut[i * 3] = r
    lut[i * 3 + 1] = g
    lut[i * 3 + 2] = b
  }
  return lut
}

/**
 * A CSS gradient for a set of stops. With `classes`, the gradient is split into
 * that many flat bands (each band takes the colour at its centre).
 */
export function gradientCss(
  stops: Stop[],
  {
    direction = "to right",
    classes,
  }: { direction?: string; classes?: number | null } = {}
): string {
  if (classes && classes > 1) {
    const parts: string[] = []
    for (let i = 0; i < classes; i++) {
      const color = rgbToHex(sampleStops(stops, (i + 0.5) / classes))
      parts.push(
        `${color} ${((i / classes) * 100).toFixed(2)}%`,
        `${color} ${(((i + 1) / classes) * 100).toFixed(2)}%`
      )
    }
    return `linear-gradient(${direction}, ${parts.join(", ")})`
  }
  const sorted = [...stops].sort((a, b) => a.pos - b.pos)
  const parts = sorted.map((s) => `${s.color} ${(s.pos * 100).toFixed(2)}%`)
  return `linear-gradient(${direction}, ${parts.join(", ")})`
}

export function colormapCss(
  id: string,
  options: {
    reversed?: boolean
    direction?: string
    classes?: number | null
  } = {}
) {
  return gradientCss(
    evenStops(getColormap(id).stops, options.reversed),
    options
  )
}

/* -------------------------------------------------------------------------- */
/* Scale                                                                       */
/* -------------------------------------------------------------------------- */

export type ScaleType = "linear" | "log"

/** Where `value` falls between `min` and `max`, 0–1 (unclamped). */
export function normalize(
  value: number,
  min: number,
  max: number,
  scale: ScaleType
) {
  if (scale === "log") {
    const lo = Math.log10(Math.max(min, 1e-6))
    const hi = Math.log10(Math.max(max, 1e-6))
    return (Math.log10(Math.max(value, 1e-6)) - lo) / (hi - lo || 1)
  }
  return (value - min) / (max - min || 1)
}

/** The inverse of `normalize`. */
export function denormalize(
  t: number,
  min: number,
  max: number,
  scale: ScaleType
) {
  if (scale === "log") {
    const lo = Math.log10(Math.max(min, 1e-6))
    const hi = Math.log10(Math.max(max, 1e-6))
    return 10 ** (lo + (hi - lo) * t)
  }
  return min + (max - min) * t
}

/** Tick values for a colour bar: decades (1, 2, 5 inside short ranges) on a log scale. */
export function ticks(min: number, max: number, scale: ScaleType, count = 5) {
  if (scale === "log") {
    const lo = Math.floor(Math.log10(min))
    const hi = Math.ceil(Math.log10(max))
    const decades = hi - lo
    const mantissas = decades <= 2 ? [1, 2, 5] : decades <= 3 ? [1, 3] : [1]
    const out: number[] = []
    for (let e = lo; e <= hi; e++)
      for (const m of mantissas) {
        const v = m * 10 ** e
        if (v >= min * 0.999 && v <= max * 1.001) out.push(v)
      }
    return out
  }
  const span = max - min
  const raw = span / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? raw
  const out: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step)
    out.push(Number(v.toPrecision(12)))
  return out
}

/** Resistivity as an engineer writes it: 0.5, 3, 12, 150, 1.2k, 20k. */
export function formatOhm(value: number) {
  if (!Number.isFinite(value)) return "–"
  if (value >= 1000) {
    const k = value / 1000
    return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}k`
  }
  if (value >= 100) return String(Math.round(value))
  if (value >= 1) return String(Math.round(value * 10) / 10)
  return value.toPrecision(2)
}

/** The value at the given percentile (0–100) of a sorted copy of `values`. */
export function percentile(sorted: Float32Array, p: number) {
  if (sorted.length === 0) return 0
  const i = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round((p / 100) * (sorted.length - 1)))
  )
  return sorted[i]
}
