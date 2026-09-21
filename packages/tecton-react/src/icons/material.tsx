"use client"

/**
 * MaterialSymbol — the escape hatch to a raw Material Symbols Sharp glyph.
 *
 * A Tecton name always wins: if the design system has an icon for what you
 * mean, use `<Icon name="…" />` (or its named component) so the drawing, the
 * variants and the gallery stay in one place. This component is for the rest of
 * Google's catalogue — a one-off glyph Tecton has no name for — and it renders
 * from the same "Tecton Symbols" font, with the same 24×24 host:
 *
 * ```tsx
 * import { MaterialSymbol } from "@tecton/react/icons/material"
 *
 * <MaterialSymbol name="rocket_launch" />
 * <MaterialSymbol name="rocket_launch" variant="filled" size={20} />
 * ```
 *
 * It lives on its own subpath because the 4,284-entry name table below is only
 * useful here: an application that stays on Tecton names never loads it.
 */
import { SymbolGlyph, UNKNOWN_CODEPOINT, warnUnknownName } from "./icon"
import { materialSymbolCodepoints } from "./material-codepoints"
import type { MaterialSymbolName } from "./material-codepoints"
import type { TectonIconProps } from "./types"

export type { MaterialSymbolName }

/** Names the table knows, with any string still accepted for data-driven use. */
export type MaterialSymbolNameInput = MaterialSymbolName | (string & {})

export interface MaterialSymbolProps extends TectonIconProps {
  /** A Material Symbols ligature name, e.g. `"rocket_launch"`. */
  name: MaterialSymbolNameInput
}

const codepointsByName = materialSymbolCodepoints as Partial<Record<string, number>>

/** One Material Symbols Sharp glyph, by its Google name. */
export function MaterialSymbol({ name, ...props }: MaterialSymbolProps) {
  const codepoint = codepointsByName[name]
  if (codepoint === undefined) warnUnknownName("MaterialSymbol", name)
  return (
    <SymbolGlyph
      name={name}
      source="material"
      codepoint={codepoint ?? UNKNOWN_CODEPOINT}
      {...props}
    />
  )
}
MaterialSymbol.displayName = "MaterialSymbol"
