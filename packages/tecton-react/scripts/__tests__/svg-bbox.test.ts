import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import { isShippedIcon, loadManifest } from "../icon-utils.mjs"
import type { Bounds } from "../svg-bbox.mjs"
import {
  cropViewBox,
  opticalCrop,
  parseViewBox,
  svgGeometryBounds,
  unionBounds,
} from "../svg-bbox.mjs"
import type { TectonSvgIcon } from "../../icons-src/icon-definition"

const scriptsDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const pkgRoot = path.dirname(scriptsDir)
const DEFINITIONS_DIR = path.join(pkgRoot, "icons-src/tecton")
const ICONS_OUT_DIR = path.join(pkgRoot, "src/icons")

/** Slugs that are generated into `src/icons/` — the domain glyphs only. */
const shippedSlugs = new Set(
  loadManifest()
    .icons.filter(isShippedIcon)
    .map((entry) => entry.slug)
)

/** Generated files in `src/icons/` that are not per-icon components. */
const NON_ICON_OUTPUTS = new Set(["_runtime.ts", "index.ts", "types.ts"])

/**
 * Must match `ICON_VIEWBOX_INSET` in `scripts/build-icons.mts`; the first test
 * below fails if the two drift apart (build-icons.mts runs its build on import,
 * so it cannot be imported here just to read the constant).
 */
const ICON_VIEWBOX_INSET = 1

/** `[minX, minY, maxX, maxY]`, rounded, for readable expectations. */
function box(bounds: Bounds | null): number[] | null {
  if (!bounds) return null
  return [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY].map(
    (n) => Math.round(n * 1e6) / 1e6
  )
}

describe("svgGeometryBounds", () => {
  it("measures a circle from its centre and radius", () => {
    expect(box(svgGeometryBounds('<circle cx="12" cy="12" r="10"/>'))).toEqual([
      2, 2, 22, 22,
    ])
  })

  it("measures an arc-drawn circle the same way", () => {
    const d = "M2 12 A10 10 0 1 0 22 12 A10 10 0 1 0 2 12 Z"
    expect(box(svgGeometryBounds(`<path d="${d}"/>`))).toEqual([2, 2, 22, 22])
  })

  it("solves cubic extrema rather than bounding the control hull", () => {
    // Controls reach y=10 but the curve only reaches y=7.5.
    expect(box(svgGeometryBounds('<path d="M0 0 C0 10 10 10 10 0"/>'))).toEqual(
      [0, 0, 10, 7.5]
    )
  })

  it("solves quadratic extrema", () => {
    expect(box(svgGeometryBounds('<path d="M0 0 Q5 10 10 0"/>'))).toEqual([
      0, 0, 10, 5,
    ])
  })

  it("reflects the previous control point for S", () => {
    const d = "M0 0 C0 10 10 10 10 0 S20 -10 20 0"
    expect(box(svgGeometryBounds(`<path d="${d}"/>`))).toEqual([
      0, -7.5, 20, 7.5,
    ])
  })

  it("reflects the previous control point for T", () => {
    expect(box(svgGeometryBounds('<path d="M0 0 Q5 10 10 0 T20 0"/>'))).toEqual(
      [0, -5, 20, 5]
    )
  })

  it("applies a translate transform", () => {
    const svg = '<path d="M0 0 L4 4" transform="translate(1 2)"/>'
    expect(box(svgGeometryBounds(svg))).toEqual([1, 2, 5, 6])
  })

  it("composes transforms through nested groups", () => {
    const svg =
      '<g transform="translate(2 0)"><path d="M0 0L2 2" transform="scale(2)"/></g>'
    expect(box(svgGeometryBounds(svg))).toEqual([2, 0, 6, 4])
  })

  it("applies a rotate transform", () => {
    const svg = '<path d="M1 0L1 0" transform="rotate(90)"/>'
    expect(box(svgGeometryBounds(svg))).toEqual([0, 1, 0, 1])
  })

  it("handles relative commands, H/V and Z", () => {
    expect(box(svgGeometryBounds('<path d="M1 1 h3 v3 Z"/>'))).toEqual([
      1, 1, 4, 4,
    ])
  })

  it("ignores a moveto that paints nothing", () => {
    expect(box(svgGeometryBounds('<path d="M50 50 M1 1 L2 2"/>'))).toEqual([
      1, 1, 2, 2,
    ])
  })

  it("ignores <defs> and <clipPath> content", () => {
    const svg =
      '<path d="M1 1L2 2"/><defs><clipPath id="c"><rect width="16" height="16"/></clipPath></defs>'
    expect(box(svgGeometryBounds(svg))).toEqual([1, 1, 2, 2])
  })

  it("ignores Figma's skip-parse gradient hack", () => {
    const svg =
      '<path d="M1 1L2 2"/><g data-figma-skip-parse="true"><g transform="matrix(0 0.004 -0.007 0 8 5)"><foreignObject x="-1015" y="-1015" width="2031" height="2031"/></g></g>'
    expect(box(svgGeometryBounds(svg))).toEqual([1, 1, 2, 2])
  })

  it("measures rect, ellipse, line, polygon and polyline", () => {
    expect(
      box(svgGeometryBounds('<rect x="2" y="3" width="4" height="5"/>'))
    ).toEqual([2, 3, 6, 8])
    expect(
      box(svgGeometryBounds('<ellipse cx="10" cy="10" rx="6" ry="3"/>'))
    ).toEqual([4, 7, 16, 13])
    expect(
      box(svgGeometryBounds('<line x1="1" y1="9" x2="7" y2="2"/>'))
    ).toEqual([1, 2, 7, 9])
    expect(box(svgGeometryBounds('<polygon points="1,1 5,3 2,9"/>'))).toEqual([
      1, 1, 5, 9,
    ])
    expect(box(svgGeometryBounds('<polyline points="1,1 5,3 2,9"/>'))).toEqual([
      1, 1, 5, 9,
    ])
  })

  it("returns null when nothing is painted", () => {
    expect(svgGeometryBounds('<defs><path d="M0 0L9 9"/></defs>')).toBeNull()
    expect(svgGeometryBounds('<svg viewBox="0 0 16 16"></svg>')).toBeNull()
  })

  it("measures a whole <svg> document the same as its fragment", () => {
    const inner = '<path d="M3 4L11 12"/>'
    expect(box(svgGeometryBounds(inner))).toEqual(
      box(svgGeometryBounds(`<svg viewBox="0 0 16 16">${inner}</svg>`))
    )
  })
})

