/**
 * Selecting cells by dragging (`cellSelectionMode="range"`): from the cell
 * pressed, the range follows the pointer cell by cell until the button is
 * let go. Near an edge of the table's scroll area (or past it), the table
 * scrolls that way, faster the further out, and the range follows onto the
 * rows and columns scrolled in: in a virtualized table too, whose rows are
 * rendered as they come into view. The rows' edges are the scroll area's,
 * less a sticky header above and a sticky totals row below; a table that
 * does not scroll up and down itself scrolls the page.
 *
 * The cell under the pointer is found once per frame, at the pointer kept
 * within the rows shown (so a pointer over the header, or past the table,
 * selects up to the cell nearest to it), before that frame's scroll: the
 * rows the last scroll brought in are rendered by then.
 */

/** How far from an edge scrolling starts, in px. */
const EDGE = 40
/** The scroll at the edge, in px per frame. */
const SPEED = 24

type DragOptions = {
  table: HTMLTableElement
  /** The table's scroll container. */
  container: HTMLElement
  /** Whether a cell can be selected: a data cell of an item row, not a group row's. */
  cellAt: (cell: HTMLTableCellElement) => boolean
  /** The pointer is over another cell. */
  onCell: (cell: HTMLTableCellElement) => void
  /** Where the press was. */
  x: number
  y: number
}

function scrollsY(element: HTMLElement) {
  const { overflowY } = getComputedStyle(element)
  return (
    (overflowY === "auto" || overflowY === "scroll") &&
    element.scrollHeight > element.clientHeight + 1
  )
}

/** The part of the viewport where the rows show: the container, less its sticky header and footer. */
function rowsBox(table: HTMLTableElement, container: HTMLElement) {
  const view = table.ownerDocument.defaultView ?? window
  const box = container.getBoundingClientRect()
  let top = Math.max(box.top, 0)
  let bottom = Math.min(box.bottom, view.innerHeight)
  const left = Math.max(box.left, 0)
  const right = Math.min(box.right, view.innerWidth)
  const head = table.tHead
  if (head && getComputedStyle(head).position === "sticky")
    top = Math.max(top, head.getBoundingClientRect().bottom)
  const foot = table.tFoot
  if (foot && getComputedStyle(foot).position === "sticky")
    bottom = Math.min(bottom, foot.getBoundingClientRect().top)
  return { top, bottom, left, right }
}

/** The fastest scroll, past the edge, as a multiple of `SPEED`. */
const PAST = 4

/**
 * The scroll speed towards an edge: negative before `start`, positive past
 * `end`; up to `SPEED` within `EDGE` of it, faster past it.
 */
function speedAt(at: number, start: number, end: number) {
  if (at < start + EDGE)
    return -Math.ceil(SPEED * Math.min(PAST, (start + EDGE - at) / EDGE))
  if (at > end - EDGE)
    return Math.ceil(SPEED * Math.min(PAST, (at - (end - EDGE)) / EDGE))
  return 0
}

/** Starts following the pointer; returns its stop. */
function startCellDrag({
  table,
  container,
  cellAt,
  onCell,
  x,
  y,
}: DragOptions) {
  const doc = table.ownerDocument
  const view = doc.defaultView ?? window
  let pointer = { x, y }
  let frame = 0
  let last: HTMLTableCellElement | null = null

  const hit = () => {
    const box = rowsBox(table, container)
    if (box.bottom <= box.top || box.right <= box.left) return
    const px = Math.min(Math.max(pointer.x, box.left + 1), box.right - 1)
    const py = Math.min(Math.max(pointer.y, box.top + 1), box.bottom - 1)
    const found = doc.elementFromPoint(px, py)?.closest("td, th")
    if (
      !found ||
      found === last ||
      found.closest("table") !== table ||
      found.parentElement?.parentElement?.tagName !== "TBODY"
    )
      return
    const cell = found as HTMLTableCellElement
    if (!cellAt(cell)) return
    last = cell
    onCell(cell)
  }

  const tick = () => {
    frame = 0
    // The rows as rendered for the last scroll (a virtualized body renders
    // the rows a scroll brings after it), then the next scroll.
    hit()
    const box = rowsBox(table, container)
    const vertical = scrollsY(container)
      ? container
      : (doc.scrollingElement as HTMLElement | null)
    const top = vertical === container ? box.top : 0
    const bottom = vertical === container ? box.bottom : view.innerHeight
    const dy = speedAt(pointer.y, top, bottom)
    const dx =
      container.scrollWidth > container.clientWidth + 1
        ? speedAt(pointer.x, box.left, box.right)
        : 0
    let scrolled = false
    if (dy && vertical) {
      const before = vertical.scrollTop
      vertical.scrollTop += dy
      scrolled = vertical.scrollTop !== before
    }
    if (dx) {
      const before = container.scrollLeft
      container.scrollLeft += dx
      scrolled ||= container.scrollLeft !== before
    }
    // Keep scrolling while the pointer stays near an edge.
    if (scrolled) frame = view.requestAnimationFrame(tick)
  }

  const schedule = () => {
    if (!frame) frame = view.requestAnimationFrame(tick)
  }
  const onMove = (event: MouseEvent) => {
    pointer = { x: event.clientX, y: event.clientY }
    // The button let go outside the window.
    if ((event.buttons & 1) === 0) return stop()
    schedule()
  }
  const stop = () => {
    if (frame) view.cancelAnimationFrame(frame)
    frame = 0
    view.removeEventListener("mousemove", onMove, true)
    view.removeEventListener("mouseup", stop, true)
    view.removeEventListener("blur", stop)
  }
  view.addEventListener("mousemove", onMove, true)
  view.addEventListener("mouseup", stop, true)
  view.addEventListener("blur", stop)
  return stop
}

export { startCellDrag }
