/**
 * de-DE translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} ausgewählt.",
    deselectedItem: "{item} nicht ausgewählt.",
    selectedCount: {
      "=0": "Keine Elemente ausgewählt.",
      one: "{count} Element ausgewählt.",
      other: "{count} Elemente ausgewählt.",
    },
    selectedAll: "Alle Elemente ausgewählt.",
  },
  chip: {
    removeButtonLabel: "Entfernen",
    removeDescription: "Auf „Löschen“ drücken, um das Tag zu entfernen.",
  },
  tree: {
    expand: "Erweitern",
    collapse: "Reduzieren",
  },
  dragAndDrop: {
    dragItem: "{itemText} ziehen",
    dragStartedKeyboard:
      "Ziehvorgang gestartet. Drücken Sie die Tabulatortaste, um zu einem Ablegeziel zu navigieren und drücken Sie dann die Eingabetaste, um das Objekt abzulegen, oder Escape, um den Vorgang abzubrechen.",
    dragStartedVirtual:
      "Ziehvorgang gestartet. Navigieren Sie zu einem Ablegeziel und klicken Sie oder drücken Sie die Eingabetaste, um das Objekt abzulegen.",
    dropCanceled: "Ablegen abgebrochen.",
    dropComplete: "Ablegen abgeschlossen.",
    dropOnItem: "Auf {itemText} ablegen",
    insertBefore: "Vor {itemText} einfügen",
    insertBetween: "Zwischen {beforeItemText} und {afterItemText} einfügen",
    insertAfter: "Nach {itemText} einfügen",
  },
  table: {
    select: "Auswählen",
    selectAll: "Alles auswählen",
    ascendingSort:
      "sortiert nach Spalte {columnName} in aufsteigender Reihenfolge",
    descendingSort:
      "sortiert nach Spalte {columnName} in absteigender Reihenfolge",
  },
  dataTable: {
    loading: "Wird geladen",
    emptyTitle: "Keine Zeilen",
    emptyDescription: "Hier gibt es noch nichts anzuzeigen.",
    noResultsTitle: "Keine Ergebnisse",
    noResultsDescription: "Keine Zeilen entsprechen der Suche und den Filtern.",
    clearFilters: "Filter zurücksetzen",
    errorTitle: "Die Zeilen konnten nicht geladen werden",
    errorDescription: "Beim Laden der Daten ist ein Fehler aufgetreten.",
    retry: "Erneut versuchen",
    rowsPerPage: "Zeilen pro Seite",
    pageInfo: "Seite {page} von {pageCount}",
    pagination: "Seitennavigation",
    firstPage: "Erste Seite",
    previousPage: "Vorherige Seite",
    nextPage: "Nächste Seite",
    lastPage: "Letzte Seite",
    selectedCount: {
      one: "{selected} von {total} ausgewählt",
      other: "{selected} von {total} ausgewählt",
    },
    selectAllMatching: {
      one: "{total} Zeile auswählen",
      other: "Alle {total} Zeilen auswählen",
    },
    clearSelection: "Auswahl aufheben",
    rowsLoaded: {
      one: "{total} Zeile wird angezeigt",
      other: "{total} Zeilen werden angezeigt",
    },
    sortPositionAscending:
      "sortiert in aufsteigender Reihenfolge, {position} von {total} in der Sortierreihenfolge",
    sortPositionDescending:
      "sortiert in absteigender Reihenfolge, {position} von {total} in der Sortierreihenfolge",
    sortAddedAscending:
      "{columnName} aufsteigend sortiert, {position} von {total}",
    sortAddedDescending:
      "{columnName} absteigend sortiert, {position} von {total}",
    sortCleared: "{columnName} nicht mehr sortiert",
    yes: "Ja",
    no: "Nein",
    columns: "Spalten",
    showColumns: "Spalten anzeigen",
    pinColumns: "Spalten fixieren",
    notPinned: "Nicht fixiert",
    pinnedStart: "Anfang",
    pinnedEnd: "Ende",
    resetColumns: "Spalten zurücksetzen",
    columnMenu: "Optionen für {columnName}",
    sortAscending: "Aufsteigend sortieren",
    sortDescending: "Absteigend sortieren",
    clearSort: "Sortierung aufheben",
    resizeColumn: "Spaltenbreite ändern",
    fitColumn: "An Inhalt anpassen",
    resetColumnWidth: "Breite zurücksetzen",
    resizeHint:
      "Mit den Pfeiltasten nach links und rechts die Spaltenbreite ändern. Eingabe übernimmt die Breite, Escape bricht ab.",
    hideColumn: "Spalte ausblenden",
    pinToStart: "Am Anfang fixieren",
    pinToEnd: "Am Ende fixieren",
    unpin: "Fixierung aufheben",
    columnDescription: "Info zu {columnName}",
    columnHidden: "{columnName} ausgeblendet",
    columnShown: "{columnName} eingeblendet",
    columnPinnedStart: "{columnName} am Anfang fixiert",
    columnPinnedEnd: "{columnName} am Ende fixiert",
    columnUnpinned: "{columnName} nicht mehr fixiert",
    search: "Suchen",
    searchChip: "Suche",
    clearSearch: "Suche löschen",
    filterBy: "Nach {columnName} filtern",
    filterContains: "Enthält",
    filterMin: "Min.",
    filterMax: "Max.",
    filterAny: "Alle",
    clearFilter: "Zurücksetzen",
    noOptions: "Keine Optionen",
    filterRange: "{from}–{to}",
    filterAtLeast: "≥ {value}",
    filterAtMost: "≤ {value}",
    filterFrom: "Ab {value}",
    filterUntil: "Bis {value}",
    optionsSelected: { other: "{total} ausgewählt" },
    filterChip: "{columnName}: {value}",
    activeFilters: "Aktive Filter",
    clearAll: "Alle zurücksetzen",
    resultsCount: { one: "{total} Ergebnis", other: "{total} Ergebnisse" },
    rowActions: "Zeilenaktionen",
    reorderRowsColumn: "Neu anordnen",
    total: "Gesamt",
    groupBy: "Gruppieren nach",
    groupOrder: "Reihenfolge",
    moveGroupUp: "{columnName} nach oben verschieben",
    ungroupAll: "Alle Gruppierungen aufheben",
    expandAllGroups: "Alle Gruppen aufklappen",
    collapseAllGroups: "Alle Gruppen zuklappen",
    groupByColumn: "Nach Spalte gruppieren",
    ungroup: "Gruppierung aufheben",
    groupedBy: "Gruppiert nach {columnNames}",
    ungrouped: "Zeilen nicht mehr gruppiert",
    groupLabel: "{columnName}: {value}",
    emptyGroup: "(Leer)",
    groupCount: { one: "{total} Zeile", other: "{total} Zeilen" },
  },
  tableColumnResizer: {
    resize: "Größe von {columnName} ändern",
  },
})
