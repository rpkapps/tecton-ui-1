/**
 * nb-NO translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} er valgt.",
    deselectedItem: "{item} er ikke valgt.",
    selectedCount: {
      "=0": "Ingen elementer er valgt.",
      one: "{count} element er valgt.",
      other: "{count} elementer er valgt.",
    },
    selectedAll: "Alle elementer er valgt.",
  },
  chip: {
    removeButtonLabel: "Fjern",
    removeDescription: "Trykk på Slett for å fjerne taggen.",
  },
  tree: {
    expand: "Utvid",
    collapse: "Skjul",
  },
  dragAndDrop: {
    dragItem: "Dra {itemText}",
    dragStartedKeyboard:
      "Begynte å dra. Trykk på Tab for å navigere til et mål, og trykk deretter på Enter for å slippe eller på Esc for å avbryte.",
    dragStartedVirtual:
      "Begynte å dra. Naviger til et mål, og klikk eller trykk på Enter for å slippe.",
    dropCanceled: "Avbrøt slipping.",
    dropComplete: "Slippingen er fullført.",
    dropOnItem: "Slipp på {itemText}",
    insertBefore: "Sett inn før {itemText}",
    insertBetween: "Sett inn mellom {beforeItemText} og {afterItemText}",
    insertAfter: "Sett inn etter {itemText}",
  },
  table: {
    select: "Velg",
    selectAll: "Velg alle",
    ascendingSort: "sortert etter kolonne {columnName} i stigende rekkefølge",
    descendingSort: "sortert etter kolonne {columnName} i synkende rekkefølge",
  },
  dataTable: {
    loading: "Laster inn",
    emptyTitle: "Ingen rader",
    emptyDescription: "Det er ingenting å vise her ennå.",
    noResultsTitle: "Ingen resultater",
    noResultsDescription: "Ingen rader samsvarer med søket og filtrene.",
    clearFilters: "Fjern filtre",
    errorTitle: "Radene kunne ikke lastes inn",
    errorDescription: "Noe gikk galt under innlasting av dataene.",
    retry: "Prøv på nytt",
    rowsPerPage: "Rader per side",
    pageInfo: "Side {page} av {pageCount}",
    pagination: "Sidenavigering",
    firstPage: "Første side",
    previousPage: "Forrige side",
    nextPage: "Neste side",
    lastPage: "Siste side",
    selectedCount: {
      one: "{selected} av {total} er valgt",
      other: "{selected} av {total} er valgt",
    },
    selectAllMatching: {
      one: "Velg {total} rad",
      other: "Velg alle {total} rader",
    },
    clearSelection: "Fjern valg",
    rowsLoaded: { one: "Viser {total} rad", other: "Viser {total} rader" },
    sortPositionAscending:
      "sortert i stigende rekkefølge, {position} av {total} i sorteringsrekkefølgen",
    sortPositionDescending:
      "sortert i synkende rekkefølge, {position} av {total} i sorteringsrekkefølgen",
    sortAddedAscending: "{columnName} sortert stigende, {position} av {total}",
    sortAddedDescending: "{columnName} sortert synkende, {position} av {total}",
    sortCleared: "{columnName} er ikke lenger sortert",
    yes: "Ja",
    no: "Nei",
    columns: "Kolonner",
    showColumns: "Vis kolonner",
    pinColumns: "Fest kolonner",
    notPinned: "Ikke festet",
    pinnedStart: "Start",
    pinnedEnd: "Slutt",
    resetColumns: "Tilbakestill kolonner",
    columnMenu: "Alternativer for {columnName}",
    sortAscending: "Sorter stigende",
    sortDescending: "Sorter synkende",
    clearSort: "Fjern sortering",
    resizeColumn: "Endre kolonnebredde",
    fitColumn: "Tilpass til innhold",
    resetColumnWidth: "Tilbakestill bredde",
    resizeHint:
      "Bruk venstre og høyre piltast for å endre kolonnebredden. Trykk Enter for å beholde bredden eller Escape for å avbryte.",
    hideColumn: "Skjul kolonne",
    pinToStart: "Fest til starten",
    pinToEnd: "Fest til slutten",
    unpin: "Løsne",
    columnDescription: "Om {columnName}",
    columnHidden: "{columnName} skjult",
    columnShown: "{columnName} vises",
    columnPinnedStart: "{columnName} festet til starten",
    columnPinnedEnd: "{columnName} festet til slutten",
    columnUnpinned: "{columnName} er ikke lenger festet",
  },
  tableColumnResizer: {
    resize: "Endre størrelse på {columnName}",
  },
})
