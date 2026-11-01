/**
 * lt-LT translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
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
  tableColumnResizer: {
    resize: "Keisti stulpelio {columnName} dydį",
  },
})
