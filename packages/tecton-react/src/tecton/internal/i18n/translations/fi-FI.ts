/**
 * fi-FI translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
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
})
