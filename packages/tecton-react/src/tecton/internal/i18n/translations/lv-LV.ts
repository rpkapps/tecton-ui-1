/**
 * lv-LV translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "Atlasīts vienums {item}.",
    deselectedItem: "Vienums {item} nav atlasīts.",
    selectedCount: {
      "=0": "Nav atlasīts neviens vienums.",
      one: "Atlasīto vienumu skaits: {count}.",
      other: "Atlasīto vienumu skaits: {count}.",
    },
    selectedAll: "Atlasīti visi vienumi.",
  },
  chip: {
    removeButtonLabel: "Noņemt",
    removeDescription: "Nospiediet Delete [Dzēst], lai noņemtu tagu.",
  },
  tree: {
    expand: "Izvērst",
    collapse: "Sakļaut",
  },
  dragAndDrop: {
    dragItem: "Velciet {itemText}",
    dragStartedKeyboard:
      "Uzsākta vilkšana. Nospiediet taustiņu Tab, lai pārietu uz nomešanas mērķi, pēc tam nospiediet Enter, lai nomestu, vai nospiediet Escape, lai atceltu.",
    dragStartedVirtual:
      "Uzsākta vilkšana. Pārejiet uz nomešanas mērķi, pēc tam nospiediet Enter, lai nomestu.",
    dropCanceled: "Nomešana atcelta.",
    dropComplete: "Nomešana pabeigta.",
    dropOnItem: "Nometiet uz {itemText}",
    insertBefore: "Ievietojiet pirms {itemText}",
    insertBetween: "Ievietojiet starp {beforeItemText} un {afterItemText}",
    insertAfter: "Ievietojiet pēc {itemText}",
  },
  table: {
    select: "Atlasīt",
    selectAll: "Atlasīt visu",
    ascendingSort: "kārtots pēc kolonnas {columnName} augošā secībā",
    descendingSort: "kārtots pēc kolonnas {columnName} dilstošā secībā",
  },
  dataTable: {
    loading: "Notiek ielāde",
    emptyTitle: "Nav rindu",
    emptyDescription: "Šeit vēl nav ko rādīt.",
    noResultsTitle: "Nav rezultātu",
    noResultsDescription:
      "Meklēšanas un filtru kritērijiem neatbilst neviena rinda.",
    clearFilters: "Notīrīt filtrus",
    errorTitle: "Rindas nevarēja ielādēt",
    errorDescription: "Ielādējot datus, radās kļūda.",
    retry: "Mēģināt vēlreiz",
    rowsPerPage: "Rindas lapā",
    pageInfo: "Lapa {page} no {pageCount}",
    pagination: "Lappušu navigācija",
    firstPage: "Pirmā lapa",
    previousPage: "Iepriekšējā lapa",
    nextPage: "Nākamā lapa",
    lastPage: "Pēdējā lapa",
    selectedCount: {
      zero: "Atlasītas {selected} no {total}",
      one: "Atlasīta {selected} no {total}",
      other: "Atlasītas {selected} no {total}",
    },
    selectAllMatching: {
      zero: "Atlasīt visas {total} rindas",
      one: "Atlasīt {total} rindu",
      other: "Atlasīt visas {total} rindas",
    },
    clearSelection: "Notīrīt atlasi",
    rowsLoaded: {
      zero: "Rāda {total} rindu",
      one: "Rāda {total} rindu",
      other: "Rāda {total} rindas",
    },
    sortPositionAscending:
      "kārtots augošā secībā, {position} no {total} kārtošanas secībā",
    sortPositionDescending:
      "kārtots dilstošā secībā, {position} no {total} kārtošanas secībā",
    sortAddedAscending:
      "{columnName} sakārtots augošā secībā, {position} no {total}",
    sortAddedDescending:
      "{columnName} sakārtots dilstošā secībā, {position} no {total}",
    sortCleared: "{columnName} vairs nav sakārtots",
    yes: "Jā",
    no: "Nē",
    columns: "Kolonnas",
    showColumns: "Rādīt kolonnas",
    pinColumns: "Piespraust kolonnas",
    notPinned: "Nav piesprausta",
    pinnedStart: "Sākums",
    pinnedEnd: "Beigas",
    resetColumns: "Atiestatīt kolonnas",
    columnMenu: "Kolonnas {columnName} opcijas",
    sortAscending: "Kārtot augošā secībā",
    sortDescending: "Kārtot dilstošā secībā",
    clearSort: "Notīrīt kārtošanu",
    resizeColumn: "Mainīt kolonnas platumu",
    fitColumn: "Pielāgot saturam",
    resetColumnWidth: "Atiestatīt platumu",
    resizeHint:
      "Izmantojiet bulttaustiņus pa kreisi un pa labi, lai mainītu kolonnas platumu. Nospiediet Enter, lai saglabātu platumu, vai Escape, lai atceltu.",
    hideColumn: "Paslēpt kolonnu",
    pinToStart: "Piespraust sākumā",
    pinToEnd: "Piespraust beigās",
    unpin: "Atspraust",
    columnDescription: "Par kolonnu {columnName}",
    columnHidden: "Kolonna {columnName} paslēpta",
    columnShown: "Kolonna {columnName} parādīta",
    columnPinnedStart: "Kolonna {columnName} piesprausta sākumā",
    columnPinnedEnd: "Kolonna {columnName} piesprausta beigās",
    columnUnpinned: "Kolonna {columnName} atsprausta",
    search: "Meklēt",
    searchChip: "Meklēšana",
    clearSearch: "Notīrīt meklēšanu",
    filterBy: "Filtrēt pēc kolonnas {columnName}",
    filterContains: "Satur",
    filterMin: "Min.",
    filterMax: "Maks.",
    filterAny: "Visi",
    clearFilter: "Notīrīt",
    noOptions: "Nav opciju",
    filterRange: "{from}–{to}",
    filterAtLeast: "≥ {value}",
    filterAtMost: "≤ {value}",
    filterFrom: "No {value}",
    filterUntil: "Līdz {value}",
    optionsSelected: { other: "Atlasīti: {total}" },
    filterChip: "{columnName}: {value}",
    activeFilters: "Aktīvie filtri",
    clearAll: "Notīrīt visu",
    resultsCount: {
      zero: "{total} rezultātu",
      one: "{total} rezultāts",
      other: "{total} rezultāti",
    },
    rowActions: "Rindas darbības",
    reorderRowsColumn: "Mainīt secību",
    total: "Kopā",
    groupBy: "Grupēt pēc",
    groupOrder: "Secība",
    moveGroupUp: "Pārvietot {columnName} uz augšu",
    ungroupAll: "Atcelt visu grupēšanu",
    expandAllGroups: "Izvērst visas grupas",
    collapseAllGroups: "Sakļaut visas grupas",
    groupByColumn: "Grupēt pēc kolonnas",
    ungroup: "Atcelt grupēšanu",
    groupedBy: "Grupēts pēc {columnNames}",
    ungrouped: "Rindas vairs nav grupētas",
    groupLabel: "{columnName}: {value}",
    emptyGroup: "(Tukšs)",
    groupCount: {
      zero: "{total} rindu",
      one: "{total} rinda",
      other: "{total} rindas",
    },
  },
  tableColumnResizer: {
    resize: "Mainīt kolonnas {columnName} izmēru",
  },
})
