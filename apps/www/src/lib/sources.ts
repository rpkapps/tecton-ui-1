/**
 * Raw source of the library files, for the docs "Manual installation" and
 * source views. Keys are the public import paths (`components/button`,
 * `tecton/chip`, `hooks/use-mobile`, `lib/utils`, `blocks/<name>/page`).
 */
const componentSources = import.meta.glob<string>(
  "../../../../packages/tecton-react/src/components/*.tsx",
  { query: "?raw", import: "default" }
)
const tectonSources = import.meta.glob<string>(
  "../../../../packages/tecton-react/src/tecton/*.tsx",
  { query: "?raw", import: "default" }
)
const hookSources = import.meta.glob<string>(
  "../../../../packages/tecton-react/src/hooks/*.ts",
  { query: "?raw", import: "default" }
)
const libSources = import.meta.glob<string>(
  "../../../../packages/tecton-react/src/lib/*.ts",
  { query: "?raw", import: "default" }
)
const blockSources = import.meta.glob<string>(
  "../../../../packages/tecton-blocks/src/blocks/*/**/*.{ts,tsx}",
  { query: "?raw", import: "default" }
)
const styleSources = import.meta.glob<string>(
  "../../../../packages/tecton-react/src/styles/*.css",
  { query: "?raw", import: "default" }
)

const PREFIX = "../../../../packages/tecton-react/src/"
const BLOCK_PREFIX = "../../../../packages/tecton-blocks/src/"

const all: Record<string, () => Promise<string>> = {}
for (const [map, ext] of [
  [componentSources, ".tsx"],
  [tectonSources, ".tsx"],
  [hookSources, ".ts"],
  [libSources, ".ts"],
  [styleSources, ".css"],
] as const) {
  for (const [key, load] of Object.entries(map)) {
    all[key.replace(PREFIX, "").replace(new RegExp(`\\${ext}$`), "")] = load
  }
}
for (const [key, load] of Object.entries(blockSources)) {
  all[key.replace(BLOCK_PREFIX, "").replace(/\.tsx?$/, "")] = load
}

export function hasSource(path: string) {
  return path in all
}

export function listSources(prefix: string) {
  return Object.keys(all)
    .filter((key) => key.startsWith(prefix))
    .sort()
}

export async function loadSource(path: string): Promise<string> {
  const load = all[path]
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- record lookup by user input
  if (!load) {
    throw new Error(`Unknown source: ${path}`)
  }
  return load()
}

export function sourceTitle(path: string) {
  if (path.startsWith("styles/"))
    return `@tecton/react/${path.replace("styles/", "")}`
  const ext =
    path.startsWith("hooks/") || path.startsWith("lib/") ? ".ts" : ".tsx"
  return `@tecton/react/${path}${ext}`
}
