/**
 * fi-FI translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree`, `dragAndDrop` and
 * `table` are copied from React Aria (`react-aria` 3.52; `table` from
 * `@react-aria/table` 3.17), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} valittu.",
    deselectedItem: "Kohdetta {item} ei valittu.",
    selectedCount: {
      "=0": "Ei yhtään kohdetta valittu.",
      one: "{count} kohde valittu.",
      other: "{count} kohdetta valittu.",
    },
    selectedAll: "Kaikki kohteet valittu.",
  },
  chip: {
    removeButtonLabel: "Poista",
    removeDescription: "Poista tunniste painamalla Poista-painiketta.",
  },
  tree: {
    expand: "Laajenna",
    collapse: "Pienennä",
  },
  dragAndDrop: {
    dragItem: "Vedä kohdetta {itemText}",
    dragStartedKeyboard:
      "Vetäminen aloitettu. Siirry pudotuskohteeseen painamalla sarkainnäppäintä ja sitten pudota painamalla Enter-näppäintä tai peruuta painamalla Escape-näppäintä.",
    dragStartedVirtual:
      "Vetäminen aloitettu. Siirry pudotuskohteeseen ja pudota napsauttamalla tai painamalla Enter-näppäintä.",
    dropCanceled: "Pudotus peruutettu.",
    dropComplete: "Pudotus suoritettu.",
    dropOnItem: "Pudota kohteeseen {itemText}",
    insertBefore: "Lisää ennen kohdetta {itemText}",
    insertBetween: "Lisää kohteiden {beforeItemText} ja {afterItemText} väliin",
    insertAfter: "Lisää kohteen {itemText} jälkeen",
  },
  table: {
    select: "Valitse",
    selectAll: "Valitse kaikki",
    ascendingSort:
      "lajiteltu sarakkeen {columnName} mukaan nousevassa järjestyksessä",
    descendingSort:
      "lajiteltu sarakkeen {columnName} mukaan laskevassa järjestyksessä",
  },
  dataTable: {
    loading: "Ladataan",
    emptyTitle: "Ei rivejä",
    emptyDescription: "Täällä ei ole vielä mitään näytettävää.",
    noResultsTitle: "Ei tuloksia",
    noResultsDescription: "Mikään rivi ei vastaa hakua ja suodattimia.",
    clearFilters: "Tyhjennä suodattimet",
    errorTitle: "Rivejä ei voitu ladata",
    errorDescription: "Tietojen lataamisessa tapahtui virhe.",
    retry: "Yritä uudelleen",
    rowsPerPage: "Rivejä sivulla",
    pageInfo: "Sivu {page}/{pageCount}",
    pagination: "Sivutus",
    firstPage: "Ensimmäinen sivu",
    previousPage: "Edellinen sivu",
    nextPage: "Seuraava sivu",
    lastPage: "Viimeinen sivu",
    selectedCount: {
      one: "{selected}/{total} valittu",
      other: "{selected}/{total} valittu",
    },
    selectAllMatching: {
      one: "Valitse {total} rivi",
      other: "Valitse kaikki {total} riviä",
    },
    clearSelection: "Tyhjennä valinta",
    rowsLoaded: {
      one: "Näytetään {total} rivi",
      other: "Näytetään {total} riviä",
    },
    sortPositionAscending:
      "lajiteltu nousevassa järjestyksessä, {position}/{total} lajittelujärjestyksessä",
    sortPositionDescending:
      "lajiteltu laskevassa järjestyksessä, {position}/{total} lajittelujärjestyksessä",
    sortAddedAscending: "{columnName} lajiteltu nousevasti, {position}/{total}",
    sortAddedDescending:
      "{columnName} lajiteltu laskevasti, {position}/{total}",
    sortCleared: "{columnName} ei ole enää lajiteltu",
    yes: "Kyllä",
    no: "Ei",
  },
  tableColumnResizer: {
    resize: "Muuta sarakkeen {columnName} kokoa",
  },
})
