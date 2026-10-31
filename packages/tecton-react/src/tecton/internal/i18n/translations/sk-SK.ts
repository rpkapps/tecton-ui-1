/**
 * sk-SK translations, loaded only when a `TectonProvider` uses this locale.
 *
 * The strings of the namespaces `grid`, `chip`, `tree` and `dragAndDrop` are
 * copied from React Aria (`react-aria` 3.52), © Adobe, Apache License 2.0
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
})
