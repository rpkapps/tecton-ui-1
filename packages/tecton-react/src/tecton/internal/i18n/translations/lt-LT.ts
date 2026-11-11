/**
 * lt-LT translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "Pasirinkta: {item}.",
    deselectedItem: "{item} nepasirinkta.",
    selectedCount: {
      "=0": "Nepasirinktas nė vienas elementas.",
      one: "Pasirinktas {count} elementas.",
      other: "Pasirinkta elementų: {count}.",
    },
    selectedAll: "Pasirinkti visi elementai.",
  },
  chip: {
    removeButtonLabel: "Pašalinti",
    removeDescription: "Norėdami pašalinti žymą, paspauskite „Delete“ klavišą.",
  },
  tree: {
    expand: "Išskleisti",
    collapse: "Sutraukti",
  },
  dragAndDrop: {
    dragItem: "Vilkti {itemText}",
    dragStartedKeyboard:
      "Pradėta vilkti. Paspauskite „Tab“, kad pereitumėte į tiesioginę paskirties vietą, tada paspauskite „Enter“, kad numestumėte, arba „Escape“, kad atšauktumėte.",
    dragStartedVirtual:
      "Pradėta vilkti. Eikite į tiesioginę paskirties vietą ir spustelėkite arba paspauskite „Enter“, kad numestumėte.",
    dropCanceled: "Numetimas atšauktas.",
    dropComplete: "Numesta.",
    dropOnItem: "Numesti ant {itemText}",
    insertBefore: "Įterpti prieš {itemText}",
    insertBetween: "Įterpti tarp {beforeItemText} ir {afterItemText}",
    insertAfter: "Įterpti po {itemText}",
  },
  table: {
    select: "Pasirinkti",
    selectAll: "Pasirinkti viską",
    ascendingSort: "surikiuota pagal stulpelį {columnName} didėjančia tvarka",
    descendingSort: "surikiuota pagal stulpelį {columnName} mažėjančia tvarka",
  },
  dataTable: {
    loading: "Įkeliama",
    emptyTitle: "Eilučių nėra",
    emptyDescription: "Čia kol kas nėra ką rodyti.",
    noResultsTitle: "Rezultatų nėra",
    noResultsDescription: "Nė viena eilutė neatitinka paieškos ir filtrų.",
    clearFilters: "Išvalyti filtrus",
    errorTitle: "Nepavyko įkelti eilučių",
    errorDescription: "Įkeliant duomenis įvyko klaida.",
    retry: "Bandyti dar kartą",
    rowsPerPage: "Eilučių puslapyje",
    pageInfo: "Puslapis {page} iš {pageCount}",
    pagination: "Puslapiavimas",
    firstPage: "Pirmas puslapis",
    previousPage: "Ankstesnis puslapis",
    nextPage: "Kitas puslapis",
    lastPage: "Paskutinis puslapis",
    selectedCount: {
      one: "Pasirinkta {selected} iš {total}",
      few: "Pasirinkta {selected} iš {total}",
      many: "Pasirinkta {selected} iš {total}",
      other: "Pasirinkta {selected} iš {total}",
    },
    selectAllMatching: {
      one: "Pasirinkti {total} eilutę",
      few: "Pasirinkti visas eilutes ({total})",
      many: "Pasirinkti visas eilutes ({total})",
      other: "Pasirinkti visas eilutes ({total})",
    },
    clearSelection: "Išvalyti pasirinkimą",
    rowsLoaded: {
      one: "Rodoma {total} eilutė",
      few: "Rodomos {total} eilutės",
      many: "Rodoma {total} eilutės",
      other: "Rodoma {total} eilučių",
    },
    sortPositionAscending:
      "surikiuota didėjančia tvarka, {position} iš {total} rikiavimo tvarkoje",
    sortPositionDescending:
      "surikiuota mažėjančia tvarka, {position} iš {total} rikiavimo tvarkoje",
    sortAddedAscending:
      "{columnName} surikiuota didėjančia tvarka, {position} iš {total}",
    sortAddedDescending:
      "{columnName} surikiuota mažėjančia tvarka, {position} iš {total}",
    sortCleared: "{columnName} nebėra surikiuota",
    yes: "Taip",
    no: "Ne",
    columns: "Stulpeliai",
    showColumns: "Rodyti stulpelius",
    pinColumns: "Prisegti stulpelius",
    notPinned: "Neprisegtas",
    pinnedStart: "Pradžia",
    pinnedEnd: "Pabaiga",
    resetColumns: "Atkurti stulpelius",
    columnMenu: "Stulpelio {columnName} parinktys",
    sortAscending: "Rikiuoti didėjančia tvarka",
    sortDescending: "Rikiuoti mažėjančia tvarka",
    clearSort: "Išvalyti rikiavimą",
    resizeColumn: "Keisti stulpelio plotį",
    fitColumn: "Pritaikyti turiniui",
    resetColumnWidth: "Atkurti plotį",
    resizeHint:
      "Stulpelio plotį keiskite rodyklių kairėn ir dešinėn klavišais. Paspauskite Enter, kad išsaugotumėte plotį, arba Escape, kad atšauktumėte.",
    hideColumn: "Slėpti stulpelį",
    pinToStart: "Prisegti pradžioje",
    pinToEnd: "Prisegti pabaigoje",
    unpin: "Atsegti",
    columnDescription: "Apie stulpelį {columnName}",
    columnHidden: "Stulpelis {columnName} paslėptas",
    columnShown: "Stulpelis {columnName} rodomas",
    columnPinnedStart: "Stulpelis {columnName} prisegtas pradžioje",
    columnPinnedEnd: "Stulpelis {columnName} prisegtas pabaigoje",
    columnUnpinned: "Stulpelis {columnName} atsegtas",
  },
  tableColumnResizer: {
    resize: "Keisti stulpelio {columnName} dydį",
  },
})
