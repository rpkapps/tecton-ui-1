/**
 * unknown-icon — the reserved "unknown icon" drawing of the Tecton symbol fonts.
 *
 * PLACEHOLDER: a dashed square outline sized like a Material Symbols glyph (ink
 * within 2..14 of the 16 grid, a 1-unit stroke drawn as filled rectangles, two
 * 3-unit dashes per side leaving the corners open). Design may replace the
 * drawing at any time; what must not change is that the outlined and the filled
 * markup stay identical and that the glyph keeps its codepoint (U+100000, see
 * `icons/tecton-codepoints.json`).
 *
 * It is not part of the vendored Tecton icon export in `icons-src/tecton/` and
 * has no entry in `icons/icons.json`, so `icons:build` ignores it.
 * `scripts/build-symbol-fonts.mts` is its only consumer: it puts the glyph in
 * the Domain font at U+100000 and makes it the single glyph of the Fallback
 * font, where every codepoint a Tecton icon could ever use maps to it.
 */
import { defineTectonSvgIcon } from "../icon-definition"

/** Eight 3×1 dashes: two per side, 2 units of gap at every corner. */
const DASHED_SQUARE =
  '<path d="M4 2H7V3H4ZM9 2H12V3H9ZM4 13H7V14H4ZM9 13H12V14H9ZM2 4H3V7H2ZM2 9H3V12H2ZM13 4H14V7H13ZM13 9H14V12H13Z"></path>'

export const tectonUnknownIcon = defineTectonSvgIcon("unknown-icon", {
  viewBox: "0 0 16 16",
  outline: DASHED_SQUARE,
  filled: DASHED_SQUARE,
})
