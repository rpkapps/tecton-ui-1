/**
 * The Module Federation `shared` entries for Tecton's dependencies: which of them
 * exist once per document (`singleton: true`) and which may be loaded twice, plus
 * the one that must never be loaded eagerly. Versions are not part of it — the
 * consumer adds `requiredVersion` / `version` from its own install. The table
 * and every entry in it are frozen, and the keys and flags are typed as the
 * literals they are.
 *
 * @see the header comment of `federation/shared.mjs` for the reason per entry.
 */
export declare const shared: {
  readonly react: { readonly singleton: true }
  readonly "react-dom": { readonly singleton: true }
  readonly sonner: { readonly singleton: true }
  readonly "@tecton/react/": { readonly singleton: false }
  readonly "react-aria-components": { readonly singleton: false }
  readonly recharts: { readonly singleton: false; readonly eager: false }
}

export default shared
