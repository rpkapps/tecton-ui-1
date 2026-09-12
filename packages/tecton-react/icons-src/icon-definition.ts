/**
 * Definition helper for the Tecton icon export in `icons-src/tecton/*.ts`.
 *
 * The files in `icons-src/tecton/` are the design system's own icon export,
 * vendored verbatim (they import `defineTectonSvgIcon` from `../icon-definition`,
 * which is this module). `scripts/build-icons.mts` loads them, normalises the
 * markup and generates the React components in `src/icons/`.
 */
export interface TectonSvgIconDefinition {
  /** SVG viewBox of both variants, e.g. `0 0 16 16`. */
  viewBox: string
  /** Inner SVG markup of the outlined variant. */
  outline: string
  /** Inner SVG markup of the filled variant. */
  filled: string
  /**
   * Multi-colour glyph: fills are kept as authored instead of being rewritten
   * to `currentColor`.
   */
  colored?: boolean
}

export interface TectonSvgIcon extends TectonSvgIconDefinition {
  /** kebab-case id, e.g. `add-circle`. */
  slug: string
}

export function defineTectonSvgIcon(slug: string, definition: TectonSvgIconDefinition): TectonSvgIcon {
  return { slug, ...definition }
}
