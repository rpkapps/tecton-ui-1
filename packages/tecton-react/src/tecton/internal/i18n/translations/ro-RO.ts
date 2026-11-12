/**
 * ro-RO translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} selectat.",
    deselectedItem: "{item} neselectat.",
    selectedCount: {
      "=0": "Niciun element selectat.",
      one: "{count} element selectat.",
      other: "{count} elemente selectate.",
    },
    selectedAll: "Toate elementele selectate.",
  },
  chip: {
    removeButtonLabel: "Îndepărtaţi",
    removeDescription:
      "Apăsați pe Delete (Ștergere) pentru a elimina eticheta.",
  },
  tree: {
    expand: "Extindeți",
    collapse: "Restrângeți",
  },
  dragAndDrop: {
    dragItem: "Glisați {itemText}",
    dragStartedKeyboard:
      "A început glisarea. Apăsați pe Tab pentru a naviga la o țintă de fixare, apoi apăsați pe Enter pentru a fixa sau apăsați pe Escape pentru a anula glisarea.",
    dragStartedVirtual:
      "A început glisarea. Navigați la o țintă de fixare, apoi faceți clic sau apăsați pe Enter pentru a fixa.",
    dropCanceled: "Fixare anulată.",
    dropComplete: "Fixare finalizată.",
    dropOnItem: "Fixați pe {itemText}",
    insertBefore: "Inserați înainte de {itemText}",
    insertBetween: "Inserați între {beforeItemText} și {afterItemText}",
    insertAfter: "Inserați după {itemText}",
  },
  table: {
    select: "Selectare",
    selectAll: "Selectare totală",
    ascendingSort: "sortate după coloana {columnName} în ordine crescătoare",
    descendingSort:
      "sortate după coloana {columnName} în ordine descrescătoare",
  },
  dataTable: {
    loading: "Se încarcă",
    emptyTitle: "Niciun rând",
    emptyDescription: "Încă nu există nimic de afișat aici.",
    noResultsTitle: "Niciun rezultat",
    noResultsDescription: "Niciun rând nu corespunde căutării și filtrelor.",
    clearFilters: "Ștergeți filtrele",
    errorTitle: "Rândurile nu au putut fi încărcate",
    errorDescription: "A apărut o eroare la încărcarea datelor.",
    retry: "Reîncercați",
    rowsPerPage: "Rânduri pe pagină",
    pageInfo: "Pagina {page} din {pageCount}",
    pagination: "Paginare",
    firstPage: "Prima pagină",
    previousPage: "Pagina anterioară",
    nextPage: "Pagina următoare",
    lastPage: "Ultima pagină",
    selectedCount: {
      one: "{selected} din {total} selectat",
      few: "{selected} din {total} selectate",
      other: "{selected} din {total} selectate",
    },
    selectAllMatching: {
      one: "Selectați {total} rând",
      few: "Selectați toate cele {total} rânduri",
      other: "Selectați toate cele {total} de rânduri",
    },
    clearSelection: "Anulați selecția",
    rowsLoaded: {
      one: "Se afișează {total} rând",
      few: "Se afișează {total} rânduri",
      other: "Se afișează {total} de rânduri",
    },
    sortPositionAscending:
      "sortat în ordine crescătoare, {position} din {total} în ordinea de sortare",
    sortPositionDescending:
      "sortat în ordine descrescătoare, {position} din {total} în ordinea de sortare",
    sortAddedAscending: "{columnName} sortat crescător, {position} din {total}",
    sortAddedDescending:
      "{columnName} sortat descrescător, {position} din {total}",
    sortCleared: "{columnName} nu mai este sortat",
    yes: "Da",
    no: "Nu",
    columns: "Coloane",
    showColumns: "Afișați coloanele",
    pinColumns: "Fixați coloanele",
    notPinned: "Nefixată",
    pinnedStart: "Început",
    pinnedEnd: "Sfârșit",
    resetColumns: "Resetați coloanele",
    columnMenu: "Opțiuni pentru {columnName}",
    sortAscending: "Sortați crescător",
    sortDescending: "Sortați descrescător",
    clearSort: "Ștergeți sortarea",
    resizeColumn: "Redimensionați coloana",
    fitColumn: "Potriviți la conținut",
    resetColumnWidth: "Resetați lățimea",
    resizeHint:
      "Utilizați tastele săgeată stânga și dreapta pentru a redimensiona coloana. Apăsați Enter pentru a păstra lățimea sau Escape pentru a anula.",
    hideColumn: "Ascundeți coloana",
    pinToStart: "Fixați la început",
    pinToEnd: "Fixați la sfârșit",
    unpin: "Anulați fixarea",
    columnDescription: "Despre {columnName}",
    columnHidden: "Coloana {columnName} a fost ascunsă",
    columnShown: "Coloana {columnName} a fost afișată",
    columnPinnedStart: "Coloana {columnName} a fost fixată la început",
    columnPinnedEnd: "Coloana {columnName} a fost fixată la sfârșit",
    columnUnpinned: "Fixarea coloanei {columnName} a fost anulată",
    search: "Căutați",
    searchChip: "Căutare",
    clearSearch: "Ștergeți căutarea",
    filterBy: "Filtrați după {columnName}",
    filterContains: "Conține",
    filterMin: "Min.",
    filterMax: "Max.",
    filterAny: "Oricare",
    clearFilter: "Ștergeți",
    noOptions: "Nicio opțiune",
    filterRange: "{from}–{to}",
    filterAtLeast: "≥ {value}",
    filterAtMost: "≤ {value}",
    filterFrom: "De la {value}",
    filterUntil: "Până la {value}",
    optionsSelected: { other: "Selectate: {total}" },
    filterChip: "{columnName}: {value}",
    activeFilters: "Filtre active",
    clearAll: "Ștergeți tot",
    resultsCount: {
      one: "{total} rezultat",
      few: "{total} rezultate",
      other: "{total} de rezultate",
    },
    rowActions: "Acțiuni pentru rând",
    total: "Total",
    groupBy: "Grupați după",
    groupOrder: "Ordine",
    moveGroupUp: "Mutați {columnName} în sus",
    ungroupAll: "Anulați toate grupările",
    expandAllGroups: "Extindeți toate grupurile",
    collapseAllGroups: "Restrângeți toate grupurile",
    groupByColumn: "Grupați după coloană",
    ungroupColumn: "Anulați gruparea după coloană",
    groupedBy: "Grupat după {columnNames}",
    ungrouped: "Rândurile nu mai sunt grupate",
    groupLabel: "{columnName}: {value}",
    emptyGroup: "(Gol)",
    groupCount: {
      one: "{total} rând",
      few: "{total} rânduri",
      other: "{total} de rânduri",
    },
    groupRowLabel: "{label}, {rows}",
  },
  tableColumnResizer: {
    resize: "Redimensionați {columnName}",
  },
})
