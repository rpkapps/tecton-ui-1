/**
 * lv-LV translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "Atlasīts vienums {item}.",
    deselectedItem: "Vienums {item} nav atlasīts.",
    selectedCount: {
      "=0": "Nav atlasīts neviens vienums.",
      one: "Atlasīto vienumu skaits: {count}.",
      other: "Atlasīto vienumu skaits: {count}.",
    },
    selectedAll: "Atlasīti visi vienumi.",
  },
  chip: {
    removeButtonLabel: "Noņemt",
    removeDescription: "Nospiediet Delete [Dzēst], lai noņemtu tagu.",
  },
  tree: {
    expand: "Izvērst",
    collapse: "Sakļaut",
  },
  dragAndDrop: {
    dragItem: "Velciet {itemText}",
    dragStartedKeyboard:
      "Uzsākta vilkšana. Nospiediet taustiņu Tab, lai pārietu uz nomešanas mērķi, pēc tam nospiediet Enter, lai nomestu, vai nospiediet Escape, lai atceltu.",
    dragStartedVirtual:
      "Uzsākta vilkšana. Pārejiet uz nomešanas mērķi, pēc tam nospiediet Enter, lai nomestu.",
    dropCanceled: "Nomešana atcelta.",
    dropComplete: "Nomešana pabeigta.",
    dropOnItem: "Nometiet uz {itemText}",
    insertBefore: "Ievietojiet pirms {itemText}",
    insertBetween: "Ievietojiet starp {beforeItemText} un {afterItemText}",
    insertAfter: "Ievietojiet pēc {itemText}",
  },
  tableColumnResizer: {
    resize: "Mainīt kolonnas {columnName} izmēru",
  },
})
