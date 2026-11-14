/**
 * Internal to `@tecton/react`: the DOM a grid table (`table-grid.tsx`) reads
 * and writes, as plain functions of elements: what takes focus and keys,
 * which cells are laid out, the columns of a header with cells spanning
 * rows, a tabindex put back, and the table laid out at its content's width
 * for a moment (the column sizer, Fit to content, the virtualizer).
 */

/** Elements that take focus, besides the rows and cells the grid focuses. */
const FOCUSABLE =
  'a[href], area[href], button, input, select, textarea, iframe, summary, [contenteditable]:not([contenteditable="false"]), [tabindex]'

const isMac = () =>
  typeof navigator !== "undefined" &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform)

const TEXT_INPUTS = new Set([
  "text",
  "search",
  "email",
  "url",
  "tel",
  "password",
  "number",
  "date",
  "datetime-local",
  "month",
  "time",
  "week",
])

/** A field that takes the arrow keys and typing itself. */
function isTextEntry(element: HTMLElement) {
  if (element.isContentEditable) return true
  if (element instanceof HTMLTextAreaElement) return true
  if (element instanceof HTMLSelectElement) return true
  if (element instanceof HTMLInputElement) return TEXT_INPUTS.has(element.type)
  const role = element.getAttribute("role")
  return role === "textbox" || role === "combobox" || role === "spinbutton"
}

/**
 * A control that takes keys the grid would take (the arrows, Home / End,
 * Space, typing): a text field, a select, a slider, a radio. The grid
 * leaves its keys to it, and a cell holding one is entered (`contentOf`).
 */
function takesKeys(element: HTMLElement) {
  if (isTextEntry(element)) return true
  if (element instanceof HTMLInputElement)
    return element.type === "range" || element.type === "radio"
  const role = element.getAttribute("role")
  return role === "slider" || role === "radio" || role === "listbox"
}

function isCell(element: Element): element is HTMLTableCellElement {
  return element.tagName === "TD" || element.tagName === "TH"
}

/** Whether a cell is laid out: not hidden below a breakpoint (`hidden md:table-cell`). */
function isShown(cell: Element) {
  if (cell.getClientRects().length > 0) return true
  // No boxes: hidden, unless nothing in the table is laid out (a table not
  // rendered yet, or no layout at all), when every cell counts.
  const table = cell.closest("table")
  return !table || table.getClientRects().length === 0
}

/** The nearest cell laid out from `cell` on, `step` 1 forwards or -1 backwards. */
function shownFrom(cell: Element | null, step: 1 | -1) {
  for (
    let at = cell;
    at;
    at = step === 1 ? at.nextElementSibling : at.previousElementSibling
  )
    if (isCell(at) && isShown(at)) return at
  return null
}

/**
 * The cell over each column of a header or footer row, a cell of a row
 * above spanning down into it (`rowSpan`) included; `null` for a body row,
 * or a section with no cell spanning rows, whose rows' own cells are their
 * columns.
 */
function cellsByColumn(
  row: HTMLTableRowElement
): Array<HTMLTableCellElement> | null {
  const section = row.parentElement
  if (
    !(section instanceof HTMLTableSectionElement) ||
    section.tagName === "TBODY"
  )
    return null
  const rows = [...section.rows]
  if (!rows.some((each) => [...each.cells].some((cell) => cell.rowSpan > 1)))
    return null
  const grid = rows.map((): Array<HTMLTableCellElement> => [])
  rows.forEach((each, y) => {
    let x = 0
    for (const cell of each.cells) {
      while (grid[y][x]) x++
      const down = Math.min(Math.max(1, cell.rowSpan), rows.length - y)
      for (let dy = 0; dy < down; dy++)
        for (let dx = 0; dx < cell.colSpan; dx++) grid[y + dy][x + dx] = cell
      x += cell.colSpan
    }
  })
  return grid[rows.indexOf(row)] ?? null
}

/**
 * `read`'s result with the table laid out at its content's width for the
 * moment: every column as wide as its content, none given the space left,
 * in the automatic layout (with `col` given, without that column's width).
 */
function atContentWidth<T>(
  table: HTMLTableElement,
  read: () => T,
  col?: HTMLElement | null
): T {
  const { style } = table
  const saved = [style.tableLayout, style.width, style.minWidth]
  const width = col?.style.width ?? ""
  Object.assign(style, {
    tableLayout: "auto",
    width: "max-content",
    minWidth: "0",
  })
  if (col) col.style.width = ""
  try {
    return read()
  } finally {
    ;[style.tableLayout, style.width, style.minWidth] = saved
    if (col) col.style.width = width
  }
}

/** The first cell laid out from column `from` on, `step` 1 forwards or -1 backwards. */
function shownAt(
  cells: ReadonlyArray<HTMLTableCellElement>,
  from: number,
  step: 1 | -1
) {
  for (let at = from; at >= 0 && at < cells.length; at += step)
    if (isShown(cells[at])) return cells[at]
  return null
}

/** Gives an element the tab index it had (`null`: none). */
function putBackTabIndex(
  element: HTMLElement,
  original: string | null | undefined
) {
  if (original == null) element.removeAttribute("tabindex")
  else element.setAttribute("tabindex", original)
}

/** A column resizer: never one of the grid's stops, nor its tab stop. */
function isResizer(element: HTMLElement) {
  return element.dataset.slot === "table-column-resizer"
}

/**
 * A control the user can focus (not disabled, hidden or inert). A column
 * resizer is left out: it takes the arrow keys itself, so it is reached
 * through its column's menu ("Resize column") instead.
 */
function isFocusableControl(element: HTMLElement) {
  if (element.tagName === "TR" || isCell(element)) return false
  if (isResizer(element)) return false
  if ((element as HTMLButtonElement).disabled) return false
  if (element instanceof HTMLInputElement && element.type === "hidden")
    return false
  if (element.hidden || element.closest('[aria-hidden="true"], [inert]'))
    return false
  return true
}

export {
  atContentWidth,
  cellsByColumn,
  FOCUSABLE,
  isCell,
  isFocusableControl,
  isMac,
  isResizer,
  isShown,
  isTextEntry,
  putBackTabIndex,
  shownAt,
  shownFrom,
  takesKeys,
}
