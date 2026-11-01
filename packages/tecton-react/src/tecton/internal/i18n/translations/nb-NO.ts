/**
 * nb-NO translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} er valgt.",
    deselectedItem: "{item} er ikke valgt.",
    selectedCount: {
      "=0": "Ingen elementer er valgt.",
      one: "{count} element er valgt.",
      other: "{count} elementer er valgt.",
    },
    selectedAll: "Alle elementer er valgt.",
  },
  chip: {
    removeButtonLabel: "Fjern",
    removeDescription: "Trykk på Slett for å fjerne taggen.",
  },
  tree: {
    expand: "Utvid",
    collapse: "Skjul",
  },
  dragAndDrop: {
    dragItem: "Dra {itemText}",
    dragStartedKeyboard:
      "Begynte å dra. Trykk på Tab for å navigere til et mål, og trykk deretter på Enter for å slippe eller på Esc for å avbryte.",
    dragStartedVirtual:
      "Begynte å dra. Naviger til et mål, og klikk eller trykk på Enter for å slippe.",
    dropCanceled: "Avbrøt slipping.",
    dropComplete: "Slippingen er fullført.",
    dropOnItem: "Slipp på {itemText}",
    insertBefore: "Sett inn før {itemText}",
    insertBetween: "Sett inn mellom {beforeItemText} og {afterItemText}",
    insertAfter: "Sett inn etter {itemText}",
  },
  tableColumnResizer: {
    resize: "Endre størrelse på {columnName}",
  },
})
