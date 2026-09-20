import type { Plugin } from "postcss"

export interface ScopeTectonOptions {
  /**
   * Selector of the remote's root element — the same class `ThemeRoot` renders and
   * the React root's `identifierPrefix` are built from, e.g. `".mfe-a"`. Required.
   */
  scope: string
  /**
   * Lower limit of the scope: `@scope (<scope>) to (<boundary>)`.
   *
   * Defaults to `"[data-tecton-root]"`, the attribute every `ThemeRoot` puts on its
   * element and on its body-level overlay container, so a remote mounted inside this
   * one ends the scope instead of inheriting its classes. A scope root that matches
   * the limit selector is not excluded by its own limit (a limit applies to
   * descendants), and `:scope` still selects the root.
   *
   * `false` (or `null`) scopes without a lower limit.
   */
  boundary?: string | false | null
}

/**
 * PostCSS plugin that wraps a micro-frontend remote's compiled Tailwind output in
 * `@scope`, hoisting the document-global at-rules and Tailwind's `:root, :host`
 * defaults out of it. Run it after `@tailwindcss/postcss`.
 *
 * @see the header comment of `postcss/scope.mjs` for the full recipe.
 */
declare function scopeTecton(options: ScopeTectonOptions): Plugin

declare namespace scopeTecton {
  const postcss: true
}

export default scopeTecton
