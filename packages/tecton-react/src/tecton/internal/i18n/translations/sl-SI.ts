/**
 * sl-SI translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "Element {item} je izbran.",
    deselectedItem: "Element {item} ni izbran.",
    selectedCount: {
      "=0": "Noben element ni izbran.",
      one: "{count} element je izbran.",
      other: "{count} elementov je izbranih.",
    },
    selectedAll: "Vsi elementi so izbrani.",
  },
  chip: {
    removeButtonLabel: "Odstrani",
    removeDescription: "Pritisnite Delete, da odstranite oznako.",
  },
  tree: {
    expand: "Razširi",
    collapse: "Strni",
  },
  dragAndDrop: {
    dragItem: "Povleci {itemText}",
    dragStartedKeyboard:
      "Vlečenje se je začelo. Pritisnite tipko Tab za pomik na mesto, kamor želite spustiti elemente, in pritisnite tipko Enter, da jih spustite, ali tipko Escape, da prekličete postopek.",
    dragStartedVirtual:
      "Vlečenje se je začelo. Pomaknite se na mesto, kamor želite spustiti elemente, in kliknite ali pritisnite tipko Enter, da jih spustite.",
    dropCanceled: "Spust je preklican.",
    dropComplete: "Spust je končan.",
    dropOnItem: "Spusti na mesto {itemText}",
    insertBefore: "Vstavi pred {itemText}",
    insertBetween: "Vstavi med {beforeItemText} in {afterItemText}",
    insertAfter: "Vstavi za {itemText}",
  },
  tableColumnResizer: {
    resize: "Spremeni velikost stolpca {columnName}",
  },
})
