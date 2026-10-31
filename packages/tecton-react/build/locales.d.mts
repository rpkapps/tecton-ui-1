import type optimizeLocales from "@react-aria/optimize-locales-plugin"

/**
 * Build plugin that keeps the screen reader strings of the Tecton components
 * (Tree View, Chip) to the languages an application ships in. Each method takes
 * `{ locales }`, e.g. `{ locales: ["en-US"] }`: strings for every other locale
 * are left out of the client build, and those locales fall back to English.
 *
 * @see the header comment of `build/locales.mjs` for the recipe.
 */
declare const tectonLocales: Pick<
  typeof optimizeLocales,
  "vite" | "webpack" | "rollup" | "esbuild" | "turbopack"
>

export default tectonLocales
