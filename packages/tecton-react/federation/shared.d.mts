/**
 * The Module Federation `shared` entries for Tecton's dependencies. None is a
 * singleton: applications release independently, so each may load its own copy
 * when versions differ, and a version both sides accept is loaded once. One
 * entry must never be loaded eagerly. Versions are not part of it — the
 * consumer adds `requiredVersion` / `version` from its own install. The table
 * and every entry in it are frozen, and the keys and flags are typed as the
 * literals they are.
 *
 * @see the header comment of `federation/shared.mjs` for the reason per entry.
 */
export declare const shared: {
  readonly react: SharedPolicy<false>
  readonly "react-dom": SharedPolicy<false>
  readonly sonner: SharedPolicy<false>
  readonly "@tecton/react/": SharedPolicy<false>
  readonly "@base-ui/react": SharedPolicy<false>
  readonly "@base-ui/react/": SharedPolicy<false>
  readonly "react-aria-components": SharedPolicy<false>
  readonly recharts: SharedPolicy<false> & { readonly eager: false }
}

/**
 * One entry. `eager` is optional on every entry, so code that reads it off any
 * policy (`Object.values(shared)`, `Object.entries(shared)`) type-checks.
 */
export type SharedPolicy<Singleton extends boolean = boolean> = {
  readonly singleton: Singleton
  readonly eager?: boolean
}

export default shared
