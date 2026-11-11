/**
 * DataTable's development warnings: each said once per table, never in
 * production. They name what was asked for that cannot work (items without
 * ids, a part for a feature that is off, features that exclude each other)
 * and what the table does instead.
 *
 * Every call site tests `process.env.NODE_ENV !== "production"` itself,
 * written out in a `try`:
 *
 * - a consumer's bundler replaces that expression (the package's build
 *   keeps it), so a production build drops the warning and its message;
 *   it does not replace `typeof process`, which is no test of development
 *   (a plain Vite dev server has no `process`);
 * - with no bundler and no `process` (a page loading the modules as they
 *   are), the expression throws, and the `try` makes that no warning
 *   rather than an error.
 *
 * `createWarnings` tests it the same way, once more.
 */

// Declared here: the package's declaration build has no Node types.
declare const process: { env: { NODE_ENV?: string } }

/** Warns with `message` the first time `key` is given, in development. */
type Warn = (key: string, message: string) => void

function createWarnings(): Warn {
  const said = new Set<string>()
  return (key, message) => {
    try {
      if (process.env.NODE_ENV === "production" || said.has(key)) return
    } catch {
      // No `process` (no bundler): no warning.
      return
    }
    said.add(key)
    console.warn(message)
  }
}

export { createWarnings }
export type { Warn }
