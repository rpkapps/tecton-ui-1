/**
 * de-DE translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} ausgewählt.",
    deselectedItem: "{item} nicht ausgewählt.",
    selectedCount: {
      "=0": "Keine Elemente ausgewählt.",
      one: "{count} Element ausgewählt.",
      other: "{count} Elemente ausgewählt.",
    },
    selectedAll: "Alle Elemente ausgewählt.",
  },
  chip: {
    removeButtonLabel: "Entfernen",
    removeDescription: "Auf „Löschen“ drücken, um das Tag zu entfernen.",
  },
  tree: {
    expand: "Erweitern",
    collapse: "Reduzieren",
  },
  dragAndDrop: {
    dragItem: "{itemText} ziehen",
    dragStartedKeyboard:
      "Ziehvorgang gestartet. Drücken Sie die Tabulatortaste, um zu einem Ablegeziel zu navigieren und drücken Sie dann die Eingabetaste, um das Objekt abzulegen, oder Escape, um den Vorgang abzubrechen.",
    dragStartedVirtual:
      "Ziehvorgang gestartet. Navigieren Sie zu einem Ablegeziel und klicken Sie oder drücken Sie die Eingabetaste, um das Objekt abzulegen.",
    dropCanceled: "Ablegen abgebrochen.",
    dropComplete: "Ablegen abgeschlossen.",
    dropOnItem: "Auf {itemText} ablegen",
    insertBefore: "Vor {itemText} einfügen",
    insertBetween: "Zwischen {beforeItemText} und {afterItemText} einfügen",
    insertAfter: "Nach {itemText} einfügen",
  },
  tableColumnResizer: {
    resize: "Größe von {columnName} ändern",
  },
})
