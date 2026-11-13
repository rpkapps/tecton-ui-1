/** The `Table`'s scroll container, in a `DataTableContent`'s frame. */
const FRAME = '[data-slot="table-container"]'

/**
 * Where the rows of a table (`element`, or an element in it) scroll into
 * view: the nearest ancestor that clips them vertically, else the page
 * (`null`). An ancestor clips when it scrolls vertically and is bounded:
 * its content taller than it, or a `max-height`. The table's own frame
 * scrolls sideways (`overflow-x: auto` makes its `overflow-y` auto too)
 * but grows with its rows, so it counts only once it is taller inside.
 */
function scrollParentOf(element: HTMLElement) {
  const root = element.ownerDocument.documentElement
  for (
    let at = element.parentElement;
    at && at !== root && at !== element.ownerDocument.body;
    at = at.parentElement
  ) {
    const { overflowY, maxHeight } = getComputedStyle(at)
    if (
      overflowY !== "auto" &&
      overflowY !== "scroll" &&
      overflowY !== "overlay"
    )
      continue
    if (at.scrollHeight > at.clientHeight + 1) return at
    if (maxHeight !== "none" && maxHeight !== "" && !at.matches(FRAME))
      return at
  }
  return null
}

export { FRAME, scrollParentOf }
