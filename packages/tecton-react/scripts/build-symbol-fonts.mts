/**
 * build-symbol-fonts — generates the Tecton symbol fonts: icons as text.
 *
 *   bun run scripts/build-symbol-fonts.mts            (pnpm icons:fonts)
 *   bun run scripts/build-symbol-fonts.mts --check    (pnpm icons:fonts:check — CI)
 *
 * ## Symbol fonts
 *
 * Three woff2 files and one stylesheet let an application render an icon as a
 * character instead of an SVG element. `src/icons/icon.tsx` draws every icon
 * from them: a `<text>` glyph inside a 24×24 `<svg>` host.
 *
 * Inputs
 *   node_modules/material-symbols/material-symbols-sharp.woff2
 *                                    Google's Material Symbols Sharp variable
 *                                    font (marella's package, version pinned in
 *                                    package.json — it decides the glyph bytes)
 *   icons/material-symbols.codepoints  Google's `<name> <hex>` list for that
 *                                    font, vendored verbatim (source URL and
 *                                    download date below, recorded in the lock
 *                                    file). It is validated against the font's
 *                                    cmap and never used to pick glyphs.
 *   icons/icons.json                 manifest order = allocation order
 *   icons-src/tecton/<slug>.ts       the Tecton icon export (outline + filled
 *                                    markup per icon), all 131 drawings. A
 *                                    manifest entry with no drawing (it renders
 *                                    a Material `symbol`) gets no codepoint and
 *                                    no glyph here.
 *   icons-src/fallback/unknown-icon.ts  the reserved "unknown icon" drawing
 *   icons/tecton-codepoints.json     the append-only codepoint allocation
 *
 * Outputs (all committed; `--check` rebuilds them in memory and writes nothing)
 *   src/styles/fonts/tecton-symbols.woff2           "Tecton Symbols"
 *   src/styles/fonts/tecton-symbols-domain.woff2    "Tecton Symbols Domain"
 *   src/styles/fonts/tecton-symbols-fallback.woff2  "Tecton Symbols Fallback"
 *   src/styles/tecton-symbols.css    the three @font-face rules and the
 *                                    `.tecton-symbols` class. globals.css does
 *                                    NOT import it: an application shell loads
 *                                    it explicitly, by design.
 *   icons/tecton-codepoints.json     allocation, appended to
 *   icons/fonts.lock.json            provenance: versions, revisions, hashes
 *
 * The three families are one fallback chain, in this order: "Tecton Symbols"
 * carries Google's catalogue, "Tecton Symbols Domain" Tecton's own drawings,
 * and "Tecton Symbols Fallback" maps every codepoint either could ever use to
 * the "unknown icon" glyph, so a codepoint neither font has still renders
 * something deliberate instead of a browser's notdef box.
 *
 * ### Axis preset — wght 300, GRAD 0, opsz 24, FILL kept 0..1 (default 0)
 *
 * Tecton's own strokes measure 0.0599 of the icon box; Material Symbols at
 * opsz 24 measures 0.0625 at wght 300 and 0.0833 at wght 400, so wght 300 is
 * the weight that matches the drawings in the Domain font. GRAD and opsz are
 * pinned at their defaults, FILL is kept as a range so one glyph covers both
 * variants: `font-variation-settings: "FILL" var(--tecton-symbol-fill, 0)`.
 * Pinning three of the four axes and dropping the layout features (icons are
 * rendered by codepoint, never by ligature name) is most of the size win over
 * the upstream file.
 *
 * ### Codepoint allocation
 *
 * Material glyphs keep Google's codepoints (BMP private use area
 * U+E000..U+F8FF, plus U+FFEB0..U+FFFFD at the top of Supplementary PUA-A).
 * Tecton's own glyphs live in Supplementary PUA-B, which Google does not use
 * and where a future Material release therefore cannot collide: U+100000 is the
 * "unknown icon", outlined glyphs are allocated from U+100001 upward in
 * `icons/icons.json` order (drawings only: a symbol-only entry never enters
 * the allocation), and the filled variant of an icon sits at its
 * outlined codepoint + 0x800 (so U+100001..U+1007FF outlined,
 * U+100801..U+100FFF filled — room for 2047 icons). The allocation in
 * `icons/tecton-codepoints.json` is append-only: an existing entry is never
 * reassigned, new slugs are appended, and a slug that disappears from the
 * manifest — or loses its drawing — fails the build (either has to be
 * deliberate).
 *
 * ### How the fonts are built
 *
 * "Tecton Symbols" is the upstream variable font instanced by harfbuzz
 * (`subset-font`) with every glyph the cmap reaches kept. That wasm build
 * discards `gvar` as soon as it pins an axis, so the FILL axis is rebuilt here
 * from two pinned instances (see "The FILL axis"). "Tecton Symbols Domain" and
 * "Tecton Symbols Fallback" are written from path data with `opentype.js` (CFF
 * outlines) and compressed with the woff2 encoder (`wawoff2`); all three share
 * Material's metrics — 960 units per em, ascender 1056, descender -96, 960
 * units of advance per glyph — so a glyph from any of them sits on the same
 * baseline and occupies the same box.
 *
 * SVG markup is converted with the frame the Tecton export uses (`0 0 16 16`)
 * mapped onto the em square: `x * 60` and `(16 - y) * 60`. Contour directions
 * are normalised (a contour nested an odd number of deep runs against its
 * container) because a font is filled by the non-zero winding rule while the
 * drawings assume `fill-rule="evenodd"` in places.
 *
 * Both generated fonts are byte-for-byte reproducible: `head.created` and
 * `head.modified` are fixed (opentype.js would write "now"), and harfbuzz
 * carries the upstream timestamps through.
 */
/// <reference types="node" />
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import opentype from "opentype.js"
import subsetFont from "subset-font"
import wawoff2 from "wawoff2"
import { loadManifest, loadMaterialCodepoints, loadTectonDefinitions, pkgRoot } from "./icon-utils.mjs"
import { tectonUnknownIcon } from "../icons-src/fallback/unknown-icon"
import type { TectonSvgIcon } from "../icons-src/icon-definition"

const CHECK_MODE = process.argv.includes("--check")

// ---------------------------------------------------------------------------
// Paths and constants
// ---------------------------------------------------------------------------
const MATERIAL_PKG = path.join(pkgRoot, "node_modules/material-symbols")
const MATERIAL_FONT = path.join(MATERIAL_PKG, "material-symbols-sharp.woff2")
const CODEPOINTS_FILE = path.join(pkgRoot, "icons/material-symbols.codepoints")
const ALLOCATION_FILE = path.join(pkgRoot, "icons/tecton-codepoints.json")
const LOCK_FILE = path.join(pkgRoot, "icons/fonts.lock.json")
const STYLES_DIR = path.join(pkgRoot, "src/styles")
const FONTS_DIR = path.join(STYLES_DIR, "fonts")
const CSS_FILE = path.join(STYLES_DIR, "tecton-symbols.css")

/** Where `icons/material-symbols.codepoints` came from; update both together. */
const CODEPOINTS_SOURCE =
  "https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/MaterialSymbolsSharp%5BFILL,GRAD,opsz,wght%5D.codepoints"
const CODEPOINTS_DOWNLOADED = "2026-09-20"

/** Material's metrics, shared by all three families. */
const UNITS_PER_EM = 960
const ASCENDER = 1056
const DESCENDER = -96
const WIN_ASCENT = 1062
const WIN_DESCENT = 91
const ADVANCE_WIDTH = 960
/** The Tecton export draws on a 16×16 frame: 960 / 16 units per SVG unit. */
const SVG_VIEWBOX = 16
const SVG_SCALE = UNITS_PER_EM / SVG_VIEWBOX

/** The axis preset (see the header). */
const AXES = { wght: 300, GRAD: 0, opsz: 24, FILL: { min: 0, max: 1 } }

/** Supplementary PUA-B allocation. */
const UNKNOWN_CODEPOINT = 0x100000
const OUTLINED_BASE = 0x100001
const FILLED_OFFSET = 0x800

/**
 * Codepoints the Fallback font maps to the "unknown icon". The BMP private use
 * area is Material's whole range (not just the 4200 codepoints it uses today,
 * so a newer Material release still falls back). Supplementary PUA-A is capped
 * at the top 4094 codepoints rather than the whole plane: a cmap format 12
 * subtable can only map a run to CONSECUTIVE glyph ids, so a font with one
 * glyph needs one group (12 bytes) per codepoint, and covering all of
 * U+F0000..U+FFFFD would add ~115 KB to the compressed file for codepoints
 * Google has never used — it only ever allocates from the top, U+FFEB0..U+FFFFD.
 */
const FALLBACK_RANGES: Array<[number, number]> = [
  [0xe000, 0xf8ff],
  [0xff000, 0xffffd],
  [0x100000, 0x100fff],
]

/**
 * `head.created` / `head.modified` of the generated fonts: 2024-01-01T00:00:00Z
 * in seconds since the Unix epoch. Any fixed value works; what matters is that
 * two runs produce the same bytes.
 */
const FIXED_TIMESTAMP = 1_704_067_200

const FONT_VERSION = "Version 1.000"
const COPYRIGHT = "Tecton design system"

