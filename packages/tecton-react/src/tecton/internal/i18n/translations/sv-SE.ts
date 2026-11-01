/**
 * sv-SE translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} markerat.",
    deselectedItem: "{item} ej markerat.",
    selectedCount: {
      "=0": "Inga markerade objekt.",
      one: "{count} markerat objekt.",
      other: "{count} markerade objekt.",
    },
    selectedAll: "Alla markerade objekt.",
  },
  chip: {
    removeButtonLabel: "Ta bort",
    removeDescription: "Tryck på Radera för att ta bort taggen.",
  },
  tree: {
    expand: "Expandera",
    collapse: "Dölj",
  },
  dragAndDrop: {
    dragItem: "Dra {itemText}",
    dragStartedKeyboard:
      "Börja dra. Tryck på tabb för att navigera till målet, tryck på enter för att släppa eller på escape för att avbryta.",
    dragStartedVirtual:
      "Börja dra. Navigera till ett mål och klicka eller tryck på enter för att släppa.",
    dropCanceled: "Släppåtgärd avbröts.",
    dropComplete: "Släppåtgärd klar.",
    dropOnItem: "Släpp på {itemText}",
    insertBefore: "Infoga före {itemText}",
    insertBetween: "Infoga mellan {beforeItemText} och {afterItemText}",
    insertAfter: "Infoga efter {itemText}",
  },
  tableColumnResizer: {
    resize: "Ändra storlek på {columnName}",
  },
})
