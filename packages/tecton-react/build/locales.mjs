/**
 * locales — keeps the screen reader strings of the Tecton components to the
 * languages an application ships in.
 *
 * Tree View and Chip announce and label in 34 languages (drag and drop, row and
 * grid labels): about 20 kB gzipped that an English-only application never uses.
 * This build plugin replaces every other language's strings with nothing at
 * build time; a locale left out falls back to English at run time.
 *
 * Usage
 * -----
 *
 * ```ts title="vite.config.ts"
 * import tectonLocales from "@tecton/react/build/locales"
 *
 * export default defineConfig({
 *   plugins: [tectonLocales.vite({ locales: ["en-US"] }), react(), tailwindcss()],
 * })
 * ```
 *
 * `.webpack()`, `.rollup()` and `.esbuild()` take the same options, and
 * `.turbopack()` returns the `turbopack` config for Next.js. Add a locale
 * (`"nb-NO"`, `"ar-AE"`) when the application ships in that language. Only the
 * client build is trimmed; server rendering keeps every language.
 */
import optimizeLocales from "@react-aria/optimize-locales-plugin"

const tectonLocales = {
  vite: (options) => optimizeLocales.vite(options),
  webpack: (options) => optimizeLocales.webpack(options),
  rollup: (options) => optimizeLocales.rollup(options),
  esbuild: (options) => optimizeLocales.esbuild(options),
  turbopack: (options) => optimizeLocales.turbopack(options),
}

export default tectonLocales
