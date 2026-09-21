"use client"

/**
 * Icon — every Tecton icon, drawn from the symbol fonts.
 *
 * The glyph is a character, not a path: a `<text>` element inside a 24×24
 * `<svg>` host, in one of the three families of
 * `@tecton/react/styles/tecton-symbols.css` (which an application shell loads
 * explicitly — globals.css does not import it). The host keeps the contract the
 * SVG components had, so nothing around an icon changes: `size` (default 24)
 * sets width/height, `className` passes through unchanged, so `size-4` and the
 * shadcn `[&_svg:not([class*='size-'])]:size-4` rules still size it, and the
 * glyph scales with the box because the font size is expressed in the viewBox's
 * own units.
 *
 * Where the glyph comes from, per `./names`:
 *   source "symbol"   a Material Symbols Sharp codepoint; `variant="filled"`
 *                     moves the font's FILL axis through --tecton-symbol-fill
 *   source "domain"   one of Tecton's own drawings, which carries its two
 *                     variants as two codepoints
 *   source "svg"      a colour drawing (today: `strata`) that stays an inline
 *                     SVG component, because a font glyph is monochrome
 *   source "unknown"  a name the table does not have: the reserved U+100000
 *                     "unknown icon", plus one warning per name in development
 *
 * Fonts load asynchronously, so the host reports `data-state`:
 *   "loading"      the `<text>` is rendered but hidden (the browser still has
 *                  to request the font for it) and a skeleton rect is drawn
 *   "ready"        the glyph, alone
 *   "unavailable"  the fonts did not arrive within 5s: a dashed placeholder
 *                  that needs no font at all. A late font still flips the state
 *                  back to "ready".
 * The box never changes between states — only what is drawn inside it.
 */
import * as React from "react"
import { tectonIconTable } from "./names"
import { tectonSvgIcons } from "./svg-icons"
import type { TectonIconName } from "./names"
import type {
  TectonIconComponent,
  TectonIconProps,
  TectonIconRecord,
  TectonIconVariant,
} from "./types"

/** The reserved "unknown icon" glyph — every family maps it. */
const UNKNOWN_CODEPOINT = 0x100000

/** The three families of tecton-symbols.css, in fallback order. */
const FONT_FAMILIES = [
  "Tecton Symbols",
  "Tecton Symbols Domain",
  "Tecton Symbols Fallback",
] as const

const FONT_FAMILY_SET: ReadonlySet<string> = new Set(FONT_FAMILIES)

/** How long to wait for a font before drawing the font-independent placeholder. */
const FONT_TIMEOUT_MS = 5000

export type TectonSymbolFontState = "loading" | "ready" | "unavailable"

// ---------------------------------------------------------------------------
// Font readiness — one module-level store for every icon on the page
// ---------------------------------------------------------------------------
let fontState: TectonSymbolFontState = "loading"
let fontWatchStarted = false
const fontListeners = new Set<() => void>()

function setFontState(next: TectonSymbolFontState) {
  if (fontState === next) return
  fontState = next
  for (const listener of fontListeners) listener()
}

/**
 * Ask the browser for the three families once, then keep listening: fonts can
 * still arrive after the timeout (a slow network, a stylesheet added later),
 * and `loadingdone` / `loadingerror` is how we hear about it.
 */
