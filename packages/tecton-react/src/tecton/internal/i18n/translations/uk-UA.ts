/**
 * uk-UA translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
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
  table: {
    select: "Вибрати",
    selectAll: "Вибрати все",
    ascendingSort: "відсортовано за стовпцем {columnName} у висхідному порядку",
    descendingSort:
      "відсортовано за стовпцем {columnName} у низхідному порядку",
  },
  dataTable: {
    loading: "Завантаження",
    emptyTitle: "Немає рядків",
    emptyDescription: "Тут поки що нічого немає.",
    noResultsTitle: "Нічого не знайдено",
    noResultsDescription:
      "Немає рядків, що відповідають умовам пошуку та фільтрам.",
    clearFilters: "Скинути фільтри",
    errorTitle: "Не вдалося завантажити рядки",
    errorDescription: "Під час завантаження даних сталася помилка.",
    retry: "Повторити",
    rowsPerPage: "Рядків на сторінці",
    pageInfo: "Сторінка {page} з {pageCount}",
    pagination: "Навігація сторінками",
    firstPage: "Перша сторінка",
    previousPage: "Попередня сторінка",
    nextPage: "Наступна сторінка",
    lastPage: "Остання сторінка",
    selectedCount: {
      one: "Вибрано {selected} з {total}",
      few: "Вибрано {selected} з {total}",
      many: "Вибрано {selected} з {total}",
      other: "Вибрано {selected} з {total}",
    },
    selectAllMatching: {
      one: "Вибрати всі {total} рядок",
      few: "Вибрати всі {total} рядки",
      many: "Вибрати всі {total} рядків",
      other: "Вибрати всі {total} рядка",
    },
    clearSelection: "Скасувати вибір",
    rowsLoaded: {
      one: "Показано {total} рядок",
      few: "Показано {total} рядки",
      many: "Показано {total} рядків",
      other: "Показано {total} рядка",
    },
    sortPositionAscending:
      "відсортовано у висхідному порядку, {position} з {total} у порядку сортування",
    sortPositionDescending:
      "відсортовано у низхідному порядку, {position} з {total} у порядку сортування",
    sortAddedAscending:
      "{columnName}: сортування за зростанням, {position} з {total}",
    sortAddedDescending:
      "{columnName}: сортування за спаданням, {position} з {total}",
    sortCleared: "{columnName}: сортування знято",
    yes: "Так",
    no: "Ні",
  },
  tableColumnResizer: {
    resize: "Змінити розмір стовпця {columnName}",
  },
})
