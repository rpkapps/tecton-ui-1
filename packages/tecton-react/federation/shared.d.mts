/**
 * The Module Federation `shared` entries for Tecton's dependencies: which of them
 * exist once per document (`singleton: true`) and which may be loaded twice, plus
 * the one that must never be loaded eagerly. Versions are not part of it — the
 * consumer adds `requiredVersion` / `version` from its own install.
 *
 * @see the header comment of `federation/shared.mjs` for the reason per entry.
 */
export declare const shared: Readonly<
  Record<string, Readonly<{ singleton: boolean; eager?: boolean }>>
>

export default shared
