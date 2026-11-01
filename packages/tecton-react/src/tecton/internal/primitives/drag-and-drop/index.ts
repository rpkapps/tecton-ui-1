/**
 * Internal to `@tecton/react`: drag and drop shared by Tecton's components.
 *
 * - `useDragAndDrop` + `DragAndDropPrimitive.Handle` / `.DropIndicator`: a
 *   collection with its own drop rules (tree rows), from the pointer, the
 *   keyboard and a screen reader.
 * - `createListStrategy`: the drop strategy of a flat list (table rows or
 *   columns) for `useDragAndDrop`, with a line between items.
 * - `createSlotStrategy`: the drop strategy of fixed slots whose items swap
 *   (`Reorderable mode="swap"`).
 * - `useSortable`: one row or column reordered with the items sliding aside
 *   (document tabs).
 * - `useDropAnimation`: a drop's items sliding into their new places.
 * - `trackPointerDrag`, `startKeyboardDrag`: the sessions both are built on.
 */
export * as DragAndDropPrimitive from "./index.parts"
export { useDragAndDrop } from "./use-drag-and-drop"
export type {
  DragAndDrop,
  DragAndDropOptions,
  DragMode,
  DragState,
  DropStrategy,
} from "./use-drag-and-drop"
export { createListStrategy, listPlacement, moveInList } from "./list-strategy"
export type { ListDropPlace, ListItem } from "./list-strategy"
export { createSlotStrategy, swapInList } from "./slot-strategy"
export type { SlotDropPlace, SlotItem } from "./slot-strategy"
export { useSortable, targetSlot } from "./sortable"
export type { Sortable, SortableOptions } from "./sortable"
export { useDropAnimation } from "./drop-animation"
export type { DropAnimation, DropAnimationOptions } from "./drop-animation"
export { trackPointerDrag } from "./pointer-drag"
export { startKeyboardDrag } from "./keyboard-drag"
