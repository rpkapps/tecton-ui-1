/**
 * pl-PL translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
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
  table: {
    select: "Zaznacz",
    selectAll: "Zaznacz wszystko",
    ascendingSort:
      "posortowano według kolumny {columnName} w porządku rosnącym",
    descendingSort:
      "posortowano według kolumny {columnName} w porządku malejącym",
  },
  dataTable: {
    loading: "Ładowanie",
    emptyTitle: "Brak wierszy",
    emptyDescription: "Nie ma tu jeszcze nic do wyświetlenia.",
    noResultsTitle: "Brak wyników",
    noResultsDescription: "Żaden wiersz nie pasuje do wyszukiwania i filtrów.",
    clearFilters: "Wyczyść filtry",
    errorTitle: "Nie udało się załadować wierszy",
    errorDescription: "Podczas ładowania danych wystąpił błąd.",
    retry: "Spróbuj ponownie",
    rowsPerPage: "Wiersze na stronie",
    pageInfo: "Strona {page} z {pageCount}",
    pagination: "Paginacja",
    firstPage: "Pierwsza strona",
    previousPage: "Poprzednia strona",
    nextPage: "Następna strona",
    lastPage: "Ostatnia strona",
    selectedCount: {
      one: "Zaznaczono {selected} z {total}",
      few: "Zaznaczono {selected} z {total}",
      many: "Zaznaczono {selected} z {total}",
      other: "Zaznaczono {selected} z {total}",
    },
    selectAllMatching: {
      one: "Zaznacz {total} wiersz",
      few: "Zaznacz wszystkie {total} wiersze",
      many: "Zaznacz wszystkie {total} wierszy",
      other: "Zaznacz wszystkie {total} wiersza",
    },
    clearSelection: "Wyczyść zaznaczenie",
    rowsLoaded: {
      one: "Wyświetlany jest {total} wiersz",
      few: "Wyświetlane są {total} wiersze",
      many: "Wyświetlanych jest {total} wierszy",
      other: "Wyświetlane jest {total} wiersza",
    },
    sortPositionAscending:
      "posortowano w porządku rosnącym, {position} z {total} w kolejności sortowania",
    sortPositionDescending:
      "posortowano w porządku malejącym, {position} z {total} w kolejności sortowania",
    sortAddedAscending:
      "{columnName} posortowano rosnąco, {position} z {total}",
    sortAddedDescending:
      "{columnName} posortowano malejąco, {position} z {total}",
    sortCleared: "{columnName} nie jest już sortowane",
    yes: "Tak",
    no: "Nie",
    columns: "Kolumny",
    showColumns: "Pokaż kolumny",
    pinColumns: "Przypnij kolumny",
    notPinned: "Nieprzypięta",
    pinnedStart: "Początek",
    pinnedEnd: "Koniec",
    resetColumns: "Resetuj kolumny",
    columnMenu: "Opcje kolumny {columnName}",
    sortAscending: "Sortuj rosnąco",
    sortDescending: "Sortuj malejąco",
    clearSort: "Wyczyść sortowanie",
    resizeColumn: "Zmień szerokość kolumny",
    fitColumn: "Dopasuj do zawartości",
    resetColumnWidth: "Resetuj szerokość",
    resizeHint:
      "Użyj klawiszy strzałek w lewo i w prawo, aby zmienić szerokość kolumny. Naciśnij Enter, aby zachować szerokość, lub Escape, aby anulować.",
    hideColumn: "Ukryj kolumnę",
    pinToStart: "Przypnij na początku",
    pinToEnd: "Przypnij na końcu",
    unpin: "Odepnij",
    columnDescription: "Informacje o kolumnie {columnName}",
    columnHidden: "Ukryto kolumnę {columnName}",
    columnShown: "Pokazano kolumnę {columnName}",
    columnPinnedStart: "Przypięto kolumnę {columnName} na początku",
    columnPinnedEnd: "Przypięto kolumnę {columnName} na końcu",
    columnUnpinned: "Odpięto kolumnę {columnName}",
    search: "Szukaj",
    searchChip: "Wyszukiwanie",
    clearSearch: "Wyczyść wyszukiwanie",
    filterBy: "Filtruj według kolumny {columnName}",
    filterContains: "Zawiera",
    filterMin: "Min.",
    filterMax: "Maks.",
    filterAny: "Dowolna",
    clearFilter: "Wyczyść",
    noOptions: "Brak opcji",
    filterRange: "{from}–{to}",
    filterAtLeast: "≥ {value}",
    filterAtMost: "≤ {value}",
    filterFrom: "Od {value}",
    filterUntil: "Do {value}",
    optionsSelected: { other: "Wybrano: {total}" },
    filterChip: "{columnName}: {value}",
    activeFilters: "Aktywne filtry",
    clearAll: "Wyczyść wszystko",
    resultsCount: {
      one: "{total} wynik",
      few: "{total} wyniki",
      many: "{total} wyników",
      other: "{total} wyniku",
    },
    rowActions: "Akcje wiersza",
    reorderRowsColumn: "Zmień kolejność",
    total: "Razem",
    groupBy: "Grupuj według",
    groupOrder: "Kolejność",
    moveGroupUp: "Przenieś {columnName} w górę",
    ungroupAll: "Rozgrupuj wszystko",
    expandAllGroups: "Rozwiń wszystkie grupy",
    collapseAllGroups: "Zwiń wszystkie grupy",
    groupByColumn: "Grupuj według kolumny",
    ungroup: "Rozgrupuj",
    groupedBy: "Pogrupowano według {columnNames}",
    ungrouped: "Wiersze nie są już pogrupowane",
    groupLabel: "{columnName}: {value}",
    emptyGroup: "(Puste)",
    groupCount: {
      one: "{total} wiersz",
      few: "{total} wiersze",
      many: "{total} wierszy",
      other: "{total} wiersza",
    },
  },
  tableColumnResizer: {
    resize: "Zmień rozmiar kolumny {columnName}",
  },
})
