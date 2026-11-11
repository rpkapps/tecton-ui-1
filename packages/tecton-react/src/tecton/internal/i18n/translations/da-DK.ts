/**
 * da-DK translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} valgt.",
    deselectedItem: "{item} ikke valgt.",
    selectedCount: {
      "=0": "Ingen elementer valgt.",
      one: "{count} element valgt.",
      other: "{count} elementer valgt.",
    },
    selectedAll: "Alle elementer valgt.",
  },
  chip: {
    removeButtonLabel: "Fjern",
    removeDescription: "Tryk på Slet for at fjerne tag.",
  },
  tree: {
    expand: "Udvid",
    collapse: "Skjul",
  },
  dragAndDrop: {
    dragItem: "Træk {itemText}",
    dragStartedKeyboard:
      "Startet med at trække. Tryk på Tab for at gå til et slip-mål, tryk derefter på Enter for at slippe, eller tryk på Escape for at annullere.",
    dragStartedVirtual:
      "Startet med at trække. Gå til et slip-mål, og klik eller tryk derefter på enter for at slippe.",
    dropCanceled: "Slip annulleret.",
    dropComplete: "Slip fuldført.",
    dropOnItem: "Slip på {itemText}",
    insertBefore: "Indsæt før {itemText}",
    insertBetween: "Indsæt mellem {beforeItemText} og {afterItemText}",
    insertAfter: "Indsæt efter {itemText}",
  },
  table: {
    select: "Vælg",
    selectAll: "Vælg alle",
    ascendingSort: "sorteret efter kolonne {columnName} i stigende rækkefølge",
    descendingSort: "sorteret efter kolonne {columnName} i faldende rækkefølge",
  },
  dataTable: {
    loading: "Indlæser",
    emptyTitle: "Ingen rækker",
    emptyDescription: "Der er ikke noget at vise her endnu.",
    noResultsTitle: "Ingen resultater",
    noResultsDescription: "Ingen rækker matcher søgningen og filtrene.",
    clearFilters: "Ryd filtre",
    errorTitle: "Rækkerne kunne ikke indlæses",
    errorDescription: "Der opstod en fejl under indlæsning af dataene.",
    retry: "Prøv igen",
    rowsPerPage: "Rækker pr. side",
    pageInfo: "Side {page} af {pageCount}",
    pagination: "Sideinddeling",
    firstPage: "Første side",
    previousPage: "Forrige side",
    nextPage: "Næste side",
    lastPage: "Sidste side",
    selectedCount: {
      one: "{selected} af {total} valgt",
      other: "{selected} af {total} valgt",
    },
    selectAllMatching: {
      one: "Vælg {total} række",
      other: "Vælg alle {total} rækker",
    },
    clearSelection: "Ryd valg",
    rowsLoaded: { one: "Viser {total} række", other: "Viser {total} rækker" },
    sortPositionAscending:
      "sorteret i stigende rækkefølge, {position} af {total} i sorteringsrækkefølgen",
    sortPositionDescending:
      "sorteret i faldende rækkefølge, {position} af {total} i sorteringsrækkefølgen",
    sortAddedAscending: "{columnName} sorteret stigende, {position} af {total}",
    sortAddedDescending:
      "{columnName} sorteret faldende, {position} af {total}",
    sortCleared: "{columnName} er ikke længere sorteret",
    yes: "Ja",
    no: "Nej",
  },
  tableColumnResizer: {
    resize: "Tilpas størrelsen på {columnName}",
  },
})