function startFontWatch() {
  if (fontWatchStarted) return
  fontWatchStarted = true

  const fonts =
    typeof document === "undefined"
      ? undefined
      : (document as Document & { fonts?: FontFaceSet }).fonts
  // No FontFaceSet (server rendering, jsdom): nothing to wait for — the glyph
  // is rendered and whatever the environment has for those families is used.
  if (!fonts || typeof fonts.load !== "function") {
    setFontState("ready")
    return
  }

  const timer = setTimeout(() => {
    if (fontState === "loading") setFontState("unavailable")
  }, FONT_TIMEOUT_MS)

  // `FontFaceSet.load()` rejects when any face of that family failed, even if
  // another one of them is usable — which is exactly the state a page is in
  // when a stylesheet arrives after a font request was blocked. So a rejected
  // load is not the end of it: the set itself is asked what it has.
  const anyFaceLoaded = () => {
    if (typeof fonts.forEach !== "function") return false
    let loaded = false
    fonts.forEach((face) => {
      if (face.status !== "loaded") return
      if (FONT_FAMILY_SET.has(face.family.replace(/^["']|["']$/g, ""))) loaded = true
    })
    return loaded
  }

  const attempt = () => {
    if (fontState === "ready") return
    void Promise.allSettled(
      FONT_FAMILIES.map((family) => fonts.load(`1em "${family}"`))
    ).then((results) => {
      const matched =
        results.some(
          (result) =>
            result.status === "fulfilled" && (result.value as Array<FontFace> | undefined)?.length
        ) || anyFaceLoaded()
      if (!matched) return
      clearTimeout(timer)
      setFontState("ready")
    })
  }

  fonts.addEventListener("loadingdone", attempt)
  fonts.addEventListener("loadingerror", attempt)
  attempt()
}

function subscribeToFonts(onStoreChange: () => void) {
  startFontWatch()
  fontListeners.add(onStoreChange)
  return () => {
    fontListeners.delete(onStoreChange)
  }
}

function getFontSnapshot(): TectonSymbolFontState {
  // Lazy and idempotent: the first snapshot is taken before anything can be
  // subscribed, so the synchronous "ready" below notifies no one mid-render.
  if (!fontWatchStarted) startFontWatch()
  return fontState
}

function getFontServerSnapshot(): TectonSymbolFontState {
  return "loading"
}

/** The state of the three symbol families, shared by every icon on the page. */
export function useTectonSymbolFontState(): TectonSymbolFontState {
  return React.useSyncExternalStore(
    subscribeToFonts,
    getFontSnapshot,
    getFontServerSnapshot
  )
}

// ---------------------------------------------------------------------------
// The glyph host
// ---------------------------------------------------------------------------
const warnedNames = new Set<string>()

/**
 * Module-scoped on purpose: the declaration shadows @types/node's global for
 * this file, so the `.d.ts` build — which does not load the node types — still
 * compiles, and a bundler keeps seeing the literal `process.env.NODE_ENV` it
 * replaces to drop the warning from a production build.
 */
declare const process: { env: { NODE_ENV?: string } }

/**
 * Only a bundler (or Node) can tell us this is a production build. Bundlers
 * substitute the expression below for a literal, so the branch is dropped; in a
 * browser that never saw one, `process` is simply not defined, which is not
 * production — a `typeof process` guard would instead silence the warning
 * exactly where it is most useful.
 */
function isProductionBuild(): boolean {
  try {
    return process.env.NODE_ENV === "production"
  } catch {
    return false
  }
}

function warnUnknownName(kind: string, name: string) {
  if (isProductionBuild()) return
  const key = `${kind}:${name}`
  if (warnedNames.has(key)) return
  warnedNames.add(key)
  console.warn(
    `@tecton/react: <${kind} name="${name}" /> is not a known ${kind === "Icon" ? "Tecton icon" : "Material symbol"} — rendering the unknown-icon glyph.`
  )
}

interface SymbolGlyphProps extends TectonIconProps {
  /** `data-tecton-icon`: the icon's own name, whatever draws it. */
  name: string
  /** The character to draw. */
  codepoint: number
  /** `data-tecton-source`. */
  source: "symbol" | "domain" | "unknown" | "material"
}

/**
 * The shared host: one `<svg>` box with one `<text>` glyph in it. `Icon` and
 * `MaterialSymbol` differ only in how they resolve a name to a codepoint.
 */
function SymbolGlyph({
  name,
  codepoint,
  source,
  size = 24,
  variant = "outlined",
  className,
  // Accepted for lucide compatibility; a glyph has no stroke to widen.
  strokeWidth: _strokeWidth,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  ...props
}: SymbolGlyphProps) {
  const state = useTectonSymbolFontState()
  const labelled = Boolean(props["aria-label"] ?? props["aria-labelledby"])
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      data-tecton-icon={name}
      data-tecton-source={source}
      data-tecton-variant={variant}
      data-state={state}
      aria-hidden={labelled ? undefined : true}
      role={labelled ? "img" : undefined}
      {...props}
    >
      {state === "unavailable" ? (
        // Font-independent: strokes and dashes, no text at all.
        <rect
          x="2.5"
          y="2.5"
          width="19"
          height="19"
          rx="3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 2"
          opacity="0.55"
        />
      ) : (
        <text
          x="0"
          y="24"
          fontSize="24"
          className="tecton-symbols"
          style={
            {
              "--tecton-symbol-fill": variant === "filled" ? 1 : 0,
              // Hidden, not unmounted: the browser only requests a font for
              // text it actually lays out.
              ...(state === "loading" ? { visibility: "hidden" } : null),
            } as React.CSSProperties
          }
        >
          {String.fromCodePoint(codepoint)}
        </text>
      )}
      {state === "loading" && (
        // `opacity: 0` is the floor for an application that never loads
        // tecton-symbols.css; the stylesheet's animation outranks it and
        // fades the skeleton in after 150ms.
        <rect
          className="tecton-symbol-skeleton"
          x="2"
          y="2"
          width="20"
          height="20"
          rx="4"
          fill="currentColor"
          style={{ opacity: 0 }}
        />
      )}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

/** Names the table knows, with any string still accepted for data-driven use. */
export type IconName = TectonIconName | (string & {})

export interface IconProps extends TectonIconProps {
  /** A Tecton icon name, e.g. `"well"` — the `data-tecton-icon` value. */
  name: IconName
}

/** The table, read by a name that may not be in it. */
const iconsByName = tectonIconTable as Partial<Record<string, TectonIconRecord>>

function codepointOf(record: TectonIconRecord, variant: TectonIconVariant) {
  if (record.source === "symbol") return record.codepoint
  if (record.source === "domain") {
    return variant === "filled" ? record.filled : record.outlined
  }
  return UNKNOWN_CODEPOINT
}

/**
 * Any Tecton icon, by name.
 *
 * ```tsx
 * <Icon name="well" />
 * <Icon name="check-circle" variant="filled" className="size-4" />
 * <Icon name="seismic" aria-label="Seismic survey" />
 * ```
 */
export function Icon({ name, ...props }: IconProps) {
  const record = iconsByName[name]

  if (record?.source === "svg") {
    // A colour drawing: a font glyph is monochrome, so it keeps its component.
    const SvgIcon = (tectonSvgIcons as Partial<Record<string, TectonIconComponent>>)[name]
    if (SvgIcon) return <SvgIcon {...props} />
  }
  if (!record) warnUnknownName("Icon", name)

  return (
    <SymbolGlyph
      name={name}
      source={record ? (record.source as "symbol" | "domain") : "unknown"}
      codepoint={record ? codepointOf(record, props.variant ?? "outlined") : UNKNOWN_CODEPOINT}
      {...props}
    />
  )
}
Icon.displayName = "Icon"

/**
 * The named component for one icon — what `src/icons/<slug>.tsx` exports:
 *
 * ```ts
 * export const WellIcon = tectonIcon("well")
 * ```
 */
export function tectonIcon(name: TectonIconName): TectonIconComponent {
  const record = tectonIconTable[name]
  const Component = (props: TectonIconProps) => <Icon name={name} {...props} />
  Component.displayName = record.label
  return Component
}

export { UNKNOWN_CODEPOINT, SymbolGlyph, warnUnknownName }
