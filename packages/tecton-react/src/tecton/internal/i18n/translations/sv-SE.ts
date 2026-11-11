/**
 * sv-SE translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} markerat.",
    deselectedItem: "{item} ej markerat.",
    selectedCount: {
      "=0": "Inga markerade objekt.",
      one: "{count} markerat objekt.",
      other: "{count} markerade objekt.",
    },
    selectedAll: "Alla markerade objekt.",
  },
  chip: {
    removeButtonLabel: "Ta bort",
    removeDescription: "Tryck på Radera för att ta bort taggen.",
  },
  tree: {
    expand: "Expandera",
    collapse: "Dölj",
  },
  dragAndDrop: {
    dragItem: "Dra {itemText}",
    dragStartedKeyboard:
      "Börja dra. Tryck på tabb för att navigera till målet, tryck på enter för att släppa eller på escape för att avbryta.",
    dragStartedVirtual:
      "Börja dra. Navigera till ett mål och klicka eller tryck på enter för att släppa.",
    dropCanceled: "Släppåtgärd avbröts.",
    dropComplete: "Släppåtgärd klar.",
    dropOnItem: "Släpp på {itemText}",
    insertBefore: "Infoga före {itemText}",
    insertBetween: "Infoga mellan {beforeItemText} och {afterItemText}",
    insertAfter: "Infoga efter {itemText}",
  },
  table: {
    select: "Markera",
    selectAll: "Markera allt",
    ascendingSort: "sorterat på kolumn {columnName} i stigande ordning",
    descendingSort: "sorterat på kolumn {columnName} i fallande ordning",
  },
  dataTable: {
    loading: "Läser in",
    emptyTitle: "Inga rader",
    emptyDescription: "Det finns inget att visa här ännu.",
    noResultsTitle: "Inga resultat",
    noResultsDescription: "Inga rader matchar sökningen och filtren.",
    clearFilters: "Rensa filter",
    errorTitle: "Det gick inte att läsa in raderna",
    errorDescription: "Något gick fel när data lästes in.",
    retry: "Försök igen",
    rowsPerPage: "Rader per sida",
    pageInfo: "Sida {page} av {pageCount}",
    pagination: "Sidnumrering",
    firstPage: "Första sidan",
    previousPage: "Föregående sida",
    nextPage: "Nästa sida",
    lastPage: "Sista sidan",
    selectedCount: {
      one: "{selected} av {total} markerad",
      other: "{selected} av {total} markerade",
    },
    selectAllMatching: {
      one: "Markera {total} rad",
      other: "Markera alla {total} rader",
    },
    clearSelection: "Rensa markering",
    rowsLoaded: { one: "Visar {total} rad", other: "Visar {total} rader" },
    sortPositionAscending:
      "sorterat i stigande ordning, {position} av {total} i sorteringsordningen",
    sortPositionDescending:
      "sorterat i fallande ordning, {position} av {total} i sorteringsordningen",
    sortAddedAscending: "{columnName} sorterad stigande, {position} av {total}",
    sortAddedDescending:
      "{columnName} sorterad fallande, {position} av {total}",
    sortCleared: "{columnName} är inte längre sorterad",
    yes: "Ja",
    no: "Nej",
  },
  tableColumnResizer: {
    resize: "Ändra storlek på {columnName}",
  },
})
