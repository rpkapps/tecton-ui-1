import { readdirSync } from "node:fs"

/** The source folders whose modules the package exports from its root. */
const FLAT_DIRS = ["components", "tecton", "hooks", "lib"]

/**
 * Vite/Vitest aliases that point each flat module path back at its source:
 * `@tecton/react/button` → `<src>/components/button`,
 * `@tecton/react/chip` → `<src>/tecton/chip`. The package's `exports`
 * map does the same for the built `dist/`.
 *
 * `srcDir` is the absolute path of packages/tecton-react/src, with forward
 * slashes and a trailing slash.
 */
export function flatModuleAliases(
  srcDir: string
): Array<{ find: RegExp; replacement: string }> {
  return FLAT_DIRS.map((dir) => {
    const names = readdirSync(`${srcDir}${dir}`, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() &&
          /\.tsx?$/.test(entry.name) &&
          !entry.name.endsWith(".d.ts")
      )
      .map((entry) => entry.name.replace(/\.tsx?$/, ""))
    return {
      find: new RegExp(`^@tecton/react/(${names.join("|")})$`),
      replacement: `${srcDir}${dir}/$1`,
    }
  })
}
