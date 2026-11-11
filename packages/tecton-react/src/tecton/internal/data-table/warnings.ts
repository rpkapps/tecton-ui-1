/**
 * DataTable's development warnings: each said once per table, never in
 * production (each call is behind a `process.env.NODE_ENV` test). They name what was asked for that cannot work (items without
 * ids, a part for a feature that is off, features that exclude each other)
 * and what the table does instead.
 */

// Declared here: the package's declaration build has no Node types.
declare const process: { env: { NODE_ENV?: string } }

/**
 * Development builds only: a consumer's bundler replaces
 * `process.env.NODE_ENV` (the package's build keeps the expression).
 * Without a bundler, or on a server without `process`, it is `false`.
 * Every call site is behind the same test, written out there (a constant
 * the bundler keeps as a binding would not be folded), so the bundler drops
 * the warnings and their messages from a production build.
 */
const DEV =
  typeof process === "undefined" ? false : process.env.NODE_ENV !== "production"

/** Warns with `message` the first time `key` is given, in development. */
type Warn = (key: string, message: string) => void

function createWarnings(): Warn {
  const said = new Set<string>()
  return (key, message) => {
    if (said.has(key) || !DEV) return
    said.add(key)
    console.warn(message)
  }
}

export { createWarnings }
export type { Warn }
