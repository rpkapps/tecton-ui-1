/**
 * English (United States): the default, bundled with every component, and
 * the source of the translation types (namespaces, keys and placeholders).
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import type { TranslationTable } from "../translations"

const enUS = {
  grid: {
    selectedItem: "{item} selected.",
    deselectedItem: "{item} not selected.",
    selectedCount: {
      "=0": "No items selected.",
      one: "{count} item selected.",
      other: "{count} items selected.",
    },
    selectedAll: "All items selected.",
  },
  chip: {
    removeButtonLabel: "Remove",
    removeDescription: "Press Delete to remove tag.",
  },
  tree: {
    expand: "Expand",
    collapse: "Collapse",
  },
  dragAndDrop: {
    dragItem: "Drag {itemText}",
    dragStartedKeyboard:
      "Started dragging. Press Tab to navigate to a drop target, then press Enter to drop, or press Escape to cancel.",
    dragStartedVirtual:
      "Started dragging. Navigate to a drop target, then click or press Enter to drop.",
    dropCanceled: "Drop canceled.",
    dropComplete: "Drop complete.",
    dropOnItem: "Drop on {itemText}",
    insertBefore: "Insert before {itemText}",
    insertBetween: "Insert between {beforeItemText} and {afterItemText}",
    insertAfter: "Insert after {itemText}",
  },
  tableColumnResizer: {
    resize: "Resize {columnName}",
  },
} as const satisfies TranslationTable

export default enUS
