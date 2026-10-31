/**
 * nl-NL translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} geselecteerd.",
    deselectedItem: "{item} niet geselecteerd.",
    selectedCount: {
      "=0": "Geen items geselecteerd.",
      one: "{count} item geselecteerd.",
      other: "{count} items geselecteerd.",
    },
    selectedAll: "Alle items geselecteerd.",
  },
  chip: {
    removeButtonLabel: "Verwijderen",
    removeDescription: "Druk op Verwijderen om de tag te verwijderen.",
  },
  tree: {
    expand: "Uitvouwen",
    collapse: "Samenvouwen",
  },
  dragAndDrop: {
    dragItem: "{itemText} slepen",
    dragStartedKeyboard:
      "Begonnen met slepen. Druk op Tab om naar een locatie te gaan. Druk dan op Enter om neer te zetten, of op Esc om te annuleren.",
    dragStartedVirtual:
      "Begonnen met slepen. Ga naar de gewenste locatie en klik of druk op Enter om neer te zetten.",
    dropCanceled: "Neerzetten geannuleerd.",
    dropComplete: "Neerzetten voltooid.",
    dropOnItem: "Neerzetten op {itemText}",
    insertBefore: "Plaatsen vóór {itemText}",
    insertBetween: "Plaatsen tussen {beforeItemText} en {afterItemText}",
    insertAfter: "Plaatsen na {itemText}",
  },
})
