/**
 * it-IT translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} selezionato.",
    deselectedItem: "{item} non selezionato.",
    selectedCount: {
      "=0": "Nessun elemento selezionato.",
      one: "{count} elemento selezionato.",
      other: "{count} elementi selezionati.",
    },
    selectedAll: "Tutti gli elementi selezionati.",
  },
  chip: {
    removeButtonLabel: "Rimuovi",
    removeDescription: "Premi Elimina per rimuovere il tag.",
  },
  tree: {
    expand: "Espandi",
    collapse: "Comprimi",
  },
  dragAndDrop: {
    dragItem: "Trascina {itemText}",
    dragStartedKeyboard:
      "Hai iniziato a trascinare. Premi Tab per arrivare sull’area di destinazione, quindi premi Invio per rilasciare o Esc per annullare.",
    dragStartedVirtual:
      "Hai iniziato a trascinare. Arriva sull’area di destinazione, quindi fai clic o premi Invio per rilasciare.",
    dropCanceled: "Rilascio annullato.",
    dropComplete: "Rilascio completato.",
    dropOnItem: "Rilascia su {itemText}",
    insertBefore: "Inserisci prima di {itemText}",
    insertBetween: "Inserisci tra {beforeItemText} e {afterItemText}",
    insertAfter: "Inserisci dopo {itemText}",
  },
  table: {
    select: "Seleziona",
    selectAll: "Seleziona tutto",
    ascendingSort: "in ordine crescente in base alla colonna {columnName}",
    descendingSort: "in ordine decrescente in base alla colonna {columnName}",
  },
  dataTable: {
    loading: "Caricamento in corso",
    emptyTitle: "Nessuna riga",
    emptyDescription: "Non c’è ancora niente da visualizzare qui.",
    noResultsTitle: "Nessun risultato",
    noResultsDescription: "Nessuna riga corrisponde alla ricerca e ai filtri.",
    clearFilters: "Cancella filtri",
    errorTitle: "Impossibile caricare le righe",
    errorDescription:
      "Si è verificato un errore durante il caricamento dei dati.",
    retry: "Riprova",
    rowsPerPage: "Righe per pagina",
    pageInfo: "Pagina {page} di {pageCount}",
    pagination: "Paginazione",
    firstPage: "Prima pagina",
    previousPage: "Pagina precedente",
    nextPage: "Pagina successiva",
    lastPage: "Ultima pagina",
    selectedCount: {
      one: "{selected} di {total} selezionata",
      many: "{selected} di {total} selezionate",
      other: "{selected} di {total} selezionate",
    },
    selectAllMatching: {
      one: "Seleziona {total} riga",
      many: "Seleziona tutte le {total} di righe",
      other: "Seleziona tutte le {total} righe",
    },
    clearSelection: "Cancella selezione",
    rowsLoaded: {
      one: "{total} riga visualizzata",
      other: "{total} righe visualizzate",
    },
    sortPositionAscending:
      "in ordine crescente, {position} di {total} nell’ordinamento",
    sortPositionDescending:
      "in ordine decrescente, {position} di {total} nell’ordinamento",
    sortAddedAscending:
      "{columnName} ordinato in modo crescente, {position} di {total}",
    sortAddedDescending:
      "{columnName} ordinato in modo decrescente, {position} di {total}",
    sortCleared: "{columnName} non è più ordinato",
    yes: "Sì",
    no: "No",
    columns: "Colonne",
    showColumns: "Mostra colonne",
    pinColumns: "Blocca colonne",
    notPinned: "Non bloccata",
    pinnedStart: "Inizio",
    pinnedEnd: "Fine",
    resetColumns: "Ripristina colonne",
    columnMenu: "Opzioni per {columnName}",
    sortAscending: "Ordina in modo crescente",
    sortDescending: "Ordina in modo decrescente",
    clearSort: "Rimuovi ordinamento",
    resizeColumn: "Ridimensiona colonna",
    fitColumn: "Adatta al contenuto",
    resetColumnWidth: "Ripristina larghezza",
    resizeHint:
      "Usa i tasti freccia sinistra e destra per ridimensionare la colonna. Premi Invio per mantenere la larghezza o Esc per annullare.",
    hideColumn: "Nascondi colonna",
    pinToStart: "Blocca all’inizio",
    pinToEnd: "Blocca alla fine",
    unpin: "Sblocca",
    columnDescription: "Informazioni su {columnName}",
    columnHidden: "Colonna {columnName} nascosta",
    columnShown: "Colonna {columnName} visibile",
    columnPinnedStart: "Colonna {columnName} bloccata all’inizio",
    columnPinnedEnd: "Colonna {columnName} bloccata alla fine",
    columnUnpinned: "Colonna {columnName} sbloccata",
    search: "Cerca",
    searchChip: "Ricerca",
    clearSearch: "Cancella ricerca",
    filterBy: "Filtra per {columnName}",
    filterContains: "Contiene",
    filterMin: "Min",
    filterMax: "Max",
    filterAny: "Tutti",
    clearFilter: "Cancella",
    noOptions: "Nessuna opzione",
    filterRange: "{from}–{to}",
    filterAtLeast: "≥ {value}",
    filterAtMost: "≤ {value}",
    filterFrom: "Dal {value}",
    filterUntil: "Fino al {value}",
    optionsSelected: { other: "{total} selezionati" },
    filterChip: "{columnName}: {value}",
    activeFilters: "Filtri attivi",
    clearAll: "Cancella tutto",
    resultsCount: { one: "{total} risultato", other: "{total} risultati" },
    rowActions: "Azioni della riga",
    reorderRowsColumn: "Riordina",
    total: "Totale",
  },
  tableColumnResizer: {
    resize: "Ridimensiona {columnName}",
  },
})