type OutputName =
  | "src/styles/fonts/tecton-symbols.woff2"
  | "src/styles/fonts/tecton-symbols-domain.woff2"
  | "src/styles/fonts/tecton-symbols-fallback.woff2"
  | "src/styles/tecton-symbols.css"
  | "icons/tecton-codepoints.json"
  | "icons/fonts.lock.json"

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function sha256(data: Uint8Array | string): string {
  return createHash("sha256").update(data).digest("hex")
}

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`
}

function hex(codepoint: number): string {
  return `U+${codepoint.toString(16).toUpperCase().padStart(5, "0")}`
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T
}

/**
 * The installed version of a dependency, from the package.json next to it.
 * `entry` starts the search at a resolved file instead of the package folder —
 * `harfbuzzjs`, the wasm build harfbuzz runs from, is a transitive dependency
 * of subset-font and hides its own package.json behind `exports`.
 */
function packageVersion(name: string, entry?: string): string {
  let dir = entry === undefined ? path.join(pkgRoot, "node_modules", name) : path.dirname(entry)
  for (let depth = 0; depth < 12; depth += 1) {
    const file = path.join(dir, "package.json")
    if (existsSync(file)) {
      const manifest = readJson<{ name?: string; version: string }>(file)
      if (manifest.name === name) return manifest.version
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  throw new Error(`cannot read the installed version of ${name}`)
}

/** Where harfbuzz itself lives, resolved the way subset-font resolves it. */
function harfbuzzWasm(): string {
  const fromHere = createRequire(import.meta.url)
  return createRequire(fromHere.resolve("subset-font")).resolve("harfbuzzjs/dist/harfbuzz-subset.wasm")
}

// ---------------------------------------------------------------------------
// sfnt surgery
//
// opentype.js writes `head.modified` as "now" and offers no hook for it, and
// its cmap writer emits one segment per codepoint — fine for a few hundred
// glyph codepoints, far too much for the Fallback font's 14 590. Both are
// fixed after the fact: the font is taken apart into its tables, the tables are
// patched, and the sfnt is written again with fresh offsets and checksums.
// ---------------------------------------------------------------------------
interface SfntTable {
  tag: string
  data: Buffer
}

function readSfnt(buffer: Buffer): { version: number; tables: Array<SfntTable> } {
  const version = buffer.readUInt32BE(0)
  const numTables = buffer.readUInt16BE(4)
  const tables: Array<SfntTable> = []
  for (let i = 0; i < numTables; i += 1) {
    const record = 12 + i * 16
    const tag = buffer.toString("latin1", record, record + 4)
    const offset = buffer.readUInt32BE(record + 8)
    const length = buffer.readUInt32BE(record + 12)
    tables.push({ tag, data: Buffer.from(buffer.subarray(offset, offset + length)) })
  }
  return { version, tables }
}

/** Sum of the table's big-endian ULONGs, zero-padded to a 4-byte boundary. */
function checkSum(data: Buffer): number {
  let sum = 0
  for (let i = 0; i + 3 < data.length; i += 4) {
    sum = (sum + data.readUInt32BE(i)) >>> 0
  }
  return sum
}

function writeSfnt(version: number, tables: Array<SfntTable>): Buffer {
  const sorted = [...tables].sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0))
  const numTables = sorted.length
  const entrySelector = Math.floor(Math.log2(numTables))
  const searchRange = 2 ** entrySelector * 16
  const header = Buffer.alloc(12 + numTables * 16)
  header.writeUInt32BE(version, 0)
  header.writeUInt16BE(numTables, 4)
  header.writeUInt16BE(searchRange, 6)
  header.writeUInt16BE(entrySelector, 8)
  header.writeUInt16BE(numTables * 16 - searchRange, 10)

  const parts: Array<Buffer> = [header]
  let offset = header.length
  let headOffset = -1
  sorted.forEach((table, index) => {
    const padded = Buffer.alloc(Math.ceil(table.data.length / 4) * 4)
    table.data.copy(padded)
    const record = 12 + index * 16
    header.write(table.tag, record, 4, "latin1")
    header.writeUInt32BE(checkSum(padded), record + 4)
    header.writeUInt32BE(offset, record + 8)
    header.writeUInt32BE(table.data.length, record + 12)
    if (table.tag === "head") headOffset = offset
    parts.push(padded)
    offset += padded.length
  })

  const font = Buffer.concat(parts)
  if (headOffset >= 0) {
    // head.checkSumAdjustment is the one field computed over the whole file,
    // with the field itself read as zero (OpenType spec, "head").
    font.writeUInt32BE(0, headOffset + 8)
    font.writeUInt32BE((0xb1b0afba - checkSum(font)) >>> 0, headOffset + 8)
  }
  return font
}

/**
 * Replaces or adds tables and writes the sfnt back out with correct offsets and
 * checksums. `freezeTimestamps` pins `head.created` / `head.modified`, which a
 * font written by opentype.js needs to be reproducible; a font that came out of
 * harfbuzz keeps the upstream timestamps instead, which are fixed already.
 */
function normaliseSfnt(
  buffer: Buffer,
  overrides: Record<string, Buffer> = {},
  freezeTimestamps = true
): Buffer {
  const { version, tables } = readSfnt(buffer)
  const patched = tables.map((table) => {
    const replacement = overrides[table.tag]
    if (replacement) return { tag: table.tag, data: replacement }
    if (table.tag !== "head" || !freezeTimestamps) return table
    const head = Buffer.from(table.data)
    // LONGDATETIME: seconds since 1904-01-01, i.e. the Unix epoch + 2082844800.
    const stamp = BigInt(FIXED_TIMESTAMP + 2_082_844_800)
    head.writeBigInt64BE(stamp, 20) // created
    head.writeBigInt64BE(stamp, 28) // modified
    return { tag: "head", data: head }
  })
  for (const [tag, data] of Object.entries(overrides)) {
    if (!patched.some((table) => table.tag === tag)) patched.push({ tag, data })
  }
  return writeSfnt(version, patched)
}

/**
 * A cmap that maps every codepoint of `ranges` to one glyph, as a format 4
 * subtable (BMP, one segment per range through idRangeOffset + glyphIdArray)
 * and a format 12 subtable (everything, one group per codepoint — format 12
 * groups are sequential, so a constant mapping cannot be compressed into runs;
 * format 13 could, but is not read reliably outside macOS). Both are published
 * under the Unicode (0) and the Windows (3) platform ids.
 */
function buildCmapTable(ranges: Array<[number, number]>, glyphId: number): Buffer {
  const bmp = ranges.filter(([, end]) => end <= 0xffff)
  if (bmp.some(([start]) => start > 0xffff)) {
    throw new Error("a cmap range must not straddle the BMP boundary")
  }

  // --- format 4: the BMP ranges plus the mandatory 0xFFFF terminator segment.
  const segCount = bmp.length + 1
  const glyphIds: Array<number> = []
  const starts: Array<number> = []
  const ends: Array<number> = []
  const deltas: Array<number> = []
  const rangeOffsets: Array<number> = []
  bmp.forEach(([start, end], index) => {
    starts.push(start)
    ends.push(end)
    deltas.push(0)
    // Bytes from this idRangeOffset entry to its first glyphIdArray entry.
    rangeOffsets.push((segCount - index) * 2 + glyphIds.length * 2)
    for (let code = start; code <= end; code += 1) glyphIds.push(glyphId)
  })
  starts.push(0xffff)
  ends.push(0xffff)
  deltas.push(1)
  rangeOffsets.push(0)

  const format4Length = 16 + segCount * 8 + glyphIds.length * 2
  const format4 = Buffer.alloc(format4Length)
  const entrySelector = Math.floor(Math.log2(segCount))
  const searchRange = 2 ** entrySelector * 2
  format4.writeUInt16BE(4, 0)
  format4.writeUInt16BE(format4Length, 2)
  format4.writeUInt16BE(0, 4) // language
  format4.writeUInt16BE(segCount * 2, 6)
  format4.writeUInt16BE(searchRange, 8)
  format4.writeUInt16BE(entrySelector, 10)
  format4.writeUInt16BE(segCount * 2 - searchRange, 12)
  let cursor = 14
  for (const end of ends) {
    format4.writeUInt16BE(end, cursor)
    cursor += 2
  }
  cursor += 2 // reservedPad
  for (const start of starts) {
    format4.writeUInt16BE(start, cursor)
    cursor += 2
  }
  for (const delta of deltas) {
    format4.writeUInt16BE(delta & 0xffff, cursor)
    cursor += 2
  }
  for (const rangeOffset of rangeOffsets) {
    format4.writeUInt16BE(rangeOffset, cursor)
    cursor += 2
  }
  for (const id of glyphIds) {
    format4.writeUInt16BE(id, cursor)
    cursor += 2
  }

  // --- format 12: every codepoint, one group each.
  let groups = 0
  for (const [start, end] of ranges) groups += end - start + 1
  const format12 = Buffer.alloc(16 + groups * 12)
  format12.writeUInt16BE(12, 0)
  format12.writeUInt16BE(0, 2)
  format12.writeUInt32BE(format12.length, 4)
  format12.writeUInt32BE(0, 8) // language
  format12.writeUInt32BE(groups, 12)
  cursor = 16
  for (const [start, end] of ranges) {
    for (let code = start; code <= end; code += 1) {
      format12.writeUInt32BE(code, cursor)
      format12.writeUInt32BE(code, cursor + 4)
      format12.writeUInt32BE(glyphId, cursor + 8)
      cursor += 12
    }
  }

  // --- the encoding records, two per subtable (Unicode and Windows).
  const records: Array<[number, number, number]> = [
    [0, 3, 0],
    [3, 1, 0],
    [0, 4, 1],
    [3, 10, 1],
  ]
  const header = Buffer.alloc(4 + records.length * 8)
  header.writeUInt16BE(0, 0)
  header.writeUInt16BE(records.length, 2)
  const offsets = [header.length, header.length + format4.length]
  records.forEach(([platform, encoding, subtable], index) => {
    const at = 4 + index * 8
    header.writeUInt16BE(platform, at)
    header.writeUInt16BE(encoding, at + 2)
    header.writeUInt32BE(offsets[subtable], at + 4)
  })
  return Buffer.concat([header, format4, format12])
}

// ---------------------------------------------------------------------------
// The FILL axis
//
// harfbuzzjs 1.6.1 (the wasm build subset-font runs) instances an axis by
// baking its deltas into the outlines, and then drops `gvar` — including the
// deltas of the axes that were asked to stay variable. Pinning wght, GRAD and
// opsz therefore leaves an `fvar` that still advertises FILL 0..1 but a font
// where FILL does nothing.
//
// The deltas are put back here. FILL is a two-master axis (a 0.5 instance from
// harfbuzz is the midpoint of the two masters to within half a font unit, the
// rounding), so instancing the source twice — once at FILL 0, once at FILL 1 —
// and taking the difference per point reproduces it exactly: `gvar` with one
// tuple per glyph, peaking at FILL = 1, over all points. Advance widths do not
// move with FILL, so no HVAR is needed.
// ---------------------------------------------------------------------------
interface GlyphPoints {
  xs: Array<number>
  ys: Array<number>
}

/** Absolute coordinates of a simple glyph's points, in order. */
function glyphPoints(glyf: Buffer, start: number, end: number, gid: number): GlyphPoints {
  if (end <= start) return { xs: [], ys: [] }
  const numberOfContours = glyf.readInt16BE(start)
  if (numberOfContours < 0) throw new Error(`glyph ${gid} is composite; the FILL rebuild handles simple glyphs only`)
  let at = start + 10
  let numPoints = 0
  for (let i = 0; i < numberOfContours; i += 1) {
    numPoints = glyf.readUInt16BE(at) + 1
    at += 2
  }
  at += 2 + glyf.readUInt16BE(at) // instructions

  const flags: Array<number> = []
  while (flags.length < numPoints) {
    const flag = glyf.readUInt8(at)
    at += 1
    flags.push(flag)
    if (flag & 0x08) {
      let repeat = glyf.readUInt8(at)
      at += 1
      while (repeat > 0 && flags.length < numPoints) {
        flags.push(flag)
        repeat -= 1
      }
    }
  }

  const read = (shortBit: number, sameBit: number) => {
    const values: Array<number> = []
    let value = 0
    for (const flag of flags) {
      if (flag & shortBit) {
        const delta = glyf.readUInt8(at)
        at += 1
        value += flag & sameBit ? delta : -delta
      } else if (!(flag & sameBit)) {
        value += glyf.readInt16BE(at)
        at += 2
      }
      values.push(value)
    }
    return values
  }
  const xs = read(0x02, 0x10)
  const ys = read(0x04, 0x20)
  return { xs, ys }
}

function locaOffsets(font: Buffer): { glyf: Buffer; offsets: Array<number> } {
  const { tables } = readSfnt(font)
  const find = (tag: string) => {
    const table = tables.find((entry) => entry.tag === tag)
    if (!table) throw new Error(`the instanced font has no "${tag}" table`)
    return table.data
  }
  const head = find("head")
  const long = head.readInt16BE(50) === 1
  const loca = find("loca")
  const count = long ? loca.length / 4 : loca.length / 2
  const offsets: Array<number> = []
  for (let i = 0; i < count; i += 1) {
    offsets.push(long ? loca.readUInt32BE(i * 4) : loca.readUInt16BE(i * 2) * 2)
  }
  return { glyf: find("glyf"), offsets }
}

/** gvar's run-length encoding for a delta row (spec: "Packed Deltas"). */
function packDeltas(deltas: Array<number>): Buffer {
  const out: Array<number> = []
  const fitsInByte = (value: number) => value >= -128 && value <= 127
  let at = 0
  while (at < deltas.length) {
    if (deltas[at] === 0) {
      let run = 0
      while (at + run < deltas.length && deltas[at + run] === 0 && run < 64) run += 1
      out.push(0x80 | (run - 1))
      at += run
    } else {
      const asBytes = fitsInByte(deltas[at])
      let run = 0
      while (
        at + run < deltas.length &&
        deltas[at + run] !== 0 &&
        fitsInByte(deltas[at + run]) === asBytes &&
        run < 64
      ) {
        run += 1
      }
      out.push((asBytes ? 0x00 : 0x40) | (run - 1))
      for (let i = 0; i < run; i += 1) {
        const value = deltas[at + i]
        if (asBytes) out.push(value & 0xff)
        else out.push((value >> 8) & 0xff, value & 0xff)
      }
      at += run
    }
  }
  return Buffer.from(out)
}

/**
 * Reads the gvar back out of the finished font and checks the FILL axis can
 * actually move: the table has to survive the woff2 round trip, name one axis
 * and one shared tuple through a non-null offset (a null one is silently
 * dropped by Chromium), and carry data for exactly the glyphs that differ
 * between the two masters.
 */
function assertGvar(font: Buffer, varying: number) {
  const table = readSfnt(font).tables.find((entry) => entry.tag === "gvar")
  if (!table) throw new Error("pinned font: gvar did not survive, so the FILL axis would do nothing")
  const gvar = table.data
  const axisCount = gvar.readUInt16BE(4)
  const sharedTupleCount = gvar.readUInt16BE(6)
  const sharedTuplesOffset = gvar.readUInt32BE(8)
  const glyphCount = gvar.readUInt16BE(12)
  const longOffsets = (gvar.readUInt16BE(14) & 1) === 1
  if (axisCount !== 1) throw new Error(`pinned font: gvar names ${axisCount} axes, expected 1`)
  if (sharedTupleCount !== 1 || sharedTuplesOffset < 20 || sharedTuplesOffset >= gvar.length) {
    throw new Error(`pinned font: gvar shared tuples are at ${sharedTuplesOffset} (count ${sharedTupleCount})`)
  }
  if (gvar.readInt16BE(sharedTuplesOffset) !== 0x4000) {
    throw new Error("pinned font: the shared tuple does not peak at FILL = 1")
  }
  let withData = 0
  for (let gid = 0; gid < glyphCount; gid += 1) {
    const at = 20 + gid * (longOffsets ? 4 : 2)
    const start = longOffsets ? gvar.readUInt32BE(at) : gvar.readUInt16BE(at) * 2
    const end = longOffsets ? gvar.readUInt32BE(at + 4) : gvar.readUInt16BE(at + 2) * 2
    if (end > start) withData += 1
  }
  if (withData !== varying) {
    throw new Error(`pinned font: gvar carries ${withData} glyph(s), expected the ${varying} that FILL moves`)
  }
}

/** The `gvar` table that turns the FILL-0 master back into a variable font. */
function buildGvar(fill0: Buffer, fill1: Buffer): { gvar: Buffer; varying: number; points: number } {
  const zero = locaOffsets(fill0)
  const one = locaOffsets(fill1)
  if (zero.offsets.length !== one.offsets.length) throw new Error("the two FILL masters disagree on the glyph count")
  const glyphCount = zero.offsets.length - 1

  const perGlyph: Array<Buffer> = []
  let varying = 0
  let points = 0
  for (let gid = 0; gid < glyphCount; gid += 1) {
    const a = glyphPoints(zero.glyf, zero.offsets[gid], zero.offsets[gid + 1], gid)
    const b = glyphPoints(one.glyf, one.offsets[gid], one.offsets[gid + 1], gid)
    if (a.xs.length !== b.xs.length) {
      throw new Error(`glyph ${gid} has ${a.xs.length} points at FILL 0 and ${b.xs.length} at FILL 1`)
    }
    points += a.xs.length
    const dx = a.xs.map((value, index) => b.xs[index] - value)
    const dy = a.ys.map((value, index) => b.ys[index] - value)
    if (a.xs.length === 0 || (dx.every((value) => value === 0) && dy.every((value) => value === 0))) {
      perGlyph.push(Buffer.alloc(0))
      continue
    }
    varying += 1
    // One tuple per glyph, pointing at the shared peak (FILL = 1) and the
    // shared point numbers ("every point"); the four phantom points (lsb,
    // advance, top, bottom) do not move with FILL.
    const deltas = Buffer.concat([packDeltas([...dx, 0, 0, 0, 0]), packDeltas([...dy, 0, 0, 0, 0])])
    const glyphData = Buffer.concat([
      (() => {
        const header = Buffer.alloc(8)
        header.writeUInt16BE(0x8000 | 1, 0) // shared point numbers + one tuple
        header.writeUInt16BE(8, 2) // where the serialized data starts
        header.writeUInt16BE(deltas.length, 4)
        header.writeUInt16BE(0, 6) // tupleIndex: shared tuple 0, no private points
        return header
      })(),
      Buffer.from([0x00]), // shared point numbers: 0 = every point in the glyph
      deltas,
    ])
    const padded = Buffer.alloc(Math.ceil(glyphData.length / 4) * 4)
    glyphData.copy(padded)
    perGlyph.push(padded)
  }

  // Chromium's font sanitiser drops a gvar whose sharedTuplesOffset is null,
  // even with no shared tuples, and the font then renders at its default
  // instance with no warning — so the peak is stored as a shared tuple.
  const offsetsEnd = 20 + (glyphCount + 1) * 4
  const sharedTuples = Buffer.alloc(2)
  sharedTuples.writeInt16BE(0x4000, 0) // FILL = 1.0 in F2Dot14
  const headerLength = offsetsEnd + sharedTuples.length
  const gvar = Buffer.alloc(headerLength + perGlyph.reduce((sum, data) => sum + data.length, 0))
  gvar.writeUInt16BE(1, 0) // majorVersion
  gvar.writeUInt16BE(0, 2) // minorVersion
  gvar.writeUInt16BE(1, 4) // axisCount
  gvar.writeUInt16BE(1, 6) // sharedTupleCount
  gvar.writeUInt32BE(offsetsEnd, 8) // sharedTuplesOffset
  gvar.writeUInt16BE(glyphCount, 12)
  gvar.writeUInt16BE(1, 14) // flags: 32-bit offsets
  gvar.writeUInt32BE(headerLength, 16)
  sharedTuples.copy(gvar, offsetsEnd)
  let cursor = headerLength
  perGlyph.forEach((data, gid) => {
    gvar.writeUInt32BE(cursor - headerLength, 20 + gid * 4)
    data.copy(gvar, cursor)
    cursor += data.length
  })
  gvar.writeUInt32BE(cursor - headerLength, 20 + glyphCount * 4)
  return { gvar, varying, points }
}

// ---------------------------------------------------------------------------
// SVG markup → font contours
//
// The Tecton export is Figma output: absolute `M L H V C Z` path data on a
// `0 0 16 16` frame, a `translate()` on two icons, and (only in `strata`) a
// group Figma marks as unparseable around a `<foreignObject>` gradient. Any
// other element or transform throws instead of being dropped silently, so a
// future export cannot lose a shape without anyone noticing.
// ---------------------------------------------------------------------------
interface Point {
  x: number
  y: number
}

type Segment =
  | { type: "L"; x: number; y: number }
  | { type: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }

/** A closed contour in font units: a start point and the segments back to it. */
interface Contour {
  x: number
  y: number
  segments: Array<Segment>
}

/** Subtrees that carry no glyph geometry. */
const SKIPPED_TAGS = new Set(["defs", "clippath", "foreignobject"])
/** Elements that may appear outside a skipped subtree. */
const KEPT_TAGS = new Set(["g", "path"])

const TAG_RE = /<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^"'>])*?)(\/?)>/g
const ATTR_RE = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g
const TRANSLATE_RE = /^translate\(\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+))?\s*\)$/

function attributesOf(text: string): Map<string, string> {
  const attrs = new Map<string, string>()
  for (const match of text.matchAll(ATTR_RE)) {
    attrs.set(match[1].toLowerCase(), match[2] ?? match[3] ?? "")
  }
  return attrs
}

/** `<clipPath id="…">` bodies, so a clip on a kept element can be checked. */
function collectClipPaths(markup: string): Map<string, string> {
  const clips = new Map<string, string>()
  for (const match of markup.matchAll(/<clipPath\b([^>]*)>([\s\S]*?)<\/clipPath>/gi)) {
    const id = attributesOf(match[1]).get("id")
    if (id) clips.set(id, match[2])
  }
  return clips
}

/**
 * A clip is accepted only when it cannot change the drawing: a rectangle that
 * covers the whole frame, which is what Figma wraps every icon in.
 */
function assertNoOpClip(value: string, clips: Map<string, string>, origin: string) {
  const id = /^url\(\s*['"]?#([^)'"]+)['"]?\s*\)$/.exec(value.trim())?.[1]
  const body = id === undefined ? undefined : clips.get(id)
  if (body === undefined) throw new Error(`${origin}: clip-path="${value}" does not resolve`)
  const rect = /<rect\b([^>]*)>/i.exec(body)
  const attrs = rect ? attributesOf(rect[1]) : undefined
  const covers =
    attrs !== undefined &&
    Number(attrs.get("x") ?? 0) <= 0 &&
    Number(attrs.get("y") ?? 0) <= 0 &&
    Number(attrs.get("width") ?? 0) >= SVG_VIEWBOX &&
    Number(attrs.get("height") ?? 0) >= SVG_VIEWBOX
  if (!covers) {
    throw new Error(`${origin}: clip-path="${value}" clips the drawing; only a full-frame rect is supported`)
  }
}

function translationOf(value: string | undefined, origin: string): Point {
  if (value === undefined) return { x: 0, y: 0 }
  const match = TRANSLATE_RE.exec(value.trim())
  if (!match) throw new Error(`${origin}: unsupported transform "${value}" (only translate() is)`)
  return { x: Number(match[1]), y: Number(match[2] ?? 0) }
}

/** Every `<path>` that contributes ink, with its accumulated translation. */
function collectPaths(markup: string, origin: string): Array<{ d: string; dx: number; dy: number }> {
  const clips = collectClipPaths(markup)
  const found: Array<{ d: string; dx: number; dy: number }> = []
  const stack: Array<{ tag: string; dx: number; dy: number; skipped: boolean }> = [
    { tag: "#root", dx: 0, dy: 0, skipped: false },
  ]

  for (const match of markup.matchAll(TAG_RE)) {
    const [, closing, rawTag, attrText, selfClosing] = match
    const tag = rawTag.toLowerCase()
    if (closing) {
      const frame = stack.pop()
      if (!frame || frame.tag !== tag) throw new Error(`${origin}: </${rawTag}> does not close ${frame?.tag}`)
      continue
    }

    const parent = stack[stack.length - 1]
    const attrs = attributesOf(attrText)
    const skipped =
      parent.skipped || SKIPPED_TAGS.has(tag) || attrs.get("data-figma-skip-parse") === "true"

    if (!skipped) {
      if (!KEPT_TAGS.has(tag)) {
        throw new Error(`${origin}: <${rawTag}> is not path geometry and is not a skipped subtree`)
      }
      const clip = attrs.get("clip-path")
      if (clip !== undefined) assertNoOpClip(clip, clips, origin)
    }

    const shift = skipped ? { x: 0, y: 0 } : translationOf(attrs.get("transform"), origin)
    const dx = parent.dx + shift.x
    const dy = parent.dy + shift.y

    if (!skipped && tag === "path") {
      const d = attrs.get("d")
      if (d === undefined || d.trim() === "") throw new Error(`${origin}: <path> without a "d"`)
      found.push({ d, dx, dy })
    }
    if (!selfClosing) stack.push({ tag, dx, dy, skipped })
  }

  if (stack.length !== 1) throw new Error(`${origin}: ${stack.length - 1} unclosed element(s)`)
  if (found.length === 0) throw new Error(`${origin}: no <path> found`)
  return found
}

// ---------------------------------------------------------------------------
// Path data → contours
// ---------------------------------------------------------------------------
const PATH_TOKEN_RE = /([A-Za-z])|([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)/g
const ARGUMENT_COUNT: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, Z: 0 }

/**
 * Absolute `M L H V C Z` only: the whole Tecton export uses nothing else, and a
 * silently ignored relative or arc command would deform a glyph.
 */
function parsePathData(d: string, dx: number, dy: number, origin: string): Array<Contour> {
  const tokens: Array<string | number> = []
  for (const match of d.matchAll(PATH_TOKEN_RE)) {
    tokens.push(match[1] !== undefined ? match[1] : Number(match[2]))
  }

  const toX = (x: number) => (x + dx) * SVG_SCALE
  const toY = (y: number) => (SVG_VIEWBOX - (y + dy)) * SVG_SCALE

  const contours: Array<Contour> = []
  let segments: Array<Segment> = []
  let startX = 0
  let startY = 0
  let x = 0
  let y = 0
  let open = false

  const finish = () => {
    if (!open) return
    if (segments.length > 0) {
      const last = segments[segments.length - 1]
      if (Math.abs(last.x - toX(startX)) > 1e-6 || Math.abs(last.y - toY(startY)) > 1e-6) {
        segments.push({ type: "L", x: toX(startX), y: toY(startY) })
      }
      contours.push({ x: toX(startX), y: toY(startY), segments })
    }
    segments = []
    open = false
  }

  let index = 0
  let command = ""
  while (index < tokens.length) {
    const token = tokens[index]
    if (typeof token === "string") {
      command = token
      index += 1
    } else if (command === "M") {
      command = "L" // a second coordinate pair after M is an implicit lineto
    } else if (command === "") {
      throw new Error(`${origin}: path data starts with a number`)
    }

    const arity = ARGUMENT_COUNT[command]
    if (arity === undefined) {
      throw new Error(`${origin}: unsupported path command "${command}" (absolute M L H V C Z only)`)
    }
    if (arity === 0 && typeof token === "number") {
      throw new Error(`${origin}: "${command}" takes no arguments`)
    }
    const args: Array<number> = []
    for (let i = 0; i < arity; i += 1) {
      const value = tokens[index + i]
      if (typeof value !== "number") throw new Error(`${origin}: "${command}" wants ${arity} numbers`)
      args.push(value)
    }
    index += arity

    switch (command) {
      case "M":
        finish()
        startX = args[0]
        startY = args[1]
        x = args[0]
        y = args[1]
        open = true
        break
      case "L":
        if (!open) throw new Error(`${origin}: "L" outside a subpath`)
        x = args[0]
        y = args[1]
        segments.push({ type: "L", x: toX(x), y: toY(y) })
        break
      case "H":
        if (!open) throw new Error(`${origin}: "H" outside a subpath`)
        x = args[0]
        segments.push({ type: "L", x: toX(x), y: toY(y) })
        break
      case "V":
        if (!open) throw new Error(`${origin}: "V" outside a subpath`)
        y = args[0]
        segments.push({ type: "L", x: toX(x), y: toY(y) })
        break
      case "C":
        if (!open) throw new Error(`${origin}: "C" outside a subpath`)
        segments.push({
          type: "C",
          x1: toX(args[0]),
          y1: toY(args[1]),
          x2: toX(args[2]),
          y2: toY(args[3]),
          x: toX(args[4]),
          y: toY(args[5]),
        })
        x = args[4]
        y = args[5]
        break
      case "Z":
        finish()
        x = startX
        y = startY
        break
      default:
        throw new Error(`${origin}: unsupported path command "${command}"`)
    }
  }
  finish()
  return contours
}

// ---------------------------------------------------------------------------
// Contour direction
//
// SVG fills an icon with the even-odd rule where the export says so, and a font
// is always filled by the non-zero winding rule. The two agree only when a
// contour nested an odd number of deep runs against its container, so the
// contours of each `<path>` element are re-oriented here: outer contours
// counter-clockwise, the holes inside them clockwise, and so on inwards.
// opentype.js keeps the direction it is given, so this is the only place it can
// happen. Nesting is counted within one element, never across elements — see
// contoursOf() for why.
// ---------------------------------------------------------------------------
/** Curve subdivisions used for the area and containment tests (not for output). */
const FLATTEN_STEPS = 12

function flatten(contour: Contour): Array<Point> {
  const points: Array<Point> = [{ x: contour.x, y: contour.y }]
  let from: Point = { x: contour.x, y: contour.y }
  for (const segment of contour.segments) {
    if (segment.type === "L") {
      points.push({ x: segment.x, y: segment.y })
    } else {
      for (let step = 1; step <= FLATTEN_STEPS; step += 1) {
        const t = step / FLATTEN_STEPS
        const u = 1 - t
        points.push({
          x: u ** 3 * from.x + 3 * u * u * t * segment.x1 + 3 * u * t * t * segment.x2 + t ** 3 * segment.x,
          y: u ** 3 * from.y + 3 * u * u * t * segment.y1 + 3 * u * t * t * segment.y2 + t ** 3 * segment.y,
        })
      }
    }
    from = { x: segment.x, y: segment.y }
  }
  return points
}

function signedArea(polygon: Array<Point>): number {
  let sum = 0
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    sum += a.x * b.y - b.x * a.y
  }
  return sum / 2
}

/** Even-odd ray cast, used to nest contours. */
function containsPoint(polygon: Array<Point>, point: Point): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i]
    const b = polygon[j]
    if (a.y > point.y !== b.y > point.y) {
      const x = a.x + ((point.y - a.y) / (b.y - a.y)) * (b.x - a.x)
      if (x > point.x) inside = !inside
    }
  }
  return inside
}

/**
 * A probe point for the nesting test: the midpoint of the polygon's longest
 * edge, nudged a hair towards the side the polygon encloses.
 *
 * It has to sit just inside the polygon's own boundary rather than anywhere in
 * the area it encloses: a point in the middle of a ring's outer contour lies
 * inside the ring's hole contour too, which would make the two contours nest
 * inside each other and cancel the hole. Two contours drawn on top of each
 * other (the three coincident faces of `strata`) still probe the same point, so
 * they keep the same direction and add up instead of cancelling.
 */
function boundaryProbe(polygon: Array<Point>, area: number): Point {
  let edge = 0
  let longest = 0
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    const length = Math.hypot(b.x - a.x, b.y - a.y)
    if (length > longest) {
      longest = length
      edge = i
    }
  }
  const a = polygon[edge]
  const b = polygon[(edge + 1) % polygon.length]
  const inwards = Math.sign(area)
  const nudge = Math.min(0.05, longest / 4)
  return {
    x: (a.x + b.x) / 2 - ((b.y - a.y) / longest) * inwards * nudge,
    y: (a.y + b.y) / 2 + ((b.x - a.x) / longest) * inwards * nudge,
  }
}

function reverseContour(contour: Contour): Contour {
  const starts: Array<Point> = [{ x: contour.x, y: contour.y }]
  for (const segment of contour.segments) starts.push({ x: segment.x, y: segment.y })
  const segments: Array<Segment> = []
  for (let i = contour.segments.length - 1; i >= 0; i -= 1) {
    const segment = contour.segments[i]
    const to = starts[i]
    if (segment.type === "L") {
      segments.push({ type: "L", x: to.x, y: to.y })
    } else {
      segments.push({ type: "C", x1: segment.x2, y1: segment.y2, x2: segment.x1, y2: segment.y1, x: to.x, y: to.y })
    }
  }
  return { x: contour.x, y: contour.y, segments }
}

/**
 * Contours that enclose no ink. The Figma export leaves a few behind (a run of
 * `H` commands along one line, for instance); they cannot be oriented, they
 * draw nothing, and the count is reported by the build.
 */
const droppedContours: Array<string> = []

/** Below this many square units a contour is a line, not a shape. */
const AREA_EPSILON = 1

function orientContours(contours: Array<Contour>, origin: string): Array<Contour> {
  const kept: Array<{ contour: Contour; polygon: Array<Point>; area: number }> = []
  for (const contour of contours) {
    const polygon = flatten(contour)
    const area = signedArea(polygon)
    if (Math.abs(area) < AREA_EPSILON) {
      droppedContours.push(origin)
      continue
    }
    kept.push({ contour, polygon, area })
  }
  const probes = kept.map((entry) => boundaryProbe(entry.polygon, entry.area))
  return kept.map((entry, index) => {
    let depth = 0
    for (let other = 0; other < kept.length; other += 1) {
      if (other !== index && containsPoint(kept[other].polygon, probes[index])) depth += 1
    }
    const wanted = depth % 2 === 0 ? 1 : -1
    return Math.sign(entry.area) === wanted ? entry.contour : reverseContour(entry.contour)
  })
}

// ---------------------------------------------------------------------------
// Glyphs
// ---------------------------------------------------------------------------
/** Font units are integers in the end; round once so identical art dedupes. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

function contoursToPath(contours: Array<Contour>): opentype.Path {
  const path = new opentype.Path()
  for (const contour of contours) {
    path.moveTo(round(contour.x), round(contour.y))
    for (const segment of contour.segments) {
      if (segment.type === "L") {
        path.lineTo(round(segment.x), round(segment.y))
      } else {
        path.curveTo(
          round(segment.x1),
          round(segment.y1),
          round(segment.x2),
          round(segment.y2),
          round(segment.x),
          round(segment.y)
        )
      }
    }
    path.close()
  }
  return path
}

/** Identifies a drawing, so two variants that draw the same share one glyph. */
function geometryKey(contours: Array<Contour>): string {
  return contours
    .map((contour) => {
      const head = `M${round(contour.x)} ${round(contour.y)}`
      const body = contour.segments.map((segment) =>
        segment.type === "L"
          ? `L${round(segment.x)} ${round(segment.y)}`
          : `C${round(segment.x1)} ${round(segment.y1)} ${round(segment.x2)} ${round(segment.y2)} ${round(segment.x)} ${round(segment.y)}`
      )
      return `${head}${body.join("")}Z`
    })
    .join("")
}

/**
 * The contours of one drawing, oriented per `<path>` element.
 *
 * SVG paints each element on its own and the ink is their union; a font fills
 * one outline by the non-zero rule. Orienting the contours of an element by
 * their nesting depth makes that element contribute exactly 1 to the winding
 * number where it paints and 0 where it does not, whatever fill rule it asked
 * for — so elements add up to the union instead of cancelling where they
 * overlap, and a hole in one element stays open unless another paints over it.
 */
function contoursOf(markup: string, origin: string): Array<Contour> {
  const contours: Array<Contour> = []
  for (const { d, dx, dy } of collectPaths(markup, origin)) {
    contours.push(...orientContours(parsePathData(d, dx, dy, origin), origin))
  }
  if (contours.length === 0) throw new Error(`${origin}: no contours`)
  return contours
}

function notdefGlyph(): opentype.Glyph {
  return new opentype.Glyph({ name: ".notdef", advanceWidth: ADVANCE_WIDTH, path: new opentype.Path() })
}

/**
 * An sfnt with Material's metrics, written from path data. opentype.js emits
 * CFF outlines, which keep the cubic curves of the source drawings as they are.
 */
function buildOpenTypeFont(familyName: string, glyphs: Array<opentype.Glyph>): Buffer {
  const font = new opentype.Font({
    familyName,
    styleName: "Regular",
    unitsPerEm: UNITS_PER_EM,
    ascender: ASCENDER,
    descender: DESCENDER,
    createdTimestamp: FIXED_TIMESTAMP,
    weightClass: 400,
    version: FONT_VERSION,
    copyright: COPYRIGHT,
    description: `${familyName} — generated by scripts/build-symbol-fonts.mts`,
    glyphs,
    tables: {
      os2: {
        sTypoAscender: ASCENDER,
        sTypoDescender: DESCENDER,
        sTypoLineGap: 0,
        usWinAscent: WIN_ASCENT,
        usWinDescent: WIN_DESCENT,
        fsType: 0,
      },
    },
  })
  return Buffer.from(font.toArrayBuffer())
}

// ---------------------------------------------------------------------------
// The codepoint allocation (icons/tecton-codepoints.json)
// ---------------------------------------------------------------------------
interface AllocationEntry {
  slug: string
  outlined: string
  filled: string
}

interface AllocationFile {
  notes: string
  version: number
  plane: string
  unknown: string
  outlinedBase: string
  filledOffset: string
  icons: Array<AllocationEntry>
}

const ALLOCATION_NOTES =
  "GENERATED by scripts/build-symbol-fonts.mts — append-only. Codepoints are assigned once, in icons/icons.json order, and never reassigned: a new icon is appended, and an icon removed from the manifest fails the build. Outlined glyphs run from U+100001 upward, the filled variant of an icon sits at its outlined codepoint + 0x800."

function parseCodepoint(value: string, where: string): number {
  const match = /^U\+([0-9A-F]{4,6})$/.exec(value)
  if (!match) throw new Error(`${where}: "${value}" is not a U+XXXXX codepoint`)
  return Number.parseInt(match[1], 16)
}

/**
 * The append-only Supplementary PUA-B allocation, over the slugs that have a
 * Tecton drawing. A manifest entry that renders a Material `symbol` and has no
 * drawing never appears here: it has no domain glyph to point at.
 */
function allocateCodepoints(slugs: Array<string>): AllocationFile {
  const known = new Set(slugs)
  const entries: Array<AllocationEntry> = []
  const taken = new Set<number>()

  if (existsSync(ALLOCATION_FILE)) {
    const previous = readJson<AllocationFile>(ALLOCATION_FILE)
    for (const entry of previous.icons) {
      if (!known.has(entry.slug)) {
        throw new Error(
          `icons/tecton-codepoints.json allocates "${entry.slug}", which icons/icons.json no longer lists ` +
            "with a drawing in icons-src/tecton/. Removing an icon (or its drawing) has to be deliberate: " +
            "drop the entry by hand (its codepoints stay retired) and re-run."
        )
      }
      const outlined = parseCodepoint(entry.outlined, `icons/tecton-codepoints.json (${entry.slug})`)
      const filled = parseCodepoint(entry.filled, `icons/tecton-codepoints.json (${entry.slug})`)
      if (filled !== outlined + FILLED_OFFSET) {
        throw new Error(`icons/tecton-codepoints.json (${entry.slug}): filled is not outlined + 0x${FILLED_OFFSET.toString(16)}`)
      }
      if (taken.has(outlined)) throw new Error(`icons/tecton-codepoints.json: ${entry.outlined} is allocated twice`)
      taken.add(outlined)
      entries.push({ slug: entry.slug, outlined: hex(outlined), filled: hex(filled) })
    }
  }

  const allocated = new Set(entries.map((entry) => entry.slug))
  let next = OUTLINED_BASE
  for (const slug of slugs) {
    if (allocated.has(slug)) continue
    while (taken.has(next)) next += 1
    if (next >= UNKNOWN_CODEPOINT + FILLED_OFFSET) {
      throw new Error(`the outlined range U+100001..${hex(UNKNOWN_CODEPOINT + FILLED_OFFSET - 1)} is full`)
    }
    taken.add(next)
    entries.push({ slug, outlined: hex(next), filled: hex(next + FILLED_OFFSET) })
  }

  return {
    notes: ALLOCATION_NOTES,
    version: 1,
    plane: "Supplementary Private Use Area-B (plane 16)",
    unknown: hex(UNKNOWN_CODEPOINT),
    outlinedBase: hex(OUTLINED_BASE),
    filledOffset: `0x${FILLED_OFFSET.toString(16)}`,
    icons: entries,
  }
}

// ---------------------------------------------------------------------------
// "Tecton Symbols" — Material Symbols Sharp, instanced
// ---------------------------------------------------------------------------
function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
}

interface MaterialResult {
  woff2: Buffer
  fillVaryingGlyphs: number
  fillPoints: number
  withFeatures: number
  sourceBytes: number
  version: string
  fontRevision: string
  sourceGlyphs: number
  glyphs: number
  codepoints: number
  names: number
  namesMissing: Array<string>
  unnamedAliases: number
  unnamedGlyphs: number
}

async function buildMaterialFont(): Promise<MaterialResult> {
  const source = readFileSync(MATERIAL_FONT)
  const sourceSfnt = Buffer.from(await wawoff2.decompress(source))
  const sourceFont = opentype.parse(toArrayBuffer(sourceSfnt))
  const sourceMap = sourceFont.tables.cmap?.glyphIndexMap
  if (!sourceMap) throw new Error(`${MATERIAL_FONT}: no cmap`)
  const codepoints = Object.keys(sourceMap)
    .map(Number)
    .sort((a, b) => a - b)

  // --- the vendored name list, checked against what the font actually has.
  const names = loadMaterialCodepoints(CODEPOINTS_FILE)
  const namesMissing = [...names].filter(([, code]) => sourceMap[String(code)] === undefined).map(([name]) => name)
  const namedGlyphs = new Set([...names.values()].map((code) => sourceMap[String(code)]))
  const namedCodepoints = new Set(names.values())
  // Google keeps legacy Material Icons codepoints pointing at renamed glyphs;
  // they carry no name of their own, which is expected as long as the glyph
  // behind them is reachable from a name.
  const unnamed = codepoints.filter((code) => code >= 0xe000 && !namedCodepoints.has(code))
  const unnamedGlyphs = unnamed.filter((code) => !namedGlyphs.has(sourceMap[String(code)]))
  const missingShare = namesMissing.length / names.size
  const orphanShare = unnamedGlyphs.length / codepoints.length
  if (missingShare > 0.02) {
    throw new Error(
      `icons/material-symbols.codepoints: ${namesMissing.length} of ${names.size} names (${(missingShare * 100).toFixed(1)}%) ` +
        "are not in the font's cmap — the list and material-symbols are out of step"
    )
  }
  if (orphanShare > 0.02) {
    throw new Error(
      `${unnamedGlyphs.length} cmap codepoints (${(orphanShare * 100).toFixed(1)}%) reach a glyph no name reaches — ` +
        "the vendored codepoints list is too old for this material-symbols version"
    )
  }
  if (namesMissing.length > 0) {
    console.warn(`  warning: ${namesMissing.length} name(s) are not in the font: ${namesMissing.slice(0, 5).join(", ")}`)
  }

  // --- instance the variable font, keeping every glyph the cmap can reach.
  // Three passes: the one the font ships as (wght/GRAD/opsz pinned, FILL left
  // in fvar) and the two masters of the FILL axis, whose difference becomes the
  // gvar harfbuzz drops (see "The FILL axis" above).
  const text = codepoints.map((code) => String.fromCodePoint(code)).join("")
  const instance = (fill: number | { min: number; max: number }, keepLayoutFeatures = false) =>
    subsetFont(source, text, {
      targetFormat: "sfnt",
      variationAxes: { ...AXES, FILL: fill },
      // icons are rendered by codepoint, never by ligature name; the comparison
      // build keeps them only to report what they would cost
      keepFeatures: keepLayoutFeatures ? undefined : [],
    })
  const partial = await instance(AXES.FILL)
  const fill0 = await instance(0)
  const fill1 = await instance(1)

  const tableOf = (font: Buffer, tag: string) => {
    const table = readSfnt(font).tables.find((entry) => entry.tag === tag)
    if (!table) throw new Error(`the instanced font has no "${tag}" table`)
    return table.data
  }
  for (const tag of ["glyf", "loca"]) {
    if (!tableOf(partial, tag).equals(tableOf(fill0, tag))) {
      throw new Error(`pinned font: its default instance is not the FILL 0 master ("${tag}" differs)`)
    }
  }
  const { gvar, varying, points } = buildGvar(fill0, fill1)
  const woff2 = Buffer.from(await wawoff2.compress(normaliseSfnt(partial, { gvar }, false)))
  const withFeatures = Buffer.from(
    await wawoff2.compress(normaliseSfnt(await instance(AXES.FILL, true), { gvar }, false))
  )

  // --- and check the result really is the font the stylesheet promises.
  const outSfnt = Buffer.from(await wawoff2.decompress(woff2))
  const outFont = opentype.parse(toArrayBuffer(outSfnt))
  const axes = outFont.tables.fvar?.axes ?? []
  if (axes.length !== 1 || axes[0].tag !== "FILL" || axes[0].minValue !== 0 || axes[0].maxValue !== 1) {
    throw new Error(`pinned font: expected one FILL 0..1 axis, got ${JSON.stringify(axes)}`)
  }
  if (axes[0].defaultValue !== 0) throw new Error("pinned font: FILL must default to 0")
  if (outFont.unitsPerEm !== UNITS_PER_EM) {
    throw new Error(`pinned font: unitsPerEm ${outFont.unitsPerEm}, expected ${UNITS_PER_EM}`)
  }
  const outMap = outFont.tables.cmap?.glyphIndexMap ?? {}
  const lost = codepoints.filter((code) => outMap[String(code)] === undefined)
  if (lost.length > 0) {
    throw new Error(`pinned font: ${lost.length} codepoint(s) lost, first ${hex(lost[0])}`)
  }
  const closeGlyph = outFont.glyphs.get(outMap[String(0xe5cd)])
  if (closeGlyph.advanceWidth !== ADVANCE_WIDTH) {
    throw new Error(`pinned font: "close" (U+E5CD) advances ${closeGlyph.advanceWidth}, expected ${ADVANCE_WIDTH}`)
  }
  assertGvar(outSfnt, varying)

  return {
    woff2,
    fillVaryingGlyphs: varying,
    fillPoints: points,
    withFeatures: withFeatures.length,
    sourceBytes: source.length,
    version: sourceFont.getEnglishName("version"),
    fontRevision: String(sourceFont.tables.head?.fontRevision ?? ""),
    sourceGlyphs: sourceFont.numGlyphs,
    glyphs: outFont.numGlyphs,
    codepoints: codepoints.length,
    names: names.size,
    namesMissing,
    unnamedAliases: unnamed.length - unnamedGlyphs.length,
    unnamedGlyphs: unnamedGlyphs.length,
  }
}

// ---------------------------------------------------------------------------
// "Tecton Symbols Domain" — Tecton's own drawings
// ---------------------------------------------------------------------------
interface DomainResult {
  woff2: Buffer
  glyphs: number
  markups: number
  shared: number
  colored: Array<string>
}

/** `add-circle` → `add_circle`, the PostScript name the CFF charset carries. */
function glyphName(slug: string, variant: "outlined" | "filled" | "shared"): string {
  const base = slug.replace(/[^A-Za-z0-9]/g, "_")
  return variant === "filled" ? `${base}_filled` : base
}

async function buildDomainFont(
  definitions: Map<string, { def: TectonSvgIcon; file: string }>,
  allocation: AllocationFile
): Promise<DomainResult> {
  interface Pending {
    name: string
    contours: Array<Contour>
    unicodes: Array<number>
  }
  const byGeometry = new Map<string, Pending>()
  const colored: Array<string> = []
  let markups = 0

  const add = (key: string, name: string, contours: Array<Contour>, codepoint: number) => {
    const pending = byGeometry.get(key)
    if (pending) {
      pending.unicodes.push(codepoint)
      return
    }
    byGeometry.set(key, { name, contours, unicodes: [codepoint] })
  }

  const unknownOrigin = "icons-src/fallback/unknown-icon.ts"
  const unknownContours = contoursOf(tectonUnknownIcon.outline, unknownOrigin)
  if (geometryKey(contoursOf(tectonUnknownIcon.filled, unknownOrigin)) !== geometryKey(unknownContours)) {
    throw new Error(`${unknownOrigin}: the outlined and the filled drawing must be identical`)
  }
  add(geometryKey(unknownContours), glyphName("unknown-icon", "shared"), unknownContours, UNKNOWN_CODEPOINT)

  for (const entry of allocation.icons) {
    const definition = definitions.get(entry.slug)
    if (!definition) throw new Error(`icons-src/tecton/${entry.slug}.ts is missing`)
    const { def, file } = definition
    if (def.viewBox.trim() !== `0 0 ${SVG_VIEWBOX} ${SVG_VIEWBOX}`) {
      throw new Error(`${file}: viewBox "${def.viewBox}", expected "0 0 ${SVG_VIEWBOX} ${SVG_VIEWBOX}"`)
    }
    if (def.colored) colored.push(entry.slug)
    for (const variant of ["outlined", "filled"] as const) {
      const markup = variant === "outlined" ? def.outline : def.filled
      if (!markup || markup.trim() === "") throw new Error(`${file}: no ${variant} markup`)
      markups += 1
      const contours = contoursOf(markup, `${file} (${variant})`)
      add(
        geometryKey(contours),
        glyphName(entry.slug, variant),
        contours,
        parseCodepoint(variant === "outlined" ? entry.outlined : entry.filled, entry.slug)
      )
    }
  }

  const glyphs = [notdefGlyph()]
  for (const pending of byGeometry.values()) {
    glyphs.push(
      new opentype.Glyph({
        name: pending.name,
        unicode: pending.unicodes[0],
        unicodes: pending.unicodes,
        advanceWidth: ADVANCE_WIDTH,
        path: contoursToPath(pending.contours),
      })
    )
  }

  const sfnt = normaliseSfnt(buildOpenTypeFont("Tecton Symbols Domain", glyphs))
  const woff2 = Buffer.from(await wawoff2.compress(sfnt))

  const parsed = opentype.parse(toArrayBuffer(Buffer.from(await wawoff2.decompress(woff2))))
  const map = parsed.tables.cmap?.glyphIndexMap ?? {}
  const wanted = [UNKNOWN_CODEPOINT, ...allocation.icons.flatMap((entry) => [entry.outlined, entry.filled].map((value) => parseCodepoint(value, entry.slug)))]
  const missing = wanted.filter((code) => map[String(code)] === undefined)
  if (missing.length > 0) throw new Error(`domain font: ${missing.length} codepoint(s) missing, first ${hex(missing[0])}`)
  if (parsed.unitsPerEm !== UNITS_PER_EM) throw new Error(`domain font: unitsPerEm ${parsed.unitsPerEm}`)
  for (const code of wanted) {
    const glyph = parsed.glyphs.get(map[String(code)])
    if (glyph.advanceWidth !== ADVANCE_WIDTH) {
      throw new Error(`domain font: ${hex(code)} advances ${glyph.advanceWidth}, expected ${ADVANCE_WIDTH}`)
    }
  }

  return { woff2, glyphs: glyphs.length, markups, shared: markups + 1 - byGeometry.size, colored }
}

// ---------------------------------------------------------------------------
// "Tecton Symbols Fallback" — one glyph, a great many codepoints
// ---------------------------------------------------------------------------
interface FallbackResult {
  woff2: Buffer
  glyphs: number
  codepoints: number
  cmapBytes: number
}

async function buildFallbackFont(): Promise<FallbackResult> {
  const origin = "icons-src/fallback/unknown-icon.ts"
  const contours = contoursOf(tectonUnknownIcon.outline, origin)
  const glyphs = [
    notdefGlyph(),
    new opentype.Glyph({
      name: glyphName("unknown-icon", "shared"),
      unicode: UNKNOWN_CODEPOINT,
      unicodes: [UNKNOWN_CODEPOINT],
      advanceWidth: ADVANCE_WIDTH,
      path: contoursToPath(contours),
    }),
  ]

  const cmap = buildCmapTable(FALLBACK_RANGES, 1)
  const sfnt = normaliseSfnt(buildOpenTypeFont("Tecton Symbols Fallback", glyphs), { cmap })
  const woff2 = Buffer.from(await wawoff2.compress(sfnt))

  const parsed = opentype.parse(toArrayBuffer(Buffer.from(await wawoff2.decompress(woff2))))
  const map = parsed.tables.cmap?.glyphIndexMap ?? {}
  let codepoints = 0
  for (const [start, end] of FALLBACK_RANGES) {
    codepoints += end - start + 1
    for (const code of [start, Math.floor((start + end) / 2), end]) {
      if (map[String(code)] !== 1) throw new Error(`fallback font: ${hex(code)} does not reach the unknown icon`)
    }
  }
  if (Object.keys(map).length !== codepoints) {
    throw new Error(`fallback font: cmap has ${Object.keys(map).length} codepoints, expected ${codepoints}`)
  }

  return { woff2, glyphs: glyphs.length, codepoints, cmapBytes: cmap.length }
}

// ---------------------------------------------------------------------------
// The stylesheet and the lock file
// ---------------------------------------------------------------------------
const FAMILIES: Array<{ family: string; file: string; what: string }> = [
  {
    family: "Tecton Symbols",
    file: "tecton-symbols.woff2",
    what: "Material Symbols Sharp, wght 300 / GRAD 0 / opsz 24, FILL variable (0..1, default 0)",
  },
  {
    family: "Tecton Symbols Domain",
    file: "tecton-symbols-domain.woff2",
    what: "Tecton's own drawings: U+100001.. outlined, + 0x800 filled",
  },
  {
    family: "Tecton Symbols Fallback",
    file: "tecton-symbols-fallback.woff2",
    what: "every codepoint the other two could use, mapped to the unknown icon",
  },
]

function renderCss(): string {
  const faces = FAMILIES.map(
    ({ family, file, what }) => `/* ${what} */
