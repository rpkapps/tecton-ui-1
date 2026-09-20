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
  /**
   * What to do with the rules Tailwind writes for the document root.
   *
   * `"scope"` (the default) rewrites a selector whose leading compound is `:root`,
   * `html` or `body` to `:scope`, keeping the rest of the compound and the rest of
   * the selector (`:root.dark` → `:scope.dark`), and drops a list member that is
   * nothing but `:host`. Tailwind's own defaults then land on the remote's own root
   * and inherit into its subtree instead of sitting at document level. A `:root`,
   * `:host`, `html` or `body` anywhere else in a selector throws, naming the file
   * and the line: under `@scope` it matches nothing.
   *
   * `"document"` leaves rules whose every selector is `:root` or `:host` unscoped
   * where they are, in the layer and the conditions they came with.
   */
  rootRules?: "scope" | "document"
  /**
   * Versions the `@keyframes` the sheet itself defines, so two remotes that hoist
   * the same name into one document stop animating each other's elements.
   *
   * On by default, with the suffix derived from `scope` (`.mfe-a` → `shimmer` is
   * emitted as `shimmer--mfe-a`). Every reference to a renamed name follows, in
   * `animation`, `animation-name` and any `--animate-*` custom property; a name
   * the sheet does not define is the host's, and is left alone.
   *
   * `{ suffix }` sets the suffix — a non-empty `[A-Za-z0-9_-]` identifier —
   * and `false` keeps the names as they are.
   */
  keyframes?: { suffix: string } | boolean
}

/**
 * PostCSS plugin that wraps a micro-frontend remote's compiled Tailwind output in
 * `@scope`, hoisting the document-global at-rules out of it and moving Tailwind's
 * `:root, :host` defaults onto the remote's own root. Run it after
 * `@tailwindcss/postcss`.
 *
 * @see the header comment of `postcss/scope.mjs` for the full recipe.
 */
declare function scopeTecton(options: ScopeTectonOptions): Plugin

declare namespace scopeTecton {
  const postcss: true
}

export default scopeTecton
