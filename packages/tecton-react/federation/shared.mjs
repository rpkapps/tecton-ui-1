/**
 * shared — the Module Federation `shared` entries for Tecton's dependencies.
 *
 * A host and a remote that each bring their own `@tecton/react` have to agree on
 * which of its dependencies exist once per document and which may be loaded twice.
 * That list follows from where the library keeps module state, so it is Tecton's to
 * know and not the integration's — published here as data, so a build integration
 * spreads it into its `ModuleFederationPlugin` config instead of transcribing the
 * table from the micro-frontends page by hand.
 *
 * Versions are deliberately absent: `requiredVersion` and `version` come from the
 * consumer's own install, which the library cannot see.
 *
 * ```js title="rspack.config.mjs"
 * import { shared } from "@tecton/react/federation/shared"
 *
 * new ModuleFederationPlugin({
 *   shared: Object.fromEntries(
 *     Object.entries(shared).map(([name, policy]) => [
 *       name,
 *       { ...policy, requiredVersion: versionOf(name) },
 *     ])
 *   ),
 * })
 * ```
 *
 * Embla, `input-otp`, `react-resizable-panels` and Base UI are deliberately absent
 * too: they hold no cross-copy state, and a second instance is only bytes.
 *
 * Plain ESM with no build step and no dependency — a build config imports it from
 * Node before anything is bundled.
 */
export const shared = Object.freeze({
  // One renderer and one DOM binding per document, always.
  react: { singleton: true },
  "react-dom": { singleton: true },
  // Sonner's queue is module state: two copies mean two toast stacks.
  sonner: { singleton: true },
  // Prefix share (trailing slash): the package has no root export, so each
  // subpath is shared on its own. Not a singleton — versions may differ.
  "@tecton/react/": { singleton: false },
  // React Aria may differ between host and remote; its contexts are not shared.
  "react-aria-components": { singleton: false },
  // The chart component pulls all of recharts (~145 KB gzipped). Share it,
  // but never eagerly: only the applications that chart should pay for it.
  recharts: { singleton: false, eager: false },
})

export default shared
