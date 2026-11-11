/**
 * ru-RU translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} выбрано.",
    deselectedItem: "{item} не выбрано.",
    selectedCount: {
      "=0": "Нет выбранных элементов.",
      one: "{count} элемент выбран.",
      other: "{count} элементов выбрано.",
    },
    selectedAll: "Выбраны все элементы.",
  },
  chip: {
    removeButtonLabel: "Удалить",
    removeDescription: "Нажмите DELETE, чтобы удалить тег.",
  },
  tree: {
    expand: "Развернуть",
    collapse: "Свернуть",
  },
  dragAndDrop: {
    dragItem: "Перетащить {itemText}",
    dragStartedKeyboard:
      "Начато перетаскивание. Нажмите клавишу Tab для выбора цели, затем нажмите клавишу Enter, чтобы применить перетаскивание, или клавишу Escape для отмены действия.",
    dragStartedVirtual:
      "Начато перетаскивание. Нажмите клавишу Tab для выбора цели, затем нажмите клавишу Enter, чтобы применить перетаскивание.",
    dropCanceled: "Перетаскивание отменено.",
    dropComplete: "Перетаскивание завершено.",
    dropOnItem: "Перетащить на {itemText}",
    insertBefore: "Вставить перед {itemText}",
    insertBetween: "Вставить между {beforeItemText} и {afterItemText}",
    insertAfter: "Вставить после {itemText}",
  },
  table: {
    select: "Выбрать",
    selectAll: "Выбрать все",
    ascendingSort: "сортировать столбец {columnName} в порядке возрастания",
    descendingSort: "сортировать столбец {columnName} в порядке убывания",
  },
  tableColumnResizer: {
    resize: "Изменить размер столбца {columnName}",
  },
})
