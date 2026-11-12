/**
 * bg-BG translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} избран.",
    deselectedItem: "{item} не е избран.",
    selectedCount: {
      "=0": "Няма избрани елементи.",
      one: "{count} избран елемент.",
      other: "{count} избрани елементи.",
    },
    selectedAll: "Всички елементи са избрани.",
  },
  chip: {
    removeButtonLabel: "Премахване",
    removeDescription: "Натиснете Delete, за да премахнете маркера.",
  },
  tree: {
    expand: "Разширяване",
    collapse: "Свиване",
  },
  dragAndDrop: {
    dragItem: "Плъзни {itemText}",
    dragStartedKeyboard:
      "Започна плъзгане. Натиснете „Tab“, за да се придвижите до целта, след което натиснете „Enter“ за пускане или натиснете „Escape“ за отмяна.",
    dragStartedVirtual:
      "Започна плъзгане. Придвижете се до целта, след което щракнете или натиснете „Enter“ за пускане.",
    dropCanceled: "Пускането е отменено.",
    dropComplete: "Пускането е завършено.",
    dropOnItem: "Пусни върху {itemText}",
    insertBefore: "Вмъкни преди {itemText}",
    insertBetween: "Вмъкни между {beforeItemText} и {afterItemText}",
    insertAfter: "Вмъкни след {itemText}",
  },
  table: {
    select: "Изберете",
    selectAll: "Изберете всичко",
    ascendingSort: "сортирано по колона {columnName} във възходящ ред",
    descendingSort: "сортирано по колона {columnName} в низходящ ред",
  },
  dataTable: {
    loading: "Зареждане",
    emptyTitle: "Няма редове",
    emptyDescription: "Тук все още няма нищо за показване.",
    noResultsTitle: "Няма резултати",
    noResultsDescription:
      "Няма редове, които отговарят на търсенето и филтрите.",
    clearFilters: "Изчистете филтрите",
    errorTitle: "Редовете не можаха да бъдат заредени",
    errorDescription: "Възникна грешка при зареждането на данните.",
    retry: "Опитайте отново",
    rowsPerPage: "Редове на страница",
    pageInfo: "Страница {page} от {pageCount}",
    pagination: "Страниране",
    firstPage: "Първа страница",
    previousPage: "Предишна страница",
    nextPage: "Следваща страница",
    lastPage: "Последна страница",
    selectedCount: {
      one: "Избран {selected} от {total}",
      other: "Избрани {selected} от {total}",
    },
    selectAllMatching: {
      one: "Изберете {total} ред",
      other: "Изберете всички {total} реда",
    },
    clearSelection: "Изчистете избора",
    rowsLoaded: {
      one: "Показан е {total} ред",
      other: "Показани са {total} реда",
    },
    sortPositionAscending:
      "сортирано във възходящ ред, {position} от {total} в реда на сортиране",
    sortPositionDescending:
      "сортирано в низходящ ред, {position} от {total} в реда на сортиране",
    sortAddedAscending:
      "{columnName} е сортирано възходящо, {position} от {total}",
    sortAddedDescending:
      "{columnName} е сортирано низходящо, {position} от {total}",
    sortCleared: "{columnName} вече не е сортирано",
    yes: "Да",
    no: "Не",
    columns: "Колони",
    showColumns: "Показване на колони",
    pinColumns: "Фиксиране на колони",
    notPinned: "Без фиксиране",
    pinnedStart: "Начало",
    pinnedEnd: "Край",
    resetColumns: "Нулиране на колоните",
    columnMenu: "Опции за {columnName}",
    sortAscending: "Сортиране във възходящ ред",
    sortDescending: "Сортиране в низходящ ред",
    clearSort: "Изчистване на сортирането",
    resizeColumn: "Преоразмеряване на колоната",
    fitColumn: "Побиране на съдържанието",
    resetColumnWidth: "Нулиране на ширината",
    resizeHint:
      "Използвайте клавишите със стрелки наляво и надясно, за да преоразмерите колоната. Натиснете Enter, за да запазите ширината, или Escape, за да отмените.",
    hideColumn: "Скриване на колоната",
    pinToStart: "Фиксиране в началото",
    pinToEnd: "Фиксиране в края",
    unpin: "Премахване на фиксирането",
    columnDescription: "Относно {columnName}",
    columnHidden: "Колоната {columnName} е скрита",
    columnShown: "Колоната {columnName} е показана",
    columnPinnedStart: "Колоната {columnName} е фиксирана в началото",
    columnPinnedEnd: "Колоната {columnName} е фиксирана в края",
    columnUnpinned: "Колоната {columnName} вече не е фиксирана",
    search: "Търсене",
    searchChip: "Търсене",
    clearSearch: "Изчистете търсенето",
    filterBy: "Филтриране по {columnName}",
    filterContains: "Съдържа",
    filterMin: "Мин.",
    filterMax: "Макс.",
    filterAny: "Всички",
    clearFilter: "Изчистване",
    noOptions: "Няма опции",
    filterRange: "{from}–{to}",
    filterAtLeast: "≥ {value}",
    filterAtMost: "≤ {value}",
    filterFrom: "От {value}",
    filterUntil: "До {value}",
    optionsSelected: { other: "Избрани: {total}" },
    filterChip: "{columnName}: {value}",
    activeFilters: "Активни филтри",
    clearAll: "Изчистване на всички",
    resultsCount: { one: "{total} резултат", other: "{total} резултата" },
    rowActions: "Действия за реда",
    total: "Общо",
    groupBy: "Групиране по",
    groupOrder: "Ред",
    moveGroupUp: "Преместване на {columnName} нагоре",
    ungroupAll: "Разгрупиране на всички",
    expandAllGroups: "Разгъване на всички групи",
    collapseAllGroups: "Свиване на всички групи",
    groupByColumn: "Групиране по колоната",
    ungroupColumn: "Разгрупиране по колоната",
    groupedBy: "Групирано по {columnNames}",
    ungrouped: "Редовете вече не са групирани",
    groupLabel: "{columnName}: {value}",
    emptyGroup: "(Празно)",
    groupCount: { one: "{total} ред", other: "{total} реда" },
    groupRowLabel: "{label}, {rows}",
  },
  tableColumnResizer: {
    resize: "Преоразмеряване на {columnName}",
  },
})