describe("cropViewBox", () => {
  it("crops a roomy glyph by the full inset", () => {
    // `add`: the glyph spans roughly 3.41..12.58 on a 16 grid.
    const crop = cropViewBox(
      "0 0 16 16",
      { minX: 3.41, minY: 3.41, maxX: 12.58, maxY: 12.58 },
      1
    )
    expect(crop.viewBox).toBe("1 1 14 14")
    expect(crop.padding).toBe(1)
    expect(crop.scale).toBe(1.143)
    expect(crop.cropped).toBe(true)
  })

  it("keeps the viewBox when the glyph reaches an edge", () => {
    const crop = cropViewBox(
      "0 0 16 16",
      { minX: 2.6, minY: 0, maxX: 15.3, maxY: 14.6 },
      1
    )
    expect(crop.viewBox).toBe("0 0 16 16")
    expect(crop.padding).toBe(0)
    expect(crop.cropped).toBe(false)
  })

  it("clamps to the glyph's own margin", () => {
    const crop = cropViewBox(
      "0 0 16 16",
      { minX: 0.125, minY: 0.2, maxX: 15.8, maxY: 15.8 },
      1
    )
    expect(crop.viewBox).toBe("0.125 0.125 15.75 15.75")
    expect(crop.padding).toBe(0.125)
  })

  it("floors the padding so rounding can never clip", () => {
    // 0.666656 must not become 0.667, which would cut into the glyph.
    const crop = cropViewBox(
      "0 0 16 16",
      { minX: 0.666656, minY: 1.4, maxX: 15.2, maxY: 14 },
      1
    )
    expect(crop.viewBox).toBe("0.666 0.666 14.668 14.668")
    expect(crop.padding).toBe(0.666)
  })

  it("absorbs binary-float noise before flooring", () => {
    // 0.35 arrives from the measurement as 0.34999999999999964.
    const crop = cropViewBox(
      "0 0 16 16",
      { minX: 0.34999999999999964, minY: 1, maxX: 15.65, maxY: 14.3 },
      1
    )
    expect(crop.padding).toBe(0.35)
    expect(crop.viewBox).toBe("0.35 0.35 15.3 15.3")
  })

  it("honours a non-zero viewBox origin", () => {
    const crop = cropViewBox(
      "-2 -2 20 20",
      { minX: 0, minY: 0, maxX: 16, maxY: 16 },
      1
    )
    expect(crop.viewBox).toBe("-1 -1 18 18")
  })

  it("leaves the viewBox alone when there is no geometry", () => {
    expect(cropViewBox("0 0 16 16", null, 1).viewBox).toBe("0 0 16 16")
  })

  it("leaves the viewBox alone when it cannot be parsed", () => {
    const bounds = { minX: 4, minY: 4, maxX: 12, maxY: 12 }
    expect(cropViewBox("nonsense", bounds, 1).viewBox).toBe("nonsense")
  })

  it("never collapses the box, however roomy the glyph", () => {
    const crop = cropViewBox(
      "0 0 4 4",
      { minX: 2, minY: 2, maxX: 2, maxY: 2 },
      100
    )
    const cropped = parseViewBox(crop.viewBox)!
    expect(cropped.width).toBeGreaterThan(0)
    expect(cropped.height).toBeGreaterThan(0)
  })
})

