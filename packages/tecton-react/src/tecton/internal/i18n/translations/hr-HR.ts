/**
 * hr-HR translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "Stavka {item} je odabrana.",
    deselectedItem: "Stavka {item} nije odabrana.",
    selectedCount: {
      "=0": "Nije odabrana nijedna stavka.",
      one: "Odabrana je {count} stavka.",
      other: "Odabrano je {count} stavki.",
    },
    selectedAll: "Odabrane su sve stavke.",
  },
  chip: {
    removeButtonLabel: "Ukloni",
    removeDescription: "Pritisnite Delete za uklanjanje oznake.",
  },
  tree: {
    expand: "Proširi",
    collapse: "Sažmi",
  },
  dragAndDrop: {
    dragItem: "Povucite stavku {itemText}",
    dragStartedKeyboard:
      "Počeli ste povlačiti. Pritisnite tipku tabulatora da biste došli do cilja ispuštanja, a zatim Enter da biste ispustili stavku ili Escape da biste prekinuli povlačenje.",
    dragStartedVirtual:
      "Počeli ste povlačiti. Dođite do cilja ispuštanja, a zatim kliknite ili pritisnite Enter da biste ispustili stavku.",
    dropCanceled: "Povlačenje je prekinuto.",
    dropComplete: "Ispuštanje je dovršeno.",
    dropOnItem: "Ispustite na stavku {itemText}",
    insertBefore: "Ispustite ispred stavke {itemText}",
    insertBetween: "Umetnite između stavki {beforeItemText} i {afterItemText}",
    insertAfter: "Umetnite iza stavke {itemText}",
  },
  table: {
    select: "Odaberite",
    selectAll: "Odaberite sve",
    ascendingSort: "razvrstano po stupcima {columnName} rastućem redoslijedom",
    descendingSort:
      "razvrstano po stupcima {columnName} padajućim redoslijedom",
  },
  dataTable: {
    loading: "Učitavanje",
    emptyTitle: "Nema redaka",
    emptyDescription: "Ovdje još nema ničega za prikaz.",
    noResultsTitle: "Nema rezultata",
    noResultsDescription: "Nijedan redak ne odgovara pretraživanju i filtrima.",
    clearFilters: "Očistite filtre",
    errorTitle: "Učitavanje redaka nije uspjelo",
    errorDescription: "Došlo je do pogreške pri učitavanju podataka.",
    retry: "Pokušajte ponovno",
    rowsPerPage: "Redaka po stranici",
    pageInfo: "Stranica {page} od {pageCount}",
    pagination: "Straničenje",
    firstPage: "Prva stranica",
    previousPage: "Prethodna stranica",
    nextPage: "Sljedeća stranica",
    lastPage: "Zadnja stranica",
    selectedCount: {
      one: "Odabran je {selected} od {total}",
      few: "Odabrana su {selected} od {total}",
      other: "Odabrano je {selected} od {total}",
    },
    selectAllMatching: {
      one: "Odaberite {total} redak",
      few: "Odaberite sva {total} retka",
      other: "Odaberite svih {total} redaka",
    },
    clearSelection: "Poništite odabir",
    rowsLoaded: {
      one: "Prikazan je {total} redak",
      few: "Prikazana su {total} retka",
      other: "Prikazano je {total} redaka",
    },
    sortPositionAscending:
      "razvrstano rastućim redoslijedom, {position} od {total} u redoslijedu sortiranja",
    sortPositionDescending:
      "razvrstano padajućim redoslijedom, {position} od {total} u redoslijedu sortiranja",
    sortAddedAscending: "{columnName} sortirano uzlazno, {position} od {total}",
    sortAddedDescending:
      "{columnName} sortirano silazno, {position} od {total}",
    sortCleared: "{columnName} više nije sortirano",
    yes: "Da",
    no: "Ne",
  },
  tableColumnResizer: {
    resize: "Promijeni veličinu stupca {columnName}",
  },
})
