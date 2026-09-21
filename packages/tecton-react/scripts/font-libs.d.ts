/**
 * Ambient declarations for the font-building libraries used by
 * `scripts/build-symbol-fonts.mts`. None of them ships TypeScript types, and
 * only the surface the script uses is declared here — check the packages' own
 * README when reaching for more.
 */

declare module "subset-font" {
  /** A variation axis kept as a range instead of being pinned to one value. */
  interface AxisRange {
    min?: number
    max?: number
    default?: number
  }

  interface SubsetOptions {
    /** `"sfnt"` (alias `"truetype"`), `"woff"` or `"woff2"`. */
    targetFormat?: "sfnt" | "truetype" | "woff" | "woff2"
    /** Extra `name` table ids to keep; harfbuzz drops most of them. */
    preserveNameIds?: Array<number>
    /** OpenType feature tags to keep. `[]` drops every layout feature. */
    keepFeatures?: Array<string>
    /** Per-axis instancing: a number pins the axis, an object narrows it. */
    variationAxes?: Record<string, number | AxisRange>
    noLayoutClosure?: boolean
    glyphNames?: boolean
    noHinting?: boolean
    /** Four-character sfnt table tags to drop. */
    dropTables?: Array<string>
    /** Keep every glyph (`--gids=*`); `text` must then be empty. */
    keepAllGlyphs?: boolean
  }

  export default function subsetFont(
    font: Uint8Array,
    text: string | null | undefined,
    options?: SubsetOptions
  ): Promise<Buffer>
}

declare module "wawoff2" {
  /** sfnt → woff2 (the Google woff2 encoder, compiled to wasm). */
  export function compress(input: Uint8Array): Promise<Uint8Array>
  /** woff2 → sfnt. */
  export function decompress(input: Uint8Array): Promise<Uint8Array>
  const wawoff2: { compress: typeof compress; decompress: typeof decompress }
  export default wawoff2
}

declare module "opentype.js" {
  export class Path {
    commands: Array<Record<string, unknown>>
    moveTo(x: number, y: number): void
    lineTo(x: number, y: number): void
    curveTo(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x: number,
      y: number
    ): void
    close(): void
  }

  export interface GlyphOptions {
    name: string
    unicode?: number
    unicodes?: Array<number>
    advanceWidth: number
    path: Path
  }

  export class Glyph {
    constructor(options: GlyphOptions)
    name: string
    unicode?: number
    unicodes: Array<number>
    advanceWidth: number
    path: Path
  }

  export interface FontOptions {
    familyName: string
    styleName: string
    unitsPerEm: number
    ascender: number
    descender: number
    glyphs: Array<Glyph>
    /** Seconds since the Unix epoch; without it `head.created` is "now". */
    createdTimestamp?: number
    weightClass?: number
    version?: string
    copyright?: string
    description?: string
    designer?: string
    license?: string
    manufacturer?: string
    trademark?: string
    /** Raw table overrides, merged over what the writer computes. */
    tables?: Record<string, Record<string, unknown>>
  }

  export interface VariationAxis {
    tag: string
    minValue: number
    defaultValue: number
    maxValue: number
  }

  /** Only the tables the script reads back are described. */
  export interface ParsedTables {
    cmap?: { glyphIndexMap: Record<string, number> }
    fvar?: { axes: Array<VariationAxis> }
    head?: { fontRevision: number; created: number; modified: number }
    [table: string]: unknown
  }

  export class Font {
    constructor(options: FontOptions)
    unitsPerEm: number
    ascender: number
    descender: number
    numGlyphs: number
    glyphs: {
      length: number
      get: (index: number) => Glyph
    }
    tables: ParsedTables
    getEnglishName(name: string): string
    toArrayBuffer(): ArrayBuffer
  }

  export function parse(buffer: ArrayBuffer): Font
}
