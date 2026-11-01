/**
 * pl-PL translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "Zaznaczono {item}.",
    deselectedItem: "Nie zaznaczono {item}.",
    selectedCount: {
      "=0": "Nie zaznaczono żadnych elementów.",
      one: "{count} zaznaczony element.",
      other: "{count} zaznaczonych elementów.",
    },
    selectedAll: "Wszystkie zaznaczone elementy.",
  },
  chip: {
    removeButtonLabel: "Usuń",
    removeDescription: "Naciśnij Usuń, aby usunąć znacznik.",
  },
  tree: {
    expand: "Rozwiń",
    collapse: "Zwiń",
  },
  dragAndDrop: {
    dragItem: "Przeciągnij {itemText}",
    dragStartedKeyboard:
      "Rozpoczęto przeciąganie. Naciśnij Tab, aby wybrać miejsce docelowe, a następnie naciśnij Enter, aby upuścić, lub Escape, aby anulować.",
    dragStartedVirtual:
      "Rozpoczęto przeciąganie. Wybierz miejsce, w którym chcesz upuścić element, a następnie kliknij lub naciśnij Enter, aby upuścić.",
    dropCanceled: "Anulowano upuszczenie.",
    dropComplete: "Zakończono upuszczanie.",
    dropOnItem: "Upuść na {itemText}",
    insertBefore: "Umieść przed {itemText}",
    insertBetween: "Umieść między {beforeItemText} i {afterItemText}",
    insertAfter: "Umieść za {itemText}",
  },
  tableColumnResizer: {
    resize: "Zmień rozmiar kolumny {columnName}",
  },
})
