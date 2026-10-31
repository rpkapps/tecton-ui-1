/**
 * uk-UA translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} вибрано.",
    deselectedItem: "{item} не вибрано.",
    selectedCount: {
      "=0": "Жодних елементів не вибрано.",
      one: "{count} елемент вибрано.",
      other: "Вибрано елементів: {count}.",
    },
    selectedAll: "Усі елементи вибрано.",
  },
  chip: {
    removeButtonLabel: "Вилучити",
    removeDescription: "Натисніть Delete, щоб вилучити тег.",
  },
  tree: {
    expand: "Розгорнути",
    collapse: "Згорнути",
  },
  dragAndDrop: {
    dragItem: "Перетягнути {itemText}",
    dragStartedKeyboard:
      "Перетягування почалося. Натисніть Tab, щоб перейти до цілі перетягування, потім натисніть Enter, щоб перетягнути, або Escape, щоб скасувати.",
    dragStartedVirtual:
      "Перетягування почалося. Перейдіть до цілі перетягування, потім натисніть Enter, щоб перетягнути.",
    dropCanceled: "Перетягування скасовано.",
    dropComplete: "Перетягування завершено.",
    dropOnItem: "Перетягнути на {itemText}",
    insertBefore: "Вставити перед {itemText}",
    insertBetween: "Вставити між {beforeItemText} і {afterItemText}",
    insertAfter: "Вставити після {itemText}",
  },
})
