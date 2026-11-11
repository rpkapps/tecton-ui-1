/**
 * DataTable's development warnings: each said once per table, never in
 * production. They name what was asked for that cannot work (items without
 * ids, a part for a feature that is off, features that exclude each other)
 * and what the table does instead.
 */

// Declared here: the package's declaration build has no Node types.
declare const process: { env: { NODE_ENV?: string } }

/** Development builds only; a consumer's bundler replaces `process.env.NODE_ENV`. */
function isDevelopment() {
  try {
    return process.env.NODE_ENV !== "production"
  } catch {
    return false
  }
}

/** Warns with `message` the first time `key` is given, in development. */
type Warn = (key: string, message: string) => void

function createWarnings(): Warn {
  const said = new Set<string>()
  return (key, message) => {
    if (said.has(key) || !isDevelopment()) return
    said.add(key)
    console.warn(message)
  }
}

export { createWarnings }
export type { Warn }
