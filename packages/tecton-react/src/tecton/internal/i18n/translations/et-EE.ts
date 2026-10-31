/**
 * et-EE translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} valitud.",
    deselectedItem: "{item} pole valitud.",
    selectedCount: {
      "=0": "Üksusi pole valitud.",
      one: "{count} üksus valitud.",
      other: "{count} üksust valitud.",
    },
    selectedAll: "Kõik üksused valitud.",
  },
  chip: {
    removeButtonLabel: "Eemalda",
    removeDescription: "Sildi eemaldamiseks vajutage kustutusklahvi Delete.",
  },
  tree: {
    expand: "Laienda",
    collapse: "Ahenda",
  },
  dragAndDrop: {
    dragItem: "Lohista {itemText}",
    dragStartedKeyboard:
      "Alustati lohistamist. Kukutamise sihtmärgi juurde navigeerimiseks vajutage klahvi Tab, seejärel vajutage kukutamiseks klahvi Enter või loobumiseks klahvi Escape.",
    dragStartedVirtual:
      "Alustati lohistamist. Navigeerige kukutamise sihtmärgi juurde ja kukutamiseks klõpsake või vajutage klahvi Enter.",
    dropCanceled: "Lohistamisest loobuti.",
    dropComplete: "Lohistamine on tehtud.",
    dropOnItem: "Kukuta asukohta {itemText}",
    insertBefore: "Sisesta {itemText} ette",
    insertBetween: "Sisesta {beforeItemText} ja {afterItemText} vahele",
    insertAfter: "Sisesta {itemText} järele",
  },
})
