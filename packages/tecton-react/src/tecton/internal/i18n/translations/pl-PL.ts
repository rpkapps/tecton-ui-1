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
  },
  tableColumnResizer: {
    resize: "Zmień rozmiar kolumny {columnName}",
  },
})
