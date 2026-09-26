#!/usr/bin/env node
/**
 * tecton — look up @tecton/react components from a terminal or a coding agent.
 *
 *   tecton search <what the UI must do>   ranked components, their import and boundaries
 *   tecton docs <id|Component>[,…]        the usage guideline: Use it when, Not for, Do, Don't
 *   tecton list [--family <name>]         every id with a one-line summary
 *   tecton rules                          the rules every file follows (= tecton docs rules)
 *
 * The executable only: everything else is in ./tecton-lib.mjs, which is what
 * the tests and the eval import. This file always runs, however it is reached
 * (a node_modules/.bin symlink, a shim, `node --preserve-symlinks-main`).
 *
 * The library is imported from this file's real path: under
 * `--preserve-symlinks-main` a static `./tecton-lib.mjs` would resolve next to
 * the node_modules/.bin symlink instead of next to this file.
 */
import { realpathSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = pathToFileURL(realpathSync(fileURLToPath(import.meta.url)))
const { main } = await import(new URL("tecton-lib.mjs", here).href)

main()
