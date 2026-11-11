/**
 * The engine's rows: `items` (and, in a tree, their children) laid out once
 * per data as positions in one depth-first list, a parent before its
 * children. Every later stage works on these positions (typed arrays of
 * them), so no stage wraps an item in an object; only the display rows do.
 *
 * A `RowSet` is a set of these rows in some order: the top-level ones, and
 * in a tree each kept row's kept children. The core is the full set in data
 * order; filtering and sorting make others.
 */

type RowSet = {
  /** The top-level rows, in order. */
  readonly roots: Uint32Array
  /** In a tree: each row's children in the set, by position; `null` for flat data. */
  readonly children: ReadonlyArray<Uint32Array | undefined> | null
  /** Every row of the set, depth first, in data order (context rows too). */
  readonly all: Uint32Array
  /**
   * In a filtered tree: 1 for the rows kept only as ancestors of matches
   * (context), which do not count as matching; `null` when there are none.
   */
  readonly context: Uint8Array | null
  /** In a filtered tree: 1 for the rows with a match below them, shown expanded. */
  readonly holdsMatch: Uint8Array | null
}

/** Problems with the items' ids, for the root's one-time development warning. */
type IdIssues = {
  /** Ids used by more than one item (each once). */
  readonly duplicateIds: ReadonlyArray<string>
  /** How many items have no id (`"undefined"`). */
  readonly missingIds: number
}

type Core<T> = RowSet & {
  /** Every item, depth first. */
  readonly items: ReadonlyArray<T>
  /** Each item's id, by position. */
  readonly ids: ReadonlyArray<string>
  /** The position of each id (the first, when ids repeat). */
  readonly positions: ReadonlyMap<string, number>
  /** In a tree: 1 for the rows whose children are `undefined` (not loaded, in server mode). */
  readonly unloaded: Uint8Array | null
  readonly idIssues: IdIssues
}

const NO_ROWS = new Uint32Array(0)

function range(n: number) {
  const rows = new Uint32Array(n)
  for (let i = 0; i < n; i++) rows[i] = i
  return rows
}

function issues(ids: ReadonlyArray<string>, positions: Map<string, number>) {
  let missingIds = 0
  const duplicates = new Set<string>()
  ids.forEach((id, position) => {
    if (id === "undefined") missingIds++
    if (positions.get(id) !== position) duplicates.add(id)
  })
  return { duplicateIds: [...duplicates], missingIds }
}

function buildCore<T>(
  data: ReadonlyArray<T>,
  itemToId: (item: T) => string,
  itemToChildren: ((item: T) => ReadonlyArray<T> | undefined) | undefined
): Core<T> {
  const positions = new Map<string, number>()
  if (!itemToChildren) {
    const ids = data.map(itemToId)
    for (let i = ids.length - 1; i >= 0; i--) positions.set(ids[i], i)
    const all = range(data.length)
    return {
      items: data,
      ids,
      positions,
      roots: all,
      children: null,
      all,
      context: null,
      holdsMatch: null,
      unloaded: null,
      idIssues: issues(ids, positions),
    }
  }
  const items: Array<T> = []
  const ids: Array<string> = []
  const children: Array<Uint32Array | undefined> = []
  const unloaded: Array<number> = []
  const visit = (level: ReadonlyArray<T>): Uint32Array => {
    const rows = new Uint32Array(level.length)
    level.forEach((item, i) => {
      const position = items.length
      const id = itemToId(item)
      items.push(item)
      ids.push(id)
      if (!positions.has(id)) positions.set(id, position)
      rows[i] = position
      const kids = itemToChildren(item)
      if (kids === undefined) unloaded.push(position)
      children[position] = kids?.length ? visit(kids) : undefined
    })
    return rows
  }
  const roots = visit(data)
  const flags = new Uint8Array(items.length)
  for (const position of unloaded) flags[position] = 1
  return {
    items,
    ids,
    positions,
    roots,
    children,
    all: range(items.length),
    context: null,
    holdsMatch: null,
    unloaded: flags,
    idIssues: issues(ids, positions),
  }
}

/**
 * Whether an expanded row of `core` whose children were `undefined` now has
 * some (loaded since, while `items` stayed the same array). Only those rows
 * are read again: new children for a row that had some already are not
 * seen until `items` is a new array.
 */
function childrenLoaded<T>(
  core: Core<T>,
  expanded: ReadonlySet<string>,
  itemToChildren: (item: T) => ReadonlyArray<T> | undefined
) {
  const { unloaded } = core
  if (!unloaded) return false
  for (const id of expanded) {
    const position = core.positions.get(id)
    if (
      position !== undefined &&
      unloaded[position] === 1 &&
      itemToChildren(core.items[position]) !== undefined
    )
      return true
  }
  return false
}

export { buildCore, childrenLoaded, NO_ROWS }
export type { Core, IdIssues, RowSet }
