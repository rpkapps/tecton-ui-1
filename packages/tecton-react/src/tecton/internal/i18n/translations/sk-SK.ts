/**
 * sk-SK translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "Vybraté položky: {item}.",
    deselectedItem: "Nevybraté položky: {item}.",
    selectedCount: {
      "=0": "Žiadne vybraté položky.",
      one: "{count} vybratá položka.",
      other: "Počet vybratých položiek:{count}.",
    },
    selectedAll: "Všetky vybraté položky.",
  },
  chip: {
    removeButtonLabel: "Odstrániť",
    removeDescription: "Ak chcete odstrániť značku, stlačte kláves Delete.",
  },
  tree: {
    expand: "Rozbaliť",
    collapse: "Zbaliť",
  },
  dragAndDrop: {
    dragItem: "Presunúť položku {itemText}",
    dragStartedKeyboard:
      "Presúvanie sa začalo. Do cieľového umiestnenia prejdete stlačením klávesu Tab. Ak chcete položku umiestniť, stlačte kláves Enter alebo stlačte kláves Esc, ak chcete presúvanie zrušiť.",
    dragStartedVirtual:
      "Presúvanie sa začalo. Prejdite na cieľové umiestnenie a kliknutím alebo stlačením klávesu Enter umiestnite položku.",
    dropCanceled: "Umiestnenie zrušené.",
    dropComplete: "Umiestnenie dokončené.",
    dropOnItem: "Umiestniť na položku {itemText}",
    insertBefore: "Vložiť pred položku {itemText}",
    insertBetween: "Vložiť medzi položky {beforeItemText} a {afterItemText}",
    insertAfter: "Vložiť za položku {itemText}",
  },
  table: {
    select: "Vybrať",
    selectAll: "Vybrať všetko",
    ascendingSort: "zoradené zostupne podľa stĺpca {columnName}",
    descendingSort: "zoradené zostupne podľa stĺpca {columnName}",
  },
  dataTable: {
    loading: "Načítava sa",
    emptyTitle: "Žiadne riadky",
    emptyDescription: "Zatiaľ tu nie je nič na zobrazenie.",
    noResultsTitle: "Žiadne výsledky",
    noResultsDescription: "Vyhľadávaniu a filtrom nezodpovedajú žiadne riadky.",
    clearFilters: "Vymazať filtre",
    errorTitle: "Riadky sa nepodarilo načítať",
    errorDescription: "Pri načítavaní údajov sa vyskytla chyba.",
    retry: "Skúsiť znova",
    rowsPerPage: "Riadky na stránku",
    pageInfo: "Strana {page} z {pageCount}",
    pagination: "Stránkovanie",
    firstPage: "Prvá strana",
    previousPage: "Predchádzajúca strana",
    nextPage: "Nasledujúca strana",
    lastPage: "Posledná strana",
    selectedCount: {
      one: "Vybratý {selected} z {total}",
      few: "Vybraté {selected} z {total}",
      many: "Vybratých {selected} z {total}",
      other: "Vybratých {selected} z {total}",
    },
    selectAllMatching: {
      one: "Vybrať {total} riadok",
      few: "Vybrať všetky {total} riadky",
      many: "Vybrať všetkých {total} riadka",
      other: "Vybrať všetkých {total} riadkov",
    },
    clearSelection: "Zrušiť výber",
    rowsLoaded: {
      one: "Zobrazuje sa {total} riadok",
      few: "Zobrazujú sa {total} riadky",
      many: "Zobrazuje sa {total} riadka",
      other: "Zobrazuje sa {total} riadkov",
    },
    sortPositionAscending:
      "zoradené vzostupne, {position} z {total} v poradí zoradenia",
    sortPositionDescending:
      "zoradené zostupne, {position} z {total} v poradí zoradenia",
    sortAddedAscending: "{columnName} zoradené vzostupne, {position} z {total}",
    sortAddedDescending: "{columnName} zoradené zostupne, {position} z {total}",
    sortCleared: "{columnName} už nie je zoradené",
    yes: "Áno",
    no: "Nie",
  },
  tableColumnResizer: {
    resize: "Zmeniť veľkosť stĺpca {columnName}",
  },
})