describe("opticalCrop", () => {
  it("measures every variant together so the crop is shared", () => {
    const roomy = '<path d="M4 4L12 12"/>'
    const wide = '<path d="M0.5 4L15.5 12"/>'
    // Alone the roomy glyph would take the full inset; the wide one caps it.
    expect(opticalCrop("0 0 16 16", [roomy], 1).viewBox).toBe("1 1 14 14")
    expect(opticalCrop("0 0 16 16", [roomy, wide], 1).viewBox).toBe(
      "0.5 0.5 15 15"
    )
  })
})

describe("unionBounds", () => {
  it("returns the other box when one is missing", () => {
    const b = { minX: 1, minY: 2, maxX: 3, maxY: 4 }
    expect(unionBounds(null, b)).toEqual(b)
    expect(unionBounds(b, null)).toEqual(b)
    expect(unionBounds(null, null)).toBeNull()
  })

  it("covers both boxes", () => {
    expect(
      unionBounds(
        { minX: 1, minY: 5, maxX: 3, maxY: 9 },
        { minX: 2, minY: 2, maxX: 8, maxY: 6 }
      )
    ).toEqual({ minX: 1, minY: 2, maxX: 8, maxY: 9 })
  })
})

// ---------------------------------------------------------------------------
// The real icon export — the regression guard that no glyph is ever clipped.
// ---------------------------------------------------------------------------

interface Measured {
  slug: string
  viewBox: string
  /** Both variants' markup, exactly as the build measures it. */
  markups: string[]
  bounds: Bounds
  available: number
}

const definitions: Measured[] = await Promise.all(
  readdirSync(DEFINITIONS_DIR)
    .filter((name) => name.endsWith(".ts") && name !== "index.ts")
    .sort()
    .map(async (name) => {
      const mod = (await import(path.join(DEFINITIONS_DIR, name))) as Record<
        string,
        unknown
      >
      const def = Object.values(mod).find(
        (v): v is TectonSvgIcon =>
          typeof v === "object" && v !== null && "slug" in v && "viewBox" in v
      )
      if (!def) throw new Error(`${name}: no defineTectonSvgIcon() export`)
      const markups = [def.outline, def.filled].filter((m) => m.trim() !== "")
      const bounds = markups.reduce<Bounds | null>(
        (acc, markup) => unionBounds(acc, svgGeometryBounds(markup)),
        null
      )
      if (!bounds) throw new Error(`${name}: no visible geometry`)
      const vb = parseViewBox(def.viewBox)!
      return {
        slug: def.slug,
        viewBox: def.viewBox,
        markups,
        bounds,
        available: Math.min(
          bounds.minX - vb.x,
          bounds.minY - vb.y,
          vb.x + vb.width - bounds.maxX,
          vb.y + vb.height - bounds.maxY
        ),
      }
    })
)

