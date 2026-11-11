/**
 * et-EE translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
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
  table: {
    select: "Vali",
    selectAll: "Vali kõik",
    ascendingSort: "sorditud veeru järgi {columnName} tõusvas järjestuses",
    descendingSort: "sorditud veeru järgi {columnName} laskuvas järjestuses",
  },
  dataTable: {
    loading: "Laadimine",
    emptyTitle: "Ridu pole",
    emptyDescription: "Siin pole veel midagi kuvada.",
    noResultsTitle: "Tulemusi pole",
    noResultsDescription: "Otsingule ja filtritele ei vasta ükski rida.",
    clearFilters: "Tühjenda filtrid",
    errorTitle: "Ridu ei saanud laadida",
    errorDescription: "Andmete laadimisel tekkis viga.",
    retry: "Proovi uuesti",
    rowsPerPage: "Ridu lehel",
    pageInfo: "Leht {page}/{pageCount}",
    pagination: "Lehtede navigeerimine",
    firstPage: "Esimene leht",
    previousPage: "Eelmine leht",
    nextPage: "Järgmine leht",
    lastPage: "Viimane leht",
    selectedCount: {
      one: "{selected}/{total} valitud",
      other: "{selected}/{total} valitud",
    },
    selectAllMatching: {
      one: "Vali {total} rida",
      other: "Vali kõik {total} rida",
    },
    clearSelection: "Tühjenda valik",
    rowsLoaded: {
      one: "Kuvatakse {total} rida",
      other: "Kuvatakse {total} rida",
    },
    sortPositionAscending:
      "sorditud tõusvas järjestuses, {position}/{total} sortimisjärjekorras",
    sortPositionDescending:
      "sorditud laskuvas järjestuses, {position}/{total} sortimisjärjekorras",
    sortAddedAscending: "{columnName} sorditud kasvavalt, {position}/{total}",
    sortAddedDescending: "{columnName} sorditud kahanevalt, {position}/{total}",
    sortCleared: "{columnName} pole enam sorditud",
    yes: "Jah",
    no: "Ei",
    columns: "Veerud",
    showColumns: "Kuva veerud",
    pinColumns: "Kinnita veerud",
    notPinned: "Kinnitamata",
    pinnedStart: "Algus",
    pinnedEnd: "Lõpp",
    resetColumns: "Lähtesta veerud",
    columnMenu: "Veeru {columnName} valikud",
    sortAscending: "Sordi kasvavalt",
    sortDescending: "Sordi kahanevalt",
    clearSort: "Tühista sortimine",
    resizeColumn: "Muuda veeru laiust",
    fitColumn: "Sobita sisuga",
    resetColumnWidth: "Lähtesta laius",
    resizeHint:
      "Veeru laiuse muutmiseks kasutage vasak- ja paremnooleklahvi. Laiuse säilitamiseks vajutage Enter, tühistamiseks Escape.",
    hideColumn: "Peida veerg",
    pinToStart: "Kinnita algusesse",
    pinToEnd: "Kinnita lõppu",
    unpin: "Vabasta",
    columnDescription: "Teave veeru {columnName} kohta",
    columnHidden: "Veerg {columnName} peidetud",
    columnShown: "Veerg {columnName} kuvatud",
    columnPinnedStart: "Veerg {columnName} kinnitatud algusesse",
    columnPinnedEnd: "Veerg {columnName} kinnitatud lõppu",
    columnUnpinned: "Veerg {columnName} vabastatud",
  },
  tableColumnResizer: {
    resize: "Muuda veeru {columnName} laiust",
  },
})