@font-face {
  font-family: "${family}";
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url("./fonts/${file}") format("woff2");
}`
  ).join("\n\n")

  return `/* GENERATED by scripts/build-symbol-fonts.mts — do not edit */
/*
 * The Tecton symbol fonts: an icon rendered as a character.
 *
 * globals.css does not import this sheet on purpose — an application shell
 * loads it explicitly, together with the woff2 files in ./fonts/ next to it.
 *
 * The three families are one fallback chain: the browser picks, per character,
 * the first family that has a glyph, so a Material codepoint comes from
 * "Tecton Symbols", a Tecton codepoint from "Tecton Symbols Domain" and
 * anything neither covers from "Tecton Symbols Fallback".
 *
 * Set --tecton-symbol-fill: 1 on an element (or a subtree) for the filled
 * variant of a Material glyph; Tecton's own glyphs carry the two variants as
 * two codepoints instead.
 *
 * src/icons/icon.tsx puts .tecton-symbols on the <text> inside its <svg> host
 * and .tecton-symbol-skeleton on the rect it draws while the fonts load.
 */

${faces}

.tecton-symbols {
  font-family:
    "Tecton Symbols", "Tecton Symbols Domain", "Tecton Symbols Fallback";
  font-weight: normal;
  font-style: normal;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  font-variation-settings: "FILL" var(--tecton-symbol-fill, 0);
  -webkit-font-smoothing: antialiased;
  user-select: none;
}