describe("the Tecton icon export", () => {
  it("vendors exactly the shipped manifest entries", () => {
    expect(definitions.map((d) => d.slug).sort()).toEqual(
      [...shippedSlugs].sort()
    )
    expect(definitions).toHaveLength(shippedSlugs.size)
  })

  it("keeps ICON_VIEWBOX_INSET in sync with build-icons.mts", () => {
    const source = readFileSync(
      path.join(scriptsDir, "build-icons.mts"),
      "utf8"
    )
    const match = source.match(/^const ICON_VIEWBOX_INSET = ([\d.]+);$/m)
    expect(match?.[1]).toBe(String(ICON_VIEWBOX_INSET))
  })

  it.each(definitions.map((d) => [d.slug, d] as const))(
    "%s: the cropped viewBox contains both variants and never over-crops",
    (_slug, icon) => {
      // Exactly what build-icons.mts calls, on exactly the same markup.
      const actual = opticalCrop(icon.viewBox, icon.markups, ICON_VIEWBOX_INSET)
      const vb = parseViewBox(actual.viewBox)!

      // 1. Nothing is clipped: the glyph lies inside the cropped box.
      expect(icon.bounds.minX).toBeGreaterThanOrEqual(vb.x)
      expect(icon.bounds.minY).toBeGreaterThanOrEqual(vb.y)
      expect(icon.bounds.maxX).toBeLessThanOrEqual(vb.x + vb.width)
      expect(icon.bounds.maxY).toBeLessThanOrEqual(vb.y + vb.height)

      // 2. The padding is the full inset, or the glyph's own margin.
      const expected = Math.max(
        0,
        Math.floor(Math.min(ICON_VIEWBOX_INSET, icon.available) * 1000 + 1e-6) /
          1000
      )
      expect(actual.padding).toBe(expected)

      // 3. The crop stays centred: equal margins on opposite sides.
      const vbSource = parseViewBox(icon.viewBox)!
      expect(vb.x - vbSource.x).toBeCloseTo(
        vbSource.x + vbSource.width - (vb.x + vb.width),
        9
      )
      expect(vb.y - vbSource.y).toBeCloseTo(
        vbSource.y + vbSource.height - (vb.y + vb.height),
        9
      )
    }
  )

  it("crops most icons by the full inset and clamps the rest", () => {
    const full = definitions.filter((d) => d.available >= ICON_VIEWBOX_INSET)
    const clamped = definitions.filter((d) => d.available < ICON_VIEWBOX_INSET)
    expect(full.length + clamped.length).toBe(definitions.length)
    // The crop is worth doing: the large majority take it in full.
    expect(full.length).toBeGreaterThan(definitions.length * 0.75)
  })

  it("generates exactly the shipped manifest slugs", () => {
    const generated = readdirSync(ICONS_OUT_DIR)
      .filter((name) => /\.tsx?$/.test(name) && !NON_ICON_OUTPUTS.has(name))
      .map((name) => name.replace(/\.tsx?$/, ""))
      .sort()
    expect(generated).toEqual([...shippedSlugs].sort())
    expect(generated).toHaveLength(shippedSlugs.size)
  })

  it("generated components render the cropped viewBox for both variants", () => {
    const wrong: string[] = []
    // Only the shipped icons have a generated component to compare against;
    // the crop itself is checked above for the whole vendored export.
    for (const icon of definitions.filter((d) => shippedSlugs.has(d.slug))) {
      const generated = readFileSync(
        path.join(ICONS_OUT_DIR, `${icon.slug}.tsx`),
        "utf8"
      )
      const block = generated.match(
        /const VIEW_BOX: Record<TectonIconVariant, string> = \{([^}]*)\}/
      )
      const entries = [...(block?.[1] ?? "").matchAll(/: "([^"]*)"/g)].map(
        (m) => m[1]
      )
      const expected = opticalCrop(
        icon.viewBox,
        icon.markups,
        ICON_VIEWBOX_INSET
      ).viewBox
      // Both variants share one crop, so neither may differ from it.
      if (entries.length !== 2 || entries.some((v) => v !== expected)) {
        wrong.push(`${icon.slug}: ${JSON.stringify(entries)} != "${expected}"`)
      }
    }
    expect(wrong).toEqual([])
  })
})
