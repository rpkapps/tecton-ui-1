/**
 * hu-HU translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} kijelölve.",
    deselectedItem: "{item} nincs kijelölve.",
    selectedCount: {
      "=0": "Egy elem sincs kijelölve.",
      one: "{count} elem kijelölve.",
      other: "{count} elem kijelölve.",
    },
    selectedAll: "Az összes elem kijelölve.",
  },
  chip: {
    removeButtonLabel: "Eltávolítás",
    removeDescription:
      "Nyomja meg a Delete billentyűt a címke eltávolításához.",
  },
  tree: {
    expand: "Kibontás",
    collapse: "Összecsukás",
  },
  dragAndDrop: {
    dragItem: "{itemText} húzása",
    dragStartedKeyboard:
      "Húzás megkezdve. Nyomja le a Tab billentyűt az elengedési célhoz navigálásához, majd nyomja le az Enter billentyűt az elengedéshez, vagy nyomja le az Escape billentyűt a megszakításhoz.",
    dragStartedVirtual:
      "Húzás megkezdve. Navigáljon egy elengedési célhoz, majd kattintson vagy nyomja le az Enter billentyűt az elengedéshez.",
    dropCanceled: "Elengedés megszakítva.",
    dropComplete: "Elengedés teljesítve.",
    dropOnItem: "Elengedés erre: {itemText}",
    insertBefore: "Beszúrás {itemText} elé",
    insertBetween: "Beszúrás {beforeItemText} és {afterItemText} közé",
    insertAfter: "Beszúrás {itemText} után",
  },
  table: {
    select: "Kijelölés",
    selectAll: "Összes kijelölése",
    ascendingSort:
      "rendezve a(z) {columnName} oszlop szerint, növekvő sorrendben",
    descendingSort:
      "rendezve a(z) {columnName} oszlop szerint, csökkenő sorrendben",
  },
  dataTable: {
    loading: "Betöltés",
    emptyTitle: "Nincsenek sorok",
    emptyDescription: "Itt még nincs megjeleníthető tartalom.",
    noResultsTitle: "Nincs találat",
    noResultsDescription: "Egy sor sem felel meg a keresésnek és a szűrőknek.",
    clearFilters: "Szűrők törlése",
    errorTitle: "Nem sikerült betölteni a sorokat",
    errorDescription: "Hiba történt az adatok betöltése közben.",
    retry: "Újrapróbálkozás",
    rowsPerPage: "Sorok oldalanként",
    pageInfo: "Oldal: {page}/{pageCount}",
    pagination: "Lapozás",
    firstPage: "Első oldal",
    previousPage: "Előző oldal",
    nextPage: "Következő oldal",
    lastPage: "Utolsó oldal",
    selectedCount: {
      one: "{selected}/{total} kijelölve",
      other: "{selected}/{total} kijelölve",
    },
    selectAllMatching: {
      one: "{total} sor kijelölése",
      other: "Mind a(z) {total} sor kijelölése",
    },
    clearSelection: "Kijelölés megszüntetése",
    rowsLoaded: { one: "{total} sor látható", other: "{total} sor látható" },
    sortPositionAscending:
      "rendezve növekvő sorrendben, {position}/{total} a rendezési sorrendben",
    sortPositionDescending:
      "rendezve csökkenő sorrendben, {position}/{total} a rendezési sorrendben",
    sortAddedAscending:
      "{columnName} növekvő sorrendbe rendezve, {position}/{total}",
    sortAddedDescending:
      "{columnName} csökkenő sorrendbe rendezve, {position}/{total}",
    sortCleared: "{columnName} már nincs rendezve",
    yes: "Igen",
    no: "Nem",
  },
  tableColumnResizer: {
    resize: "{columnName} átméretezése",
  },
})
