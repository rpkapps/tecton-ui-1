/**
 * da-DK translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
 * (https://www.apache.org/licenses/LICENSE-2.0).
 */
import { defineTranslations } from "../translations"

export default defineTranslations({
  grid: {
    selectedItem: "{item} valgt.",
    deselectedItem: "{item} ikke valgt.",
    selectedCount: {
      "=0": "Ingen elementer valgt.",
      one: "{count} element valgt.",
      other: "{count} elementer valgt.",
    },
    selectedAll: "Alle elementer valgt.",
  },
  chip: {
    removeButtonLabel: "Fjern",
    removeDescription: "Tryk på Slet for at fjerne tag.",
  },
  tree: {
    expand: "Udvid",
    collapse: "Skjul",
  },
  dragAndDrop: {
    dragItem: "Træk {itemText}",
    dragStartedKeyboard:
      "Startet med at trække. Tryk på Tab for at gå til et slip-mål, tryk derefter på Enter for at slippe, eller tryk på Escape for at annullere.",
    dragStartedVirtual:
      "Startet med at trække. Gå til et slip-mål, og klik eller tryk derefter på enter for at slippe.",
    dropCanceled: "Slip annulleret.",
    dropComplete: "Slip fuldført.",
    dropOnItem: "Slip på {itemText}",
    insertBefore: "Indsæt før {itemText}",
    insertBetween: "Indsæt mellem {beforeItemText} og {afterItemText}",
    insertAfter: "Indsæt efter {itemText}",
  },
})