/*
 * The loading skeleton: the rect <Icon> draws in the glyph box until the fonts
 * are ready. Its own style="opacity:0" is the floor, so an application that
 * never loads this sheet sees nothing rather than a solid block; a CSS
 * animation outranks an inline style, so the rule below takes over from it.
 * The 150ms delay means a warm cache — where the fonts resolve within a frame
 * or two — never flashes a skeleton at all.
 */
.tecton-symbol-skeleton {
  animation: tecton-symbol-skeleton 1.4s ease-in-out 150ms infinite;
}

@keyframes tecton-symbol-skeleton {
  0%,
  100% {
    opacity: 0.06;
  }
  50% {
    opacity: 0.22;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tecton-symbol-skeleton {
    animation: tecton-symbol-skeleton-steady 1ms linear 150ms forwards;
  }

  @keyframes tecton-symbol-skeleton-steady {
    to {
      opacity: 0.14;
    }
  }
}
`
}

function renderLock(
  material: MaterialResult,
  domain: DomainResult,
  fallback: FallbackResult,
  css: string,
  allocation: AllocationFile
): string {
  const outputs: Record<string, { bytes: number; sha256: string; glyphs?: number }> = {
    "src/styles/fonts/tecton-symbols.woff2": {
      bytes: material.woff2.length,
      sha256: sha256(material.woff2),
      glyphs: material.glyphs,
    },
    "src/styles/fonts/tecton-symbols-domain.woff2": {
      bytes: domain.woff2.length,
      sha256: sha256(domain.woff2),
      glyphs: domain.glyphs,
    },
    "src/styles/fonts/tecton-symbols-fallback.woff2": {
      bytes: fallback.woff2.length,
      sha256: sha256(fallback.woff2),
      glyphs: fallback.glyphs,
    },
    "src/styles/tecton-symbols.css": { bytes: Buffer.byteLength(css), sha256: sha256(css) },
  }

  const lock = {
    notes:
      "GENERATED by scripts/build-symbol-fonts.mts — provenance of the committed symbol fonts. " +
      "Rebuild with `pnpm icons:fonts`, verify with `pnpm icons:fonts:check`.",
    materialSymbols: {
      package: "material-symbols",
      version: packageVersion("material-symbols"),
      file: "material-symbols-sharp.woff2",
      fontRevision: material.fontRevision,
      nameVersion: material.version,
      sourceGlyphs: material.sourceGlyphs,
      keptGlyphs: material.glyphs,
      codepoints: material.codepoints,
      axes: {
        pinned: { wght: AXES.wght, GRAD: AXES.GRAD, opsz: AXES.opsz },
        variable: { FILL: { min: AXES.FILL.min, max: AXES.FILL.max, default: 0 } },
      },
      layoutFeatures: "dropped (rendered by codepoint, never by ligature name)",
    },
    codepointNames: {
      file: "icons/material-symbols.codepoints",
      source: CODEPOINTS_SOURCE,
      downloaded: CODEPOINTS_DOWNLOADED,
      names: material.names,
      namesMissingFromFont: material.namesMissing.length,
      legacyAliasCodepoints: material.unnamedAliases,
      codepointsReachingAnUnnamedGlyph: material.unnamedGlyphs,
    },
    tecton: {
      allocation: "icons/tecton-codepoints.json",
      icons: allocation.icons.length,
      drawings: domain.markups + 1,
      glyphs: domain.glyphs,
      unknownIcon: hex(UNKNOWN_CODEPOINT),
      fallbackCodepoints: fallback.codepoints,
    },
    tools: {
      "subset-font": packageVersion("subset-font"),
      harfbuzzjs: packageVersion("harfbuzzjs", harfbuzzWasm()),
      "opentype.js": packageVersion("opentype.js"),
      wawoff2: packageVersion("wawoff2"),
    },
    outputs,
  }
  return `${JSON.stringify(lock, null, 2)}\n`
}

// ---------------------------------------------------------------------------
// Writing (or, with --check, not writing)
// ---------------------------------------------------------------------------
interface Output {
  name: OutputName
  file: string
  data: Buffer
}

function commit(outputs: Array<Output>): void {
  if (CHECK_MODE) {
    const stale: Array<string> = []
    for (const output of outputs) {
      if (!existsSync(output.file)) {
        stale.push(`${output.name} is missing (${kb(output.data.length)} would be written)`)
        continue
      }
      const current = readFileSync(output.file)
      if (!current.equals(output.data)) {
        stale.push(
          `${output.name} differs (on disk ${current.length} bytes / sha256 ${sha256(current).slice(0, 12)}, ` +
            `rebuilt ${output.data.length} bytes / sha256 ${sha256(output.data).slice(0, 12)})`
        )
      }
    }
    if (stale.length > 0) {
      console.error("icons:fonts:check failed — the committed symbol fonts are stale.")
      for (const line of stale) console.error(`  ${line}`)
      console.error("  run: pnpm --filter @tecton/react icons:fonts")
      process.exit(1)
    }
    console.log(`symbol fonts: up to date (${outputs.length} outputs)`)
    return
  }

  mkdirSync(FONTS_DIR, { recursive: true })
  for (const output of outputs) writeFileSync(output.file, output.data)
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const manifest = loadManifest()
  const definitions = await loadTectonDefinitions()
  // Manifest order, drawings only — the entries that render a Material symbol
  // carry no glyph of their own and take no codepoint.
  const drawn = manifest.icons.filter((icon) => definitions.has(icon.slug))
  const allocation = allocateCodepoints(drawn.map((icon) => icon.slug))

  const material = await buildMaterialFont()
  const domain = await buildDomainFont(definitions, allocation)
  const fallback = await buildFallbackFont()
  const css = renderCss()
  const allocationJson = `${JSON.stringify(allocation, null, 2)}\n`
  const lock = renderLock(material, domain, fallback, css, allocation)

  console.log(`${CHECK_MODE ? "icons:fonts:check" : "icons:fonts"}: three families, Material metrics (${UNITS_PER_EM} upem)`)
  console.log(
    `  Tecton Symbols           ${String(material.glyphs).padStart(5)} glyphs  ${kb(material.woff2.length).padStart(9)}  ` +
      `(layout features kept: ${kb(material.withFeatures)}; upstream file ${kb(material.sourceBytes)})`
  )
  console.log(
    `    FILL rebuilt as gvar from two pinned masters: ${material.fillVaryingGlyphs} glyph(s) move, ` +
      `${material.fillPoints} points compared`
  )
  console.log(
    `    ${material.codepoints} codepoints kept, ${material.names} vendored names checked: ` +
      `${material.namesMissing.length} missing from the font, ${material.unnamedGlyphs} glyph(s) no name reaches, ` +
      `${material.unnamedAliases} legacy alias codepoint(s)`
  )
  console.log(
    `  Tecton Symbols Domain    ${String(domain.glyphs).padStart(5)} glyphs  ${kb(domain.woff2.length).padStart(9)}  ` +
      `(${allocation.icons.length} drawing(s) × 2 variants + the unknown icon, ${domain.shared} shared; ` +
      `${manifest.icons.length - allocation.icons.length} manifest entr(ies) render a Material symbol instead)`
  )
  if (domain.colored.length > 0) {
    console.log(`    note: ${domain.colored.join(", ")} is drawn in colour and becomes a monochrome glyph`)
  }
  if (droppedContours.length > 0) {
    const where = [...new Set(droppedContours)]
    console.log(
      `    note: ${droppedContours.length} contour(s) enclosing no area dropped, in ${where.length} drawing(s): ` +
        `${where.slice(0, 3).map((origin) => path.basename(origin)).join(", ")}${where.length > 3 ? ", …" : ""}`
    )
  }
  console.log(
    `  Tecton Symbols Fallback  ${String(fallback.glyphs).padStart(5)} glyphs  ${kb(fallback.woff2.length).padStart(9)}  ` +
      `(${fallback.codepoints} codepoints → the unknown icon, cmap ${kb(fallback.cmapBytes)} before compression)`
  )
  console.log(`  src/styles/tecton-symbols.css  ${kb(Buffer.byteLength(css))}`)

  commit([
    { name: "src/styles/fonts/tecton-symbols.woff2", file: path.join(FONTS_DIR, "tecton-symbols.woff2"), data: material.woff2 },
    { name: "src/styles/fonts/tecton-symbols-domain.woff2", file: path.join(FONTS_DIR, "tecton-symbols-domain.woff2"), data: domain.woff2 },
    { name: "src/styles/fonts/tecton-symbols-fallback.woff2", file: path.join(FONTS_DIR, "tecton-symbols-fallback.woff2"), data: fallback.woff2 },
    { name: "src/styles/tecton-symbols.css", file: CSS_FILE, data: Buffer.from(css) },
    { name: "icons/tecton-codepoints.json", file: ALLOCATION_FILE, data: Buffer.from(allocationJson) },
    { name: "icons/fonts.lock.json", file: LOCK_FILE, data: Buffer.from(lock) },
  ])
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
