/**
 * Rows added between two row models, for `highlightChanges`: the ids of
 * `next`'s items that `previous` has not, in `next`'s order (depth first).
 * One pass over `next`'s ids with a lookup in `previous`'s: O(n), however
 * many rows came or where they are.
 *
 * In a tree, the rows that arrive under a row whose children were not
 * loaded (`undefined` in `previous`: a server tree loading a row as it
 * opens), at any depth, are a load, not additions; a child added to a row
 * whose children were there is one, whether that row is open or not, and
 * so is a new row's subtree.
 */
import type { DataTableRowModel } from "./engine"

function addedIds<T>(
  previous: DataTableRowModel<T>,
  next: DataTableRowModel<T>
): Array<string> {
  const added: Array<string> = []
  if (previous.ids === next.ids) return added
  for (const id of next.ids) {
    if (previous.has(id)) continue
    // The nearest ancestor `previous` had: a row under one whose children
    // were not loaded came with their load, however deep.
    let parent = next.treeParentOf(id)
    while (parent !== null && !previous.has(parent))
      parent = next.treeParentOf(parent)
    if (parent !== null && previous.childrenUnloaded(parent)) continue
    added.push(id)
  }
  return added
}

export { addedIds }
