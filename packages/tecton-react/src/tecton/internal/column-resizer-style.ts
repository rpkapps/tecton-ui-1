/**
 * The look of `TableColumnResizer`'s grip, kept apart so DataTable's header
 * can draw the same grip, unchanged, before the resizer's code has loaded.
 */
import { cn } from "cn"

const columnResizerClassName = cn(
  // A 12 px grip centred on the column's end edge.
  "absolute inset-y-0 end-0 z-10 -me-1.5 w-3 cursor-col-resize touch-none outline-none select-none",
  // The line: short and quiet at rest, the header's full height while
  // the pointer is over the header, 2 px of the active outline colour
  // on the grip.
  "after:pointer-events-none after:absolute after:start-[calc(50%-0.5px)] after:top-1/3 after:bottom-1/3 after:w-px after:bg-border",
  "in-[thead:hover]:after:inset-y-0",
  "hover:after:inset-y-0 hover:after:start-[calc(50%-1px)] hover:after:w-0.5 hover:after:bg-outline-active-border",
  "focus-visible:after:inset-y-0 focus-visible:after:start-[calc(50%-1px)] focus-visible:after:w-0.5 focus-visible:after:bg-outline-active-border",
  "data-dragging:after:inset-y-0 data-dragging:after:start-[calc(50%-1px)] data-dragging:after:w-0.5 data-dragging:after:bg-outline-active-border",
  // Behind the line, centred on it: the grip's tint on hover, the
  // focus ring on keyboard focus.
  "before:pointer-events-none before:absolute before:inset-y-1 before:start-0.5 before:end-0.5 before:rounded-sm",
  "hover:before:bg-outline-active-border/15 focus-visible:before:ring-2 focus-visible:before:ring-ring data-dragging:before:bg-transparent",
  // The table's end edge is no divider: the last column shows its
  // line only when it is reached for.
  "[th:last-child>&]:after:opacity-0 [th:last-child>&]:hover:after:opacity-100 [th:last-child>&]:focus-visible:after:opacity-100 [th:last-child>&]:data-dragging:after:opacity-100",
  "data-disabled:pointer-events-none data-disabled:after:hidden"
)

export { columnResizerClassName }
