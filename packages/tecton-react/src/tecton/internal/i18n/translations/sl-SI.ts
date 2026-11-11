/**
 * sl-SI translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "Element {item} je izbran.",
    deselectedItem: "Element {item} ni izbran.",
    selectedCount: {
      "=0": "Noben element ni izbran.",
      one: "{count} element je izbran.",
      other: "{count} elementov je izbranih.",
    },
    selectedAll: "Vsi elementi so izbrani.",
  },
  chip: {
    removeButtonLabel: "Odstrani",
    removeDescription: "Pritisnite Delete, da odstranite oznako.",
  },
  tree: {
    expand: "Razširi",
    collapse: "Strni",
  },
  dragAndDrop: {
    dragItem: "Povleci {itemText}",
    dragStartedKeyboard:
      "Vlečenje se je začelo. Pritisnite tipko Tab za pomik na mesto, kamor želite spustiti elemente, in pritisnite tipko Enter, da jih spustite, ali tipko Escape, da prekličete postopek.",
    dragStartedVirtual:
      "Vlečenje se je začelo. Pomaknite se na mesto, kamor želite spustiti elemente, in kliknite ali pritisnite tipko Enter, da jih spustite.",
    dropCanceled: "Spust je preklican.",
    dropComplete: "Spust je končan.",
    dropOnItem: "Spusti na mesto {itemText}",
    insertBefore: "Vstavi pred {itemText}",
    insertBetween: "Vstavi med {beforeItemText} in {afterItemText}",
    insertAfter: "Vstavi za {itemText}",
  },
  table: {
    select: "Izberite",
    selectAll: "Izberite vse",
    ascendingSort:
      "razvrščeno po stolpcu {columnName} v naraščajočem vrstnem redu",
    descendingSort:
      "razvrščeno po stolpcu {columnName} v padajočem vrstnem redu",
  },
  dataTable: {
    loading: "Nalaganje",
    emptyTitle: "Ni vrstic",
    emptyDescription: "Tukaj še ni ničesar za prikaz.",
    noResultsTitle: "Ni rezultatov",
    noResultsDescription: "Nobena vrstica se ne ujema z iskanjem in filtri.",
    clearFilters: "Počistite filtre",
    errorTitle: "Vrstic ni bilo mogoče naložiti",
    errorDescription: "Pri nalaganju podatkov je prišlo do napake.",
    retry: "Poskusite znova",
    rowsPerPage: "Vrstic na stran",
    pageInfo: "Stran {page} od {pageCount}",
    pagination: "Ostranjevanje",
    firstPage: "Prva stran",
    previousPage: "Prejšnja stran",
    nextPage: "Naslednja stran",
    lastPage: "Zadnja stran",
    selectedCount: {
      one: "Izbrana je {selected} od {total}",
      two: "Izbrani sta {selected} od {total}",
      few: "Izbrane so {selected} od {total}",
      other: "Izbranih je {selected} od {total}",
    },
    selectAllMatching: {
      one: "Izberite {total} vrstico",
      two: "Izberite {total} vrstici",
      few: "Izberite vse {total} vrstice",
      other: "Izberite vseh {total} vrstic",
    },
    clearSelection: "Počistite izbor",
    rowsLoaded: {
      one: "Prikazana je {total} vrstica",
      two: "Prikazani sta {total} vrstici",
      few: "Prikazane so {total} vrstice",
      other: "Prikazanih je {total} vrstic",
    },
    sortPositionAscending:
      "razvrščeno v naraščajočem vrstnem redu, {position} od {total} v vrstnem redu razvrščanja",
    sortPositionDescending:
      "razvrščeno v padajočem vrstnem redu, {position} od {total} v vrstnem redu razvrščanja",
    sortAddedAscending:
      "{columnName} razvrščeno naraščajoče, {position} od {total}",
    sortAddedDescending:
      "{columnName} razvrščeno padajoče, {position} od {total}",
    sortCleared: "{columnName} ni več razvrščeno",
    yes: "Da",
    no: "Ne",
  },
  tableColumnResizer: {
    resize: "Spremeni velikost stolpca {columnName}",
  },
})
