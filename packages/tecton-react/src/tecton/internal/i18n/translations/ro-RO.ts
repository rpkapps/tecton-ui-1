/**
 * ro-RO translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} selectat.",
    deselectedItem: "{item} neselectat.",
    selectedCount: {
      "=0": "Niciun element selectat.",
      one: "{count} element selectat.",
      other: "{count} elemente selectate.",
    },
    selectedAll: "Toate elementele selectate.",
  },
  chip: {
    removeButtonLabel: "Îndepărtaţi",
    removeDescription:
      "Apăsați pe Delete (Ștergere) pentru a elimina eticheta.",
  },
  tree: {
    expand: "Extindeți",
    collapse: "Restrângeți",
  },
  dragAndDrop: {
    dragItem: "Glisați {itemText}",
    dragStartedKeyboard:
      "A început glisarea. Apăsați pe Tab pentru a naviga la o țintă de fixare, apoi apăsați pe Enter pentru a fixa sau apăsați pe Escape pentru a anula glisarea.",
    dragStartedVirtual:
      "A început glisarea. Navigați la o țintă de fixare, apoi faceți clic sau apăsați pe Enter pentru a fixa.",
    dropCanceled: "Fixare anulată.",
    dropComplete: "Fixare finalizată.",
    dropOnItem: "Fixați pe {itemText}",
    insertBefore: "Inserați înainte de {itemText}",
    insertBetween: "Inserați între {beforeItemText} și {afterItemText}",
    insertAfter: "Inserați după {itemText}",
  },
  tableColumnResizer: {
    resize: "Redimensionați {columnName}",
  },
})
